import mongoose, { mongo } from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber : {
        type : mongoose.Schema.Types.ObjectId, //one who is subscribing
        ref : "User"
    },
    channel : {
        //to whom subcriber is subscribing
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
},{ timestamps : true })

export const Subscription = mongoose.model("Subscription", subscriptionSchema)