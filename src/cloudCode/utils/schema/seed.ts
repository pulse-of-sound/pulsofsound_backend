import * as fs from 'fs';
import * as path from 'path';
import {UserRoles} from '../constants';
import User from '../../models/User';
const countriesLib = require('i18n-iso-countries');

//Register locales
countriesLib.registerLocale(require('i18n-iso-countries/langs/en.json'));
countriesLib.registerLocale(require('i18n-iso-countries/langs/ar.json'));

// Configuration for images folder path

const IMAGES_FOLDER_PATH = path.join(__dirname, '../../assets');
//const IMAGES_FOLDER_PATH = 'C:\\Users\\USER\\Desktop\\ayn_backend\\src\\assets';
// Function to verify images folder and list available files
export function verifyImagesFolder() {
  try {
    if (!fs.existsSync(IMAGES_FOLDER_PATH)) {
      console.error(`Images folder not found: ${IMAGES_FOLDER_PATH}`);
      return false;
    }

    const imageFiles = fs
      .readdirSync(IMAGES_FOLDER_PATH)
      .filter(
        file =>
          file.toLowerCase().endsWith('.svg') ||
          file.toLowerCase().endsWith('.jpg') ||
          file.toLowerCase().endsWith('.jpeg') ||
          file.toLowerCase().endsWith('.png') ||
          file.toLowerCase().endsWith('.jfif')
      );

    console.log(`✅ Images folder found: ${IMAGES_FOLDER_PATH}`);
    console.log(`📁 Found ${imageFiles.length} image files:`);
    imageFiles.forEach(file => console.log(`   - ${file}`));

    return true;
  } catch (error) {
    console.error('❌ Error verifying images folder:', error);
    return false;
  }
}

// export async function seedRoles() {
//   const actions = ['r', 'c', 'u', 'd'];
//   try {
//     for (const className of classNames) {
//       for (const action of actions) {
//         const roleName = `${className}-role-${action}`;

//         // Check if the role already exists
//         const roleQuery = new Parse.Query(Parse.Role);
//         roleQuery.equalTo('name', roleName);
//         roleQuery.equalTo('isCustom', false);
//         const existingRole = await roleQuery.first({useMasterKey: true});

//         if (!existingRole) {
//           console.log(`Creating role: ${roleName}`);

//           // Create a new role
//           const roleAcl = new Parse.ACL();
//           roleAcl.setPublicReadAccess(false);
//           roleAcl.setPublicWriteAccess(false);
//           roleAcl.setRoleReadAccess('SuperAdmin', true);
//           roleAcl.setRoleWriteAccess('SuperAdmin', true);
//           const role = new Parse.Role(roleName, roleAcl);
//           role.set('isCustom', false);
//           await role.save(null, {useMasterKey: true});

//           //console.log(`Role ${roleName} created successfully.`);
//         }
//       }
//     }
//     console.log('Role seeding completed.');
//   } catch (error) {
//     console.error('Error seeding roles:', error);
//   }
// }
export async function seedCustomRoles() {
  const roles = Object.values(UserRoles);
  for (const role of roles) {
    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', role);
    roleQuery.equalTo('isCustom', true);
    const existingRole = await roleQuery.first({useMasterKey: true});
    if (!existingRole) {
      console.log(`Creating role: ${role}`);
      const roleAcl = new Parse.ACL();
      roleAcl.setPublicReadAccess(false);
      roleAcl.setPublicWriteAccess(false);
      roleAcl.setRoleReadAccess(UserRoles.SUPER_ADMIN, true);
      roleAcl.setRoleWriteAccess(UserRoles.SUPER_ADMIN, true);
      const roleObj = new Parse.Role(role, roleAcl);
      roleObj.set('isCustom', true);
      await roleObj.save(null, {useMasterKey: true});
      console.log(`Role ${role} created successfully.`);
    }
  }
  console.log('Custom role seeding completed.');
}

