import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// verifyJWT act as an middleware , will be used to applied somewhere to access some rooutes by verify used
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    //take the current logined user's access token
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    //throw an empty message if the access token does not exist
    if (!token) {
      throw new ApiError(401, "UnAuthorized token");
    }
s
    //now verify the client side token with the database saved token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-passord -refreshToken -email"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token ");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
