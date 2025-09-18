import {count} from 'console';
import Employee from '../../models/Employee';
import {CloudFunction} from '../../utils/Registry/decorators';
import Level from '../../models/Level';

class LevelFunctions {
  @CloudFunction({methods: ['GET']})
  async getLevel(req: Parse.Cloud.FunctionRequest) {
    return new Parse.Query(Level).find();
  }

  @CloudFunction({methods: ['GET']})
  async addEditLevel(req: Parse.Cloud.FunctionRequest) {
    return 'Hi';
  }
}

export default LevelFunctions;
