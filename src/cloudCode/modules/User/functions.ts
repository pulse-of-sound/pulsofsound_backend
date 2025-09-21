import AccountStatus from '../../models/AccountStatus';
import User from '../../models/User';
import UserBlock from '../../models/UserBlock';
import UserDeleted from '../../models/UserDelete';
import {CloudFunction} from '../../utils/Registry/decorators';
import {catchError} from '../../utils/catchError';
import {UserRoles} from '../../utils/constants';
import {generateRandomString} from '../../utils/generateRandom';
import {SystemRoles} from '../../utils/rols';

class User_ {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        fullName: {required: false, type: String},
        username: {required: false, type: String},
        fcm_token: {required: false, type: String},
        birthDate: {required: false, type: String},
        fatherName: {required: false, type: String},
        profilePic: {required: false, type: Object},
      },
    },
  })
  async updateMyAccount(req: Parse.Cloud.FunctionRequest) {
    const user = req.user as User;
    const body = req.params;
    const sessionToken = req.user?.getSessionToken();

    if (body.fullName) user.fullName = body.fullName;
    if (body.username) user.username = body.username;
    if (body.fcm_token) user.fcm_token = body.fcm_token;

    if (body.birthDate) {
      const parsedDate = new Date(body.birthDate);
      if (!isNaN(parsedDate.getTime())) {
        user.birthDate = parsedDate;
      }
    }

    if (body.fatherName) user.fatherName = body.fatherName;

    if (body.profilePic && body.profilePic.__type === 'File') {
      user.set('profilePic', {
        __type: 'File',
        name: body.profilePic.name,
      });
    } else {
      user.unset('profilePic');
    }

    return await user.save(null, {sessionToken});
  }
  // important
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: false,
    },
  })
  async logout(req: Parse.Cloud.FunctionRequest) {
    const sessionToken = req.user?.getSessionToken();
    if (!sessionToken) return {message: 'User is already logged out'};

    const sessionQuery = new Parse.Query(Parse.Session);
    sessionQuery.equalTo('sessionToken', sessionToken);
    const session = await sessionQuery.first({useMasterKey: true});

    if (!session) throw new Error('Session not found');

    await session.destroy({useMasterKey: true});
    return {message: 'User logged out successfully'};
  }

  // important
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: false,
      fields: {
        username: {
          required: true,
          type: String,
        },
        password: {
          required: true,
          type: String,
        },
      },
    },
  })
  async loginUser(req: Parse.Cloud.FunctionRequest) {
    const {username, password} = req.params;
    console.log('ssssssssssssssssssssssss');

    const [error, user] = await catchError<Parse.User>(
      User.logIn(username, password, {
        installationId: generateRandomString(10),
      })
    );

    if (error) {
      throw new Parse.Error(Parse.Error.OTHER_CAUSE, error?.message);
    }
    console.log(user);
    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('users', user);

    const roles = await roleQuery.find({useMasterKey: true}); // Use master key for broader access if needed

    const validRoleNames = Object.values(UserRoles);
    const matchedRoles = roles.filter(role =>
      validRoleNames.includes(role.get('name'))
    );

    // You can choose to return just one role (e.g., the first match), or all
    const selectedRole = matchedRoles[0];
    const userJson = User.map(user as User, selectedRole) as any;

    // Add session token to response
    return {
      ...userJson,
      sessionToken: user.getSessionToken(),
    };
  }

  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: false,
      fields: {
        mobileNumber: {
          required: true,
          type: String,
        },
        OTP: {
          required: true,
          type: String,
        },
      },
    },
  })
  async loginWithMobile(req: Parse.Cloud.FunctionRequest) {
    const {mobileNumber, OTP} = req.params;

    let user: any, error: any, clientRole;

    [error, user] = await catchError<any>(
      Parse.User.logInWith(
        'mobileAuth',
        {
          authData: {
            id: mobileNumber,
            OTP: OTP,
          },
        },
        {installationId: mobileNumber, useMasterKey: true}
      )
    );
    if (error) {
      throw new Parse.Error(Parse.Error.OTHER_CAUSE, error?.message);
    }

    const sessionToken = user.getSessionToken();
    user.set('mobileNumber', mobileNumber);

    clientRole = await User.assignRoleToUser(user, SystemRoles.CHILD);

    await user.save(null, {useMasterKey: true});
    await user.fetchWithInclude([], {useMasterKey: true});
    const userJson = User.map(user, clientRole) as any;
    userJson.sessionToken = sessionToken;

    return userJson;
  }
}

export default new User_();
