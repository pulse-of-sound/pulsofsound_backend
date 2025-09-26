import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('PlacementTestQuestion')
export default class PlacementTestQuestion extends Parse.Object {
  constructor() {
    super('PlacementTestQuestion');
  }

  @ParseField('File', false)
  question_image!: Parse.File;

  @ParseField('File', false)
  option_a_image!: Parse.File;

  @ParseField('File', false)
  option_b_image!: Parse.File;

  @ParseField('File', false)
  option_c_image!: Parse.File;

  @ParseField('File', false)
  option_d_image!: Parse.File;
}
