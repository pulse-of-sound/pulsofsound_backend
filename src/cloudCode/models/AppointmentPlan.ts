import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('AppointmentPlan', {
  clp: {
    find: {'*': true},
    get: {'*': true},
    create: {'*': true},
    update: {'*': true},
    delete: {'*': true},
  },
})
export default class AppointmentPlan extends BaseModel {
  constructor() {
    super('AppointmentPlan');
  }

  @ParseField('String', true)
  title!: string;

  @ParseField('Number', true)
  duration_minutes!: number;

  @ParseField('Number', true)
  price!: number;

  @ParseField('String', false)
  description?: string;

  @ParseField('Date', false)
  created_at?: Date;

  @ParseField('Date', false)
  updated_at?: Date;
}
