// import { Role, UserStatus } from '@prisma/client';
// import * as bcrypt from 'bcrypt';
// import prisma from '../lib/prisma';
// import config from '../../config';


// const adminData = {
//   name: 'Admin',
//   email: 'admin@gmail.com',
//   password: 'password1',
//   role: Role.ADMIN,
//   status: UserStatus.ACTIVE,
//   isVerified: true
// };

// const seedAdmin = async () => {
//   try {
//     // Check if an admin already exists
//     const isAdminExists = await prisma.user.findFirst({
//       where: {
//         role: Role.ADMIN,
//         email: 'admin@gmail.com'
//       },
//     });

//     // If not, create one
//     if (!isAdminExists) {
//       adminData.password = await bcrypt.hash(
//         config.super_admin_password as string,
//         Number(config.bcrypt_salt_rounds) || 12
//       );
//       await prisma.user.create({
//         data: adminData,
//       });
//       console.log('Admin created successfully.');
//     } else {
//       return;
//       //   console.log("Admin already exists.");
//     }
//   } catch (error) {
//     console.error('Error seeding Admin:', error);
//   }
// };

// export default seedAdmin;
