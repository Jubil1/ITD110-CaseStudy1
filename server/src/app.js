const express = require("express");
const cors = require("cors");
const path = require("path");
const formRoutes = require("./routes/formRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/forms", express.static(path.join(__dirname, "../public/forms")));

app.get("/", (_req, res) => {
  res.json({ message: "ITD110 Case Study API running" });
});

app.use("/api/forms", formRoutes);

module.exports = app;