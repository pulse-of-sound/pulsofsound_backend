import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('OTPcode')
export default class OTPcode extends BaseModel {
  constructor() {
    super('OTPcode');
  }

  @ParseField('String', false)
  mobileNumber!: string;

  @ParseField('String', false)
  code!: string;
  static map(obj?: OTPcode): unknown {
    if (!obj) {
      return undefined;
    }
    return {
      id: obj.id,
      className: obj?.className,
      createdAt: obj?.createdAt,
      updatedAt: obj?.updatedAt,
      mobileNumber: obj?.mobileNumber,
      code: obj?.code,
    };
  }
}
