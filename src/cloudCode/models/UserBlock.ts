import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('UserBlock', {
  clp: {
    find: {requiresAuthentication: true},
    get: {requiresAuthentication: true},
    create: {requiresAuthentication: true},
    update: {requiresAuthentication: true},
    delete: {requiresAuthentication: true},
  },
})
export default class UserBlock extends BaseModel {
  constructor() {
    super('UserBlock');
  }

  @ParseField('Boolean', false)
  isBlocked!: boolean;

  static map(obj?: UserBlock): unknown {
    if (!obj) {
      return undefined;
    }
    return {
      id: obj.id,
      className: obj?.className,
      createdAt: obj?.createdAt,
      updatedAt: obj?.updatedAt,
      isBlocked: obj?.isBlocked,
    };
  }
}
