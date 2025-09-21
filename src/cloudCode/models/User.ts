import {Anonymous} from '../modules/authAdapters/models/Anonymous';
import {EmailAuth} from '../modules/authAdapters/models/EmailAuth';
import {MobileAuth} from '../modules/authAdapters/models/MobileAuth';
import {ParseClass, ParseField} from '../utils/decorator/baseDecorator';
import AccountStatus from './AccountStatus';
import UserBlock from './UserBlock';
import UserDeleted from './UserDelete';

@ParseClass('_User', {
  clp: {
    find: '*',
    get: '*',
    create: '*',
    update: '*',
    delete: '*',
  },
})
export default class User extends Parse.User {
  constructor() {
    super();
  }

  @ParseField('Object', false)
  authData!: MobileAuth | EmailAuth | Anonymous;

  @ParseField('String', false)
  username!: string;

  @ParseField('String', false)
  fcm_token!: string;

  @ParseField('String', false)
  mobileNumber!: string;

  @ParseField('String', false)
  fullName!: string;

  @ParseField('Pointer', false, 'UserBlock')
  userBlock!: UserBlock;

  @ParseField('Pointer', false, 'UserDeleted')
  deleted!: UserDeleted;

  @ParseField('Pointer', false, 'AccountStatus')
  accountStatus!: AccountStatus;

  @ParseField('Boolean', false)
  status!: boolean;

  @ParseField('Date', false)
  birthDate!: Date;

  @ParseField('String', false)
  fatherName!: string;

  @ParseField('File', false)
  profilePic!: Parse.File;

  static map(user?: User, assignedRole?: Parse.Role) {
    if (!user) {
      return {};
    }

    const userObject = {
      id: user.id,
      email: user.get('email'),
      username: user.get('username'),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      status: user.get('status'),
      mobileNumber: user.get('mobileNumber'),
      fullName: user.get('fullName'),
      birthDate: user.get('birthDate'),
      fatherName: user.get('fatherName'),
      profilePic: user.get('profilePic'),
    };

    const flattenedObject = {
      ...userObject,
      role: [
        {
          id: assignedRole?.id,
          name: assignedRole?.get('name'),
        },
      ],
    };

    return flattenedObject;
  }

  static async createUserRecord(userParams: any) {
    const user = new User();

    if (userParams?.id) {
      user.id = userParams.id;
    }

    if (!userParams.username) {
      userParams.username =
        userParams.username ||
        userParams.email ||
        `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    }

    if (!userParams.id) {
      const userBlock = new UserBlock();
      userBlock.isBlocked = false;

      const userDeleted = new UserDeleted();
      userDeleted.isDeleted = false;

      const accountStatus = (await new Parse.Query(AccountStatus)
        .equalTo('code', '1')
        .first({useMasterKey: true})) as AccountStatus;

      const [block, deleted] = await Promise.all([
        userBlock.save(null, {useMasterKey: true}),
        userDeleted.save(null, {useMasterKey: true}),
      ]);

      user.set({
        userBlock: block,
        deleted: deleted,
        accountStatus: accountStatus,

        birthDate: new Date('2000-01-01'),
        fatherName: 'fatherName ',
        profilePic: null,
      });
    }

    user.set({
      ...userParams,
    });

    return {
      user,
    };
  }

  static async assignRoleToUser(user: Parse.User, roleIdOrName: string) {
    const nameQuery = new Parse.Query(Parse.Role).equalTo('name', roleIdOrName);
    const idQuery = new Parse.Query(Parse.Role).equalTo(
      'objectId',
      roleIdOrName
    );

    const roleQuery = Parse.Query.or(nameQuery, idQuery);
    const role = await roleQuery.first({useMasterKey: true});

    const relation = role?.relation('users');
    relation?.add(user);
    await role?.save(null, {useMasterKey: true});
    return role;
  }
}
