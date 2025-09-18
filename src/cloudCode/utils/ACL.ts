import User from '../models/User';

type RoleRule = {role: string; read?: boolean; write?: boolean};

export function implementACL(params: {
  publicRead?: boolean;
  publicWrite?: boolean;
  roleRules: RoleRule[]; // roles with normal role-level read/write
  excludedRoles?: string[]; // roles that MUST NOT get role-level access (owner-only)
  owner?: {user: string | User; read?: boolean; write?: boolean}; // “own” access
}): Parse.ACL {
  const {
    publicRead = false,
    publicWrite = false,
    roleRules,
    excludedRoles = [],
    owner,
  } = params;

  //const excludedRoles2 = new Set(excludedRoles);
  const acl = new Parse.ACL();

  acl.setPublicReadAccess(!!publicRead); //double negation operator that converts any value to a boolean.
  acl.setPublicWriteAccess(!!publicWrite);

  // Apply role level rules
  for (const {role, read = false, write = false} of roleRules) {
    if (excludedRoles.includes(role)) continue; // owner-only: no role-level access on the object
    if (read) acl.setRoleReadAccess(role, true);
    acl.setRoleWriteAccess(role, !!write);
  }

  // Owner access (creator)
  if (owner) {
    if (owner.read) acl.setReadAccess(owner.user, true);
    if (owner.write) acl.setWriteAccess(owner.user, true);
  }

  return acl;
}
 
export async function hasRole(
  user: Parse.User,
  roleName: string
): Promise<boolean> {
  const roleQuery = new Parse.Query(Parse.Role);
  roleQuery.equalTo('users', user);
  roleQuery.equalTo('isCustom', true);
  roleQuery.equalTo('name', roleName);

  const count = await roleQuery.count({useMasterKey: true});
  return count > 0;
}
