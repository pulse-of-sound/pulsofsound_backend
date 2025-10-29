import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('ChargeRequest', {
  clp: {
    find: {'*': true},
    get: {'*': true},
    create: {'*': true},
    update: {'*': true},
    delete: {'*': true},
  },
})
export default class ChargeRequest extends BaseModel {
  constructor() {
    super('ChargeRequest');
  }

  @ParseField('Pointer', true, 'Wallet')
  wallet_id!: Parse.Object;

  @ParseField('Number', true)
  amount!: number;

  @ParseField('String', true)
  status!: string;

  @ParseField('String', false)
  note?: string;

  @ParseField('File', false)
  receipt_image?: Parse.File;

  @ParseField('Date', false)
  created_at?: Date;

  @ParseField('Date', false)
  updated_at?: Date;
}
