import TestCase from '../models/TestCase.js';
import Project from '../models/Project.js';
import { generateTestCases } from '../services/aiServiceFactory.js';
import {
  generateSchema,
  saveTestCasesSchema,
  updateTestCaseSchema,
  bulkDeleteSchema,
  bulkStatusSchema,
} from '../validators/testCaseValidator.js';

// @desc    Generate test cases using AI
// @route   POST /api/testcases/generate
// @access  Private
export const generateTestCasesHandler = async (req, res) => {
  try {
    const { error, value } = generateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { projectId, description, options } = value;

    const project = await Project.findById(projectId);
    if (!project || project.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.testCaseTemplate || !project.testCaseTemplate.fields?.length) {
      return res.status(400).json({
        message:
          'Project must have a template defined before generating test cases. Please create a template first.',
      });
    }

    const testCases = await generateTestCases({
      websiteUrl: project.websiteUrl,
      description,
      options,
      templateFields: project.testCaseTemplate.fields,
    });

    res.json({ testCases, count: testCases.length });
  } catch (error) {
    console.error('Generate test cases error:', error);

    if (error.status === 429) {
      return res
        .status(429)
        .json({ message: 'AI rate limit reached. Please try again in a moment.' });
    }
    if (error.status === 401) {
      return res
        .status(500)
        .json({ message: 'AI service authentication error. Please contact support.' });
    }
    if (error.message?.includes('parse')) {
      return res
        .status(502)
        .json({ message: 'AI returned an unexpected response. Please try again.' });
    }

    res.status(500).json({ message: 'Failed to generate test cases. Please try again.' });
  }
};

// @desc    Save generated test cases
// @route   POST /api/testcases
// @access  Private
export const saveTestCases = async (req, res) => {
  try {
    const { error, value } = saveTestCasesSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { projectId, testCases } = value;

    const project = await Project.findById(projectId);
    if (!project || project.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const docs = testCases.map((tc) => ({
      project: projectId,
      user: req.user._id,
      data: tc.data,
      status: tc.status || 'draft',
      generatedBy: tc.generatedBy || 'ai',
      version: 1,
      history: [],
    }));

    const saved = await TestCase.insertMany(docs);

    project.testCaseCount += saved.length;
    await project.save();

    res.status(201).json({ testCases: saved, count: saved.length });
  } catch (error) {
    console.error('Save test cases error:', error);
    res.status(500).json({ message: 'Server error saving test cases' });
  }
};

// @desc    Get test cases for a project
// @route   GET /api/testcases?projectId=xxx
// @access  Private
export const getTestCases = async (req, res) => {
  try {
    const { projectId, status, page = 1, limit = 50 } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: 'projectId query parameter is required' });
    }

    const project = await Project.findById(projectId);
    if (!project || project.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const query = { project: projectId, user: req.user._id };
    if (status) query.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const testCases = await TestCase.find(query)
      .sort('-createdAt')
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await TestCase.countDocuments(query);

    res.json({
      testCases,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get test cases error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error fetching test cases' });
  }
};

// @desc    Update a test case
// @route   PUT /api/testcases/:id
// @access  Private
export const updateTestCase = async (req, res) => {
  try {
    const { error, value } = updateTestCaseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const testCase = await TestCase.findById(req.params.id);
    if (!testCase || testCase.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Test case not found' });
    }

    if (value.data) {
      testCase.history.push({
        data: testCase.data,
        changedAt: new Date(),
        version: testCase.version,
      });
      testCase.data = value.data;
      testCase.version += 1;
    }

    if (value.status) {
      testCase.status = value.status;
    }

    if (value.tags !== undefined) {
      testCase.tags = value.tags;
    }

    const updated = await testCase.save();
    res.json(updated);
  } catch (error) {
    console.error('Update test case error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Test case not found' });
    }
    res.status(500).json({ message: 'Server error updating test case' });
  }
};

// @desc    Delete a test case
// @route   DELETE /api/testcases/:id
// @access  Private
export const deleteTestCase = async (req, res) => {
  try {
    const testCase = await TestCase.findById(req.params.id);
    if (!testCase || testCase.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Test case not found' });
    }

    const projectId = testCase.project;
    await testCase.deleteOne();

    await Project.findByIdAndUpdate(projectId, { $inc: { testCaseCount: -1 } });

    res.json({ message: 'Test case deleted successfully' });
  } catch (error) {
    console.error('Delete test case error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Test case not found' });
    }
    res.status(500).json({ message: 'Server error deleting test case' });
  }
};

// @desc    Duplicate a test case
// @route   POST /api/testcases/:id/duplicate
// @access  Private
export const duplicateTestCase = async (req, res) => {
  try {
    const testCase = await TestCase.findById(req.params.id);
    if (!testCase || testCase.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Test case not found' });
    }

    const duplicate = await TestCase.create({
      project: testCase.project,
      user: req.user._id,
      data: testCase.data,
      status: 'draft',
      generatedBy: 'manual',
      tags: testCase.tags || [],
      version: 1,
      history: [],
    });

    await Project.findByIdAndUpdate(testCase.project, { $inc: { testCaseCount: 1 } });

    res.status(201).json(duplicate);
  } catch (error) {
    console.error('Duplicate test case error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Test case not found' });
    }
    res.status(500).json({ message: 'Server error duplicating test case' });
  }
};

// @desc    Bulk delete test cases
// @route   POST /api/testcases/bulk-delete
// @access  Private
export const bulkDeleteTestCases = async (req, res) => {
  try {
    const { error, value } = bulkDeleteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { ids } = value;

    const testCases = await TestCase.find({
      _id: { $in: ids },
      user: req.user._id,
    });

    if (testCases.length === 0) {
      return res.status(404).json({ message: 'No matching test cases found' });
    }

    // Group by project to decrement counts
    const projectCounts = {};
    for (const tc of testCases) {
      const pid = tc.project.toString();
      projectCounts[pid] = (projectCounts[pid] || 0) + 1;
    }

    await TestCase.deleteMany({
      _id: { $in: testCases.map((tc) => tc._id) },
    });

    // Decrement counts per project
    for (const [projectId, count] of Object.entries(projectCounts)) {
      await Project.findByIdAndUpdate(projectId, { $inc: { testCaseCount: -count } });
    }

    res.json({ message: 'Test cases deleted', deletedCount: testCases.length });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ message: 'Server error deleting test cases' });
  }
};

// @desc    Bulk update test case status
// @route   POST /api/testcases/bulk-status
// @access  Private
export const bulkUpdateStatus = async (req, res) => {
  try {
    const { error, value } = bulkStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { ids, status } = value;

    const result = await TestCase.updateMany(
      { _id: { $in: ids }, user: req.user._id },
      { $set: { status } }
    );

    res.json({ message: 'Status updated', modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Bulk status update error:', error);
    res.status(500).json({ message: 'Server error updating test cases' });
  }
};
