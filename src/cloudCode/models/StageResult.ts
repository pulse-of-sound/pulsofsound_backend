import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('StageResult', {
  clp: {
    find: {'*': true},
    get: {'*': true},
    create: {'*': true},
    update: {'*': true},
    delete: {'*': true},
  },
})
export default class StageResult extends BaseModel {
  constructor() {
    super('StageResult');
  }

  @ParseField('Pointer', true, '_User')
  user_id!: Parse.User;

  @ParseField('Pointer', true, 'LevelGame')
  level_game_id!: Parse.Object;

  @ParseField('Number', false)
  score?: number;

  @ParseField('Number', false)
  total_questions?: number;

  @ParseField('Array', false)
  answers?: object[];

  @ParseField('Date', false)
  created_at?: Date;

  @ParseField('Date', false)
  updated_at?: Date;
}
