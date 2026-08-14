import express, { json } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
// cookie parser is used to store and modify cookies in the clients browser from server itself

const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
})) // use method is mostly used for middlewares or configurations

app.use(express.json({ limit : "16kb" }))
app.use(express.urlencoded()) // to aceept data from url
app.use(express.static("public")) // to store data in server only, like we have a public folder in this backend directory
app.use(cookieParser())

//routes import
import userRouter from "./routes/user.routes.js"

//routes declaration
app.use("/api/v1/users", userRouter)

export { app }