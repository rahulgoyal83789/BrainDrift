const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
app.use(cookieParser());

app.use(express.json());
/* Require all the routes here*/ 
const authRouter = require("./routes/auth.routes");

/* Using all the routes here */
app.use("/api/auth",authRouter);

module.exports = app;