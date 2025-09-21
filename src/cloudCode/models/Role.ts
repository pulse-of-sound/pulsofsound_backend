import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('_Role')
export default class Role extends Parse.Object {
  constructor() {
    super('_Role');
  }

  @ParseField('String', false)
  name!: string;

  @ParseField('Boolean', false)
  isCustom!: boolean;

  @ParseField('Date', false)
  _created_at!: Date;

  @ParseField('Date', false)
  _updated_at!: Date;
}
