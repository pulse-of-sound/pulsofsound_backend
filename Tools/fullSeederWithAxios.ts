import fs from 'fs';
import path from 'path';
import axios from 'axios';
require('dotenv').config();

// إعدادات الاتصال بـ Parse Server
const appId = process.env.appId!;
const restAPIKey = process.env.restAPIKey!;
const masterKey = process.env.masterKey!;
const serverURL = process.env.serverURL!;

// مسار الصور
const folderPath = 'C:/Users/DELL/Desktop/Pulse Of Sound/PlacementTestQuestion';
const correctAnswers = [
  'C', 'B', 'B', 'A', 'D',
  'C', 'D', 'B', 'A', 'D',
  'A', 'B', 'D', 'D', 'C'
];

// رفع صورة باستخدام axios وإرجاع رابطها
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

// حفظ سؤال في قاعدة البيانات
async function saveQuestion(images: Record<string, string>): Promise<string> {
  const response = await axios.post(`${serverURL}/classes/PlacementTestQuestion`, {
    question_image_url: images.question,
    option_a_image_url: images.a,
    option_b_image_url: images.b,
    option_c_image_url: images.c,
    option_d_image_url: images.d,
  }, {
    headers: {
      'X-Parse-Application-Id': appId,
      'X-Parse-REST-API-Key': restAPIKey,
      'X-Parse-Master-Key': masterKey,
      'Content-Type': 'application/json',
    },
  });

  return response.data.objectId;
}

// حفظ الإجابة الصحيحة وربطها بالسؤال
async function saveAnswer(questionId: string, correctOption: string): Promise<void> {
  await axios.post(`${serverURL}/classes/PlacementTestCorrectAnswer`, {
    correct_option: correctOption,
    question: {
      __type: 'Pointer',
      className: 'PlacementTestQuestion',
      objectId: questionId,
    },
  }, {
    headers: {
      'X-Parse-Application-Id': appId,
      'X-Parse-REST-API-Key': restAPIKey,
      'X-Parse-Master-Key': masterKey,
      'Content-Type': 'application/json',
    },
  });
}

// تنفيذ الإدخال الكامل
async function seedAll() {
  for (let i = 1; i <= 15; i++) {
    console.log(`🔄 Processing question ${i}`);

    try {
      const images = {
        question: await uploadImage(`q${i}.jpg`),
        a: await uploadImage(`q${i}_a.jpg`),
        b: await uploadImage(`q${i}_b.jpg`),
        c: await uploadImage(`q${i}_c.jpg`),
        d: await uploadImage(`q${i}_d.jpg`),
      };

      const questionId = await saveQuestion(images);
      await saveAnswer(questionId, correctAnswers[i - 1]);

      console.log(`✅ Question ${i} saved`);
    } catch (error: any) {
      console.error(`❌ Error in question ${i}:`, error.response?.data || error.message);
    }
  }

  console.log('🎉 All questions and answers seeded successfully!');
}

seedAll().catch(err => {
  console.error('❌ Fatal Error:', err);
});
