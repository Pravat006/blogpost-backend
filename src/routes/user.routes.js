import {
  registerUser,
  loginUser,
  logOut,
  getCurrentUser,
  refreshAccessToken,
  changeCurrentPassword,
  getLikedHistory,
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
router.route("/logout").post(logOut)
router.route("/get-CurrentUser").get(getCurrentUser)
router.route("/change-password").patch(changeCurrentPassword)
router.route("/likedPost-history").get(verifyJWT,getLikedHistory)
router.route("/author-profile").get(verifyJWT,getAuthorProfile)
router.route("/refresh-token").post(refreshAccessToken);

export default router