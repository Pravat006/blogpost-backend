import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Post } from "../models/post.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { isValidObjectId } from "mongoose";

//function to create a blogpost by the author(user)
const publishPost = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if ([title, description].some((fields) => fields.trim() === " ")) {
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
    author: req.user?._id
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
    const { page = 1, limit = 10, sortBy, order = "desc" } = req.query;

    //convert page and limit to intigers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    //creating the query with the filters and  options
    const posts = await Post.find()
      .sort({ [sortBy]: order === "desc" ? -1 : 1 }) // Sort by field and order
      .skip((pageNumber - 1) * limitNumber) // Skip documents for pagination
      .limit(limitNumber); // Limit number of results per page
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
    const postId = req.params;

    if (!isValidObjectId(postId)) {
      throw new ApiError(4001, "Invalid blog post id provided");
    }
    const post = await Post.aggregate([
      {
        $match: {
          _id: postId,
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "post",
          as: "likes",
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
                "avatar.url": 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          likesCount: {
            $size: "likes",
          },
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          image: 1,
          author: 1,
          createdAt: 1,
          likesCount: 1,
        },
      },
    ]);
    if (!post) {
      throw new ApiError(400, "Something went wrong while getting the post");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, post, "Blog post fetched successfully"));
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
  const newImageLocalpath = req.files?.image[0]?.path;
  let newImage;
  if (newImage) {
    newImage = await uploadOnCloudinary(newImageLocalpath);
  }
  if (!newImage) {
    throw new ApiError(400, "Error while uploading the new image on cloud");
  }
  const updatePost = await Post.findByIdAndDelete(
    postId,
    {
      $set: {
        title: newTitle ,
        description: newDescription ,
        image: newImage?.url.toString() || "",
      },
    },
    {
      new: true,
    }
  );
  const updatedPost = await Post.findById(updatePost._id);
  return res
    .status(200)
    .json(new ApiResponse(200, updatedPost, "blog post successfully updated"));
});
const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) {
    throw new ApiError(404, "Invalid blogpost id provided")
  }
  await Post.findByIdAndDelete(postId)

  return res.status(200).json(
    new ApiResponse(200, {}, "Blog Post deleted successfully")
  )

});

export { publishPost, getAllPost, getPostById, updatePost, deletePost };
