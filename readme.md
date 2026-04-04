const Appointment = require("../models/appointmentModel");

const getAllPatients = asyncHandler(async (req, res) => {

    // 🔥 ADMIN → all patients
    if (req.user.role === "admin") {
        const patients = await User.find({ role: "patient" })
            .select("-password")
            .select("-refreshToken");

        return res.status(200).json(patients);
    }

    // 🔥 DOCTOR → only assigned patients
    if (req.user.role === "doctor") {

        const appointments = await Appointment.find({
            doctor: req.user.id
        }).populate("patient");

        // extract unique patients
        const uniquePatientsMap = new Map();

        appointments.forEach((appt) => {
            if (appt.patient) {
                uniquePatientsMap.set(
                    appt.patient._id.toString(),
                    appt.patient
                );
            }
        });

        const patients = Array.from(uniquePatientsMap.values());

        return res.status(200).json(patients);
    }

    // ❌ Others not allowed
    res.status(403);
    throw new Error("Not authorized to view patients");
});