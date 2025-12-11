import User from '../../models/User';
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

    const roles = await roleQuery.find({useMasterKey: true});

    const validRoleNames = Object.values(UserRoles);
    const matchedRoles = roles.filter(role =>
      validRoleNames.includes(role.get('name'))
    );

    const selectedRole = matchedRoles[0];
    const userJson = User.map(user as User, selectedRole) as any;

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
    const childRole = await new Parse.Query(Parse.Role)
      .equalTo('name', SystemRoles.CHILD)
      .first({useMasterKey: true});

    if (!childRole) {
      throw new Parse.Error(141, `Role '${SystemRoles.CHILD}' not found`);
    }

    user.set('role', childRole.toPointer());

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
        role: {required: false, type: String},
        mobile: {required: false, type: String},
        email: {required: false, type: String},
      },
    },
  })
  async addSystemUser(req: Parse.Cloud.FunctionRequest) {
    const {fullName, username, password, mobile, email} = req.params;
    const role = req.params.role || SystemRoles.CHILD;

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

  @CloudFunction({
    methods: ['POST'],
    validation: {
      fields: {
        fullName: {required: true, type: String},
        username: {required: true, type: String},
        password: {required: true, type: String},
        mobile: {required: false, type: String},
        email: {required: false, type: String},
      },
    },
  })
  async addEditDoctor(req: Parse.Cloud.FunctionRequest) {
    const {fullName, username, password, mobile, email} = req.params;

    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', SystemRoles.DOCTOR);
    const roleObj = await roleQuery.first({useMasterKey: true});

    if (!roleObj) {
      throw new Parse.Error(141, `Role '${SystemRoles.DOCTOR}' not found`);
    }

    const existingUser = await new Parse.Query(Parse.User)
      .equalTo('username', username)
      .first({useMasterKey: true});

    if (existingUser) {
      existingUser.set('fullName', fullName);
      existingUser.set('password', password);
      if (mobile) existingUser.set('mobile', mobile);
      if (email) existingUser.set('email', email);
      existingUser.set('role', roleObj.toPointer());

      await existingUser.save(null, {useMasterKey: true});

      roleObj.relation('users').add(existingUser);
      await roleObj.save(null, {useMasterKey: true});

      return {
        message: 'Doctor updated successfully',
        userId: existingUser.id,
        username,
        role: SystemRoles.DOCTOR,
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
      message: 'Doctor created and logged in successfully',
      sessionToken: user.getSessionToken(),
      userId: user.id,
      username,
      role: SystemRoles.DOCTOR,
    };
  }

  @CloudFunction({
    methods: ['POST'],
    validation: {
      // requireUser: true,
      fields: {
        fullName: {required: true, type: String},
        username: {required: true, type: String},
        password: {required: true, type: String},
        mobile: {required: false, type: String},
        email: {required: false, type: String},
      },
    },
  })
  async addEditSpecialist(req: Parse.Cloud.FunctionRequest) {
    const {fullName, username, password, mobile, email} = req.params;

    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', SystemRoles.SPECIALIST);
    const roleObj = await roleQuery.first({useMasterKey: true});

    if (!roleObj) {
      throw new Parse.Error(141, `Role '${SystemRoles.SPECIALIST}' not found`);
    }

    const existingUser = await new Parse.Query(Parse.User)
      .equalTo('username', username)
      .first({useMasterKey: true});

    if (existingUser) {
      existingUser.set('fullName', fullName);
      existingUser.set('password', password);
      if (mobile) existingUser.set('mobile', mobile);
      if (email) existingUser.set('email', email);
      existingUser.set('role', roleObj.toPointer());

      await existingUser.save(null, {useMasterKey: true});

      roleObj.relation('users').add(existingUser);
      await roleObj.save(null, {useMasterKey: true});

      return {
        message: 'Specialist updated successfully',
        userId: existingUser.id,
        username,
        role: SystemRoles.SPECIALIST,
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
      message: 'Specialist created and logged in successfully',
      sessionToken: user.getSessionToken(),
      userId: user.id,
      username,
      role: SystemRoles.SPECIALIST,
    };
  }

  @CloudFunction({
    methods: ['POST'],
    validation: {
      // requireUser: true,
      fields: {
        fullName: {required: true, type: String},
        username: {required: true, type: String},
        password: {required: true, type: String},
        mobile: {required: false, type: String},
        email: {required: false, type: String},
      },
    },
  })
  async addEditAdmin(req: Parse.Cloud.FunctionRequest) {
    const {fullName, username, password, mobile, email} = req.params;

    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', SystemRoles.ADMIN);
    const roleObj = await roleQuery.first({useMasterKey: true});

    if (!roleObj) {
      throw new Parse.Error(141, `Role '${SystemRoles.ADMIN}' not found`);
    }

    const existingUser = await new Parse.Query(Parse.User)
      .equalTo('username', username)
      .first({useMasterKey: true});

    if (existingUser) {
      existingUser.set('fullName', fullName);
      existingUser.set('password', password);
      if (mobile) existingUser.set('mobile', mobile);
      if (email) existingUser.set('email', email);
      existingUser.set('role', roleObj.toPointer());

      await existingUser.save(null, {useMasterKey: true});

      roleObj.relation('users').add(existingUser);
      await roleObj.save(null, {useMasterKey: true});

      return {
        message: 'Admin updated successfully',
        userId: existingUser.id,
        username,
        role: SystemRoles.ADMIN,
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
      message: 'Admin created and logged in successfully',
      sessionToken: user.getSessionToken(),
      userId: user.id,
      username,
      role: SystemRoles.ADMIN,
    };
  }

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
    const roleObj = await roleQuery.first({useMasterKey: true});

    if (!roleObj) {
      throw new Parse.Error(141, `Role '${SystemRoles.DOCTOR}' not found`);
    }

    const usersQuery = roleObj.relation('users').query();
    usersQuery.include('role');
    const doctors = await usersQuery.find({useMasterKey: true});

    const result = doctors.map(user => ({
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
    const roleObj = await roleQuery.first({useMasterKey: true});

    if (!roleObj) {
      throw new Parse.Error(141, `Role '${SystemRoles.SPECIALIST}' not found`);
    }

    const usersQuery = roleObj.relation('users').query();
    usersQuery.include('role');
    const specialists = await usersQuery.find({useMasterKey: true});

    const result = specialists.map(user => ({
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
    const isSuperAdmin = await roleQuery.first({useMasterKey: true});

    if (!isSuperAdmin) {
      throw new Parse.Error(
        141,
        'Access denied. Only SUPER_ADMIN can view admins.'
      );
    }

    const adminRoleQuery = new Parse.Query(Parse.Role);
    adminRoleQuery.equalTo('name', SystemRoles.ADMIN);
    const adminRole = await adminRoleQuery.first({useMasterKey: true});

    if (!adminRole) {
      throw new Parse.Error(141, `Role '${SystemRoles.ADMIN}' not found`);
    }

    const usersQuery = adminRole.relation('users').query();
    usersQuery.include('role');
    const admins = await usersQuery.find({useMasterKey: true});

    const result = admins.map(user => ({
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
    const hasPermission = await roleQuery.first({useMasterKey: true});

    if (!hasPermission) {
      throw new Parse.Error(
        141,
        'You do not have the authority to delete the doctor.'
      );
    }

    const doctorQuery = new Parse.Query(Parse.User);
    doctorQuery.equalTo('objectId', doctorId);
    const doctor = await doctorQuery.first({useMasterKey: true});

    if (!doctor) {
      throw new Parse.Error(101, 'No user found with this ID.');
    }

    const doctorRole = await new Parse.Query(Parse.Role)
      .equalTo('name', SystemRoles.DOCTOR)
      .first({useMasterKey: true});

    if (!doctorRole) {
      throw new Parse.Error(141, 'Doctor role not found.');
    }

    const userRolePointer = doctor.get('role');
    if (!userRolePointer || userRolePointer.id !== doctorRole.id) {
      throw new Parse.Error(141, 'User is not a doctor.');
    }

    await doctor.destroy({useMasterKey: true});

    return {message: 'The doctor was successfully deleted.'};
  }
  @CloudFunction({
    methods: ['DELETE'],
    validation: {
      requireUser: true,
    },
  })
  async deleteSpecialist(req: Parse.Cloud.FunctionRequest) {
    const currentUser = req.user;
    const specialistId = req.params.specialistId;

    if (!specialistId) {
      throw new Parse.Error(141, 'Specialist ID must be specified.');
    }

    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.containedIn('name', [SystemRoles.ADMIN, SystemRoles.SUPER_ADMIN]);
    roleQuery.equalTo('users', currentUser);
    const hasPermission = await roleQuery.first({useMasterKey: true});

    if (!hasPermission) {
      throw new Parse.Error(
        141,
        'You do not have the authority to delete the specialist.'
      );
    }

    const specialistQuery = new Parse.Query(Parse.User);
    specialistQuery.equalTo('objectId', specialistId);
    const specialist = await specialistQuery.first({useMasterKey: true});

    if (!specialist) {
      throw new Parse.Error(101, 'No user found with this ID.');
    }

    const specialistRole = await new Parse.Query(Parse.Role)
      .equalTo('name', SystemRoles.SPECIALIST)
      .first({useMasterKey: true});

    if (!specialistRole) {
      throw new Parse.Error(141, 'Specialist role not found.');
    }

    const userRolePointer = specialist.get('role');
    if (!userRolePointer || userRolePointer.id !== specialistRole.id) {
      throw new Parse.Error(141, 'User is not a specialist.');
    }
    await specialist.destroy({useMasterKey: true});

    return {message: 'The specialist was successfully deleted.'};
  }
  @CloudFunction({
    methods: ['DELETE'],
    validation: {
      requireUser: true,
    },
  })
  async deleteAdmin(req: Parse.Cloud.FunctionRequest) {
    const currentUser = req.user;
    const adminId = req.params.adminId;

    if (!adminId) {
      throw new Parse.Error(141, 'Admin ID must be specified.');
    }

    const superAdminRoleQuery = new Parse.Query(Parse.Role);
    superAdminRoleQuery.equalTo('name', SystemRoles.SUPER_ADMIN);
    superAdminRoleQuery.equalTo('users', currentUser);
    const isSuperAdmin = await superAdminRoleQuery.first({useMasterKey: true});

    if (!isSuperAdmin) {
      throw new Parse.Error(141, 'Only Super Admins can delete Admins.');
    }

    const adminQuery = new Parse.Query(Parse.User);
    adminQuery.equalTo('objectId', adminId);
    const adminUser = await adminQuery.first({useMasterKey: true});

    if (!adminUser) {
      throw new Parse.Error(101, 'No user found with this ID.');
    }

    const adminRole = await new Parse.Query(Parse.Role)
      .equalTo('name', SystemRoles.ADMIN)
      .first({useMasterKey: true});

    if (!adminRole) {
      throw new Parse.Error(141, 'Admin role not found.');
    }

    const userRolePointer = adminUser.get('role');
    if (!userRolePointer || userRolePointer.id !== adminRole.id) {
      throw new Parse.Error(141, 'User is not an Admin.');
    }
    await adminUser.destroy({useMasterKey: true});

    return {message: 'The Admin was successfully deleted.'};
  }
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        fullName: {required: false, type: String},
        mobile: {required: false, type: String},
        email: {required: false, type: String},
        password: {required: false, type: String},
      },
    },
  })
  async updateAdminProfile(req: Parse.Cloud.FunctionRequest) {
    const user = req.user;

    if (!user) {
      throw new Parse.Error(209, 'User not authenticated');
    }

    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', SystemRoles.ADMIN);
    const adminRole = await roleQuery.first({useMasterKey: true});

    if (!adminRole) {
      throw new Parse.Error(141, `Role '${SystemRoles.ADMIN}' not found`);
    }

    const relation = adminRole.relation('users');
    const admins = await relation.query().find({useMasterKey: true});

    const isAdmin = admins.some(admin => admin.id === user.id);

    if (!isAdmin) {
      throw new Parse.Error(141, 'Only admins can update admin profile');
    }

    const {fullName, mobile, email, password} = req.params;

    if (fullName) user.set('fullName', fullName);
    if (mobile) user.set('mobile', mobile);
    if (email) user.set('email', email);
    if (password) user.set('password', password);

    await user.save(null, {useMasterKey: true});

    return {
      message: 'Admin profile updated successfully',
      userId: user.id,
      fullName: user.get('fullName'),
      mobile: user.get('mobile'),
      email: user.get('email'),
    };
  }
  @CloudFunction({
    methods: ['GET'],
    validation: {
      requireUser: true,
    },
  })
  async getAdminProfile(req: Parse.Cloud.FunctionRequest) {
    const user = req.user;

    if (!user) {
      throw new Parse.Error(209, 'User not authenticated');
    }

    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', SystemRoles.ADMIN);
    const adminRole = await roleQuery.first({useMasterKey: true});

    if (!adminRole) {
      throw new Parse.Error(141, `Role '${SystemRoles.ADMIN}' not found`);
    }

    const relation = adminRole.relation('users');
    const admins = await relation.query().find({useMasterKey: true});

    const isAdmin = admins.some(admin => admin.id === user.id);

    if (!isAdmin) {
      throw new Parse.Error(141, 'Only admins can access this profile');
    }

    return {
      userId: user.id,
      username: user.get('username'),
      fullName: user.get('fullName'),
      mobile: user.get('mobile'),
      email: user.get('email'),
      role: SystemRoles.ADMIN,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        fullName: {required: false, type: String},
        mobile: {required: false, type: String},
        email: {required: false, type: String},
        password: {required: false, type: String},
      },
    },
  })
  async updateDoctorProfile(req: Parse.Cloud.FunctionRequest) {
    const user = req.user;

    if (!user) {
      throw new Parse.Error(209, 'User not authenticated');
    }

    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', SystemRoles.DOCTOR);
    const doctorRole = await roleQuery.first({useMasterKey: true});

    if (!doctorRole) {
      throw new Parse.Error(141, `Role '${SystemRoles.DOCTOR}' not found`);
    }

    const relation = doctorRole.relation('users');
    const doctors = await relation.query().find({useMasterKey: true});

    const isDoctor = doctors.some(doctor => doctor.id === user.id);

    if (!isDoctor) {
      throw new Parse.Error(141, 'Only doctors can update doctor profile');
    }

    const {fullName, mobile, email, password} = req.params;

    if (fullName) user.set('fullName', fullName);
    if (mobile) user.set('mobile', mobile);
    if (email) user.set('email', email);
    if (password) user.set('password', password);

    await user.save(null, {useMasterKey: true});

    return {
      message: 'Doctor profile updated successfully',
      userId: user.id,
      fullName: user.get('fullName'),
      mobile: user.get('mobile'),
      email: user.get('email'),
    };
  }
  @CloudFunction({
    methods: ['GET'],
    validation: {
      requireUser: true,
    },
  })
  async getDoctorProfile(req: Parse.Cloud.FunctionRequest) {
    const user = req.user;

    if (!user) {
      throw new Parse.Error(209, 'User not authenticated');
    }

    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', SystemRoles.DOCTOR);
    const doctorRole = await roleQuery.first({useMasterKey: true});

    if (!doctorRole) {
      throw new Parse.Error(141, `Role '${SystemRoles.DOCTOR}' not found`);
    }

    const relation = doctorRole.relation('users');
    const doctors = await relation.query().find({useMasterKey: true});

    const isDoctor = doctors.some(doctor => doctor.id === user.id);

    if (!isDoctor) {
      throw new Parse.Error(141, 'Only doctors can access this profile');
    }

    return {
      userId: user.id,
      username: user.get('username'),
      fullName: user.get('fullName'),
      mobile: user.get('mobile'),
      email: user.get('email'),
      role: SystemRoles.DOCTOR,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        fullName: {required: false, type: String},
        mobile: {required: false, type: String},
        email: {required: false, type: String},
        password: {required: false, type: String},
      },
    },
  })
  async updateSpecialistProfile(req: Parse.Cloud.FunctionRequest) {
    const user = req.user;

    if (!user) {
      throw new Parse.Error(209, 'User not authenticated');
    }

    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', SystemRoles.SPECIALIST);
    const specialistRole = await roleQuery.first({useMasterKey: true});

    if (!specialistRole) {
      throw new Parse.Error(141, `Role '${SystemRoles.SPECIALIST}' not found`);
    }

    const relation = specialistRole.relation('users');
    const specialists = await relation.query().find({useMasterKey: true});

    const isSpecialist = specialists.some(
      specialist => specialist.id === user.id
    );

    if (!isSpecialist) {
      throw new Parse.Error(
        141,
        'Only specialists can update specialist profile'
      );
    }

    const {fullName, mobile, email, password} = req.params;

    if (fullName) user.set('fullName', fullName);
    if (mobile) user.set('mobile', mobile);
    if (email) user.set('email', email);
    if (password) user.set('password', password);

    await user.save(null, {useMasterKey: true});

    return {
      message: 'Specialist profile updated successfully',
      userId: user.id,
      fullName: user.get('fullName'),
      mobile: user.get('mobile'),
      email: user.get('email'),
    };
  }
  @CloudFunction({
    methods: ['GET'],
    validation: {
      requireUser: true,
    },
  })
  async getSpecialistProfile(req: Parse.Cloud.FunctionRequest) {
    const user = req.user;

    if (!user) {
      throw new Parse.Error(209, 'User not authenticated');
    }

    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', SystemRoles.SPECIALIST);
    const specialistRole = await roleQuery.first({useMasterKey: true});

    if (!specialistRole) {
      throw new Parse.Error(141, `Role '${SystemRoles.SPECIALIST}' not found`);
    }

    const relation = specialistRole.relation('users');
    const specialists = await relation.query().find({useMasterKey: true});

    const isSpecialist = specialists.some(
      specialist => specialist.id === user.id
    );

    if (!isSpecialist) {
      throw new Parse.Error(141, 'Only specialists can access this profile');
    }

    return {
      userId: user.id,
      username: user.get('username'),
      fullName: user.get('fullName'),
      mobile: user.get('mobile'),
      email: user.get('email'),
      role: SystemRoles.SPECIALIST,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export default new User_();
