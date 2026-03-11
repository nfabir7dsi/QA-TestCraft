import TestCase from '../models/TestCase.js';
import Project from '../models/Project.js';
import { generateTestCases } from '../services/aiServiceFactory.js';
import { scrapePageContent } from '../services/pageScraper.js';
import { extractTextFromPdf } from '../services/pdfExtractor.js';
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

    const { projectId, description, options, path, testData } = value;

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

    // Extract document content or fallback to page scraping
    let documentContent = null;
    let pageContent = null;
    const fullUrl = path ? `${project.websiteUrl.replace(/\/$/, '')}${path}` : project.websiteUrl;

    if (project.documents?.length > 0) {
      // Extract text from uploaded PDFs
      const texts = [];
      for (const doc of project.documents) {
        try {
          const text = await extractTextFromPdf(doc.path);
          texts.push(`--- ${doc.originalName} ---\n${text}`);
        } catch {
          // Skip failed extractions
        }
      }
      if (texts.length > 0) {
        documentContent = texts.join('\n\n').slice(0, 3000);
      }
    }

    // Fallback: scrape page only if no documents attached
    if (!documentContent) {
      try {
        pageContent = await scrapePageContent(fullUrl);
      } catch {
        // Scraping is optional — continue without it
      }
    }

    // Calculate next test case ID
    const nextIdNum = (project.testCaseIdCounter || 0) + 1;
    const nextTestCaseId = `TC-${String(nextIdNum).padStart(3, '0')}`;

    const testCases = await generateTestCases({
      websiteUrl: project.websiteUrl,
      description,
      options,
      templateFields: project.testCaseTemplate.fields,
      path: path || '',
      testData: testData || '',
      projectContext: project.aiContext || '',
      pageContent,
      documentContent,
      nextTestCaseId,
    });

    res.json({ testCases, count: testCases.length, nextIdStart: nextTestCaseId });
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

    // Assign sequential test case IDs
    const startCounter = project.testCaseIdCounter || 0;
    const docs = testCases.map((tc, i) => ({
      project: projectId,
      user: req.user._id,
      testCaseId: `TC-${String(startCounter + i + 1).padStart(3, '0')}`,
      data: tc.data,
      status: tc.status || 'draft',
      generatedBy: tc.generatedBy || 'ai',
      version: 1,
      history: [],
    }));

    const saved = await TestCase.insertMany(docs);

    // Update project counter and test case count
    const endCounter = startCounter + saved.length;
    project.testCaseCount += saved.length;
    project.testCaseIdCounter = endCounter;

    // Build and append context summary
    const startId = `TC-${String(startCounter + 1).padStart(3, '0')}`;
    const endId = `TC-${String(endCounter).padStart(3, '0')}`;
    const contextEntry = `[${new Date().toISOString().slice(0, 10)}] Generated ${saved.length} test cases (${startId}-${endId}).`;

    const existingContext = project.aiContext || '';
    const newContext = existingContext
      ? `${existingContext}\n${contextEntry}`
      : contextEntry;
    // Trim to 3000 chars, keeping most recent entries
    project.aiContext = newContext.length > 3000
      ? '...' + newContext.slice(newContext.length - 2997)
      : newContext;

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

    // Assign next sequential ID
    const project = await Project.findById(testCase.project);
    const nextCounter = (project.testCaseIdCounter || 0) + 1;
    const newTestCaseId = `TC-${String(nextCounter).padStart(3, '0')}`;

    const duplicate = await TestCase.create({
      project: testCase.project,
      user: req.user._id,
      testCaseId: newTestCaseId,
      data: testCase.data,
      status: 'draft',
      generatedBy: 'manual',
      tags: testCase.tags || [],
      version: 1,
      history: [],
    });

    project.testCaseCount += 1;
    project.testCaseIdCounter = nextCounter;
    await project.save();

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

// @desc    Get project AI context and last test case ID
// @route   GET /api/testcases/context/:projectId
// @access  Private
export const getProjectContext = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project || project.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const counter = project.testCaseIdCounter || 0;
    const lastTestCaseId = counter > 0
      ? `TC-${String(counter).padStart(3, '0')}`
      : null;

    res.json({
      context: project.aiContext || null,
      lastTestCaseId,
      testCaseIdCounter: counter,
    });
  } catch (error) {
    console.error('Get project context error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error fetching project context' });
  }
};
