const express = require("express");
const {
  createForm,
  getForms,
  getFormById,
  updateForm,
  deleteForm,
  getDashboardStats,
  downloadBackup
} = require("../controllers/formController");

const router = express.Router();

router.get("/", getForms);
router.get("/dashboard/stats", getDashboardStats);
router.get("/backup/json", downloadBackup);
router.get("/:id", getFormById);
router.post("/", createForm);
router.put("/:id", updateForm);
router.delete("/:id", deleteForm);

module.exports = router;