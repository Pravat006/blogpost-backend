import mongoose, {  Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "password must required"],
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
     
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);
userSchema.pre("save", async function (next){
    if(!this.isModified("password")) return next();
      
    this.password= await bcrypt.hash(this.password, 10);
      next()   
  });

  //writing some custom mongoose methods to do a perticular task

// isPasseordCorrect used to validate the password while user trying to login
  userSchema.methods.isPasswordCorrect= async function(password){
     return await bcrypt.compare(password, this.password)
  }
  

  // these methods generate access token and refresh token during user login process
  userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
      _id: this._id,
      email: this.email,
      fullname: this.fullname
       },
       process.env.ACCESS_TOKEN_SECRET,
       {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
       }
    )
  }
  userSchema.methods.generateRefershToken= function(){
    return jwt.sign({
      _id: this._id,
      email: this.email,
      fullname: this.fullname
       },
       process.env.REFRESH_TOKEN_SECRET,
       {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRY
       }
    )

  }

export const User = mongoose.model("user", userSchema);
