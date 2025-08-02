// get all usesrs except loged in user

import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import {io,userSocketMap} from "../server.js"

export const getUsersForSidebar=async(req,res)=>{
    try {
        // get all the users aside from the current user
        const userId=req.user._id;
        const filteredUsers=await User.find({_id:{$ne : userId}}).select("-password");
        // count number of messages unseen
        const unseenMessages={}
        const promises=filteredUsers.map(async(user)=>{
            const messages=await Message.find({senderId:user._id,recieverId:userId,seen:false});
            if(messages.length>0)
            {
                unseenMessages[user._id]=messages.length;
            }
        })
        await Promise.all(promises);
        res.json({success:true,users:filteredUsers,unseenMessages});
    } catch (error) {
        console.error(error.message);
        res.json({success:false,message:error.message});
    }
}


// get all messages from selected users
export const getMessages=async(req,res)=>{
    try {
        const {id:selectedUserId}=req.params;
        const myId=req.user._id;
        const messages=await Message.find({
            $or:[
                {senderId:myId,recieverId:selectedUserId},
                {senderId:selectedUserId,recieverId:myId},
            ]
        })
        await Message.updateMany({senderId:selectedUserId,recieverId:myId},{seen:true});
        res.json({success:true,messages});
    } catch (error) {
        console.error(error.message);
        res.json({success:true,message:error.message}); 
    }
}

// api to mark message as seen using message id

export const markMessageAsSeen=async(req,res)=>{
    try {
        const {id}=req.params;
        await Message.findByIdAndUpdate(id,{seen:true});
        res.json({success:true});
    } catch (error) {
        console.error(error.message);
        res.json({success:true,message:error.message});
    }
}

// Send message to selected user
export const sendMessage=async(req,res)=>{
    try {
        const {text,image}=req.body;
        const recieverId=req.params.id;
        const senderId=req.user._id;
        let imageUrl;
        if(image){
            const uploadRespone=await cloudinary.uploader.upload(image);
            imageUrl=uploadRespone.secure_url;
        }
        const newMessage=await Message.create({
            senderId,
            recieverId,
            text,
            image:imageUrl
        });
        // Emit the new message to reciever socket
        const recieverSocketId=userSocketMap[recieverId];
        if(recieverSocketId){
            io.to(recieverSocketId).emit("newMessage",newMessage);
        }
        res.json({success:true,newMessage});

    } catch (error) {
         console.error(error.message);
        res.json({success:true,message:error.message});
    }
}

// delete a message 
export const deleteMessage = async (req, res) => {
    try {
        const { messageId, otherUserId } = req.params; 
        await Message.findByIdAndDelete(messageId);
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId: myId, recieverId: otherUserId },
                { senderId: otherUserId, recieverId: myId },
            ]
        });
        res.json({ success: true, messages });
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}