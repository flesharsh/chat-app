import { useContext } from "react";
import { useState } from "react";
import { createContext } from "react";
import { AuthContext } from "./AuthContext";
import { useEffect } from "react";
import toast from "react-hot-toast";

export const ChatContext=createContext();

export const ChatProvider=({children})=>{
    const [messages,setMessages]=useState([]);
    const [users,setUsers]=useState([]);
    const [selectedUser,setSelectedUser]=useState(null);
    const [unseenMessages,setUnseenMessages]=useState({});

    const {socket,axios,token}=useContext(AuthContext);

    // fucntion to get all users for sidebar
    const getUsers=async()=>{
        try {
            const {data}=await axios.get("/api/messages/users");
            if(data.success){
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }
    // Function toget message for selected user
    const getMessages=async(userId)=>{
        try {
            const {data}=await axios.get(`/api/messages/${userId}`);
            if(data.success){
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // function to send message to selected user
    const sendMessage=async(messageData)=>{
        try {
            const {data}=await axios.post(`/api/messages/send/${selectedUser._id}`,messageData);
            if(data.success){
                setMessages((prevMessages)=>[...prevMessages,data.newMessage]);
            }else{
                toast.error(data.message);
                console.log(data);
            }
        } catch (error) {
            toast.error(error.message);
            console.error(error);
        }
    }
    //function to subscribe to messages for  selected user
    const subscribeToMessage=async()=>{
        if(!socket)return;
        socket.on("newMessage",(newMessage)=>{
            if(selectedUser&&newMessage.senderId===selectedUser._id){
                newMessage.seen=true;
                setMessages((prevMessages)=>[...prevMessages,newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            }else{
                setUnseenMessages((prevUnseenMessages)=>({
                    ...prevUnseenMessages,[newMessage.senderId]:prevUnseenMessages[newMessage.senderId]?prevUnseenMessages[newMessage.senderId]+1:1
                }))
            }
        })
    } 

    // function to unsubscribe to messages
    const unsubscribeFromMessages=()=>{
        if(socket)socket.off("newMessage");
    }
    useEffect(()=>{
        subscribeToMessage();
        return ()=>unsubscribeFromMessages();
    },[socket,selectedUser])

    // function to delete message
const deleteMessage = async (messageId, otherUserId) => {
    try {
        const { data } = await axios.delete(`/api/messages/delete/${messageId}/${otherUserId}`,
                                            {
                                                headers: {
                                                Authorization: `Bearer ${token}`
                                                }
                                            }
                                            );
        if (data.success) {
            setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
            setUnseenMessages((prevUnseenMessages) => {
                const updatedUnseenMessages = { ...prevUnseenMessages };
                if (updatedUnseenMessages[otherUserId]) {
                    updatedUnseenMessages[otherUserId] = updatedUnseenMessages[otherUserId] - 1;
                    if (updatedUnseenMessages[otherUserId] <= 0) delete updatedUnseenMessages[otherUserId];
                }
                return updatedUnseenMessages;
            });
        } else {
            toast.error(data.message);
        }
    } catch (error) {
        toast.error(error.message);
    }
}



    const value={ messages,users,selectedUser,getUsers,setMessages,sendMessage,setSelectedUser,unseenMessages,setUnseenMessages,getMessages,deleteMessage }


    return <ChatContext.Provider value={value}>
        {children}
    </ChatContext.Provider>
}