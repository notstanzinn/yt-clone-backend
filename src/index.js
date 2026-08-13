// require('dotenv').config({path : './env'})
import dotenv from "dotenv"
dotenv.config({ path : './.env'})
import connectDB from "./db/db.js";

connectDB()




















// import express from "express"
// const app = express()
//
// ( async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("errror", (error) => {
//             console.log("Error: ", error)
//             throw error
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`app is listening on port ${process.env.PORT}`)
//         })
//     } catch (error) {
//       console.error("Error: ", error)
//       throw error  
//     }
// })() //executes the function immediately, this is called iffy function