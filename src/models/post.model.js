import mongoose, { Schema } from "mongoose";
//import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'
const postSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "title must required"],
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
     author:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    isPublished:{
      type: Boolean,
      default: true

    }
  },
  { timestamps: true }
);

//postSchema.plugin(mongooseAggregatePaginate)

export const Post = mongoose.model("Post", postSchema);
