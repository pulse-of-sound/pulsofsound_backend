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
    const score = req.user!.get('placement_test_score');
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
      .equalTo('user', req.user)
      .first({useMasterKey: true});

    if (!childProfile) {
      throw {
        codeStatus: 5003,
        message: 'ChildProfile not found for this user',
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
      .equalTo('child', childProfile)
      .first({useMasterKey: true});

    const childLevel = existing || new ChildLevel();
    childLevel.set('child', childProfile);
    childLevel.set('level', firstLevel);
    childLevel.set('current_game_order', 1);

    const [error, data] = await catchError(
      childLevel.save(null, {useMasterKey: true})
    );

    if (error) {
      throw {
        codeStatus: 5005,
        message: 'Error saving ChildLevel data',
      };
    }

    return data;
  }
}

export default new ChildLevelFunctions();
