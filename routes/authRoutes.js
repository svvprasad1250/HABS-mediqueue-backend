const express = require("express");
const upload = require("../middleware/upload");
const { registerUser, loginUser, refreshAccessToken, forgotPassword, resetPassword, verifyOTP } = require("../controllers/authControllers");

const router = express.Router();

router.post("/register",upload.single("image"),registerUser)

router.post("/login",loginUser)

router.post("/refresh",refreshAccessToken)

router.post("/forgot-password",forgotPassword)

router.post("/reset-password",resetPassword)

router.post("/verify-otp",verifyOTP)

module.exports = router;