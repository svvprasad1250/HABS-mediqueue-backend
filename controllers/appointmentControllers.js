
const Appointment = require("../models/appointmentModel");
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const sendEmail = require("../utils/sendMail");
const {generateAppointmentCode} = require("../helperFunctions/generateAppointmentCode")

//@desc get all appointments
//@route GET /api/appointments
//@access private

const getAppointments = asyncHandler(async (req, res) => {
    let appointments;

    if(req.user.role === "doctor"){
        appointments = await Appointment
        .find({ doctor: req.user.id })
        .populate("patient", "name email phone");
    }
    else if(req.user.role === "admin"){
        appointments = await Appointment
        .find().populate("patient","name email phone").populate("doctor","name email department")
    }else{
        appointments = await Appointment
        .find({ bookedBy: req.user.id })
        .populate("doctor", "name email department");
    }

    res.status(200).json(appointments);

});

//@desc add appointments
//@route POST /api/appointments
//@access private

const createAppointment = asyncHandler(
    async(req,res)=>{
        const {patient,doctor,department,appointmentDate,timeSlot,reason} = req.body;
        if(!patient || !doctor || !department || !appointmentDate || !timeSlot || !reason){
            res.status(400);
            throw new Error("Fields are mandate")
        }
        const appointmentCode = await generateAppointmentCode();
        const appointment = await Appointment.create({
            appointmentCode,
            bookedBy: req.user.id,
            patient,
            doctor,
            department,
            appointmentDate,
            timeSlot,
            reason
        })
        const doctorDetails = await User.findById(doctor)
        try{
            await sendEmail(
            req.user.email,
            "Appointment Submitted - MediQueue",
            `
            <h2>Hello ${req.user.name}</h2>
            <p>Your appointment request has been submitted successfully.</p>
            <p><b>Patient:</b> ${patient.name}</p>
            <p> <b> Appointment Code: </b> ${appointmentCode} </p>
            <p><b>Department:</b> ${department}</p>
            <p><b>Date:</b> ${appointmentDate}</p>
            <p><b>Time:</b> ${timeSlot}</p>
            <p>Please wait for the doctor's confirmation.</p>
            <p>Thank you for choosing MediQueue.</p>
            `
        );
        await sendEmail(
            doctorDetails.email,
            "New Appointment Request - MediQueue",
            `
            <h2>Hello ${doctorDetails.name}</h2>
            <p>You have received a new appointment request.</p>
            <p> <b> Appointment Code: </b> ${appointmentCode} </p>
            <p><b>Patient:</b> ${patient.name}</p>
            <p><b>Booked By: </b> ${req.user.name}</p>
            <p><b>Department:</b> ${department}</p>
            <p><b>Date:</b> ${appointmentDate}</p>
            <p><b>Time:</b> ${timeSlot}</p>
            <p><b>Reason:</b> ${reason}</p>
            <p>Please login to MediQueue to confirm or manage the appointment.</p>
            `
        );
        }catch(err){
            console.log("email sent failed",err.message)
        }
        res.status(201).json(appointment)
    }
)

//@desc update Appointment Status by doctors
//@route PATCH /api/appointments
//@access private

const updateAppointmentStatus = asyncHandler(
    async(req,res)=>{
        const {status,doctorNote} = req.body;
        const {id} = req.params;

        if(req.user.role !== "doctor"){
            res.status(403);
            throw new Error("Only doctors can update appointment status")
        }

        const appointment = await Appointment.findById(id);
        if(!appointment){
            res.status(404);
            throw new Error("Appointment not found")
        }
        if(appointment.doctor.toString() !== req.user.id){
            res.status(403);
            throw new Error("You are not allow to update this appointment")
        }
        appointment.status = status;
        if(status === "cancelled"){
            if(!doctorNote){
                res.status(400);
                throw new Error("doctorNote required for cancelling the appointment")
            }
            appointment.doctorNote = doctorNote
        }
        const updatedAppointment = await appointment.save();

        const user = await User.findById(appointment.bookedBy);
        try {
            await sendEmail(
                user.email,
                "Appointment Status Update - MediQueue",
                `
                <h2>Hello ${user.name}</h2>
                <p> <b> Appointment Code: </b> ${appointment.appointmentCode} </p>
                <p>Your appointment status has been updated.</p>
                <p><b>Status:</b> ${status}</p>
                <p><b>Patient:</b> ${appointment.patient.name}</p>
                <p><b>Department:</b> ${appointment.department}</p>
                <p><b>Date:</b> ${appointment.appointmentDate}</p>
                <p><b>Time:</b> ${appointment.timeSlot}</p>
                ${status === "cancelled" ? `<p><b>Reason:</b> ${doctorNote}</p>` : ""}
                <p>Thank you for choosing MediQueue.</p>
                `
            );
        }catch(err){
            console.log("email fail sent status",err.message);
        }
        res.status(200).json(updatedAppointment)
    }
)

