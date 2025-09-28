import {CloudFunction} from '../../utils/Registry/decorators';
import Level from '../../models/Level';

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
}

export default new LevelFunctions();
