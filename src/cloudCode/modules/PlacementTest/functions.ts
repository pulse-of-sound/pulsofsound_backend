import {CloudFunction} from '../../utils/Registry/decorators';
import PlacementTestQuestion from '../../models/PlacementTestQuestion';
import {ValidatorField} from '../../utils/types/cloud';
import PlacementTestCorrectAnswer from '../../models/PlacementTestCorrectAnswer';
class PlacementTestFunctions {
  //get all Questions
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
        throw {
          codeStatus: 103,
          message: 'User context is missing',
        };
      }

      const rolePointer = user.get('role');
      const role = await new Parse.Query(Parse.Role)
        .equalTo('objectId', rolePointer?.id)
        .first({useMasterKey: true});

      const roleName = role?.get('name');
      if (roleName !== 'Child') {
        throw {
          codeStatus: 102,
          message: 'User is not a Child',
        };
      }

      const query = new Parse.Query(PlacementTestQuestion);
      query.ascending('createdAt');
      const results = await query.find({useMasterKey: true});

      const formatted = results.map(q => ({
        id: q.id,
        question_image_url: q.get('question_image_url'),
        options: {
          A: q.get('option_a_image_url'),
          B: q.get('option_b_image_url'),
          C: q.get('option_c_image_url'),
          D: q.get('option_d_image_url'),
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
  //get Question by Index

  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
    },
  })
  async getPlacementTestQuestionByIndex(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      console.log('📦 Incoming params:', req.params);
      console.log('📌 Type of index:', typeof req.params.index);

      const index = req.params.index;

      if (!user) {
        throw {
          codeStatus: 103,
          message: 'User context is missing',
        };
      }

      const rolePointer = user.get('role');
      const role = await new Parse.Query(Parse.Role)
        .equalTo('objectId', rolePointer?.id)
        .first({useMasterKey: true});

      const roleName = role?.get('name');
      if (roleName !== 'Child') {
        throw {
          codeStatus: 102,
          message: 'User is not a Child',
        };
      }

      const query = new Parse.Query(PlacementTestQuestion);
      query.ascending('createdAt');
      query.skip(index);
      query.limit(1);

      const result = await query.first({useMasterKey: true});
      if (!result) {
        throw {
          codeStatus: 104,
          message: 'No question found at this index',
        };
      }

      return {
        id: result.id,
        question_image_url: result.get('question_image_url'),
        options: {
          A: result.get('option_a_image_url'),
          B: result.get('option_b_image_url'),
          C: result.get('option_c_image_url'),
          D: result.get('option_d_image_url'),
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
    },
  })
  async submitPlacementTestAnswers(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      const answers = req.params.answers as {
        questionId: string;
        selectedOption: 'A' | 'B' | 'C' | 'D';
      }[];
      console.log(' Incoming answers:', answers);
      console.log(' Type of answers:', typeof answers);
      console.log(' Is Array:', Array.isArray(answers));

      if (!user) {
        throw {
          codeStatus: 103,
          message: 'User context is missing',
        };
      }

      let correctCount = 0;

      for (const answer of answers) {
        const correct = await new Parse.Query(PlacementTestCorrectAnswer)
          .equalTo(
            'question',
            new Parse.Object('PlacementTestQuestion').set(
              'objectId',
              answer.questionId
            )
          )
          .first({useMasterKey: true});

        if (
          correct &&
          correct.get('correct_option') === answer.selectedOption
        ) {
          correctCount++;
        }
      }

      const score = Math.round((correctCount / answers.length) * 100);
      user.set('placement_test_score', score);
      await user.save(null, {useMasterKey: true});

      return {
        correctCount,
        score,
        passed: score >= 70,
      };
    } catch (error: any) {
      console.error('Error in submitPlacementTestAnswers:', error);
      throw {
        codeStatus: error.codeStatus || 1000,
        message: error.message || 'Failed to submit placement test answers',
      };
    }
  }
}

export default new PlacementTestFunctions();
