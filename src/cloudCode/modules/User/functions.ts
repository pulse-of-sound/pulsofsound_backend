import AccountStatus from '../../models/AccountStatus';
import User from '../../models/User';
import UserBlock from '../../models/UserBlock';
import UserDeleted from '../../models/UserDelete';
import {CloudFunction} from '../../utils/Registry/decorators';
import {catchError} from '../../utils/catchError';
import {UserRoles} from '../../utils/constants';
import {generateRandomString} from '../../utils/generateRandom';

class User_ {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        fullName: {required: true, type: String},
      },
    },
  })
  async updateUser(req: Parse.Cloud.FunctionRequest) {
    const user = req.user as User;
    const body = req.params;
    const sessionToken = req.user?.getSessionToken();
    user.fullName = body.fullName;

    return await user.save(null, {sessionToken});
  }

  //   @CloudFunction({
  //     methods: ['POST'],
  //     validation: {
  //       requireUser: false,
  //       fields: {
  //         id: {
  //           required: false,
  //           type: String,
  //         },
  //       },
  //     },
  //   })
  //   async loginAnonymous(req: Parse.Cloud.FunctionRequest) {
  //     const {id} = req.params;

  //     const [error, anonymousUser] = await catchError<User>(
  //       User.logInWith(
  //         'anonymous',
  //         {
  //           authData: {
  //             id: id,
  //           },
  //         },
  //         {installationId: id, useMasterKey: true}
  //       )
  //       // Parse.AnonymousUtils.logIn({
  //       //   useMasterKey: true,
  //       // })
  //     );

  //     if (error) {
  //       throw new Parse.Error(Parse.Error.OTHER_CAUSE, error?.message);
  //     }
  //     const sessionToken = anonymousUser.getSessionToken();
  //     const otherData = await createNewUserPointers(sessionToken!, anonymousUser);

  //     anonymousUser.userBlock = otherData[0];
  //     anonymousUser.deleted = otherData[1];
  //     anonymousUser.accountStatus = otherData[2];

  //     await anonymousUser.save(null, {useMasterKey: true});

  //     // Assign client role to anonymous user
  //     const clientRole = await User.assignRoleToUser(anonymousUser, 'Client');

  //     await anonymousUser.fetchWithInclude(
  //       [
  //         'kyc.nationlity',
  //         'kyc.countryOfResidence',
  //         'kyc.gender',
  //         'kyc.passport',
  //         'kyc.profilePic',
  //       ],
  //       {useMasterKey: true}
  //     );

  //     const userJson = (await User.map(anonymousUser, clientRole)) as any;
  //     userJson.sessionToken = sessionToken;
  //     return {
  //       anonymousUser: userJson,
  //     };
  //   }

  //   @CloudFunction({
  //     methods: ['POST'],
  //     validation: {
  //       requireUser: false,
  //       fields: {
  //         id: {
  //           required: true,
  //           type: String,
  //         },
  //         userId: {
  //           required: true,
  //           type: String,
  //         },
  //       },
  //     },
  //   })

  //   async loginWithGoogle(req: Parse.Cloud.FunctionRequest) {
  //     const {id, userId} = req.params;

  //     const [error, user] = await catchError<User>(
  //       User.logInWith(
  //         'google',
  //         {
  //           authData: {
  //             id_token: id, //Google ID token JWT(header.payload.signature)
  //             id: userId, //Google User ID
  //           },
  //         },
  //         {installationId: id, useMasterKey: true}
  //       )
  //     );

  //     if (error) {
  //       throw new Parse.Error(Parse.Error.OTHER_CAUSE, error?.message);
  //     }

  //     const sessionToken = user.getSessionToken();
  //     let clientRole;

  //     // Only create new pointers if user is new (didn't exist before)
  //     if (!user.existed()) {
  //       await user.save(null, {useMasterKey: true});
  //       const otherData = await createNewUserPointers(sessionToken!, user);
  //       user.userBlock = otherData[0];
  //       user.deleted = otherData[1];
  //       user.accountStatus = otherData[2];

  //       // Assign client role to new Google user
  //       clientRole = await User.assignRoleToUser(user, 'Client');
  //     }
  //     // Get existing user's role
  //     clientRole = await User.assignRoleToUser(user, '');

  //     await user.save(null, {useMasterKey: true});
  //     await user.fetchWithInclude(
  //       [
  //         'kyc.nationlity',
  //         'kyc.countryOfResidence',
  //         'kyc.gender',
  //         'kyc.passport',
  //         'kyc.profilePic',
  //         'userPreferences',
  //       ],
  //       {useMasterKey: true}
  //     );

  //     const userJson = (await User.map(user, clientRole)) as any;
  //     userJson.sessionToken = sessionToken;
  //     return {
  //       user: userJson,
  //     };
  //   }

  //   @CloudFunction({
  //     methods: ['POST'],
  //     validation: {
  //       requireUser: false,
  //       fields: {
  //         // email: {required: true, type: String},
  //         mobileNumber: { required: true, type: String },
  //         OTP: {required: true, type: String},
  //       },
  //     },
  //   })

  //   async loginWithMobile(req: Parse.Cloud.FunctionRequest) {
  //     const {mobileNumber, OTP} = req.params;
  //     const currentUser = req.user;

  //     let user: any, error: any, clientRole;

  //     if (currentUser && currentUser.get('authData')?.anonymous) {
  //       //    console.log('dddd');
  //       // Upgrade anonymous
  //       [error, user] = await catchError<any>(
  //         currentUser.linkWith(
  //           'emailAuth',
  //           {
  //             authData: {
  //               id: mobileNumber,
  //               OTP: OTP,
  //             },
  //           },
  //           {useMasterKey: true}
  //         )
  //       );
  //     } else {
  //       // Not logged anonymous before, use logInWith
  //       // console.log('qqqqqqqqqqqqqqq');
  //       [error, user] = await catchError<any>(
  //         Parse.User.logInWith(
  //           'mobileAuth',
  //           {
  //             authData: {
  //               id: mobileNumber,
  //               OTP: OTP,
  //             },
  //           },
  //           {installationId: mobileNumber, useMasterKey: true}
  //         )
  //       );
  //     }

  //     if (error) {
  //       throw new Parse.Error(Parse.Error.OTHER_CAUSE, error?.message);
  //     }

  //     const sessionToken = user.getSessionToken();
  //     user.set('mobileNumber', mobileNumber);
  //     if (!user.existed()) {
  //       await user.save(null, {useMasterKey: true});
  //       // if user is not login anonymous before
  //       const otherData = await createNewUserPointers(sessionToken!, user);
  //       user.set('userBlock', otherData[0]);
  //       user.set('deleted', otherData[1]);
  //       user.set('accountStatus', otherData[2]);
  //       // Assign client role to new email user
  //       clientRole = await User.assignRoleToUser(user, 'Client');
  //     }
  //     clientRole = await User.assignRoleToUser(user, '');

  //     await user.save(null, {useMasterKey: true});
  //     await user.fetchWithInclude(
  //       [
  //         'kyc.nationlity',
  //         'kyc.countryOfResidence',
  //         'kyc.gender',
  //         'kyc.passport',
  //         'kyc.profilePic',
  //         'userPreferences',
  //       ],
  //       {useMasterKey: true}
  //     );
  //     const userJson = (await User.map(user, clientRole)) as any;
  //     userJson.sessionToken = sessionToken;

  //     return userJson;
  //   }
  //   @CloudFunction({
  //     methods: ['POST'],
  //     validation: {
  //       requireUser: false,
  //       fields: {
  //         username: {
  //           required: true,
  //           type: String,
  //         },
  //         password: {
  //           required: true,
  //           type: String,
  //         },
  //       },
  //     },
  //   })
  //   async loginUser(req: Parse.Cloud.FunctionRequest) {
  //     const {username, password} = req.params;

  //     const [error, user] = await catchError<User>(
  //       User.logIn(username, password, {
  //         installationId: generateRandomString(10),
  //       })
  //     );

  //     if (error) {
  //       throw new Parse.Error(Parse.Error.OTHER_CAUSE, error?.message);
  //     }

  //     const roleQuery = new Parse.Query(Parse.Role);
  //     roleQuery.equalTo('users', user);

  //     const roles = await roleQuery.find({useMasterKey: true}); // Use master key for broader access if needed

  //     const validRoleNames = Object.values(UserRoles);
  //     const matchedRoles = roles.filter(role =>
  //       validRoleNames.includes(role.get('name'))
  //     );

  //     // You can choose to return just one role (e.g., the first match), or all
  //     const selectedRole = matchedRoles[0];
  //     const userJson = User.map(user, selectedRole) as any;

  //     // Add session token to response
  //     return {
  //       ...userJson,
  //       sessionToken: user.getSessionToken(),
  //     };
  //   }

  //   @CloudFunction({
  //     methods: ['POST'],
  //     validation: {
  //       requireUser: true,
  //     },
  //   })
  //   async logout(req: Parse.Cloud.FunctionRequest) {
  //     const sessionToken = req.user?.getSessionToken();
  //     if (!sessionToken) throw new Error('No session token provided');

  //     const sessionQuery = new Parse.Query('_Session');
  //     sessionQuery.equalTo('sessionToken', sessionToken);
  //     const session = await sessionQuery.first({useMasterKey: true});

  //     if (session) {
  //       await session.destroy({useMasterKey: true});
  //       return {message: 'User logged out successfully'};
  //     } else {
  //       throw new Error('Session not found');
  //     }
  //   }

  //   @CloudFunction({
  //     methods: ['POST'],
  //     validation: {
  //       requireUser: false,
  //       fields: {
  //         idToken: {
  //           required: true,
  //           type: String,
  //         },
  //         userId: {
  //           required: true,
  //           type: String,
  //         },
  //       },
  //     },
  //   })
  //   async loginWithApple(req: Parse.Cloud.FunctionRequest) {
  //     const {idToken, userId} = req.params;

  //     const [error, user] = await catchError<User>(
  //       User.logInWith(
  //         'apple',
  //         {
  //           authData: {
  //             token: idToken,
  //             id: userId,
  //           },
  //         },
  //         {installationId: idToken, useMasterKey: true}
  //       )
  //     );

  //     if (error) {
  //       throw new Parse.Error(Parse.Error.OTHER_CAUSE, error?.message);
  //     }
  //     const sessionToken = user.getSessionToken();

  //     let clientRole;

  //     // Only create new pointers if user is new (didn't exist before)
  //     if (!user.existed()) {
  //       await user.save(null, {useMasterKey: true});
  //       const otherData = await createNewUserPointers(sessionToken!, user);
  //       user.userBlock = otherData[0];
  //       user.accountStatus = otherData[2];
  //       // Assign client role to new Google user
  //       clientRole = await User.assignRoleToUser(user, 'Client');
  //     }
  //     // Get existing user's role
  //     clientRole = await User.assignRoleToUser(user, '');

  //     await user.save(null, {useMasterKey: true});
  //     await user.fetchWithInclude(
  //       [
  //         'kyc.nationlity',
  //         'kyc.countryOfResidence',
  //         'kyc.gender',
  //         'kyc.passport',
  //         'kyc.profilePic',
  //         'userPreferences',
  //       ],
  //       {useMasterKey: true}
  //     );

  //     const userJson = (await User.map(user, clientRole)) as any;
  //     userJson.sessionToken = sessionToken;
  //     return {
  //       user: userJson,
  //     };
  //   }
  // }

  // async function createNewUserPointers(
  //   sessionToken: string,
  //   ownerUser: Parse.User
  // ): Promise<[UserBlock, UserDeleted, AccountStatus]> {
  //   const userBlock = new UserBlock();
  //   userBlock.isBlocked = false;

  //   const userDeleted = new UserDeleted();
  //   userDeleted.isDeleted = false;

  //   const accountStatus = (await new Parse.Query(AccountStatus)
  //     .equalTo('code', '1')
  //     .first({useMasterKey: true})) as AccountStatus;

  //   const [block, deleted] = await Promise.all([
  //     userBlock.save(null, {useMasterKey: true}),
  //     userDeleted.save(null, {useMasterKey: true}),
  //   ]);

  //   return [block, deleted, accountStatus];
  // }
}
