import {CloudFunction} from '../../utils/Registry/decorators';
import LevelGame from '../../models/LevelGame';

class LevelGameFunctions {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: false,
      fields: {
        levelId: {required: true, type: String},
        name: {required: true, type: String},
        order: {required: true, type: Number},
      },
    },
  })
  async addLevelGameByAdmin(req: Parse.Cloud.FunctionRequest) {
    try {
      const {levelId, name, order} = req.params;

      const levelPointer = new Parse.Object('Level');
      levelPointer.id = levelId;

      const existing = await new Parse.Query(LevelGame)
        .equalTo('level_id', levelPointer)
        .equalTo('order', order)
        .first({useMasterKey: true});

      if (existing) {
        throw {
          codeStatus: 102,
          message: 'LevelGame with this order already exists in this level',
        };
      }

      const levelGame = new LevelGame();
      levelGame.set('level_id', levelPointer);
      levelGame.set('name', name);
      levelGame.set('order', order);
      levelGame.set('created_at', new Date());
      levelGame.set('updated_at', new Date());

      await levelGame.save(null, {useMasterKey: true});

      return {
        message: 'LevelGame added successfully',
        levelGame: levelGame.toJSON(),
      };
    } catch (error: any) {
      console.error('Error in addLevelGameByAdmin:', error);
      throw {
        codeStatus: error.codeStatus || 1002,
        message: error.message || 'Failed to add level game',
      };
    }
  }
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: false,
      fields: {
        level_id: { required: true, type: String }
      }
    }
  })
  async getLevelGamesForLevel(req: Parse.Cloud.FunctionRequest) {
    try {
      const { level_id } = req.params;

      const levelPointer = new Parse.Object('Level');
      levelPointer.id = level_id;

      const query = new Parse.Query(LevelGame);
      query.equalTo('level_id', levelPointer);
      query.ascending('order');

      const results = await query.find({ useMasterKey: true });

      const stages = results.map(stage => ({
        objectId: stage.id,
        name: stage.get('name'),
        description: stage.get('description'),
        order: stage.get('order'),
        level_id: level_id
      }));

      return {
        message: 'Level games fetched successfully',
        stages
      };
    } catch (error: any) {
      console.error('Error in getLevelGamesForLevel:', error);
      throw {
        codeStatus: error.codeStatus || 1001,
        message: error.message || 'Failed to fetch level games'
      };
    }
  }
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: false,
      fields: {
        level_id: { required: true, type: String },
        current_order: { required: true, type: Number }
      }
    }
  })
  async getNextStageOrder(req: Parse.Cloud.FunctionRequest) {
    const { level_id, current_order } = req.params;

    const levelPointer = new Parse.Object('Level');
    levelPointer.id = level_id;

    const query = new Parse.Query(LevelGame);
    query.equalTo('level_id', levelPointer);
    query.equalTo('order', current_order + 1);

    const nextStage = await query.first({ useMasterKey: true });

    if (!nextStage) {
      return {
        completed: true,
        message: 'Child has completed all stages in this level'
      };
    }

    return {
      completed: false,
      message: 'Next stage found',
      next_stage: {
        objectId: nextStage.id,
        name: nextStage.get('name'),
        order: nextStage.get('order')
      }
    };
  }
}

export default new LevelGameFunctions();
