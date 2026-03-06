import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
    },
    generatedBy: {
      type: String,
      enum: ['ai', 'manual'],
      default: 'ai',
    },
    version: {
      type: Number,
      default: 1,
    },
    tags: {
      type: [String],
      default: [],
    },
    history: [
      {
        data: mongoose.Schema.Types.Mixed,
        changedAt: { type: Date, default: Date.now },
        version: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

testCaseSchema.index({ project: 1, createdAt: -1 });
testCaseSchema.index({ status: 1 });
testCaseSchema.index({ tags: 1 });

const TestCase = mongoose.model('TestCase', testCaseSchema);
export default TestCase;
