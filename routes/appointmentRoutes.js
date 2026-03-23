const express = require("express");
const router = express.Router();

const {getAppointments,createAppointment, updateAppointmentStatus, rescheduleAppointment, deleteAppointment} = require("../controllers/appointmentControllers");
const validateToken = require("../middleware/validateTokenHandler");

router.use(validateToken);
router.route("/")
    .get(getAppointments)
    .post(createAppointment)

router.patch("/:id/status",updateAppointmentStatus)
router.patch("/:id/rescheduleAppointment",rescheduleAppointment)
router.delete("/:id",deleteAppointment)

module.exports = router