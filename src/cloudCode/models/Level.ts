import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('Level', {
  clp: {
    find: '*',
    get: '*',
    create: '*',
    update: '*',
    delete: '*',
  },
})
export default class Level extends BaseModel {
  constructor() {
    super('Level');
  }

  @ParseField('String', true)
  name!: string;

  @ParseField('String', true)
  code!: string;
}
