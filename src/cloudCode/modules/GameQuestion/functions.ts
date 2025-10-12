import {CloudFunction} from '../../utils/Registry/decorators';
import GameQuestion from '../../models/GameQuestion';

class GameQuestionFunctions {
  //لم يتم التجريب
  // @CloudFunction({
  //   methods: ['POST'],
  //   validation: {
  //     requireUser: false,
  //     fields: {
  //       level_game_id: {required: true, type: String},
  //       question_text: {required: true, type: String},
  //       question_type: {required: false, type: String},
  //       option_type: {required: false, type: String},
  //       options: {required: false, type: Array},
  //       option_a: {required: false, type: String},
  //       option_b: {required: false, type: String},
  //       option_c: {required: false, type: String},
  //       option_d: {required: false, type: String},
  //     },
  //   },
  // })
  // async addGameQuestionByAdmin(req: Parse.Cloud.FunctionRequest) {
  //   try {
  //     const {
  //       level_game_id,
  //       question_text,
  //       question_type,
  //       option_type,
  //       options,
  //       option_a,
  //       option_b,
  //       option_c,
  //       option_d,
  //     } = req.params;

  //     const levelGamePointer = new Parse.Object('LevelGame');
  //     levelGamePointer.id = level_game_id;

  //     const question = new GameQuestion();
  //     question.set('level_game_id', levelGamePointer);
  //     question.set('question_text', question_text);
  //     question.set('question_type', question_type || '');
  //     question.set('option_type', option_type || '');
  //     question.set('options', options || []);
  //     question.set('option_a', option_a || '');
  //     question.set('option_b', option_b || '');
  //     question.set('option_c', option_c || '');
  //     question.set('option_d', option_d || '');
  //     question.set('created_at', new Date());
  //     question.set('updated_at', new Date());

  //     await question.save(null, {useMasterKey: true});

  //     return {
  //       message: 'GameQuestion added successfully',
  //       gameQuestion: question.toJSON(),
  //     };
  //   } catch (error: any) {
  //     console.error('Error in addGameQuestionByAdmin:', error);
  //     throw {
  //       codeStatus: error.codeStatus || 1004,
  //       message: error.message || 'Failed to add game question',
  //     };
  //   }
  // }
}

export default new GameQuestionFunctions();
