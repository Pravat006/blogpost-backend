import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Post } from "../models/post.model.js";

const togglePostLike = asyncHandler(async (req, res) => {
  try {
    // toggle like a post
    //take the post id from params and validate the post id
    //check if the current user liked the post or not !
    //if liked then unlike
    // else create a new like document

    const { postId } = req.params;
    if (!isValidObjectId(postId)) {
      throw new ApiError(400, "Invalid post id");
    }
    const post = await Post.findById(postId);
    if (!post) {
      throw new ApiError(404, "Blog Post not found");
    }

    const existingLike = await Like.findOne({
      post: postId,
      likedBy: req.user?._id,
    });

    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "post unliked successfully"));
    } else {
      const newLike = await Like.create({
        post: postId,
        likedBy: req.user?._id,
      });
    }
    return res
      .status(200)
      .json(new ApiResponse(200, newLike, "Post liked successfully"));
  } catch (error) {
    console.error("Error while toggling Like : ", error);
    return res.status(500).json({ message: "Server Error" });
  }
});

const getLikedPosts = asyncHandler(async (req, res) => {
  try {
    const likedPosts = await Like.aggregate([
  
      {
        $match: {
          likedBy: new mongoose.Types.ObjectId(req.user?._id)
        }
      },
      {
        $lookup: {
          from: "posts",
          foreignField: "_id",
          localField: "post",
          as: "likedPost",
          pipeline: [
            {
              $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "author",
                as: "authorDetails",
  
              }
            }, {
              $unwind: "$authorDetails"
            }
          ]
  
  
        }
      }, {
        $unwind: "$likedPost"
      }, {
        $sort: {
          createdAt: -1
        }
      }, {
        $project: {
          _id: 0,
          likedPosts: {
            _id: 1,
            title: 1,
            description: 1,
            image: 1,
            authorDetails: {
              fullname: 1,
              avatar: 1,
              email: 1
  
  
            }
  
          }
        }
      }
    ]);
  
    return res.status(200).json(
      new ApiResponse(200, likedPosts, "liked blog posts fetched successfully")
    )
  } catch (error) {
    throw new ApiError(500, error.message, "Internal server error")
  }
})

export {
  togglePostLike,
  getLikedPosts
}