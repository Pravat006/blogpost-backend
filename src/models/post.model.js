import mongoose, { Schema } from "mongoose";
//import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "title must required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

//postSchema.plugin(mongooseAggregatePaginate)

export const Post = mongoose.model("Post", postSchema);
