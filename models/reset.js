import { ObjectId } from "mongodb";
import mongoose from "mongoose";

const ResetPasswordSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    resetURL: {type: String, required: true},
    createdAt: { type: Date, expires: '180m', default: Date.now }
}, {collection: 'reset'})

const ResetPassword = mongoose.model('ResetPassword', ResetPasswordSchema)

export { ResetPassword }