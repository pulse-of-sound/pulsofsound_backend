import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';
import {MultiLangs} from './Interfaces/MultiLangs';

@ParseClass('AccountStatus', {
  clp: {
    find: {requiresAuthentication: true},
    get: {requiresAuthentication: true},
    create: {requiresAuthentication: true},
    update: {requiresAuthentication: true},
    delete: {requiresAuthentication: true},
  },
})
export default class AccountStatus extends BaseModel {
  constructor() {
    super('AccountStatus');
  }
  @ParseField('String', false)
  code!: string;
  @ParseField('Object', false)
  name!: MultiLangs;

  static map(obj?: AccountStatus): unknown {
    if (!obj) {
      return undefined;
    }
    return {
      id: obj.id,
      className: obj?.className,
      createdAt: obj?.createdAt,
      updatedAt: obj?.updatedAt,
      code: obj?.code,
      name: obj?.name,
    };
  }
}
