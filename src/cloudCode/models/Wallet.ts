import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('Wallet', {
  clp: {
    find: {'*': true},
    get: {'*': true},
    create: {'*': true},
    update: {'*': true},
    delete: {'*': true},
  },
})
export default class Wallet extends BaseModel {
  constructor() {
    super('Wallet');
  }

  @ParseField('Pointer', true, '_User')
  user_id!: Parse.Object;

  @ParseField('Number', true)
  balance!: number;

  @ParseField('Date', false)
  created_at?: Date;

  @ParseField('Date', false)
  updated_at?: Date;
}
