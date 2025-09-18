import {encode} from 'blurhash';

import axios from 'axios';
import sharp = require('sharp');
import IMG from '../../models/IMG';
require('dotenv').config();
Parse.Cloud.beforeSave(IMG, async request => {
  const object = request.object;

  const image = object.image;

  const url = image?.url();
  console.log(':: IN BEFROE SAVE ', url);

  if (!url) return;
  const imgBuffer = await axios.get(url, {
    responseType: 'arraybuffer',
  });

  const image_large = await sharp(imgBuffer.data)
    .resize({
      width: 1000,
      withoutEnlargement: true,
    })
    .webp({
      quality: 70,
    })
    .toBuffer();

  object.image = await new Parse.File('im.webp', {
    base64: image_large.toString('base64'),
  }).save({useMasterKey: true});

  const image_thumb = await sharp(imgBuffer.data)
    .resize({
      width: 1000,
      withoutEnlargement: true,
    })
    .webp({
      quality: 30,
    })
    .toBuffer();

  object.imageThumbNail = await new Parse.File('th.webp', {
    base64: image_thumb.toString('base64'),
  }).save({useMasterKey: true});

  const resizedImage = await sharp(imgBuffer.data)
    .resize({width: 100})
    .raw()
    .ensureAlpha()
    .toBuffer({resolveWithObject: true});

  const {data, info} = resizedImage;

  const blurhash = encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    4,
    4
  );

  object.blurHash = blurhash;
});

Parse.Cloud.afterSave(IMG, async request => {
  const object = request.object;
  const original = request.original;

  if (original) {
    if (object?.image.name() !== original?.image.name()) {
      original?.image?.destroy({useMasterKey: true});
      original?.imageThumbNail?.destroy({useMasterKey: true});
    }
  }
});

Parse.Cloud.afterDelete(IMG, async request => {
  const object = request.object;
  const image = object.image;
  const image_thumb = object.imageThumbNail;
  image ? image.destroy({useMasterKey: true}) : undefined;
  image_thumb ? image_thumb.destroy({useMasterKey: true}) : undefined;
});
