import ChildProfile from '../../models/ChildProfile';
import { CloudFunction } from '../../utils/Registry/decorators';

class ChildProfile_ {
  // @CloudFunction({
  //   methods: ['POST'],
  //   validation: {
  //     requireUser: false,
  //     fields: {
  //       childId: { required: true, type: String },
  //     },
  //   },
  // })
  // async getChildProfileById(req: Parse.Cloud.FunctionRequest) {
  //   const { childId } = req.params;

  //   try {
  //     const query = new Parse.Query(ChildProfile);
  //     query.equalTo('objectId', childId);
  //     query.includeAll();

  //     const child = await query.first({ useMasterKey: true });

  //     if (!child) {
  //       throw {
  //         codeStatus: 101,
  //         message: 'Child not found or access denied',
  //       };
  //     }

  //     return child.toJSON();
  //   } catch (error: any) {
  //     console.error('Error in getChildProfileById:', error);
  //     if (error.codeStatus) {
  //       throw error;
  //     }
  //     throw {
  //       codeStatus: 1000,
  //       message: error.message || 'Failed to retrieve child profile',
  //     };
  //   }
  // }

  @CloudFunction({
    methods: ['GET'],
    validation: {
      requireUser: true,
      fields: {},
    },
  })
  async getMyChildProfile(req: Parse.Cloud.FunctionRequest) {
    try {
      if (!req.user) {
        throw {
          codeStatus: 103,
          message: 'User context is missing',
        };
      }

      const user = req.user;
      await user.fetchWithInclude(['role']); // تحميل بيانات الدور

      const roleName = user.get('role')?.get('name');
      if (roleName !== 'Child') {
        throw {
          codeStatus: 102,
          message: 'User is not a Child',
        };
      }

      const query = new Parse.Query(ChildProfile);
      query.equalTo('user', user);
      query.includeAll();

      let child = await query.first({ useMasterKey: true });

      // إذا لم يوجد سجل، ننشئ واحدًا جديدًا تلقائيًا
      if (!child) {
        child = new ChildProfile();
        child.set('user', user);
        await child.save(null, { useMasterKey: true });
      }

      return child.toJSON();
    } catch (error: any) {
      console.error('Error in getMyChildProfile:', error);
      if (error.codeStatus) {
        throw error;
      }
      throw {
        codeStatus: 1000,
        message: error.message || 'Failed to retrieve or create child profile',
      };
    }
  }






  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: false,
      fields: {
        childId: { required: true, type: String },
        name: { required: false, type: String },
        fatherName: { required: false, type: String },
        birthdate: { required: false, type: String }, // تم تحويله إلى String
        gender: { required: false, type: String },
        medical_info: { required: false, type: String },
      },
    },
  })
  async createOrUpdateChildProfile(req: Parse.Cloud.FunctionRequest) {
    const { childId, name, fatherName, birthdate, gender, medical_info } = req.params;

    try {
      const userQuery = new Parse.Query(Parse.User);
      userQuery.equalTo('objectId', childId);
      userQuery.include('role');
      const user = await userQuery.first({ useMasterKey: true });

      if (!user) {
        throw {
          codeStatus: 101,
          message: 'User not found',
        };
      }

      const roleName = user.get('role')?.get('name');
      if (roleName !== 'Child') {
        throw {
          codeStatus: 102,
          message: 'User is not a Child',
        };
      }

      let profile: ChildProfile | undefined;

      const profileQuery = new Parse.Query(ChildProfile);
      profileQuery.equalTo('user', user);
      profile = await profileQuery.first({ useMasterKey: true });

      if (!profile) {
        profile = new ChildProfile();
        profile.set('user', user);
      }

      if (name) profile.set('name', name);
      if (fatherName) profile.set('fatherName', fatherName);
      if (birthdate) profile.set('birthdate', birthdate); // الآن يقبل كـ String
      if (gender) profile.set('gender', gender);
      if (medical_info) profile.set('medical_info', medical_info);

      await profile.save(null, { useMasterKey: true });

      return profile.toJSON();
    } catch (error: any) {
      console.error('Error in createOrUpdateChildProfile:', error);
      if (error.codeStatus) {
        throw error;
      }
      throw {
        codeStatus: 1000,
        message: error.message || 'Failed to create or update child profile',
      };
    }
  }
}

export default ChildProfile_;
