import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';
import PlacementTestQuestion from './PlacementTestQuestion';

@ParseClass('PlacementTestCorrectAnswer')
export default class PlacementTestCorrectAnswer extends Parse.Object {
  constructor() {
    super('PlacementTestCorrectAnswer');
  }

  @ParseField('Pointer', false, 'PlacementTestQuestion')
  question!: PlacementTestQuestion;

  @ParseField('String', false)
  correct_option!: string;
}
