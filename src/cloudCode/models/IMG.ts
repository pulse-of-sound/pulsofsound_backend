import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('IMG', {
  clp: {
    find: {requiresAuthentication: true},
    get: {requiresAuthentication: true},
    count: {requiresAuthentication: true},
    create: {requiresAuthentication: true},
    update: {requiresAuthentication: true},
    delete: {requiresAuthentication: true},
  },
})
export default class IMG extends BaseModel {
  constructor() {
    super('IMG');
  }

  @ParseField('File', false)
  image!: Parse.File;

  @ParseField('File', false)
  imageThumbNail!: Parse.File;

  @ParseField('String', false)
  blurHash!: string;

  static map(obj?: IMG): unknown {
    if (!obj) {
      return undefined;
    }
    return {
      id: obj.id,
      className: obj?.className,
      createdAt: obj?.createdAt,
      updatedAt: obj?.updatedAt,

      image: obj?.image,
      imageThumbNail: obj?.imageThumbNail,
      blurHash: obj?.blurHash,
    };
  }

  static mapList(obj?: IMG[]): unknown {
    if (!obj || obj.length === 0) {
      return [];
    }
    return obj.map(obj => this.map(obj));
  }
}
