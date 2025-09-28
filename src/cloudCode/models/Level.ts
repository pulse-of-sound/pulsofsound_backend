import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('Level', {
  clp: {
    find: {'*': true},
    get: {'*': true},
    create: {'*': true},
    update: {'*': true},
    delete: {'*': true},
  },
})
export default class Level extends BaseModel {
  constructor() {
    super('Level');
  }

  @ParseField('String', true)
  name!: string;

  @ParseField('String', false)
  description?: string;

  @ParseField('Number', true)
  order!: number;

  @ParseField('Date', false)
  created_at?: Date;

  @ParseField('Date', false)
  updated_at?: Date;
}
