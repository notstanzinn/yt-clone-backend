// require('dotenv').config({path : './env'})
import dotenv from "dotenv"
dotenv.config({ path : './.env'})
import connectDB from "./db/db.js";
import { app } from "./app.js";

connectDB()
.then( () => {
    app.listen(process.env.PORT || 8000, () => {
        console.log("app is listening at port : ", process.env.PORT)
    })
})
.catch( (err) => {
    console.log("Mongo DB Connection Failed : ", err)
})




















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