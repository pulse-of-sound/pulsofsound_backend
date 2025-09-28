import {CloudFunction} from '../../utils/Registry/decorators';
import TrainingQuestion from '../../models/TrainingQuestion';
import TrainingQuestionCorrectAnswer from '../../models/TrainingQuestionCorrectAnswer';

const sessionAnswers: Record<
  string,
  {correctCount: number; currentIndex: number}
> = {};

class TrainingFlowFunctions {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        question_id: {type: String, required: true},
        selected_option: {type: String, required: true},
      },
    },
  })
  async getNextTrainingQuestion(req: Parse.Cloud.FunctionRequest) {
    const user = req.user;
    if (!user) {
      throw new Error('المستخدم غير مسجل الدخول');
    }

    const userId = user.id;
    const {question_id, selected_option} = req.params;

    if (!sessionAnswers[userId]) {
      sessionAnswers[userId] = {correctCount: 0, currentIndex: 0};
    }

    const session = sessionAnswers[userId];

    // التحقق من الإجابة
    const answerQuery = new Parse.Query(TrainingQuestionCorrectAnswer);
    answerQuery.equalTo('question', {
      __type: 'Pointer',
      className: 'TrainingQuestion',
      objectId: question_id,
    });
    const correctAnswer = await answerQuery.first({useMasterKey: true});

    const isCorrect = correctAnswer?.get('correct_option') === selected_option;
    if (isCorrect) session.correctCount++;

    session.currentIndex++;

    if (session.currentIndex >= 5) {
      const result = {
        message: `أجبت على ${session.correctCount} من 5 بشكل صحيح.`,
        options: ['إعادة اختبار الذكاء', 'متابعة التدريب'],
      };

      delete sessionAnswers[userId];

      return result;
    }

    const questionQuery = new Parse.Query(TrainingQuestion);
    questionQuery.skip(session.currentIndex); // ترتيب بسيط حسب عدد الأسئلة
    questionQuery.limit(1);
    const next = await questionQuery.first({useMasterKey: true});

    if (!next) throw {code: 404, message: 'لا يوجد سؤال تدريبي متاح'};

    return {
      question_id: next.id,
      question_image_url: next.get('question_image_url'),
      options: {
        A: next.get('option_a'),
        B: next.get('option_b'),
        C: next.get('option_c'),
      },
      current_index: session.currentIndex,
      is_previous_correct: isCorrect,
    };
  }
}

export default new TrainingFlowFunctions();
