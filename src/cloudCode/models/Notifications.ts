import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('Notifications', {
  clp: {
    find: {'*': true},
    get: {'*': true},
    create: {'*': true},
    update: {'*': true},
    delete: {'*': true},
  },
})
export default class Notifications extends BaseModel {
  constructor() {
    super('Notifications');
  }

  @ParseField('Pointer', true, '_User')
  user_id!: Parse.Object;

  @ParseField('String', true)
  title!: string;

  @ParseField('String', true)
  body!: string;

  @ParseField('String', false)
  type?: string;

  @ParseField('Pointer', false, 'Appointment')
  appointment_id?: Parse.Object;

  @ParseField('Pointer', false, 'ChatGroup')
  chat_group_id?: Parse.Object;

  @ParseField('String', false)
  image?: string;

  @ParseField('Boolean', false)
  is_read?: boolean;

  @ParseField('Date', false)
  created_at?: Date;

  @ParseField('Date', false)
  updated_at?: Date;
}
