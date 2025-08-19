import {
  togglePostLike,
  getLikedPosts,
} from "../controllers/like.controller.js";
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/toggle/:postId", togglePostLike);
router.get("/", getLikedPosts);

export default router;