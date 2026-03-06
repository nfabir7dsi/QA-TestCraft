import Project from '../models/Project.js';
import Joi from 'joi';
import {
  updateTemplateSchema,
  validateFieldIdUniqueness,
  validateFieldNameUniqueness,
} from '../validators/templateValidator.js';

// Validation schemas
const createProjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).allow('', null).optional(),
  websiteUrl: Joi.string().uri().required(),
  tags: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid('active', 'archived', 'completed').optional(),
});

const updateProjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).allow('', null).optional(),
  websiteUrl: Joi.string().uri().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid('active', 'archived', 'completed').optional(),
});

// @desc    Get all projects for logged-in user
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  try {
    const { status, search, sort = '-createdAt', limit = 50, page = 1 } = req.query;

    // Build query
    const query = { user: req.user._id };

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { websiteUrl: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query with pagination
    const projects = await Project.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get total count for pagination
    const total = await Project.countDocuments(query);

    res.json({
      projects,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Make sure user owns this project
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error fetching project' });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res) => {
  try {
    // Validate input
    const { error } = createProjectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, description, websiteUrl, tags, status } = req.body;

    // Create project
    const project = await Project.create({
      name,
      description,
      websiteUrl,
      tags,
      status: status || 'active',
      user: req.user._id,
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error creating project' });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
export const updateProject = async (req, res) => {
  try {
    // Validate input
    const { error } = updateProjectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Make sure user owns this project
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    // Update fields
    const { name, description, websiteUrl, tags, status } = req.body;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (websiteUrl) project.websiteUrl = websiteUrl;
    if (tags) project.tags = tags;
    if (status) project.status = status;

    const updatedProject = await project.save();

    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error updating project' });
  }
};

// @desc    Update project template
// @route   PUT /api/projects/:id/template
// @access  Private
export const updateProjectTemplate = async (req, res) => {
  try {
    // Validate template structure
    const { error } = updateTemplateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Find project
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check ownership
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this project template' });
    }

    // Validate field ID uniqueness
    const idCheck = validateFieldIdUniqueness(req.body.testCaseTemplate.fields);
    if (!idCheck.valid) {
      return res.status(400).json({ message: idCheck.error });
    }

    // Validate field name uniqueness
    const nameCheck = validateFieldNameUniqueness(req.body.testCaseTemplate.fields);
    if (!nameCheck.valid) {
      return res.status(400).json({ message: nameCheck.error });
    }

    // Update template
    project.testCaseTemplate = {
      ...req.body.testCaseTemplate,
      updatedAt: new Date(),
    };

    const updatedProject = await project.save();

    res.json(updatedProject);
  } catch (error) {
    console.error('Update template error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error updating template' });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Make sure user owns this project
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    await project.deleteOne();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error deleting project' });
  }
};

// @desc    Get project statistics
// @route   GET /api/projects/stats
// @access  Private
export const getProjectStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Project.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalTestCases: { $sum: '$testCaseCount' },
        },
      },
    ]);

    const totalProjects = await Project.countDocuments({ user: userId });

    res.json({
      totalProjects,
      byStatus: stats,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
};
