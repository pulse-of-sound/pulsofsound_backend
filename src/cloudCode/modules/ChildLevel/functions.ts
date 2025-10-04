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
    },
  })
  async assignChildLevelIfPassed(req: Parse.Cloud.FunctionRequest) {
    const user = req.user;
    if (!user) {
      throw {
        codeStatus: 103,
        message: 'User context is missing',
      };
    }

    const score = user.get('placement_test_score');
    if (typeof score !== 'number') {
      throw {
        codeStatus: 104,
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
      .equalTo('user', user)
      .first({useMasterKey: true});

    if (!childProfile) {
      throw {
        codeStatus: 105,
        message: 'ChildProfile not found for this user',
      };
    }

    const firstLevel = await new Parse.Query(Level)
      .ascending('order')
      .first({useMasterKey: true});

    if (!firstLevel) {
      throw {
        codeStatus: 106,
        message: 'No levels found in system',
      };
    }

    const existing = await new Parse.Query(ChildLevel)
      .equalTo('child', childProfile)
      .first({useMasterKey: true});
    const childLevel = existing || new ChildLevel();
    // childLevel.child = childProfile
    childLevel.set('child', childProfile);
    childLevel.set('level', firstLevel);
    childLevel.set('current_game_order', 1);

    const [error, data] = await catchError(
      childLevel.save(null, {useMasterKey: true})
    );
    if (error) {
      throw 'Error Saving Data';
    }

    return data;
  }
}

export default new ChildLevelFunctions();
