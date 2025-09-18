import {BaseModel} from '../utils/BaseModel';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';

@ParseClass('SpecializationReference', {
  clp: {
    find: '*',
    get: '*',
    create: '*',
    update: '*',
    delete: '*',
  },
})


export default class SpecializationReference extends BaseModel {
  constructor() {
    super('SpecializationReference');
  }

  @ParseField('String', false)
  specialization!: string;
}
