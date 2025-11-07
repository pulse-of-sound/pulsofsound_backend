import {CloudFunction} from '../../utils/Registry/decorators';
import StageQuestion from '../../models/StageQuestion';
import LevelGame from '../../models/LevelGame';
import StageResult from '../../models/StageResult';

interface AnswerInput {
  question_id: string;
  answer: any;
}

class StageResultFunctions {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        level_game_id: {required: true, type: String},
        answers: {required: true, type: Array},
      },
    },
  })
  async submitStageAnswers(req: Parse.Cloud.FunctionRequest) {
    try {
      const {level_game_id} = req.params;
      const answers = req.params.answers as AnswerInput[];
      const user = req.user;

      if (!user) {
        throw {
          codeStatus: 401,
          message: 'Unauthorized: user not found',
        };
      }

      const stagePointer = await new Parse.Query(LevelGame)
        .equalTo('objectId', level_game_id)
        .first({useMasterKey: true});

      if (!stagePointer) {
        throw {
          codeStatus: 404,
          message: 'LevelGame not found',
        };
      }

      const questionIds = answers.map((a: AnswerInput) => a.question_id);
      const query = new Parse.Query(StageQuestion);
      query.containedIn('objectId', questionIds);
      const stageQuestions = await query.find({useMasterKey: true});

      let correctCount = 0;

      for (const answerObj of answers) {
        const question = stageQuestions.find(
          q => q.id === answerObj.question_id
        );
        if (!question) continue;

        const correct = question.get('correct_answer');
        const type = question.get('question_type');
        const userAnswer = answerObj.answer;

        if (!correct || type === 'view_only') continue;

        if (type === 'choose' && correct.index === userAnswer) {
          correctCount++;
        } else if (type === 'match') {
          const correctPairs = correct.pairs || [];
          const userPairs = userAnswer || [];
          const match =
            correctPairs.length === userPairs.length &&
            correctPairs.every(
              (pair: any, i: number) =>
                pair.left === userPairs[i].left &&
                pair.right === userPairs[i].right
            );
          if (match) correctCount++;
        } else if (type === 'classify') {
          const correctBoy = correct.boy || [];
          const correctGirl = correct.girl || [];
          const userBoy = userAnswer.boy || [];
          const userGirl = userAnswer.girl || [];
          const match =
            JSON.stringify(correctBoy.sort()) ===
              JSON.stringify(userBoy.sort()) &&
            JSON.stringify(correctGirl.sort()) ===
              JSON.stringify(userGirl.sort());
          if (match) correctCount++;
        }
      }

      const result = new StageResult();
      result.set('user_id', user);
      result.set('level_game_id', stagePointer);
      result.set('score', correctCount);
      result.set('total_questions', stageQuestions.length);
      result.set('answers', answers);
      result.set('created_at', new Date());
      result.set('updated_at', new Date());

      await result.save(null, {useMasterKey: true});

      return {
        message: 'Stage answers submitted successfully',
        score: correctCount,
        total: stageQuestions.length,
      };
    } catch (error: any) {
      console.error('Error in submitStageAnswers:', error);
      throw {
        codeStatus: error.codeStatus || 1004,
        message: error.message || 'Failed to submit stage answers',
      };
    }
  }
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        level_game_id: {required: true, type: String},
      },
    },
  })
  async getStageResult(req: Parse.Cloud.FunctionRequest) {
    try {
      const {level_game_id} = req.params;
      const user = req.user;

      if (!user) {
        throw {
          codeStatus: 401,
          message: 'Unauthorized: user not found',
        };
      }

      const stagePointer = await new Parse.Query(LevelGame)
        .equalTo('objectId', level_game_id)
        .first({useMasterKey: true});

      if (!stagePointer) {
        throw {
          codeStatus: 404,
          message: 'LevelGame not found',
        };
      }

      const resultQuery = new Parse.Query(StageResult);
      resultQuery.equalTo('user_id', user);
      resultQuery.equalTo('level_game_id', stagePointer);
      resultQuery.descending('createdAt');
      const result = await resultQuery.first({useMasterKey: true});

      if (!result) {
        throw {
          codeStatus: 404,
          message: 'No result found for this stage',
        };
      }

      const score = result.get('score') || 0;
      const total = result.get('total_questions') || 0;
      const percent = total > 0 ? Math.round((score / total) * 100) : 0;

      let evaluation = 'بحاجة إلى تحسين';
      if (percent >= 80) evaluation = 'ممتاز';
      else if (percent >= 50) evaluation = 'جيد';

      const nextStageQuery = new Parse.Query(LevelGame);
      nextStageQuery.greaterThan('order', stagePointer.get('order'));
      nextStageQuery.equalTo('level_id', stagePointer.get('level_id'));
      nextStageQuery.ascending('order');
      const nextStage = await nextStageQuery.first({useMasterKey: true});

      let nextStep: any = null;

      if (nextStage) {
        nextStep = {
          type: 'stage',
          level_id: nextStage.get('level_id').id,
          level_game_id: nextStage.id,
          title: nextStage.get('title'),
        };
      } else {
        const nextLevelQuery = new Parse.Query('Level');
        nextLevelQuery.greaterThan(
          'order',
          stagePointer.get('level_id').get('order')
        );
        nextLevelQuery.ascending('order');
        const nextLevel = await nextLevelQuery.first({useMasterKey: true});

        if (nextLevel) {
          nextStep = {
            type: 'level',
            level_id: nextLevel.id,
            title: nextLevel.get('title'),
          };
        }
      }

      return {
        message: 'Stage result fetched successfully',
        score,
        total,
        percent,
        evaluation,
        nextStep,
      };
    } catch (error: any) {
      console.error('Error in getStageResult:', error);
      throw {
        codeStatus: error.codeStatus || 1005,
        message: error.message || 'Failed to fetch stage result',
      };
    }
  }
}

export default new StageResultFunctions();
