import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('Employee', {
  clp: {
    find: '*',
    get: '*',
    create: '*',
    update: '*',
    delete: '*',
  },
})
export default class Employee extends BaseModel {
  constructor() {
    super('Employee');
  }

  @ParseField('String', false)
  name!: string;

  @ParseField('String', false)
  position!: string;

  @ParseField('String', false)
  department!: string;

  @ParseField('Array', false)
skills!: string[];

  @ParseField('Date', false)
  hiredAt!: Date;
}
