const express = require("express");
const {
  createForm,
  getForms,
  getFormById,
  updateForm,
  deleteForm,
  openForm,
  getDashboardStats,
  downloadBackup
} = require("../controllers/formController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes — anyone can browse
router.get("/", getForms);
router.get("/dashboard/stats", getDashboardStats);
router.get("/backup/json", downloadBackup);
router.get("/:id/open", openForm);
router.get("/:id", getFormById);

// Protected routes — admin only
router.post("/", protect, authorize("admin"), createForm);
router.put("/:id", protect, authorize("admin"), updateForm);
router.delete("/:id", protect, authorize("admin"), deleteForm);

module.exports = router;