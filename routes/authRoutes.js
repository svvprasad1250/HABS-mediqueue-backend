const express = require("express");
const upload = require("../middleware/upload");
const { registerUser, loginUser, refreshAccessToken } = require("../controllers/authControllers");

const router = express.Router();

router.post("/register",upload.single("image"),registerUser)

router.post("/login",loginUser)

router.post("/refresh",refreshAccessToken)

module.exports = router;