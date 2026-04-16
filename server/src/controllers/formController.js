const Form = require("../models/Form");

// Create
exports.createForm = async (req, res) => {
  try {
    const form = await Form.create(req.body);
    res.status(201).json(form);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Read all + search
exports.getForms = async (req, res) => {
  try {
    const { q, office, category } = req.query;
    const filter = {};

    if (office) filter.office = office;
    if (category) filter.category = category;

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $elemMatch: { $regex: q, $options: "i" } } }
      ];
    }

    const forms = await Form.find(filter).sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read one
exports.getFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update
exports.updateForm = async (req, res) => {
  try {
    const form = await Form.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!form) return res.status(404).json({ message: "Form not found" });
    res.json(form);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete
exports.deleteForm = async (req, res) => {
  try {
    const form = await Form.findByIdAndDelete(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    res.json({ message: "Form deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Dashboard
exports.getDashboardStats = async (_req, res) => {
  try {
    const totalForms = await Form.countDocuments();

    const byCategory = await Form.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { _id: 0, category: "$_id", count: 1 } }
    ]);

    const topDownloaded = await Form.find()
      .sort({ downloadCount: -1 })
      .limit(5)
      .select("title downloadCount");

    res.json({ totalForms, byCategory, topDownloaded });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// JSON backup
exports.downloadBackup = async (_req, res) => {
  try {
    const forms = await Form.find().lean();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=forms-backup.json");
    res.status(200).send(JSON.stringify(forms, null, 2));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};