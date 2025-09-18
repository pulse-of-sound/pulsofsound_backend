import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('Admin')
export default class Admin extends Parse.Object {
  constructor() {
    super('Admin');
  }

  @ParseField('String', false)
  name!: string;

  @ParseField('String', false)
  mobileNumber!: string;

  @ParseField('Pointer', false, '_User')
  user!: Parse.User;
}
