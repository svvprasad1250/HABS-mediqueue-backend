const mongoose = require("mongoose");

const appointmentSchema = mongoose.Schema(
{
    appointmentCode:{
        type:String,
        unique:true
    },

    bookedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    patient:{
        name:{
            type:String,
            required:true
        },
        age:{
            type:Number
        },
        gender:{
            type:String,
            enum:["Male","Female","Other"]
        },
        phone:{
            type:String
        }
    },

    doctor:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    department:{
        type:String,
        enum:["Cardiology","Dermatology","Neurology","Orthopedics"],
        required:true
    },

    appointmentDate:{
        type:Date,
        required:true
    },

    timeSlot:{
        type:String,
        required:true
    },

    reason:{
        type:String
    },

    status:{
        type:String,
        enum:["pending","rejected","approved"],
        default:"pending"
    },

    doctorNote:{
        type:String,
        default:null
    }

},
{ timestamps:true });

module.exports = mongoose.model("Appointment",appointmentSchema);