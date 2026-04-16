const mongoose = require("mongoose");

const formSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    office: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    tags: [{ type: String, trim: true }],
    fileUrl: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    downloadCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Form", formSchema);