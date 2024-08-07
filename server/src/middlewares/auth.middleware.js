import {ApiError,ApiResponse} from '../utils/apiHanlder.js'
import jwt from 'jsonwebtoken';
import {User} from '../models/user.model.js'

export const verifyJWT = async (req,res,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.json(new ApiError(400,'you are not logged in')) 
        }
        
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

        if (!decodedToken){
            return res.json(new ApiError(400,"couldn't decode the token"))
        }

        const user = await User.findById(decodedToken._id).select('-password -refreshToken')

        if (!user) {
            return res.json(new ApiError(400,"no user found"))
        }

        req.user = user;
        next()

    } catch (error) {
        throw new ApiError(400,error)
    }
}

export const verifySocket = async (err,socket,next) => {
    try {
        const authToken = socket?.request?.cookies?.accessToken;


        if (!authToken) {
            throw new ApiError(400,"no access token found")
        }
        
        const decodedToken =  jwt.verify(authToken,process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken._id).select('-password -refreshToken')

        if (!user) {
            throw new ApiError(401,"no user found")
        }

        socket.user = user;

        next();
    } catch (error) {
        console.log(error)
    }
}