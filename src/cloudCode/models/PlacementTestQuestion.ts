import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('PlacementTestQuestion')
export default class PlacementTestQuestion extends Parse.Object {
  constructor() {
    super('PlacementTestQuestion');
  }

  @ParseField('File', false)
  question_image_url!: Parse.File;

  @ParseField('File', false)
  option_a_image_url!: Parse.File;

  @ParseField('File', false)
  option_b_image_url!: Parse.File;

  @ParseField('File', false)
  option_c_image_url!: Parse.File;

  @ParseField('File', false)
  option_d_image_url!: Parse.File;
}
