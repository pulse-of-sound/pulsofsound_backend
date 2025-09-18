import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('UserDeleted', {
  clp: {
    find: {requiresAuthentication: true},
    get: {requiresAuthentication: true},
    create: {requiresAuthentication: true},
    update: {requiresAuthentication: true},
    delete: {requiresAuthentication: true},
  },
})
export default class UserDeleted extends BaseModel {
  constructor() {
    super('UserDeleted');
  }

  @ParseField('Boolean', false)
  isDeleted!: boolean;

  static map(obj?: UserDeleted): unknown {
    if (!obj) {
      return undefined;
    }
    return {
      id: obj.id,
      className: obj?.className,
      createdAt: obj?.createdAt,
      updatedAt: obj?.updatedAt,
      isBlocked: obj?.isDeleted,
    };
  }
}
