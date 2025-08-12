import express from "express";
import { StoreControllers } from "./store.controller";
import validateRequest from "../../middlewares/validateRequest";
import { StoreValidation } from "./store.validation";
import auth, { checkOTP } from "../../middlewares/auth";
import { Role } from "@prisma/client";


const router = express.Router();

router.post(
  "/create",
  validateRequest(StoreValidation.createStoreSchema),
  checkOTP,
  StoreControllers.createStore
);


export const StoreRouters = router;
