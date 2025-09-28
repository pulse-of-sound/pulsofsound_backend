import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';
import PlacementTestQuestion from './PlacementTestQuestion';

@ParseClass('PlacementTestCorrectAnswer')
export default class PlacementTestCorrectAnswer extends Parse.Object {
  constructor() {
    super('PlacementTestCorrectAnswer');
  }
  @ParseField('String', false)
  correct_option!: string;

  @ParseField('Pointer', false, 'PlacementTestQuestion')
  question!: PlacementTestQuestion;
}
