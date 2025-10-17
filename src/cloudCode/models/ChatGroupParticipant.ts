import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('ChatGroupParticipants', {
  clp: {
    find: {'*': true},
    get: {'*': true},
    create: {'*': true},
    update: {'*': true},
    delete: {'*': true},
  },
})
export default class ChatGroupParticipant extends BaseModel {
  constructor() {
    super('ChatGroupParticipants');
  }

  @ParseField('Pointer', true, 'ChatGroup')
  chat_group_id!: Parse.Object;

  @ParseField('Pointer', true, '_User')
  user_id!: Parse.Object;

  @ParseField('Date', false)
  created_at?: Date;

  @ParseField('Date', false)
  updated_at?: Date;
}
