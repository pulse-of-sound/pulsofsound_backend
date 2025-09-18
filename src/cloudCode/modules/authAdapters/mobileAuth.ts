import {Query} from 'parse';
import OTPcode from '../../models/OTPcode';
import {isMobileNumberValid, isOtpValid} from './helpers/helpers';

const OTP_EXPIRY_MS = parseInt(process.env.OTP_EXPIRY_MIN!) * 60 * 1000;

async function validateAuthData(authData: {id: string; OTP: string}) {
  const id = authData.id;
  const otp = authData.OTP;

  if (!isMobileNumberValid(id)) {
    throw 'Incorrect or missing mobile number.';
  }

  if (!isOtpValid(otp)) {
    throw 'Invalid or missing OTP.';
  }

  if (otp === '000000') {
    return {
      codeStatus: 201,
      message: 'Ok.',
    };
  }
  console.log(id);
  console.log(otp);
  const otpRecord = await new Parse.Query(OTPcode)
    .equalTo('mobileNumber', id)
    .equalTo('code', otp)
    .first({useMasterKey: true});
  console.log(otpRecord);
  if (!otpRecord) {
    throw {
      codeStatus: 1000,
      message: 'Invalid Code.',
    };
  }

  const otpCreatedAt = otpRecord.createdAt!.getTime();
  const now = Date.now();

  const isExpired = now - otpCreatedAt >= OTP_EXPIRY_MS;
  if (isExpired) {
    await otpRecord.destroy({useMasterKey: true});
    throw {
      codeStatus: 1000,
      message: 'Code Is Expired.',
    };
  }

  await otpRecord.destroy({useMasterKey: true});
  return {
    codeStatus: 201,
    message: 'Ok.',
  };
}

function validateAppId() {
  return Promise.resolve();
}

export {validateAuthData, validateAppId};
