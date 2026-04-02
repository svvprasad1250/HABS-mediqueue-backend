const express = require("express");
const connectDB = require("./config/dbConnection");
const dotenv = require("dotenv").config();

connectDB()
const app = express();
const errorHandler = require("./middleware/errorHandler");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const cors = require("cors");

app.use("/api-docs",swaggerUi.serve,swaggerUi.setup(swaggerDocument));
const port = process.env.PORT || 4000;

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/appointments",require("./routes/appointmentRoutes"));
app.use("/api/auth",require("./routes/authRoutes"));
app.use("/api/users",require("./routes/userRoutes"));
app.use("/api/hospitals",require("./routes/hospitalRoutes"))
app.use(errorHandler);

app.listen(port,()=>{
    console.log(`server is connected at ${port}`)
})