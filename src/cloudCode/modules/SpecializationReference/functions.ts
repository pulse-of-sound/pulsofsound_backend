import SpecializationReference from '../../models/SpecializationReference';

import AccountStatus from '../../models/AccountStatus';
import User from '../../models/User';
import UserBlock from '../../models/UserBlock';
import UserDeleted from '../../models/UserDelete';
import {CloudFunction} from '../../utils/Registry/decorators';
import {catchError} from '../../utils/catchError';
import {UserRoles} from '../../utils/constants';
import {generateRandomString} from '../../utils/generateRandom';

class EmergencyFunctions {
  @CloudFunction({ methods: ['GET'] })
  async forceCreateSpecialization(req: Parse.Cloud.FunctionRequest) {
    const obj = new Parse.Object('SpecializationReference');
    obj.set('specialization', 'manual');
    return await obj.save();
  }
}

export default EmergencyFunctions;

