import IMG from '../models/IMG';
import {catchError} from './catchError';

async function createImageFromBase64(
  base64: string,
  name: string
): Promise<Parse.File> {
  const safeName = encodeURIComponent(name || 'image.webp');
  const file = new Parse.File(safeName, {base64});
  return await file.save({useMasterKey: true});
}

// ✅ Handle Single Image (Pointer)
// export async function handleImageLogic<T extends Parse.Object>(
//   object: T, // main object that conatin image object
//   file: any, // image object
//   id: string | undefined, // id of the main object
//   attributeName: string // name of the attribute that contains the image object
// ): Promise<void> {
//   // empty image
//   if (!file) return;

//   if (!file.image.url && !file.image.base64) {
//     object.unset(attributeName);
//     return;
//   }

//   const className = object.className;

//   // Remove old image if no id/url in the new one
//   if (!file?.image?.id && !file?.image?.url && id) {
//     const query = new Parse.Query(className);
//     query.equalTo('objectId', id);
//     query.include([attributeName]);

//     const classObject = await query.first({useMasterKey: true});
//     const oldImg = classObject?.get(attributeName);
//     if (oldImg) {
//       await oldImg.destroy({useMasterKey: true});
//       object.unset(attributeName);
//     }
//   }

//   let imgObj = new IMG();

//   // if the main object has image object (reference to an existing IMG object)
//   if (file?.image && file?.image?.url) {
//     imgObj.id = file.id;
//     imgObj.image = file.image;
//     imgObj.imageThumbNail = file.imageThumbNail;
//     imgObj.blurHash = file.blurHash;
//     object.set(attributeName, imgObj);
//   }

//   //sends a new image upload
//   if (file?.base64) {
//     const fileUpload = await createImageFromBase64(file.base64, file.name);
//     imgObj.image = fileUpload;
//     object.set(attributeName, imgObj);
//   }

//   object.set(attributeName, imgObj);
// }

async function destroyOldImage(
  id: string,
  className: string,
  attributeName: string
) {
  if (!id) return;

  const query = new Parse.Query(className);
  query.equalTo('objectId', id);
  query.include([attributeName]);
  const classObject = await query.first({useMasterKey: true});
  const oldImg = classObject?.get(attributeName);

  if (oldImg && typeof oldImg.destroy === 'function') {
    await oldImg.destroy({useMasterKey: true});
    console.log('Old image destroyed');
  }
}

export async function handleImageLogic<T extends Parse.Object>(
  object: T,
  file: any,
  id: string | undefined,
  attributeName: string
): Promise<void> {
  const className = object.className;

  // when the key of image not provided in request
  if (!file) return;

  // Add new object and no image provided to it
  if (!file?.image && !id) return;

  // Update existing object and remove image from it
  if (!file.image?.url && !file.image?.base64 && id) {
    console.log('No image provided, removing old image if exists');

    // const query = new Parse.Query(className);
    // query.equalTo('objectId', id);
    // query.include([attributeName]);
    // const classObject = await query.first({useMasterKey: true});
    // const oldImg = classObject?.get(attributeName);
    // if (oldImg && typeof oldImg.destroy === 'function') {
    //   try {
    //     await oldImg.destroy({useMasterKey: true});
    //     console.log('Old image destroyed');
    //   } catch (err) {
    //     console.error('Failed to destroy old image:', err);
    //   }
    // }
    //object.unset(attributeName);

    const [error] = await catchError(
      destroyOldImage(id!, className, attributeName)
    );
    if (error) {
      console.error('Error destroying old image:', error);
    }
    return;
  }

  const imgObj = new IMG();

  // Upload new image (base64) to new or existing object,delete old image and set new one
  if (file?.image?.base64 && file?.image?.name) {
    console.log('Uploading new image');

    const [error] = await catchError(
      destroyOldImage(id!, className, attributeName)
    );
    if (error) {
      console.error('Error destroying old image:', error);
    }

    const [uploadError, fileUpload] = await catchError(
      createImageFromBase64(file.image.base64, file.image.name)
    );

    if (uploadError) {
      console.error('File upload failed:', uploadError);
      return;
    }

    console.log('File uploaded successfully');

    imgObj.image = fileUpload;
    if (file.imageThumbNail) imgObj.imageThumbNail = file.imageThumbNail;
    if (file.blurHash) imgObj.blurHash = file.blurHash;
  }

  //  Don't update the image that is in updated object (Reference existing image no new upload)
  if (file?.id && file?.image?.url && !file?.image?.base64) {
    console.log('Referencing existing image, setting only pointer');
    //const imgObj = new IMG();
    imgObj.id = file.id;
    // Do NOT set image, imageThumbNail, or blurHash fields here!
    // object.set(attributeName, imgObj);
    // return;
  }

  object.set(attributeName, imgObj);
  // if file is present but doesn't match above, just set as object
  // object.set(attributeName, file);
}

