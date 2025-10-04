import {CloudFunction} from '../../utils/Registry/decorators';
import PlacementTestQuestion from '../../models/PlacementTestQuestion';
import PlacementTestCorrectAnswer from '../../models/PlacementTestCorrectAnswer';
class PlacementTestFunctions {
  @CloudFunction({
    methods: ['GET'],
    validation: {
      requireUser: true,
      fields: {},
    },
  })
  async getPlacementTestQuestions(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      if (!user) {
        throw {codeStatus: 103, message: 'User context is missing'};
      }

      const rolePointer = user.get('role');
      const role = await new Parse.Query(Parse.Role)
        .equalTo('objectId', rolePointer?.id)
        .first({useMasterKey: true});

      const roleName = role?.get('name');
      if (roleName !== 'Child') {
        throw {codeStatus: 102, message: 'User is not a Child'};
      }

      const query = new Parse.Query(PlacementTestQuestion);
      query.ascending('createdAt');
      const results = await query.find({useMasterKey: true});

      const formatted = results.map(q => ({
        id: q.id,
        question_image_url: q.get('question_image_url')?.url(),
        options: {
          A: q.get('option_a_image_url')?.url(),
          B: q.get('option_b_image_url')?.url(),
          C: q.get('option_c_image_url')?.url(),
          D: q.get('option_d_image_url')?.url(),
        },
      }));

      return formatted;
    } catch (error: any) {
      console.error('Error in getPlacementTestQuestions:', error);
      throw {
        codeStatus: error.codeStatus || 1000,
        message: error.message || 'Failed to retrieve placement test questions',
      };
    }
  }

  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
    },
  })
  async getPlacementTestQuestionByIndex(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      const index = req.params.index;

      if (!user) {
        throw {codeStatus: 103, message: 'User context is missing'};
      }

      const rolePointer = user.get('role');
      const role = await new Parse.Query(Parse.Role)
        .equalTo('objectId', rolePointer?.id)
        .first({useMasterKey: true});

      const roleName = role?.get('name');
      if (roleName !== 'Child') {
        throw {codeStatus: 102, message: 'User is not a Child'};
      }

      const query = new Parse.Query(PlacementTestQuestion);
      query.ascending('createdAt');
      query.skip(index);
      query.limit(1);
      const result = await query.first({useMasterKey: true});
      if (!result) {
        throw {codeStatus: 104, message: 'No question found at this index'};
      }

      return {
        id: result.id,
        question_image_url: result.get('question_image_url')?.url(),
        options: {
          A: result.get('option_a_image_url')?.url(),
          B: result.get('option_b_image_url')?.url(),
          C: result.get('option_c_image_url')?.url(),
          D: result.get('option_d_image_url')?.url(),
        },
      };
    } catch (error: any) {
      console.error('Error in getPlacementTestQuestionByIndex:', error);
      throw {
        codeStatus: error.codeStatus || 1000,
        message: error.message || 'Failed to retrieve question by index',
      };
    }
  }
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        answers: {type: Array, required: true},
      },
    },
  })
  async submitPlacementTestAnswers(req: Parse.Cloud.FunctionRequest) {
    const user = req.user;
    if (!user) throw new Error('User is not logged in');

    const {answers} = req.params;
    let correctCount = 0;

    for (const {questionId, selectedOption} of answers) {
      const questionPointer = new Parse.Object('PlacementTestQuestion');
      questionPointer.id = questionId;

      const answerQuery = new Parse.Query(PlacementTestCorrectAnswer);
      answerQuery.equalTo('question', questionPointer);
      const correctAnswer = await answerQuery.first({useMasterKey: true});

      const isCorrect =
        correctAnswer?.get('correct_option')?.trim().toUpperCase() ===
        selectedOption.trim().toUpperCase();

      if (isCorrect) correctCount++;
    }

    const score = Math.round((correctCount / answers.length) * 100);
    const passed = score >= 70;

    user.set('placement_test_score', score);
    await user.save(null, {useMasterKey: true});

    return {correctCount, score, passed};
  }
}

export default new PlacementTestFunctions();
