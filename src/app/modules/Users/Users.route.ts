import express from 'express';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { UsersController } from './Users.controller';
import { fileUploader } from '../../middlewares/multerFileUpload';



const router = express.Router();

//admin


router.put('/update-profile', auth(), UsersController.updateMyProfile);

router.get('/all', auth(Role.ADMIN, Role.SUPERADMIN), UsersController.getAllUsers);

router.put('/status/:userId', auth(Role.ADMIN, Role.SUPERADMIN), UsersController.updateUserStatus);

router.get('/me', auth(), UsersController.getMyProfile);
router.post('/me/uploads-profile-photo', auth(), fileUploader.profileImage, UsersController.updateMyProfileImage);

router.get('/seller/:sellerId', auth(), UsersController.getSellerProfileById);

router.get('/:id', UsersController.getUserProfileById);






export const UsersRoutes = router;
