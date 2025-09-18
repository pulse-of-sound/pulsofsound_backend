export class BaseModel extends Parse.Object {
  static fromParams<T extends typeof BaseModel>(
    this: T,
    params: any
  ): InstanceType<T> {
    params.className = new this().className;

    const raw = Parse.Object.fromJSON(params, true);
    Object.setPrototypeOf(raw, this.prototype);
    const obj = raw as InstanceType<T>;

    if (params.id) obj.id = params.id;

    const fieldsMeta = Reflect.getMetadata('parse:fields', this) || {};

    for (const field in fieldsMeta) {
      const fieldMeta = fieldsMeta[field];
      const fieldType = fieldMeta.type;
      const targetClass = fieldMeta.targetClass;
      const value = params[field];

      if (value === undefined) continue;
      if (targetClass === 'IMG') continue;
      if (targetClass === 'File') continue;

      // ✅ Pointer field
      if (fieldType === 'Pointer') {
        // Handle null and empty objects for Pointer fields
        if (
          value === null ||
          (value &&
            typeof value === 'object' &&
            Object.keys(value).length === 0)
        ) {
          obj.set(field, null);
          continue;
        }

        const PointerConstructor = Parse.Object.extend(targetClass);
        const pointerObj = new PointerConstructor();

        if (value && value.id) pointerObj.id = value.id;
        //pointerObj.set(value); // set even if it has id (for update)

        obj.set(field, pointerObj);
        continue;
      }

      // ✅ Array of Pointers
      if (fieldType === 'Array' && Array.isArray(value) && targetClass) {
        const PointerConstructor = Parse.Object.extend(targetClass);
        const pointerArray = value.map((item: any) => {
          const pointerObj = new PointerConstructor();
          pointerObj.id = item.id;
          return pointerObj;
        });
        obj.set(field, pointerArray);
        continue;
      }

      // ✅ Embedded object
      if (fieldType === 'Object') {
        obj.set(field, value);
        continue;
      }

      if (fieldType === 'Date') {
        obj.set(field, new Date(value));
        continue;
      }
      if (fieldType === 'GeoPoint') {
        obj.set(field, new Parse.GeoPoint(value));
        continue;
      }
      // ✅ Scalar
      obj.set(field, value);
    }

    return obj;
  }
}
