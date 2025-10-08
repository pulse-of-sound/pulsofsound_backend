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
    methods: ['GET'],
    validation: {
      requireUser: true,
      fields: {
        levelId: {required: true, type: String},
      },
    },
  })
  async getLevelGames(req: Parse.Cloud.FunctionRequest) {
    try {
      const {levelId} = req.params;

      const query = new Parse.Query(LevelGame);
      query.equalTo(
        'level_id',
        new Parse.Object('Level').set('objectId', levelId)
      );
      query.ascending('order');

      const results = await query.find({useMasterKey: true});

      const levelGames = results.map(game => ({
        objectId: game.id,
        name: game.get('name'),
        order: game.get('order'),
      }));

      return {
        message: 'Level games fetched successfully',
        levelGames,
      };
    } catch (error: any) {
      console.error('Error in getLevelGames:', error);
      throw {
        codeStatus: error.codeStatus || 1001,
        message: error.message || 'Failed to fetch level games',
      };
    }
  }
}

export default new LevelGameFunctions();
