import {CloudFunction} from '../../utils/Registry/decorators';
import ChildLevel from '../../models/ChildLevel';
import ChildProfile from '../../models/ChildProfile';
import Level from '../../models/Level';

class ChildLevelFunctions {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        childId: {required: true, type: String},
        levelId: {required: true, type: String},
      },
    },
  })
  async assignLevelToChild(req: Parse.Cloud.FunctionRequest) {
    const {childId, levelId} = req.params;

    try {
      const child = await new Parse.Query(ChildProfile)
        .equalTo('objectId', childId)
        .first({useMasterKey: true});

      const level = await new Parse.Query(Level)
        .equalTo('objectId', levelId)
        .first({useMasterKey: true});

      if (!child || !level) {
        throw {
          codeStatus: 101,
          message: 'Child or Level not found',
        };
      }

      const existing = await new Parse.Query(ChildLevel)
        .equalTo('child', child)
        .first({useMasterKey: true});

      const childLevel = existing || new ChildLevel();
      childLevel.set('child', child);
      childLevel.set('level', level);
      childLevel.set('current_game_order', 1);

      await childLevel.save(null, {useMasterKey: true});

      return childLevel.toJSON();
    } catch (error: any) {
      console.error('Error in assignLevelToChild:', error);
      throw {
        codeStatus: 1000,
        message: error.message || 'Failed to assign level to child',
      };
    }
  }
}

export default new ChildLevelFunctions();
