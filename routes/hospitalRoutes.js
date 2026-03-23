const express = require("express");
const { registerHospital, loginHospital, updateHospitalStatus, getHospitals } = require("../controllers/hospitalController");
const validateToken = require("../middleware/validateTokenHandler");
const router = express.Router();

router.post("/register",registerHospital)
router.post("/login",loginHospital)
router.patch("/:id/approval-status",validateToken,updateHospitalStatus)
router.get("/",validateToken,getHospitals)

module.exports = router