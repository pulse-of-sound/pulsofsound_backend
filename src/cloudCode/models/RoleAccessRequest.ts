import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';
import User from './User';

@ParseClass('RoleAccessRequest')
export default class RoleAccessRequest extends Parse.Object {
  constructor() {
    super('RoleAccessRequest');
  }

  @ParseField('String', false)
  mobileNumber!: string;

  @ParseField('String', false)
  code!: string;

  @ParseField('String', false)
  role!: string;

  @ParseField('Pointer', false, '_User')
  createdBy!: User;

  @ParseField('Boolean', false)
  isUsed!: boolean;

  @ParseField('Date', false)
  expiresAt!: Date;
}
