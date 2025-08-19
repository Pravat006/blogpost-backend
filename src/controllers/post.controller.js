import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Post } from "../models/post.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose, { isValidObjectId } from "mongoose";

//function to create a blogpost by the author(user)
const publishPost = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if ([title, description].some((fields) => fields.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  const imageLocalpath = req.files?.image[0]?.path;
  if (!imageLocalpath) {
    throw new ApiError(400, "Image must required ");
  }
  const image = await uploadOnCloudinary(imageLocalpath);
  if (!image) {
    throw new ApiError(400, "Error while uploading image on server");
  }

  const blogpost = await Post.create({
    title,
    description,
    image: image.url,
    author: req.user?._id,
  });
  const createdPost = await Post.findById(blogpost?._id);
  if (!createdPost) {
    throw new ApiError(500, "Error while create a post on server");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdPost, "Blog post successfully created"));
});

// this function adds feature to get all posts by adding filtering, sorting, pagination
const getAllPost = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    //convert page and limit to integers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    //creating the query with the filters and  options
    const posts = await Post.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "author", // Field in the 'Post' collection
          foreignField: "_id", // Field in the 'users' collection
          as: "author", // Output field to store author data
          pipeline: [
            {
              $project: {
                fullname: 1,
                avatar: 1, // Include only 'fullname' and 'avatar'
              },
            },
          ],
        },
      },
      // Extract the first author (flatten the array) and handle missing authors
      {
        $addFields: {
          author: {
            $cond: {
              if: { $gt: [{ $size: "$author" }, 0] },
              then: { $arrayElemAt: ["$author", 0] },
              else: null
            }
          },
        },
      },
      // Sort posts by 'createdAt' in descending order
      {
        $sort: { createdAt: -1 },
      },
      // Skip documents for pagination
      {
        $skip: (pageNumber - 1) * limitNumber, // Skip documents based on page and limit
      },
      // Limit the number of documents returned
      {
        $limit: limitNumber, // Limit the results to the specified number
      },
      // Project only required fields
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          image: 1,
          author: 1, // Includes author details (flattened above)
          createdAt: 1,
          likesCount: 1,
        },
      },
    ]); // Limit number of results per page
    const totalPosts = await Post.countDocuments();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          posts,
          page: pageNumber,
          totalPages: Math.ceil(totalPosts / limitNumber),
          totalPosts,
        },
        "Queried posts fetched successfully"
      )
    );
  } catch (error) {
    console.error("Error while getting the posts : ", error);
    throw new ApiError(500, "Error while getting posts from server");
  }
});

// get a post details by its id
const getPostById = asyncHandler(async (req, res) => {
  try {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      throw new ApiError(400, "Invalid blog post id provided");
    }

    const post = await Post.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(postId),
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "post",
          as: "like",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
          pipeline: [
            {
              $project: {
                fullname: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          likesCount: {
            $size: "$like",
          },
          author: {
            $cond: {
              if: { $gt: [{ $size: "$author" }, 0] },
              then: { $arrayElemAt: ["$author", 0] },
              else: null
            }
          },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          image: 1,
          author: 1,
          createdAt: 1,
          likesCount: 1,
        },
      },
    ]);

    if (!post || post.length === 0) {
      throw new ApiError(404, "Post not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, post[0], "Blog post fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "server error while fetching the blog post");
  }
});

const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { newTitle, newDescription } = req.body;

  if (!isValidObjectId(postId)) {
    throw new ApiError(404, "Invalid blog post id provided");
  }
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Blog post not found");
  }

  const newImageLocalpath = req.file?.path;
  let newImage;
  if (newImageLocalpath) {
    newImage = await uploadOnCloudinary(newImageLocalpath);
  }

  const updateData = {
    title: newTitle || post.title,
    description: newDescription || post.description,
  };

  if (newImage) {
    updateData.image = newImage.url;
  }

  const updatedPost = await Post.findByIdAndUpdate(
    postId,
    { $set: updateData },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPost, "blog post successfully updated"));
});

const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) {
    throw new ApiError(404, "Invalid blogpost id provided");
  }
  await Post.findByIdAndDelete(postId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Blog Post deleted successfully"));
});

export { publishPost, getAllPost, getPostById, updatePost, deletePost };
