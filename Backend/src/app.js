const express = require("express");

const app = express();

app.use(express.json());
/* Require all the routes here*/ 
const authRouter = require("./routes/auth.routes");

/* Using all the routes here */
app.use("/api/auth",authRouter);

module.exports = app;