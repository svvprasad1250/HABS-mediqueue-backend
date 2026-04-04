const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"]
    },

    email: {
        type: String,
        required: [true, "Please enter email"],
        unique: true,
        lowercase: true
    },

    password: {
        type: String,
        required: [true, "Please enter password"]
    },

    role: {
        type: String,
        enum: ["patient", "doctor", "admin"],
        default: "patient"
    },
    hospital:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Hospital"
    },

    department: {
        type: String,
        enum: [
            "Cardiology",
            "Dermatology",
            "Neurology",
            "Orthopedics"
        ],
        required: function () {
            return this.role === "doctor";
        }
    },

    phone: {
        type: String
    },
    
    profileImage: {
        type: String,
        default: null
    },

    darkMode: {
        type: Boolean,
        default: false
    },

    refreshToken: {
        type: String
    },
    resetOTP:{
        type:String
    },
    resetOTPExpire:{
        type:Date
    },
    lastOtpSentAt: {
        type: Date
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);