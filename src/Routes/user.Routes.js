import { Router } from "express";
import {
  accessRefreshToken,
  logOutUser,
  loginUser,
  registerUser,
} from "../Controllers/user.controller.js";
import { upload } from "../Middlewares/multer.middleware.js";
import { jwtVerify } from "../Middlewares/auth.middleware.js";

const router = Router();

router.route("/registerUser").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(jwtVerify, logOutUser);

router.route("/refreshToken").post(accessRefreshToken);
export default router;