async function seedUsers() {
  const userData = {
    username: 'super',
    password: 'super',
    email: 'admin@test.com',
  };

  // Check if user already exists
  const query = new Parse.Query(User);
  query.equalTo('username', userData.username);
  const exists = await query.first({useMasterKey: true});

  if (!exists) {
    const user = new User();
    user.set('username', userData.username);
    user.set('password', userData.password);
    user.set('email', userData.email);

    try {
      await user.save(null, {useMasterKey: true});
      console.log(`Seeded user: ${userData.username}`);

      // Assign SuperAdmin role to the user
      const roleQuery = new Parse.Query(Parse.Role);
      roleQuery.equalTo('name', 'SuperAdmin');
      const superAdminRole = await roleQuery.first({useMasterKey: true});

      if (superAdminRole) {
        superAdminRole.getUsers().add(user);
        await superAdminRole.save(null, {useMasterKey: true});
        console.log(`Assigned SuperAdmin role to user: ${userData.username}`);
      } else {
        console.error('SuperAdmin role not found in database');
      }
    } catch (err) {
      console.error(`Failed to seed user ${userData.username}:`, err);
    }
  } else {
    // User exists, check if they have SuperAdmin role
    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', 'SuperAdmin');
    const superAdminRole = await roleQuery.first({useMasterKey: true});

    if (superAdminRole) {
      // Check if user already has the SuperAdmin role
      const userRoleQuery = new Parse.Query(Parse.Role);
      userRoleQuery.equalTo('name', 'SuperAdmin');
      userRoleQuery.equalTo('users', exists);
      const userHasRole = await userRoleQuery.first({useMasterKey: true});

      if (!userHasRole) {
        // Assign SuperAdmin role to existing user
        superAdminRole.getUsers().add(exists);
        await superAdminRole.save(null, {useMasterKey: true});
        console.log(
          `Assigned SuperAdmin role to existing user: ${userData.username}`
        );
      } else {
        console.log(`User ${userData.username} already has SuperAdmin role`);
      }
    } else {
      console.error('SuperAdmin role not found in database');
    }
  }

  console.log('User seeding complete!');
}

async function seedAccountStatus() {
  const accountstatuses = [
    {code: '1', name: {en: 'Active', ar: 'نشط'}},
    {code: '2', name: {en: 'Inactive', ar: 'غير نشط'}},
    {code: '3', name: {en: 'Blocked', ar: 'محظور'}},
  ];
  for (const status of accountstatuses) {
    const query = new Parse.Query('AccountStatus');
    query.equalTo('code', status.code);
    const exists = await query.first({useMasterKey: true});
    if (!exists) {
      const accountStatus = new Parse.Object('AccountStatus');
      accountStatus.set('code', status.code);
      accountStatus.set('name', status.name); // MultiLangs object
      await accountStatus.save(null, {useMasterKey: true});
      // console.log(`Seeded: ${status.name.en}`);
    }
  }
  console.log('AccountStatus seeding complete!');
}

// Helper function to create a Parse.File from a local image file
async function createFileFromLocalImage(
  imagePath: string,
  fileName: string
): Promise<Parse.File> {
  try {
    // Read the file as buffer
    const fileBuffer = fs.readFileSync(imagePath);

    // Convert buffer to base64
    const base64 = fileBuffer.toString('base64');

    // Create Parse.File
    const fileExtension = path.extname(fileName).toLowerCase();
    let mimeType = 'image/jpeg'; // default

    if (fileExtension === '.svg') {
      mimeType = 'image/svg+xml';
    } else if (fileExtension === '.png') {
      mimeType = 'image/png';
    } else if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
      mimeType = 'image/jpeg';
    } else if (fileExtension === '.jfif') {
      mimeType = 'image/jpeg';
    }

    const parseFile = new Parse.File(fileName, {base64}, mimeType);

    // Save the file
    return await parseFile.save({useMasterKey: true});
  } catch (error) {
    console.error(`Error creating file from ${imagePath}:`, error);
    throw error;
  }
}

// Helper function to create a File object from a local image
// async function createFileObjectFromLocalImage(
//   imagePath: string,
//   fileName: string
// ): Promise<File> {
//   try {
//     const parseFile = await createFileFromLocalImage(imagePath, fileName);

//     const fileObj = new File();
//     fileObj.file = parseFile;
//     fileObj.fileSize = fs.statSync(imagePath).size;

//     // Save the File object to the database
//     await fileObj.save(null, {useMasterKey: true});

//     return fileObj;
//   } catch (error) {
//     console.error(`Error creating File object from ${imagePath}:`, error);
//     throw error;
//   }
// }

export async function seedAll() {
  // await seedRoles();
  await seedCustomRoles();
  await seedUsers();
  await seedAccountStatus();
  console.log('All seeders completed!');
}
