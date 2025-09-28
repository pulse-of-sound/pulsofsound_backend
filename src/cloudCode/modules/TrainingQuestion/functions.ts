import {CloudFunction} from '../../utils/Registry/decorators';
import TrainingQuestion from '../../models/TrainingQuestion';

class TrainingQuestionFunctions {
  @CloudFunction({
    methods: ['GET'],
    validation: {
      requireUser: true,
    },
  })
  async getTrainingQuestions(_: Parse.Cloud.FunctionRequest) {
    try {
      const query = new Parse.Query(TrainingQuestion);
      query.limit(5);
      query.descending('createdAt');
      const results = await query.find({useMasterKey: true});

      const formatted = results.map((q) => ({
        id: q.id,
        question_image_url: q.get('question_image_url'),
        options: {
          A: q.get('option_a'),
          B: q.get('option_b'),
          C: q.get('option_c'),
        },
      }));

      return {
        count: formatted.length,
        questions: formatted,
      };
    } catch (error: any) {
      console.error('Error in getTrainingQuestions:', error);
      throw {
        codeStatus: 1000,
        message: error.message || 'Failed to fetch training questions',
      };
    }
  }
}

export default new TrainingQuestionFunctions();
