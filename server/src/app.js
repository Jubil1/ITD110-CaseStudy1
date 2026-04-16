const express = require("express");
const cors = require("cors");
const formRoutes = require("./routes/formRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "ITD110 Case Study API running" });
});

app.use("/api/forms", formRoutes);

module.exports = app;