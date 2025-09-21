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

  ////////////////////////////////////////////////////

  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        fullName: {required: true, type: String},
        username: {required: true, type: String},
        password: {required: true, type: String},
        role: {required: true, type: String},
        mobile: {required: false, type: String},
        email: {required: false, type: String},
      },
    },
  })
  async addSystemUser(req: Parse.Cloud.FunctionRequest) {
    const {fullName, username, password, role, mobile, email} = req.params;

    const validRoles = Object.values(SystemRoles);
    if (!validRoles.includes(role)) {
      throw new Parse.Error(141, `Invalid role provided: ${role}`);
    }

    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', role);
    const roleObj = await roleQuery.first({useMasterKey: true});

    if (!roleObj) {
      throw new Parse.Error(141, `Role '${role}' not found in _Role table`);
    }

    const existingUser = await new Parse.Query(Parse.User)
      .equalTo('username', username)
      .first({useMasterKey: true});

    if (existingUser) {
      existingUser.set('fullName', fullName);
      existingUser.set('password', password);
      existingUser.set('role', roleObj.toPointer());
      if (mobile) existingUser.set('mobile', mobile);
      if (email) existingUser.set('email', email);

      await existingUser.save(null, {useMasterKey: true});

      roleObj.relation('users').add(existingUser);
      await roleObj.save(null, {useMasterKey: true});

      return {
        message: `${role} updated successfully`,
        userId: existingUser.id,
        username,
        role,
      };
    }

    const user = new Parse.User();
    user.set('username', username);
    user.set('password', password);
    user.set('fullName', fullName);
    user.set('role', roleObj.toPointer());
    if (mobile) user.set('mobile', mobile);
    if (email) user.set('email', email);

    await user.signUp(null, {useMasterKey: true});

    roleObj.relation('users').add(user);
    await roleObj.save(null, {useMasterKey: true});

    return {
      message: `${role} created and logged in successfully`,
      sessionToken: user.getSessionToken(),
      userId: user.id,
      username,
      role,
    };
  }

  //   @CloudFunction({
  //   methods: ['POST'],
  //   validation: {
  //     fields: {
  //       fullName: { required: true, type: String },
  //       username: { required: true, type: String },
  //       password: { required: true, type: String },
  //       mobile: { required: false, type: String },
  //       email: { required: false, type: String },
  //     },
  //   },
  // })
  // async addEditDoctor(req: Parse.Cloud.FunctionRequest) {
  //   const { fullName, username, password, mobile, email } = req.params;

  //   const roleQuery = new Parse.Query(Parse.Role);
  //   roleQuery.equalTo('name', SystemRoles.DOCTOR);
  //   const roleObj = await roleQuery.first({ useMasterKey: true });

  //   if (!roleObj) {
  //     throw new Parse.Error(141, `Role '${SystemRoles.DOCTOR}' not found`);
  //   }

  //   const existingUser = await new Parse.Query(Parse.User)
  //     .equalTo('username', username)
  //     .first({ useMasterKey: true });

  //   if (existingUser) {
  //     existingUser.set('fullName', fullName);
  //     existingUser.set('password', password);
  //     if (mobile) existingUser.set('mobile', mobile);
  //     if (email) existingUser.set('email', email);
  //     existingUser.set('role', roleObj.toPointer());

  //     await existingUser.save(null, { useMasterKey: true });

  //     roleObj.relation('users').add(existingUser);
  //     await roleObj.save(null, { useMasterKey: true });

  //     return {
  //       message: 'Doctor updated successfully',
  //       userId: existingUser.id,
  //       username,
  //       role: SystemRoles.DOCTOR,
  //     };
  //   }

  //   const user = new Parse.User();
  //   user.set('username', username);
  //   user.set('password', password);
  //   user.set('fullName', fullName);
  //   user.set('role', roleObj.toPointer());
  //   if (mobile) user.set('mobile', mobile);
  //   if (email) user.set('email', email);

  //   await user.signUp(null, { useMasterKey: true });

  //   roleObj.relation('users').add(user);
  //   await roleObj.save(null, { useMasterKey: true });

  //   return {
  //     message: 'Doctor created and logged in successfully',
  //     sessionToken: user.getSessionToken(),
  //     userId: user.id,
  //     username,
  //     role: SystemRoles.DOCTOR,
  //   };
  // }

  // @CloudFunction({
  //   methods: ['POST'],
  //   validation: {
  //     // requireUser: true,
  //     fields: {
  //       fullName: {required: true, type: String},
  //       username: {required: true, type: String},
  //       password: {required: true, type: String},
  //       mobile: {required: false, type: String},
  //       email: {required: false, type: String},
  //     },
  //   },
  // })
  // async addEditSpecialist(req: Parse.Cloud.FunctionRequest) {
  //   const {fullName, username, password, mobile, email} = req.params;

  //   const roleQuery = new Parse.Query(Parse.Role);
  //   roleQuery.equalTo('name', SystemRoles.SPECIALIST);
  //   const roleObj = await roleQuery.first({useMasterKey: true});

  //   if (!roleObj) {
  //     throw new Parse.Error(141, `Role '${SystemRoles.SPECIALIST}' not found`);
  //   }

  //   const existingUser = await new Parse.Query(Parse.User)
  //     .equalTo('username', username)
  //     .first({useMasterKey: true});

  //   if (existingUser) {
  //     existingUser.set('fullName', fullName);
  //     existingUser.set('password', password); // يمكن حذف هذا لو لا تريدين تغييره
  //     if (mobile) existingUser.set('mobile', mobile);
  //     if (email) existingUser.set('email', email);
  //     existingUser.set('role', roleObj.toPointer());

  //     await existingUser.save(null, {useMasterKey: true});

  //     roleObj.relation('users').add(existingUser);
  //     await roleObj.save(null, {useMasterKey: true});

  //     return {
  //       message: 'Specialist updated successfully',
  //       userId: existingUser.id,
  //       username,
  //       role: SystemRoles.SPECIALIST,
  //     };
  //   }

  //   const user = new Parse.User();
  //   user.set('username', username);
  //   user.set('password', password);
  //   user.set('fullName', fullName);
  //   user.set('role', roleObj.toPointer());
  //   if (mobile) user.set('mobile', mobile);
  //   if (email) user.set('email', email);

  //   await user.signUp(null, {useMasterKey: true});

  //   roleObj.relation('users').add(user);
  //   await roleObj.save(null, {useMasterKey: true});

  //   return {
  //     message: 'Specialist created and logged in successfully',
  //     sessionToken: user.getSessionToken(),
  //     userId: user.id,
  //     username,
  //     role: SystemRoles.SPECIALIST,
  //   };
  // }


  // @CloudFunction({
  //   methods: ['POST'],
  //   validation: {
  //     // requireUser: true,
  //     fields: {
  //       fullName: {required: true, type: String},
  //       username: {required: true, type: String},
  //       password: {required: true, type: String},
  //       mobile: {required: false, type: String},
  //       email: {required: false, type: String},
  //     },
  //   },
  // })
  // async addEditAdmin(req: Parse.Cloud.FunctionRequest) {
  //   const {fullName, username, password, mobile, email} = req.params;

  //   const roleQuery = new Parse.Query(Parse.Role);
  //   roleQuery.equalTo('name', SystemRoles.ADMIN);
  //   const roleObj = await roleQuery.first({useMasterKey: true});

  //   if (!roleObj) {
  //     throw new Parse.Error(141, `Role '${SystemRoles.ADMIN}' not found`);
  //   }

  //   const existingUser = await new Parse.Query(Parse.User)
  //     .equalTo('username', username)
  //     .first({useMasterKey: true});

  //   if (existingUser) {
  //     existingUser.set('fullName', fullName);
  //     existingUser.set('password', password); // يمكن حذف هذا لو لا تريدين تغييره
  //     if (mobile) existingUser.set('mobile', mobile);
  //     if (email) existingUser.set('email', email);
  //     existingUser.set('role', roleObj.toPointer());

  //     await existingUser.save(null, {useMasterKey: true});

  //     roleObj.relation('users').add(existingUser);
  //     await roleObj.save(null, {useMasterKey: true});

  //     return {
  //       message: 'Admin updated successfully',
  //       userId: existingUser.id,
  //       username,
  //       role: SystemRoles.ADMIN,
  //     };
  //   }

  //   const user = new Parse.User();
  //   user.set('username', username);
  //   user.set('password', password);
  //   user.set('fullName', fullName);
  //   user.set('role', roleObj.toPointer());
  //   if (mobile) user.set('mobile', mobile);
  //   if (email) user.set('email', email);

  //   await user.signUp(null, {useMasterKey: true});

  //   roleObj.relation('users').add(user);
  //   await roleObj.save(null, {useMasterKey: true});

  //   return {
  //     message: 'Admin created and logged in successfully',
  //     sessionToken: user.getSessionToken(),
  //     userId: user.id,
  //     username,
  //     role: SystemRoles.ADMIN,
  //   };
  // }

  @CloudFunction({
  methods: ['GET'],
  validation: {
    requireUser: true,
    // requireRoles: [SystemRoles.SUPER_ADMIN]
  },
})
async getAllDoctors(req: Parse.Cloud.FunctionRequest) {
  const roleQuery = new Parse.Query(Parse.Role);
  roleQuery.equalTo('name', SystemRoles.DOCTOR);
  const roleObj = await roleQuery.first({ useMasterKey: true });

  if (!roleObj) {
    throw new Parse.Error(141, `Role '${SystemRoles.DOCTOR}' not found`);
  }

  const usersQuery = roleObj.relation('users').query();
  usersQuery.include('role');
  const doctors = await usersQuery.find({ useMasterKey: true });

  const result = doctors.map((user) => ({
    id: user.id,
    fullName: user.get('fullName'),
    username: user.get('username'),
    email: user.get('email'),
    mobile: user.get('mobile'),
    role: user.get('role')?.get('name'),
  }));

  return result;
}

