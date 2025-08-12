import { Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import config from '../../config';


const superAdminData = {
  name: 'Super Admin',
  email: 'admin@gmail.com',
  password: 'password1',
  role: Role.SUPERADMIN,
  status:  UserStatus.ACTIVE,
  isVerified: true
};

const seedSuperAdmin = async () => {
  try {
    // Check if a super admin already exists
    const isSuperAdminExists = await prisma.user.findFirst({
      where: {
        role: Role.SUPERADMIN,
      },
    });

    // If not, create one
    if (!isSuperAdminExists) {
      superAdminData.password = await bcrypt.hash(
        config.super_admin_password as string,
        Number(config.bcrypt_salt_rounds) || 12
      );
      await prisma.user.create({
        data: superAdminData,
      });
      console.log('Super Admin created successfully.');
    } else {
      return;
      //   console.log("Super Admin already exists.");
    }
  } catch (error) {
    console.error('Error seeding Super Admin:', error);
  }
};

export default seedSuperAdmin;
