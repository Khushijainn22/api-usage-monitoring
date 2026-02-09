/**
 * Project = Folder container for an Admin's APIs.
 * Admin creates Projects → each Project contains multiple Services (APIs).
 * Enables folder-style visualization: Project (folder) → Services (APIs inside).
 */
const mongoose = require("mongoose");

const adminProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminProject", adminProjectSchema);
