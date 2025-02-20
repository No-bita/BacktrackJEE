import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    }
}, {
    timestamps: true // ✅ Auto-adds `createdAt` & `updatedAt`
});

// ✅ Prevent duplicate model definition
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
