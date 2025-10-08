import {CloudFunction} from '../../utils/Registry/decorators';
import Level from '../../models/Level';
// import LevelGame from '../../models/LevelGame';

class LevelFunctions {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: false,
      fields: {
        name: {required: true, type: String},
        description: {required: false, type: String},
        order: {required: true, type: Number},
      },
    },
  })
  async addLevelByAdmin(req: Parse.Cloud.FunctionRequest) {
    try {
      const {name, description, order} = req.params;

      const existing = await new Parse.Query(Level)
        .equalTo('order', order)
        .first({useMasterKey: true});

      if (existing) {
        throw {
          codeStatus: 101,
          message: 'Level with this order already exists',
        };
      }

      const level = new Level();
      level.set('name', name);
      level.set('description', description || '');
      level.set('order', order);
      level.set('created_at', new Date());
      level.set('updated_at', new Date());

      await level.save(null, {useMasterKey: true});

      return {
        message: 'Level added successfully',
        level: level.toJSON(),
      };
    } catch (error: any) {
      console.error('Error in addLevelByAdmin:', error);
      throw {
        codeStatus: error.codeStatus || 1000,
        message: error.message || 'Failed to add level',
      };
    }
  }

  @CloudFunction({
    methods: ['GET'],
    validation: {
      requireUser: false,
      fields: {},
    },
  })
  async getAllLevels(req: Parse.Cloud.FunctionRequest) {
    const query = new Parse.Query(Level);
    query.ascending('order');

    const results = await query.find({useMasterKey: true});

    const levels = results.map(level => ({
      objectId: level.id,
      name: level.get('name'),
      description: level.get('description'),
      order: level.get('order'),
    }));

    return {
      message: 'All levels fetched successfully',
      levels,
    };
  }
}

export default new LevelFunctions();
