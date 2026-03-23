const mongoose = require("mongoose");

const hospitalSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },

    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true
    },

    password:{
        type:String,
        required:true
    },

    address:{
        type:String
    },

    phone:{
        type:String
    },

    approvalStatus:{
        type:String,
        enum:["pending","approved","rejected"],
        default:"pending"
    },
    darkMode: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String
    }

},{timestamps:true});

module.exports = mongoose.model("Hospital",hospitalSchema);