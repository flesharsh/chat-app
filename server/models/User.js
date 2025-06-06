import mongoose from "mongoose";

const userSChema=new mongoose.Schema({
    email:{type:String,required:true,unique:true},
    fullName:{type:String,required:true},
    password:{type:String,required:true,minlength:6},
    profilePic:{type:String,default:""},
    bio:{type:String},
},{timestamps:true});
const User=mongoose.model("User",userSChema);
export default User;