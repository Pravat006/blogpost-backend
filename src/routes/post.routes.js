import {
  publishPost,
  getAllPost,
  getPostById,
  updatePost,
  deletePost,
} from "../controllers/post.controller.js";
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes (no authentication required)
router.route("/").get(getAllPost);
router.route("/getPost/:postId").get(getPostById);

// Protected routes (authentication required)
router.use(verifyJWT);

router.route("/publishPost").post(
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  publishPost
);
router.route("/deletePost/:postId").delete(deletePost);
router.route("/updatePost/:postId").patch(upload.single("image"), updatePost);

export default router;