// ✅ Handle List of Images (Array of IMG)
export async function handleImageArrayLogic<T extends Parse.Object>(
  object: T,
  files: any[] = [],
  id: string | undefined,
  attributeName: string
): Promise<void> {
  const className = object.className;

  // Collect incoming image ids (for existing images)
  const incomingIds = new Set(
    files
      .map(f => {
        // Handle existing IMG objects (with full Parse structure)
        if (f && f.id && f.className === 'IMG') {
          return f.id;
        }
        // Handle new uploads (with image wrapper)
        if (f && f.image && f.image.id) {
          return f.image.id;
        }
        // Handle direct image objects
        // if (f && f.id) {
        //   return f.id;
        // }
        return null;
      })
      .filter(Boolean)
  );
  const newImages: IMG[] = [];

  // 🔍 Fetch and clean old images if necessary
  if (id) {
    const query = new Parse.Query(className);
    query.equalTo('objectId', id);
    query.include([attributeName]);

    const existingObj = await query.first({useMasterKey: true});
    const currentImages: IMG[] = existingObj?.get(attributeName) || [];

    for (const img of currentImages) {
      if (!incomingIds.has(img.id)) {
        const [error] = await catchError(img.destroy({useMasterKey: true}));
        if (error) {
          console.error('Error destroying old image:', error);
        }
      }
    }
  }

  // 🖼 Process each image in the array
  for (const fileWrapper of files) {
    let imgObj = new IMG();

    //existing IMG object (full IMG object structure)
    // if (fileWrapper && fileWrapper.id && fileWrapper.className === 'IMG') {
    //   console.log('Using existing IMG object:', fileWrapper.id);
    //   imgObj = fileWrapper as IMG;
    //   newImages.push(imgObj);
    //   continue;
    // }

    //  New image upload (with image wrapper)
    if (fileWrapper && fileWrapper.image && fileWrapper.image.base64) {
      console.log('Uploading new image with wrapper');
      const file = fileWrapper.image;

      const [uploadError, parseFile] = await catchError(
        createImageFromBase64(file.base64, file.name)
      );
      if (uploadError) {
        console.error('File upload failed:', uploadError);
        continue;
      }

      imgObj.image = parseFile;
      if (file.imageThumbNail) imgObj.imageThumbNail = file.imageThumbNail;
      if (file.blurHash) imgObj.blurHash = file.blurHash;
      newImages.push(imgObj);
      continue;
    }

    // Case 3: Direct image object (without wrapper)
    // if (fileWrapper && fileWrapper.base64 && fileWrapper.name) {
    //   console.log('Uploading new image directly');

    //   const [uploadError, parseFile] = await catchError(
    //     createImageFromBase64(fileWrapper.base64, fileWrapper.name)
    //   );
    //   if (uploadError) {
    //     console.error('File upload failed:', uploadError);
    //     continue;
    //   }

    //   imgObj.image = parseFile;
    //   if (fileWrapper.imageThumbNail)
    //     imgObj.imageThumbNail = fileWrapper.imageThumbNail;
    //   if (fileWrapper.blurHash) imgObj.blurHash = fileWrapper.blurHash;
    //   newImages.push(imgObj);
    //   continue;
    // }

    // Reference existing image (by id and url)
    if (
      fileWrapper &&
      fileWrapper.image &&
      fileWrapper.id &&
      fileWrapper.image.url &&
      !fileWrapper.image.base64
    ) {
      console.log('Referencing existing image by id and url');
      imgObj.id = fileWrapper.id;
      newImages.push(imgObj);
      continue;
    }

    // Direct reference to existing IMG (by id and url)
    // if (
    //   fileWrapper &&
    //   fileWrapper.id &&
    //   fileWrapper.url &&
    //   !fileWrapper.base64
    // ) {
    //   console.log('Referencing existing image directly');
    //   imgObj.id = fileWrapper.id;
    //   newImages.push(imgObj);
    //   continue;
    // }

    // // Case 6: Fallback - skip invalid items
    // console.log('Skipping invalid image item:', fileWrapper);
  }

  // ✅ Always overwrite with new list
  object.set(attributeName, newImages);
}
