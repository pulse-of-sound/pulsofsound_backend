import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('GameQuestion', {
  clp: {
    find: {'*': true},
    get: {'*': true},
    create: {'*': true},
    update: {'*': true},
    delete: {'*': true},
  },
})
export default class GameQuestion extends BaseModel {
  constructor() {
    super('GameQuestion');
  }

  @ParseField('Pointer', true, 'LevelGame')
  level_game_id!: Parse.Object;

  @ParseField('String', true)
  question_text!: string;

  @ParseField('String', false)
  question_type?: string;

  @ParseField('String', false)
  option_type?: string;

  @ParseField('Array', false)
  options?: string[];

  @ParseField('String', false)
  option_a?: string;

  @ParseField('String', false)
  option_b?: string;

  @ParseField('String', false)
  option_c?: string;

  @ParseField('String', false)
  option_d?: string;

  @ParseField('Date', false)
  created_at?: Date;

  @ParseField('Date', false)
  updated_at?: Date;
}
