import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    websiteUrl: {
      type: String,
      required: [true, 'Website URL is required'],
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    testCaseCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'completed'],
      default: 'active',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    // For future: Google Sheets integration
    googleSheetId: {
      type: String,
      default: null,
    },
    googleSheetUrl: {
      type: String,
      default: null,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    syncStatus: {
      type: String,
      enum: ['idle', 'syncing', 'success', 'error'],
      default: 'idle',
    },
    syncError: {
      type: String,
      default: null,
    },
    // AI generation context — compact summary of past generations
    aiContext: {
      type: String,
      default: null,
      maxlength: 3000,
    },
    // Sequential test case ID counter (TC-001, TC-002, ...)
    testCaseIdCounter: {
      type: Number,
      default: 0,
    },
    // Project documents (SRS, BRS, requirement analysis PDFs)
    documents: [{
      filename: { type: String, required: true },
      originalName: { type: String, required: true },
      path: { type: String, required: true },
      size: { type: Number, required: true },
      uploadedAt: { type: Date, default: Date.now },
    }],
    // Custom test case template structure (for Sprint 3)
    testCaseTemplate: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
projectSchema.index({ user: 1, createdAt: -1 });
projectSchema.index({ status: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
