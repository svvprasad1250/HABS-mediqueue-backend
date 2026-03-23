const Hospital = require("../models/hospitalModel");
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/userModel")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendMail");

//@desc Register a hospital
//@route POST /api/hospitals/register
//@access public

const registerHospital = asyncHandler(async (req,res)=>{

    const {name,email,password,address,phone} = req.body;
    console.log("Admin email:", process.env.ADMIN_EMAIL);
    if(!name || !email || !password || !phone || !address){
        res.status(400);
        throw new Error("fields are mandatory")
    }

    const hsplAvail = await Hospital.findOne({email});

    if(hsplAvail){
        res.status(400);
        throw new Error("hospital already exists");
    }

    const hashedPasswd = await bcrypt.hash(password,10);

    const hospital = await Hospital.create({
        name,
        email,
        password:hashedPasswd,
        phone,
        address
    });

    console.log("Sending response to Swagger");
    res.status(201).json({
        message:"Hospital registered successfully",
        id:hospital._id,
        name:hospital.name,
        email:hospital.email,
        darkMode:hospital.darkMode
    });

    try{

        await sendEmail(
            hospital.email,
            "Welcome to mediQueue",
            `
            <h2>Hello ${hospital.name}</h2>
            <p>Your hospital account has been created.</p>
            <p>Please wait for admin approval.</p>
            `
        );

        await sendEmail(
            process.env.ADMIN_EMAIL,
            "New Hospital Registration",
            `
            <h2>Hello Admin</h2>
            <p>A new hospital registered:</p>

            <p><b>Hospital:</b> ${hospital.name}
            <p><b>Hospital Email:</b> ${hospital.email}
            <p>Please login to approve the hospital.</p>
            `
        );

    }catch(err){
        console.log("Email sending failed:", err.message);
    }

});

//@desc Login a hospital
//@route POST /api/hospitals/login
//@access public

const loginHospital = asyncHandler(
    async(req,res)=>{
        const {email,password} = req.body;

        const hospital = await Hospital.findOne({email});

        if(!hospital){
            res.status(404);
            throw new Error("Hospital not found");
        }

        const isMatch = await bcrypt.compare(password,hospital.password);

        if(!isMatch){
            res.status(401);
            throw new Error("Invalid credentials");
        }

        if(hospital.approvalStatus !== "approved"){
            res.status(403);
            throw new Error("Hospital not approved by platform admin");
        }

        const accessToken = jwt.sign(
            {
                hospital:{
                    id:hospital._id,
                    email:hospital.email
                }
            },
            process.env.SECRET_KEY,
            {expiresIn:"15m"}
        );

        const refreshToken = jwt.sign(
            {id:hospital._id},
            process.env.REFRESH_SECRET_KEY,
            {expiresIn:"7d"}
        );

        hospital.refreshToken = refreshToken;
        await hospital.save();
        try{
            await sendEmail(
                hospital.email,
                "welcome to the MediQueue 🎉",
                `
                <h2> Hello ${hospital.name} </h2>
                <p> Your account logged in successfully ! </p>
                <p> Have a great day. </p>
                `
            )
        }catch(err){
            console.log(err.message,"email sending failed")
        }
        res.status(200).json({
            message:"Logged in successfully",
            accessToken:accessToken,
            refreshToken:refreshToken,
            hospital:{
                id:hospital._id,
                name:hospital.name,
                email:hospital.email,
                darkMode:hospital.darkMode
            }
        })
    }
)

//@desc get all Hospitals
//@route GET /api/hospitals
//@access private

const getHospitals = asyncHandler(async (req, res) => {
    let hospitals;

    if(req.user.role === "admin"){
        hospitals = await Hospital.find()
    }
    // else{
    //     appointments = await Appointment
    //     .find({ bookedBy: req.user.id })
    //     .populate("doctor", "name email department");
    // }

    res.status(200).json(hospitals);

});

//@desc Login a hospital
//@route PATCH /api/hospitals
//@access public

const updateHospitalStatus = asyncHandler(
    async(req,res)=>{
        const {approvalStatus}=req.body;
        const {id}=req.params;

        if(req.user.role !== "admin"){
            res.status(400);
            throw new Error("only admin can modify")
        }

        const hospital = await Hospital.findById(id);
        if(!hospital){
            res.status(404);
            throw new Error("Hospital not found")
        }

        hospital.approvalStatus = approvalStatus;
        const updatedStatus = await hospital.save();
        try {
            await sendEmail(
                hospital.email,
                "Hospital Status Update - MediQueue",
                `
                <h2>Hello ${hospital.name}</h2>
                <p>Your hospital status has been updated.</p>
                <p><b>Status:</b> ${approvalStatus}</p>
                <p> Now you can login with registered credentials. </p>
                <p>Thank you for choosing MediQueue.</p>
                `
            );
        }catch(err){
            console.log("email fail sent status",err.message);
        }
        res.status(200).json(updatedStatus)
    }
)

module.exports = {registerHospital,loginHospital,updateHospitalStatus,getHospitals}