import User from '../../models/User';

import {implementACL} from '../../utils/ACL';
import {UserRoles} from '../../utils/constants';

Parse.Cloud.afterSave(User, async req => {
  const obj = req.object;
  const user = req.user!;

  if (!obj.existed()) {
    obj.setACL(
      implementACL({
        roleRules: [
          {role: UserRoles.SUPER_ADMIN, read: true, write: true},
          {role: UserRoles.SUPER_ADMIN, read: true, write: true},
        ],
        owner: {user: obj.id, read: true, write: true}, // when client create account
      })
    );
  }
});
Parse.Cloud.beforeSave('StaffProfile', async request => {
  const staffProfile = request.object;

  // Only set ACL if it's not already set
  if (!staffProfile.getACL()) {
    const acl = new Parse.ACL();

    // Give access to the linked user, if available
    const user = request.user;
    if (user) {
      acl.setReadAccess(user.id, true);
      acl.setWriteAccess(user.id, true);
    }

    // Optional: Give access to roles
    acl.setRoleWriteAccess('Admin', true);
    acl.setRoleReadAccess('Admin', true);

    // Optional: Public read access
    // acl.setPublicReadAccess(true);

    staffProfile.setACL(acl);
  }
});
