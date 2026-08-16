import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import mongoose from "mongoose"
import { ApiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        

        //save the refresh token in the db
        user.refreshToken = refreshToken;
        
        const savedUser = await user.save({ validateBeforeSave: false });
        

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, `something went wrong while generating refresh and access token: ${error}`)
    }
}

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

    console.log(req.files)
    
    if(
        [fullname,email,username,password].some( (field) => { return field?.trim() === ""})
    ) {
        throw new ApiError(401, "All fields are required!")
    }

    const existedUser = await User.findOne({
        $or : [{ username } , { email }] //find user with username or email
    })

    if(existedUser){
        throw new ApiError(409, "User with username or email already exists")
    }

    //access avatar and coverImage from request
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // console.log(avatarLocalPath)
    // console.log(coverImageLocalPath)

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // console.log("before check")

    if(!avatar){
        throw new ApiError(400, "Avatar flie is required")
    }
    
    // console.log("after check")

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

const loginUser = asyncHandler( async (req,res) => {
    //take data from req.body
    //authenticate user based on username or email
    //check in db if user exist
    //if user exist check password
    //generate access and refresh token and send to user in cookies
    //login the user

    const {email, username, password} = req.body

    if(!username && !email){
        throw new ApiError(400,"username or password is required")
    }

    const user = await User.findOne({
        $or : [{ username }, { email }]
    })

    if(!user){
        throw new ApiError(404,"user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"password is incorrect")
    }

    //generate access and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    //what to send to the user
    const loggedInUser = await User.findById(user._id).
    select("-password  -refreshToken")


    const options = {
        httpOnly : true,
        secure : true
    } //yeh karne se cookies sirf aur sirf server se modifiable hongi

    
    return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )


})

const logoutUser = asyncHandler( async (req,res) => {
    // find user and cookies clear kardo
    //but how do i find the user? req mein toh email, username nahi hai,
    // so we'll design a middleware to solve this problem, that middleware will inject user document into the req
    //by extracting the access token from the req.cookie or req.header and find the user document based on that access token
    const userId = req.user._id

    await User.findByIdAndUpdate(
        userId,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200, 
            {},
            "User successfully logged out!"
        )
    )

})

const refreshAccessToken = asyncHandler ( async (req,res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request!")
    }

    try {
        const decodedIncomingRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedIncomingRefreshToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used!")
        }
    
        //ab access and refresh token ko renew karo
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {newAccessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken : newAccessToken, 
                    refreshToken : newRefreshToken
                },
                "Access token refreshed successfully!"
            )
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "something went wrong while refreshing the access token")
    }
    
})

const changeCurrentPassword = asyncHandler( async(req,res) => {
    const {oldPassword, newPassword} = req.body
    //user password change kar rha hai matlab user loggedin toh hai,
    //humne middleware ka use kiya toh ab req.user se userId nikal sakte hai

    const userId = req.user?._id

    const user = await User.findById(userId)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave : false })

    return res.status(200).json( new ApiResponse(200,"password changed successfully!"))

})

const getCurrentUser = asyncHandler( async (req,res) => {
    const user = req.user
    return res.status(200).json(new ApiResponse(200,user,"Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler( async (req,res) => {
    const {fullname, email} = req.body
    if(!fullname && !email){
        throw new ApiError(400,"All fields are required!")
    }
    const userId = req.user?._id
    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set : {
                fullname, email
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateAvatar = asyncHandler( async(req,res) => {
    // here we will have only one file in request thats why
    //we'll use req.file and not req.files

    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading the avatar on cloudinary")
    }

    //updating the db
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,updatedUser,"Avatar updated successfully!"))

})

const updateCoverImage = asyncHandler( async(req,res) => {
    // here we will have only one file in request thats why
    //we'll use req.file and not req.files
    
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"coverImage file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading the coverImage on cloudinary")
    }

    //updating the db
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,updatedUser,"coverImage updated successfully!"))

})

export {
    updateAvatar,
    refreshAccessToken,
    registerUser, 
    loginUser, 
    logoutUser, 
    getCurrentUser, 
    changeCurrentPassword,
    updateCoverImage
}

