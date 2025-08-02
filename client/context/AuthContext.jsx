import { createContext } from "react";
import axios from 'axios'
import { useState } from "react";
import toast from "react-hot-toast";
import { useEffect } from "react";
import {io} from "socket.io-client";

export const AuthContext=createContext();
const backendURL = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL=backendURL;


export const AuthProvider=({children})=>{
    const [token,setToken]=useState(localStorage.getItem("token"));
    const [authUser,setAuthUser]=useState(null);
    const [onlineUsers,setOnlineUsers]=useState([]);
    const [socket,setSocket]=useState(null);
    // check if the user is  authenticated and if so set the user data and connect the socket
    const checkAuth=async()=>{
        try {
            const {data}=await axios.get("/api/auth/check");
            if(data.success){
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        } catch (error) {
            toast.error(error.message);
            console.log(error);
        }
    }

    // login function to handle user authentication and socket connection
    const login=async(state,credentials)=>{
        try {
            const {data}=await axios.post(`/api/auth/${state}`,credentials);
            if(data.success){
                setAuthUser(data.userData);
                connectSocket(data.userData);
                axios.defaults.headers.common["token"]=data.token;
                setToken(data.token);
                localStorage.setItem("token",data.token);
                toast.success(data.message);
            }else{
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error);
            
        }
    }

    // update profile function to handle user profile updates
    const updateProfile=async(body)=>{
        try {
            const {data}=await axios.put("/api/auth/update-profile",body);
            if(data.success){
                setAuthUser(data.user);
                toast.success("profile updated successfully")
            }
        } catch (error) {
            toast.error(error.message)
        }
    }


    // logout functon to handle user logout ans socket disconnection
    const logout=async()=>{
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        axios.defaults.headers.common["token"]=null;
        toast.success("logged out succesfuly");
        socket?.disconnect(); 

    }

    // connect socket function to handle socket connection and online users update
    const connectSocket=(userData)=>{
        if(!userData||socket?.connected)return ;
        const newSocket=io(backendURL,{
            query:{
                userId:userData._id,
            }
        })
        newSocket.connect();
        setSocket(newSocket);
        newSocket.on("getOnlineUsers",(userIds)=>{
            setOnlineUsers(userIds);
        })
    }

   useEffect(() => {
    const savedToken = localStorage.getItem("token");

    if (savedToken) {
        axios.defaults.headers.common["token"] = savedToken;
        setToken(savedToken);
        checkAuth(); 
    }
}, []);


 const value={
    axios,authUser,onlineUsers,socket,login,logout,updateProfile,token
 }
 return <AuthContext.Provider value={value}>
         {children}
        </AuthContext.Provider>
}