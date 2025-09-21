// import {CloudFunction} from '../../utils/Registry/decorators';
// import User from '../../models/User';
// import RoleAccessRequest from '../../models/RoleAccessRequest';
// import generateRandomInteger from '../../utils/generateRandom';

// class AdminFunctions {
//   @CloudFunction({
//     methods: ['POST'],
//     validation: {
//       requireUser: true,
//       fields: {
//         name: { required: true, type: String },
//         mobileNumber: { required: true, type: String },
//         role: { required: true, type: String }, // Doctor, Specialist, Admin
//       },
//     },
//   })
//   async createDoctorAccess(req: Parse.Cloud.FunctionRequest) {
//     const { name, mobileNumber, role } = req.params;
//     const currentUser = req.user as User;

//     const roles = await new Parse.Query(Parse.Role)
//       .equalTo('users', currentUser)
//       .find({ useMasterKey: true });

//     const isAdmin = roles.some(r => {
//       const roleName = r.get('name');
//       return roleName === 'Admin' || roleName === 'SuperAdmin';
//     });

//     if (!isAdmin) {
//       throw {
//         code: 1001,
//         message: 'Unauthorized: Only Admins can create access',
//       };
//     }

//     const code = generateRandomInteger(6);
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

//     const access = new RoleAccessRequest();
//     access.set('mobileNumber', mobileNumber);
//     access.set('code', code);
//     access.set('role', role);
//     access.set('createdBy', currentUser);
//     access.set('isUsed', false);
//     access.set('expiresAt', expiresAt);

//     await access.save(null, { useMasterKey: true });

//     const { user } = await User.createUserRecord({
//       username: `user_${Date.now()}`,
//       mobileNumber,
//       status: true,
//     });

//     await user.save(null, { useMasterKey: true });

//     const assignedRole = await User.assignRoleToUser(user, role);

//     return {
//       message: 'Access created successfully',
//       mobileNumber,
//       code,
//       role,
//       user: User.map(user, assignedRole),
//     };
//   }
// }

// export default AdminFunctions;
// import {CloudFunction} from '../../utils/Registry/decorators';
// import User from '../../models/User';
// import RoleAccessRequest from '../../models/RoleAccessRequest';
// import generateRandomInteger from '../../utils/generateRandom';

// class AdminFunctions {
//   @CloudFunction({
//     methods: ['POST'],
//     validation: {
//       requireUser: true,
//       fields: {
//         name: { required: true, type: String },
//         mobileNumber: { required: true, type: String },
//         role: { required: true, type: String },
//       },
//       requireAnyUserRoles:[]
//     },
//   })
//   async createDoctorAccessTest(req: Parse.Cloud.FunctionRequest) {
//     const { name, mobileNumber, role } = req.params;
//     const currentUser = req.user as User;
//     if (!currentUser) {
//     throw {
//       code: 401,
//       message: 'Unauthorized: No user session found',
//   };
// }

//     console.log(`🔧 Skipping role check for testing. Executed by: ${currentUser.id}`);

//     const code = generateRandomInteger(6);
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

//     const access = new RoleAccessRequest();
//     access.set('mobileNumber', mobileNumber);
//     access.set('code', code);
//     access.set('role', role);
//     access.set('createdBy', currentUser);
//     access.set('isUsed', false);
//     access.set('expiresAt', expiresAt);

//     await access.save(null, { useMasterKey: true });

//     const { user } = await User.createUserRecord({
//       username: `user_${Date.now()}`,
//       mobileNumber,
//       status: true,
//     });

//     await user.save(null, { useMasterKey: true });

//     const assignedRole = await User.assignRoleToUser(user, role);

//     return {
//       message: 'Access created (test mode)',
//       mobileNumber,
//       code,
//       role,
//       user: User.map(user, assignedRole),
//     };
//   }
// }

// export default AdminFunctions;

import Parse from 'parse/node';
import {CloudFunction} from '../../utils/Registry/decorators';
import {UserRoles} from '../../utils/constants';

class AdminFunctions {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      // requireRoles: ['SuperAdmin', 'Admin'],
      fields: {
        fullName: { required: true, type: String },
        username: { required: true, type: String },
        password: { required: true, type: String },
        role: { required: true, type: String },
        mobile: { required: false, type: String },
        email: { required: false, type: String },
      },
    },
  })
  async addSystemUser(req: Parse.Cloud.FunctionRequest) {
    const { fullName, username, password, role, mobile, email } = req.params;

    const existingUser = await new Parse.Query(Parse.User)
      .equalTo('username', username)
      .first({ useMasterKey: true });

    if (existingUser) {
      throw new Parse.Error(202, 'Username already taken');
    }

    const user = new Parse.User();
    user.set('username', username);
    user.set('password', password);
    user.set('fullName', fullName);
    user.set('role', role);
    if (mobile) user.set('mobile', mobile);
    if (email) user.set('email', email);

    await user.signUp(null, { useMasterKey: true });

    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', role);
    const roleObj = await roleQuery.first({ useMasterKey: true });

    if (roleObj) {
      roleObj.getUsers().add(user);
      await roleObj.save(null, { useMasterKey: true });
    }

    return {
      message: 'User created successfully',
      credentials: {
        username,
        password,
      },
    };
  }
}

export default new AdminFunctions();
