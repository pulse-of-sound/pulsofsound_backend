import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('ChatMessage', {
  clp: {
    find: {'*': true},
    get: {'*': true},
    create: {'*': true},
    update: {'*': true},
    delete: {'*': true},
  },
})
export default class ChatMessage extends BaseModel {
  constructor() {
    super('ChatMessage');
  }

  @ParseField('Pointer', true, 'ChatGroup')
  chat_group_id!: Parse.Object;

  @ParseField('Pointer', true, '_User')
  send_id!: Parse.Object;

  @ParseField('Pointer', false, '_User')
  receive_id?: Parse.Object;

  @ParseField('Pointer', false, 'ChildProfile')
  child_id?: Parse.Object;

  @ParseField('String', true)
  message!: string;

  @ParseField('Pointer', false, 'Notifications')
  notifications_id?: Parse.Object;

  @ParseField('Date', true)
  time!: Date;

  @ParseField('Date', false)
  created_at?: Date;

  @ParseField('Date', false)
  updated_at?: Date;
}
