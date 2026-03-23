
const asyncHandler=require("../middleware/asyncHandler");
const User = require("../models/userModel");
const fs = require("fs");
const path = require("path");

//@desc current user
//@route GET /api/users/current-user
//@access private

const getCurrentUser = asyncHandler(
    async(req,res)=>{
        const user = await User.findById(req.user.id).select("-password").select("-refreshToken");
        if(!user){
            res.status(404);
            throw new Error("user not found")
        }
        res.status(200).json(user)
    }
)

//@desc get all doctors
//@route GET /api/users/doctors
//@access private

const getAllDoctors = asyncHandler(async (req, res) => {
    const users = await User.find({role:"doctor"}).select("-password").select("-refreshToken");
    res.status(200).json(users);
});

//@desc get all patients
//@route GET /api/users/patients
//@access private

const getAllPatients = asyncHandler(
    async(req,res)=>{
        if(req.user.role !== "admin"){
            res.status(403);
            throw new Error("Only Admin can view all patients")
        }
        const patients = await User.find({role:"patient"}).select("-password").select("-refreshToken");
        res.status(200).json(patients);
    }
);

//@desc update darkmode
//@route PATCH /api/users/darkmode
//@access private

const updateDarkMode = asyncHandler(
    async(req,res)=>{
        const {darkMode} = req.body;
        if(typeof darkMode !== "boolean"){
            res.status(400);
            throw new Error("darkmode be in boolean")
        }
        const user = await User.findById(req.user.id);
        if(!user){
            res.status(404);
            throw new Error("user not found")
        }
        user.darkMode = darkMode;
        await user.save();
        res.status(200).json({
            message:"darkMode updated successful",
            darkMode: user.darkMode
        })
    }
)

const updateUserProfile = asyncHandler(
    async(req,res)=>{
        const { name, phone } = req.body;
        const user = await User.findById(req.user.id);
        if(!user){
            res.status(404);
            throw new Error("User Not Found !")
        }
        if(user._id.toString() !== req.user.id ){
            res.status(403);
            throw new Error(" user cannot able to update the another user")
        }
        if (name) user.name = name;
        if (phone) user.phone = phone;

        if(req.file){
            if(user.profileImage){
                const oldImg = path.join(__dirname,"..",user.profileImage);
                if(fs.existsSync(oldImg)){
                    fs.unlinkSync(oldImg)
                }
            }
            user.profileImage = `/uploads/${req.file.filename}`
        }
        
        const updatedUser = await user.save();
        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });
    }
)

module.exports = {getAllDoctors,getAllPatients,updateDarkMode,getCurrentUser,updateUserProfile}
