import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('LevelGame', {
  clp: {
    find: {'*': true},
    get: {'*': true},
    create: {'*': true},
    update: {'*': true},
    delete: {'*': true},
  },
})
export default class LevelGame extends BaseModel {
  constructor() {
    super('LevelGame');
  }

  @ParseField('Pointer', true, 'Level')
  level_id!: Parse.Object;
  @ParseField('String', true)
  name!: string;

  @ParseField('Number', true)
  order!: number;

  @ParseField('Date', false)
  created_at?: Date;

  @ParseField('Date', false)
  updated_at?: Date;
}
