import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';
import {MultiLangs} from './Interfaces/MultiLangs';

@ParseClass('Test', {
  clp: {
    find: '*',
    get: '*',
    create: '*',
    update: '*',
    delete: '*',
  },
})
export default class Test extends BaseModel {
  constructor() {
    super('Test');
  }


  @ParseField('String', false)
  name!: string;

  @ParseField('String', false)
  question!: string;

  @ParseField('String', false)
  specialization!: string;

  static map(obj?: Test): unknown {
    if (!obj) {
      return undefined;
    }
    return {
      id: obj.id,
      className: obj?.className,
      createdAt: obj?.createdAt,
      updatedAt: obj?.updatedAt,
      name: obj?.name,
    };
  }
}
