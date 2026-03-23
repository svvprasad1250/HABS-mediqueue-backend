const express = require("express");
const validateToken = require("../middleware/validateTokenHandler");
const {getAllDoctors, getAllPatients, updateDarkMode, getCurrentUser, updateUserProfile} = require("../controllers/userControllers")
const upload = require("../middleware/upload");
const router = express.Router();

router.use(validateToken)
router.get("/current-user",getCurrentUser)
router.get("/doctors",getAllDoctors);
router.get("/patients",getAllPatients);
router.patch("/darkmode",updateDarkMode);
router.patch("/profile-update",upload.single("image"),updateUserProfile);

module.exports = router
