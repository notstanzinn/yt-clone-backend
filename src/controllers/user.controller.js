import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import mongoose from "mongoose"
import { ApiResponse } from "../utils/apiResponse.js"

const registerUser = asyncHandler( async (req,res) => {
    //get user details from frontend
    //validation - {username, email, password} is not empty
    //check if user already exists: username, email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    //create an user object - create entry in db
    //remove password from password and refresh token field from response
    // check for user creation
    // return response
    const {username, email, fullname, password} = req.body
    
    if(
        [fullname,email,username,password].some( (field) => { return field?.trim() === ""})
    ) {
        throw new ApiError(401, "All fields are required!")
    }

    const existedUser = User.find({
        $or : [{ username } , { email }] //find user with username or email
    })

    if(existedUser){
        throw new ApiError(409, "User with username or email already exists")
    }

    //access avatar and coverImage from request
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar flie is required")
    }

    const user = await User.create({
        fullname : fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" //removing password and refresh token from the user object
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user :(")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully !")
    )
    


})

export {registerUser}

