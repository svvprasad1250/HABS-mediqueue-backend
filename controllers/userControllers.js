
const asyncHandler=require("../middleware/asyncHandler");
const User = require("../models/userModel");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

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
                if (user.profileImage) {
                    try {
                        const parts = user.profileImage.split("/");
                        const fileName = parts[parts.length - 1];
                        const publicId = fileName.split(".")[0];

                        await cloudinary.uploader.destroy(`profile_images/${publicId}`);
                    } catch (err) {
                        console.log("Old image delete failed");
                    }
                }
            user.profileImage = result.secure_url;
        }
        
        const updatedUser = await user.save();
        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });
    }
)

module.exports = {getAllDoctors,getAllPatients,updateDarkMode,getCurrentUser,updateUserProfile}
