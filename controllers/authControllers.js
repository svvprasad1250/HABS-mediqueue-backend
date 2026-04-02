
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/userModel")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendMail");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const mongoose = require("mongoose");

const refreshExpireTime = "7d"
const accessExpireTime = "15m";

//@desc Register a user
//@route POST /api/users/register
//@access public

const registerUser = asyncHandler(
    async(req,res)=>{
        const {name,email,password,role,department,phone} = req.body;
        
        let profileImage = null;
        if (req.file) {
            const streamUpload = () => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "profile_images" },
                        (error, result) => {
                            if (result) resolve(result);
                            else reject(error);
                        }
                    );
                    streamifier.createReadStream(req.file.buffer).pipe(stream);
                });
            };

            const result = await streamUpload();
            profileImage = result.secure_url; // 🔥 IMPORTANT
        }

        if(!name || !email || !password ){
            res.status(400);
            throw new Error("all the fileds are mandate")
        }

        if(role === "doctor" && !department){
            res.status(400);
            throw new Error("Department is required for doctor");
        }

        const userAvailable = await User.findOne({email})
        if(userAvailable){
            res.status(400);
            throw new Error("user already exists");
        }

        const hashedPasswd = await bcrypt.hash(password,10);
        const user = await User.create({
            name,
            email,
            password:hashedPasswd,
            role:role || 'patient',
            phone,
            department: role === "doctor" ? department : undefined,
            profileImage:profileImage
        });

        if(user){
            try {
                await sendEmail(
                    user.email,
                    "Welcome to MediQueue 🎉",
                    `
                    <h2>Hello ${user.name} 👋</h2>
                    <p>Your account has been created successfully.</p>
                    <p>Welcome aboard!</p>
                    <p> please login there </p>
                    `
                );
            } catch (err) {
                console.log("Email failed:", err.message);
            }
            res.status(201).json({
                message:"user registered successfully",
                id:user.id,
                name:user.name,
                email:user.email,
                darkMode:user.darkMode,
                role:user.role,
                profileImage:user.profileImage,
            })
        }else{
            res.status(400);
            throw new Error("User data is not valid")
        }

    }
)

//@desc Login a user
//@route POST /api/users/login
//@access public

const loginUser = asyncHandler(
    async(req,res)=>{
        const {email,password} = req.body;
        if(!email || !password){
            res.status(400);
            throw new Error("Email and password are mandatory")
        }
        const user = await User.findOne({email});
        if(user && ( await bcrypt.compare(password,user.password))){
            const accessToken = jwt.sign(
                {
                    user:{
                        id:user.id,
                        email:user.email,
                        role:user.role,
                        name:user.name
                    }
                },
                process.env.SECRET_KEY,
                {expiresIn:accessExpireTime}
            )
            const refreshToken = jwt.sign(
                {id:user.id},
                process.env.REFRESH_SECRET_KEY,
                {expiresIn:refreshExpireTime}
            )

            user.refreshToken = refreshToken;
            await user.save();
            try{
                await sendEmail(
                    user.email,
                    "welcome to the MediQueue 🎉",
                    `
                    <h2> Hello ${user.name} </h2>
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
                user:user.name,
                darkMode:user.darkMode,
                role:user.role
            })
        }else{
            res.status(401);
            throw new Error("unAuthorized user check credentials !")
        }
    }
)

//@desc Refresh access token
//@route POST /api/auth/refresh
//@access public

const refreshAccessToken = asyncHandler(
    async(req,res)=>{
        const {refreshToken} = req.body;

        if(!refreshToken){
            res.status(401);
            throw new Error("refresh token required")
        }

        const user = await User.findOne({refreshToken});

        if(!user){
            res.status(403);
            throw new Error("Invalid refresh token")
        }

        try{
            const decoded = jwt.verify(
                refreshToken,
                process.env.REFRESH_SECRET_KEY
            );
            const newAccessToken = jwt.sign(
                {
                    user:{
                        id:user.id,
                        email:user.email,
                        role:user.role,
                        name:user.name
                    },
                },
                process.env.SECRET_KEY,
                {expiresIn:accessExpireTime}
            )

            const newRefreshToken = jwt.sign(
                {id:user.id},
                process.env.REFRESH_SECRET_KEY,
                {expiresIn:refreshExpireTime}
            )

            user.refreshToken = newRefreshToken;
            await user.save();

            res.status(200).json({
                accessToken:newAccessToken,
                refreshToken:newRefreshToken
            })
        }catch (err) {
            res.status(403);
            throw new Error("Invalid or expired refresh token");
        }
    }
)

//@desc Forgot password
//@route POST /api/auth/forgot-password
//@access public

const forgotPassword = asyncHandler(
    async(req,res)=>{
        const {email} = req.body;
        if(!email){
            res.status(400);
            throw new Error("email is mandate!")
        }
        const user = await User.findOne({email});
        if(!user){
            res.status(400);
            throw new Error("User not found")
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOTP = await bcrypt.hash(otp,10);
        user.resetOTP = hashedOTP;
        user.resetOTPExpire = Date.now() + 10 * 60 * 1000;
        await user.save();
        try{
            await sendEmail(
                user.email,
                "Password Reset OTP",
                ` <h2> Your OTP is: ${otp} </h2> `
            )
        }catch(err){
            throw new Error("Email sending failed!")
        }
        res.status(200).json({
            message:"OTP sent to email"
        })
    }
)

//@desc Reset password
//@route POST /api/auth/reset-password
//@access public

const resetPassword = asyncHandler(
    async(req,res)=>{
        const {email,newPassword} = req.body;
        if(!email || !newPassword){
            res.status(400);
            throw new Error("All Feilds are mandate!")
        }
        const user = await User.findOne({email});
        if (!user) {
            res.status(400);
            throw new Error("User not found");
        }
        const hashedPassword = await bcrypt.hash(newPassword,10);
        user.password = hashedPassword;

        user.resetOTP = undefined;
        user.resetOTPExpire = undefined;

        await user.save();
        try{
            await sendEmail(
                user.email,
                "Password changed",
                ` <h2> Password reset successful </h2> `
            )
        }catch(err){
            throw new Error("Email sending failed!")
        }
        res.status(200).json({message:"password reset successful"})
    }
)

//@desc Verify OTP
//@route POST /api/auth/verify-otp
//@access public

const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        res.status(400);
        throw new Error("Email and OTP required");
    }

    const user = await User.findOne({ email });

    if (!user || !user.resetOTP || !user.resetOTPExpire) {
        res.status(400);
        throw new Error("Invalid request");
    }

    if (user.resetOTPExpire < Date.now()) {
        res.status(400);
        throw new Error("OTP expired");
    }

    const isMatch = await bcrypt.compare(otp, user.resetOTP);

    if (!isMatch) {
        res.status(400);
        throw new Error("Invalid OTP");
    }

    res.status(200).json({ message: "OTP verified" });
});


module.exports = {registerUser,loginUser,refreshAccessToken,forgotPassword,resetPassword,verifyOTP}