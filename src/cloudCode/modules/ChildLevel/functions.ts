import {CloudFunction} from '../../utils/Registry/decorators';
import ChildLevel from '../../models/ChildLevel';
import ChildProfile from '../../models/ChildProfile';
import Level from '../../models/Level';
import {catchError} from '../../utils/catchError';

class ChildLevelFunctions {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        child_id: {type: String, required: true},
      },
    },
  })
  async assignChildLevelIfPassed(req: Parse.Cloud.FunctionRequest) {
    const {child_id} = req.params;
    const user = req.user;

    if (!user) {
      throw {
        codeStatus: 5001,
        message: 'Unauthorized: user not found',
      };
    }

    const score = user.get('placement_test_score');
    if (typeof score !== 'number') {
      throw {
        codeStatus: 5002,
        message: 'Placement test score is missing or invalid',
      };
    }

    if (score < 70) {
      return {
        passed: false,
        message: 'Child did not pass. Training required.',
      };
    }

    const childProfile = await new Parse.Query(ChildProfile)
      .equalTo('objectId', child_id)
      .include('parent_id')
      .include('user')
      .first({useMasterKey: true});

    if (!childProfile) {
      throw {
        codeStatus: 5003,
        message: 'ChildProfile not found',
      };
    }

    const parent = childProfile.get('parent_id');
    const directUser = childProfile.get('user');

    const isChild = user.id === child_id;
    const isParent =
      (parent && user.id === parent.id) ||
      (directUser && user.id === directUser.id);

    if (!isChild && !isParent) {
      throw {
        codeStatus: 5006,
        message: 'Access denied: not child or parent',
      };
    }

    const firstLevel = await new Parse.Query(Level)
      .ascending('order')
      .first({useMasterKey: true});

    if (!firstLevel) {
      throw {
        codeStatus: 5004,
        message: 'No levels found in system',
      };
    }

    const existing = await new Parse.Query(ChildLevel)
      .equalTo('child_id', childProfile)
      .first({useMasterKey: true});

    const childLevel = existing || new ChildLevel();
    childLevel.set('child_id', childProfile);
    childLevel.set('level_id', firstLevel);
    childLevel.set('current_game_order', 1);

    const [error, saved] = await catchError(
      childLevel.save(null, {useMasterKey: true})
    );

    if (error) {
      throw {
        codeStatus: 5005,
        message: 'Error saving ChildLevel data',
      };
    }

    return {
      passed: true,
      message: 'Child level assigned successfully',
      childLevel: {
        objectId: saved.id,
        child_id: childProfile.id,
        level_id: firstLevel.id,
        current_game_order: 1,
      },
    };
  }
}

export default new ChildLevelFunctions();
