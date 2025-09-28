import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('TrainingQuestion', {
  clp: {
    find: {'*': true},
    get: {'*': true},
    create: {'*': true},
    update: {'*': true},
    delete: {'*': true},
  },
})
export default class TrainingQuestion extends BaseModel {
  constructor() {
    super('TrainingQuestion');
  }

  @ParseField('String', true)
  question_image_url!: string;

  @ParseField('String', true)
  option_a!: string;

  @ParseField('String', true)
  option_b!: string;

  @ParseField('String', true)
  option_c!: string;

  @ParseField('Date', false)
  created_at?: Date;

  @ParseField('Date', false)
  updated_at?: Date;
}
