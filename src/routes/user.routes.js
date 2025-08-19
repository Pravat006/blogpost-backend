import {
  registerUser,
  loginUser,
  logOut,
  getCurrentUser,
  refreshAccessToken,
  changeCurrentPassword,

  getAuthorProfile,
} from "../controllers/user.controller.js";

import {upload} from "../middlewares/multer.middleware.js"
import {Router} from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js";
  
const router = Router();

router.route("/register").post(
  //injecting multer middleware
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    }
   
  ]),
  registerUser
);

router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,logOut)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/change-password").patch(verifyJWT,changeCurrentPassword)
router.route("/author-profile/:fullname").get(verifyJWT,getAuthorProfile)
router.route("/refresh-token").post(refreshAccessToken);

export default router