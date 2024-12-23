import Mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import mongoose from "mongoose";
//import bcrypt from "bcrypt"

const registerUser = asyncHandler(async (req, res) => {
  //take necessary data from user to resister

  const { fullname, email, password } = req.body;

  // check if the required fields are not empty
  if ([email, fullname, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "all field are required");
  }

  //check for existed user in database before creating a new user account
  const existedUser = await User.findOne({
    email: email,
  });
  if (existedUser) {
    throw new ApiError(409, "User with this email  already exist");
  }

  //console.log(req.files);

  ////check for images, check for avatar
  //const avatarLocalPath = req.files?.avatar[0]?.path;
  ////const coverImageLocalPath = req.files?.coverImage[0]?.path;
  //if (!avatarLocalPath) {
  //  throw new ApiError(400, "Avatar file is required");
  //}

  //const avatar = await uploadOnCloudinary(avatarLocalPath);

  //if (!avatar) {
  //  throw new ApiError(400, "Avatar file is required");
  //}

  const user = await User.create({
    fullname,
    //avatar: avatar.url,
    email,
    password,
  });
  //find created user
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "User account already exist in our database");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User register successful"));
});

//const generateAccessToken =  (userId)=>{
//    return  jwt.sign({userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: process.env.ACCESS_TOKEN_EXPIRY})
//}
//const generateRefreshToken= (userId)=>{
//  return jwt.sign({userId}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: process.env.REFRESH_TOKEN_EXPIRY})
//}
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefershToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token !"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Please enter your resistered email address ! ");
  }
  const user = await User.findOne({
    email: email,
  });
  //console.log(user)
  if (!user) {
    throw new ApiError(404, "user does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password)
  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect passord entered");
  }
  
  //const accessToken=  generateAccessToken(user?._id)
  //const refreshToken=  generateRefreshToken(user?._id)
  
  const {accessToken, refreshToken}= await generateAccessAndRefreshToken(user?._id)
  const loggedInUser = await User.findById(user?._id).select(
    "-passord -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          refreshToken,
          accessToken,
        },
        "user logged in successfully"
      )
    );
});

const logOut = asyncHandler(async (req, res) => {


  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized request !");
  }
  await User.findByIdAndUpdate(
  req.user?._id,
    {
      $unset: {
        //refreshToken: undefined,
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successful"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const userRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!userRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      userRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (userRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refreshToken is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    //after token verification generate new access and refresh token
    const { accessToken, RefreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("access token", accessToken, options)
      .cookie("refresh token", RefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: RefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select("-password -refreshToken");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "current user fetched successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = user.isPasswordCorrect(currentPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid currentPassword provided");
  }
  user.passord = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "currentPassword changed successfully"));
});
const getAuthorProfile = asyncHandler(async (req, res) => {
  try {
    const { fullname } = req.params;
    const author = await User.findOne({ fullname: fullname }).select(
      "-password -refreshToken"
    );
    if (!author) {
      throw new ApiError(404, "Author not found");
    }
   const authoraggregate= await User.aggregate([
     {
      $match: {_id: new mongoose.Types.ObjectId(author?._id)}
     },{
        $lookup:{
          from: "posts",
          localField: "_id",
          foreignField: "author",
          as: "posts",
          pipeline: [
            {
              $match:{
                isPublished: true
              }
            },
            {
              $sort:{
                createdAt: -1
              }
            },
            {
              $limit: 10
            }
          ]
        }
     },
     
     {
        $project:{
          _id: 0,
          fullname: 1,
          avatar: 1,
          posts:{
            title: 1,
            description: 1,
            image: 1,
            isPublished: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
     }
  
  
   ])
   return res.status(200).json(
      new ApiResponse(200, authoraggregate, "Author profile fetched successfully")
   )
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
    
  }
  
});





export {
  registerUser,
  loginUser,
  logOut,
  getCurrentUser,
  refreshAccessToken,
  changeCurrentPassword,
  getAuthorProfile,
};
