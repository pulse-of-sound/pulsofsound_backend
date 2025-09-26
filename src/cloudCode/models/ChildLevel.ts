import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';
import ChildProfile from './ChildProfile';
import Level from './Level';

@ParseClass('ChildLevel')
export default class ChildLevel extends Parse.Object {
  constructor() {
    super('ChildLevel');
  }

  @ParseField('Pointer', false, 'ChildProfile')
  child!: ChildProfile;

  @ParseField('Pointer', false, 'Level')
  level!: Level;

  @ParseField('Number', false)
  current_game_order!: number;
}
