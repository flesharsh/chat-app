import { protectRoute } from "../middleware/auth.js";
import express from "express"
import { deleteMessage, getMessages, getUsersForSidebar, markMessageAsSeen, sendMessage } from "../controllers/messageController.js";

const messageRouter=express.Router();
messageRouter.get("/users",protectRoute,getUsersForSidebar);
messageRouter.delete("/delete/:messageId/:otherUserId",protectRoute,deleteMessage);
messageRouter.get("/:id",protectRoute,getMessages);
messageRouter.put("/mark/:id",protectRoute,markMessageAsSeen);
messageRouter.post("/send/:id",protectRoute,sendMessage);
export default messageRouter