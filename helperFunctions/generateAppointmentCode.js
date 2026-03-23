const Appointment = require("../models/appointmentModel");

const generateAppointmentCode = async()=>{
    const lastAppointment = await Appointment
    .findOne()
    .sort({createdAt:-1})
    .select("appointmentCode")

    let newNumber =1;
    if(lastAppointment){
        const lastCode = lastAppointment.appointmentCode;
        const lastNumber = lastCode ? parseInt(lastCode.split("-")[1]) : 0;
        newNumber = lastNumber+1
    }

    return `MED-${String(newNumber).padStart(4,"0")}`;
}

module.exports = {generateAppointmentCode}