//@desc update Appointment timeSlot, appointmentDate by patient
//@route PATCH /api/appointments
//@access private

const rescheduleAppointment =  asyncHandler(
    async(req,res)=>{
        const {id} = req.params;
        const {appointmentDate,timeSlot} = req.body;

        const appointment = await Appointment.findById(id);

        if(!appointment){
            res.status(404);
            throw new Error("appointment not found")
        }
        if(appointment.bookedBy.toString() !== req.user.id){
            res.status(403);
            throw new Error("You are allowed to modify this appointment")
        }
        if(appointment.status !== "pending" && appointment.status !== "cancelled"){
            res.status(400);
            throw new Error("appointment be modifies when the status is pending")
        }

        appointment.appointmentDate = appointmentDate;
        appointment.timeSlot = timeSlot;
        appointment.status = "pending";
        appointment.doctorNote = null;

        const updatedAppointment = await appointment.save();
        const doctor = await User.findById(appointment.doctor);
        const user = await User.findById(appointment.bookedBy);

        try{
            await sendEmail(
                doctor.email,
                "Appointment Rescheduled - MediQueue",
                `
                <h2>Hello Dr. ${doctor.name}</h2>
                <p>The appointment has been rescheduled.</p>
                <p><b>Appointment Code:</b> ${appointment.appointmentCode}</p>
                <p><b>Patient:</b> ${appointment.patient.name}</p>
                <p><b>Booked By:</b> ${user.name}</p>
                <p><b>Date:</b> ${appointmentDate}</p>
                <p><b>Time:</b> ${timeSlot}</p>
                <p>Please review and confirm the appointment.</p>
                `
            )
            await sendEmail(
                user.email,
                "Appointment Rescheduled - MediQueue",
                `
                <h2>Hello ${user.name}</h2>
                <p>The appointment has been rescheduled.</p>
                <p><b>Appointment Code:</b> ${appointment.appointmentCode}</p>
                <p><b>Patient:</b> ${appointment.patient.name}</p>
                <p><b>Date:</b> ${appointmentDate}</p>
                <p><b>Time:</b> ${timeSlot}</p>
                <p>Please wait for the doctor's confirmation.</p>
                <p>Thank you for choosing MediQueue.</p>
                `
            );
        }catch (err) {
            console.log("Email failed:", err.message);
        }
        res.status(200).json(updatedAppointment);
    }
)

const deleteAppointment = asyncHandler(
    async(req,res)=>{
        const {reasonForCancellation} = req.body
        if(!mongoose.Types.ObjectId.isValid(req.params.id)){
            res.status(400);
            throw new Error("Invalid Id format")
        }
        const appointment = await Appointment.findById(req.params.id);

        if(!appointment){
            res.status(400);
            throw new Error("appointment not found");
        }
        if(req.user.role !== "admin" && appointment.patient.toString() !== req.user.id ){
            res.status(403);
            throw new Error("You are not allowed to delete this appointment");
        }

        await Appointment.findByIdAndDelete(req.params.id);
        const doctor = await User.findById(appointment.doctor);
        const patient = await User.findById(appointment.patient);
        try{
            await sendEmail(
                doctor.email,
                "Appointment Cancelled - MediQueue",
                `
                <h2>Hello Dr. ${doctor.name}</h2>
                <p>The appointment with patient <b>${patient.name}</b> has been cancelled.</p>
                <p><b>Appointment Code:</b> ${appointment.appointmentCode}</p>
                <p><b>Date:</b> ${appointment.appointmentDate}</p>
                <p><b>Time:</b> ${appointment.timeSlot}</p
                ${reasonForCancellation ? ` <p><b> Reason: </b> ${reasonForCancellation}</p> ` : ""}
                `
            )
            await sendEmail(
                patient.email,
                "Appointment Cancelled - MediQueue",
                `
                <h2>Hello ${patient.name}</h2>
                <p>Your appointment has been successfully cancelled.</p>
                <p><b>Appointment Code:</b> ${appointment.appointmentCode}</p>
                <p><b>Department:</b> ${appointment.department}</p>
                <p><b>Date:</b> ${appointment.appointmentDate}</p>
                <p><b>Time:</b> ${appointment.timeSlot}</p>
                ${reasonForCancellation ? `<p><b>Reason:</b> ${reasonForCancellation}</p>` : ""}
                <p>If you still need a consultation, you can book a new appointment.</p>
                <p>Thank you for using MediQueue.</p>
                `
            );
        }catch(err){
            console.log("Email sending failed:", err.message);
        }
        res.status(200).json({
            message:`contact deleted successfully!`,
            id:req.params.id
        })
    }
)

module.exports = {getAppointments,createAppointment,updateAppointmentStatus,rescheduleAppointment,deleteAppointment}