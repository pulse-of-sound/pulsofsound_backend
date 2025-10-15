import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('Invoice', {
  clp: {
    find: {'*': true},
    get: {'*': true},
    create: {'*': true},
    update: {'*': true},
    delete: {'*': true},
  },
})
export default class Invoice extends BaseModel {
  constructor() {
    super('Invoice');
  }

  @ParseField('Pointer', true, 'Appointment')
  appointment_id!: Parse.Object;

  @ParseField('Number', true)
  amount!: number;

  @ParseField('String', true)
  status!: string;

  @ParseField('Date', false)
  created_at?: Date;

  @ParseField('Date', false)
  updated_at?: Date;
}
