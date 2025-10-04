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

  @ParseField('File', true)
  question_image_url!: Parse.File;

  @ParseField('File', true)
  option_a!: Parse.File;

  @ParseField('File', true)
  option_b!: Parse.File;

  @ParseField('File', true)
  option_c!: Parse.File;

  @ParseField('Date', false)
  created_at?: Date;

  @ParseField('Date', false)
  updated_at?: Date;
}