@CloudFunction({
  methods: ['GET'],
  validation: {
    requireUser: true,
    //requireRoles: [SystemRoles.SUPER_ADMIN]
  },
})
async getAllSpecialists(req: Parse.Cloud.FunctionRequest) {
  const roleQuery = new Parse.Query(Parse.Role);
  roleQuery.equalTo('name', SystemRoles.SPECIALIST);
  const roleObj = await roleQuery.first({ useMasterKey: true });

  if (!roleObj) {
    throw new Parse.Error(141, `Role '${SystemRoles.SPECIALIST}' not found`);
  }

  const usersQuery = roleObj.relation('users').query();
  usersQuery.include('role');
  const specialists = await usersQuery.find({ useMasterKey: true });

  const result = specialists.map((user) => ({
    id: user.id,
    fullName: user.get('fullName'),
    username: user.get('username'),
    email: user.get('email'),
    mobile: user.get('mobile'),
    role: user.get('role')?.get('name'),
  }));

  return result;
}
@CloudFunction({
  methods: ['GET'],
  validation: {
    requireUser: true,
  },
})
async getAllAdmins(req: Parse.Cloud.FunctionRequest) {
  const currentUser = req.user;

  const roleQuery = new Parse.Query(Parse.Role);
  roleQuery.equalTo('name', SystemRoles.SUPER_ADMIN);
  roleQuery.equalTo('users', currentUser);
  const isSuperAdmin = await roleQuery.first({ useMasterKey: true });

  if (!isSuperAdmin) {
throw new Parse.Error(141, 'Access denied. Only SUPER_ADMIN can view admins.');  }

  const adminRoleQuery = new Parse.Query(Parse.Role);
  adminRoleQuery.equalTo('name', SystemRoles.ADMIN);
  const adminRole = await adminRoleQuery.first({ useMasterKey: true });

  if (!adminRole) {
    throw new Parse.Error(141, `Role '${SystemRoles.ADMIN}' not found`);
  }

  const usersQuery = adminRole.relation('users').query();
  usersQuery.include('role');
  const admins = await usersQuery.find({ useMasterKey: true });

  const result = admins.map((user) => ({
    id: user.id,
    fullName: user.get('fullName'),
    username: user.get('username'),
    email: user.get('email'),
    mobile: user.get('mobile'),
    role: user.get('role')?.get('name'),
  }));

  return result;
}



  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: false,
    },
  })
  async createSystemRolesIfMissing(req: Parse.Cloud.FunctionRequest) {
    const createdRoles: string[] = [];

    for (const roleName of Object.values(SystemRoles)) {
      const query = new Parse.Query(Parse.Role);
      query.equalTo('name', roleName);
      const existing = await query.first({useMasterKey: true});

      if (!existing) {
        const role = new Parse.Role(roleName, new Parse.ACL());
        await role.save(null, {useMasterKey: true});
        createdRoles.push(roleName);
      }
    }

    return {
      message: 'Role seeding complete',
      createdRoles,
    };
  }
  @CloudFunction({
  methods: ['DELETE'],
  validation: {
    requireUser: true,
  },
})
async deleteDoctor(req: Parse.Cloud.FunctionRequest) {
  const currentUser = req.user;
  const doctorId = req.params.doctorId;

  if (!doctorId) {
    throw new Parse.Error(141, 'Doctor ID must be specified.');
  }

  const roleQuery = new Parse.Query(Parse.Role);
  roleQuery.containedIn('name', [SystemRoles.ADMIN, SystemRoles.SUPER_ADMIN]);
  roleQuery.equalTo('users', currentUser);
  const hasPermission = await roleQuery.first({ useMasterKey: true });

  if (!hasPermission) {
    throw new Parse.Error(141, 'You do not have the authority to delete the doctor.');
  }

  const doctorQuery = new Parse.Query(Parse.User);
  doctorQuery.equalTo('objectId', doctorId);
  doctorQuery.equalTo('role', SystemRoles.DOCTOR);
  const doctor = await doctorQuery.first({ useMasterKey: true });

  if (!doctor) {
    throw new Parse.Error(101, 'The doctor is not here');
  }

  // حذف الطبيب
  await doctor.destroy({ useMasterKey: true });

  return { message: 'The doctor was successfully deleted.' };
}

}

export default new User_();
