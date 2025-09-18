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
import {CloudFunction} from '../../utils/Registry/decorators';
import User from '../../models/User';
import RoleAccessRequest from '../../models/RoleAccessRequest';
import generateRandomInteger from '../../utils/generateRandom';

class AdminFunctions {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        name: { required: true, type: String },
        mobileNumber: { required: true, type: String },
        role: { required: true, type: String },
      },
      requireAllUserRoles:[]
    },
  })
  async createDoctorAccessTest(req: Parse.Cloud.FunctionRequest) {
    const { name, mobileNumber, role } = req.params;
    const currentUser = req.user as User;
    if (!currentUser) {
    throw {
      code: 401,
      message: 'Unauthorized: No user session found',
  };
}

    console.log(`🔧 Skipping role check for testing. Executed by: ${currentUser.id}`);

    const code = generateRandomInteger(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const access = new RoleAccessRequest();
    access.set('mobileNumber', mobileNumber);
    access.set('code', code);
    access.set('role', role);
    access.set('createdBy', currentUser);
    access.set('isUsed', false);
    access.set('expiresAt', expiresAt);

    await access.save(null, { useMasterKey: true });

    const { user } = await User.createUserRecord({
      username: `user_${Date.now()}`,
      mobileNumber,
      status: true,
    });

    await user.save(null, { useMasterKey: true });

    const assignedRole = await User.assignRoleToUser(user, role);

    return {
      message: 'Access created (test mode)',
      mobileNumber,
      code,
      role,
      user: User.map(user, assignedRole),
    };
  }
}

export default AdminFunctions;
