import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('Appointment', {
  clp: {
    find: {'*': true},
    get: {'*': true},
    create: {'*': true},
    update: {'*': true},
    delete: {'*': true},
  },
})
export default class Appointment extends BaseModel {
  constructor() {
    super('Appointment');
  }

  @ParseField('Pointer', true, '_User')
  user_id!: Parse.Object;

  @ParseField('Pointer', true, '_User')
  provider_id!: Parse.Object;

  @ParseField('Pointer', true, 'ChildProfile')
  child_id!: Parse.Object;

  @ParseField('Pointer', true, 'AppointmentPlan')
  appointment_plan_id!: Parse.Object;

  @ParseField('String', false)
  note?: string;

  @ParseField('String', true)
  status!: string;

  @ParseField('Date', false)
  created_at?: Date;

  @ParseField('Date', false)
  updated_at?: Date;
}
