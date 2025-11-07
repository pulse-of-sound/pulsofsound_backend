import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('StageQuestion', {
  clp: {
    find: {'*': true},
    get: {'*': true},
    create: {'*': true},
    update: {'*': true},
    delete: {'*': true},
  },
})
export default class StageQuestion extends BaseModel {
  constructor() {
    super('StageQuestion');
  }

  @ParseField('Pointer', true, 'LevelGame')
  level_game_id!: Parse.Object;

  @ParseField('String', true)
  question_type!: string;

  @ParseField('String', false)
  instruction?: string;

  @ParseField('Array', false)
  images?: string[];

  @ParseField('Object', false)
  correct_answer?: object;

  @ParseField('Object', false)
  options?: object;

  @ParseField('Date', false)
  created_at?: Date;

  @ParseField('Date', false)
  updated_at?: Date;
  @ParseField('Number', false)
  order?: number;
}
