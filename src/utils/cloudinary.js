import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file has been uploaded successfully
        console.log("file uploaded successfully", response.url)
        return response

    } catch (error) {
        //if file uploading fails, woh file apne server se delete kardo
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the uploading of file failed
        return null
    }
}

export {uploadOnCloudinary}