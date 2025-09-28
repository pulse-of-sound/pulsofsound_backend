import fs from 'fs';
import path from 'path';
import axios from 'axios';
require('dotenv').config();

const appId = process.env.appId!;
const restAPIKey = process.env.restAPIKey!;
const masterKey = process.env.masterKey!;
const serverURL = process.env.serverURL!;

const folderPath = 'C:/Users/DELL/Desktop/Pulse Of Sound/TrainingQuestions';

const correctAnswers = [
  'A',
  'C',
  'B',
  'C',
  'A',
  'C',
  'A',
  'A',
  'B',
  'B',
  'C',
  'A',
  'C',
  'B',
  'B',
];

async function uploadImage(fileName: string): Promise<string> {
  const filePath = path.join(folderPath, fileName);
  const data = fs.readFileSync(filePath);

  const response = await axios.post(`${serverURL}/files/${fileName}`, data, {
    headers: {
      'X-Parse-Application-Id': appId,
      'X-Parse-REST-API-Key': restAPIKey,
      'X-Parse-Master-Key': masterKey,
      'Content-Type': 'image/jpeg',
    },
  });

  return response.data.url;
}

async function saveTrainingQuestion(
  images: Record<string, string>
): Promise<string> {
  const response = await axios.post(
    `${serverURL}/classes/TrainingQuestion`,
    {
      question_image_url: images.question,
      option_a: images.a,
      option_b: images.b,
      option_c: images.c,
      created_at: {
        __type: 'Date',
        iso: new Date().toISOString(),
      },
      updated_at: {
        __type: 'Date',
        iso: new Date().toISOString(),
      },
    },
    {
      headers: {
        'X-Parse-Application-Id': appId,
        'X-Parse-REST-API-Key': restAPIKey,
        'X-Parse-Master-Key': masterKey,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.objectId;
}

async function saveCorrectAnswer(
  questionId: string,
  correctOption: string
): Promise<void> {
  await axios.post(
    `${serverURL}/classes/TrainingQuestionCorrectAnswer`,
    {
      correct_option: correctOption,
      question: {
        __type: 'Pointer',
        className: 'TrainingQuestion',
        objectId: questionId,
      },
      created_at: {
        __type: 'Date',
        iso: new Date().toISOString(),
      },
      updated_at: {
        __type: 'Date',
        iso: new Date().toISOString(),
      },
    },
    {
      headers: {
        'X-Parse-Application-Id': appId,
        'X-Parse-REST-API-Key': restAPIKey,
        'X-Parse-Master-Key': masterKey,
        'Content-Type': 'application/json',
      },
    }
  );
}

// تنفيذ الإدخال الكامل
async function seedAllTrainingQuestions() {
  for (let i = 1; i <= 15; i++) {
    console.log(`🔄 Processing training question ${i}`);

    try {
      const images = {
        question: await uploadImage(`q${i}.jpg`),
        a: await uploadImage(`q${i}_a.jpg`),
        b: await uploadImage(`q${i}_b.jpg`),
        c: await uploadImage(`q${i}_c.jpg`),
      };

      const questionId = await saveTrainingQuestion(images);
      await saveCorrectAnswer(questionId, correctAnswers[i - 1]);

      console.log(`✅ Training question ${i} saved`);
    } catch (error: any) {
      console.error(
        `❌ Error in training question ${i}:`,
        error.response?.data || error.message
      );
    }
  }

  console.log('🎉 All training questions and answers seeded successfully!');
}

seedAllTrainingQuestions().catch(err => {
  console.error('❌ Fatal Error:', err);
});
