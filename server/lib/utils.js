import jwt from "jsonwebtoken"; // ✅ correct



// function to generate a token

export const generateToken=(userId)=>{
    const token=jwt.sign({userId},process.env.JWT_SECRET);
    return token;
}