import crypto from 'crypto';
import User from '../models/User.js';
import Project from '../models/Project.js';
import TestCase from '../models/TestCase.js';
import { encrypt } from '../utils/encryption.js';
import { connectSheetSchema } from '../validators/googleSheetsValidator.js';
import {
  generateAuthUrl,
  getTokensFromCode,
  getAuthenticatedClient,
  createSheet,
  writeTestCasesToSheet,
  validateSheetAccess,
} from '../services/googleSheetsService.js';

function signState(payload) {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(payload)
    .digest('hex');
}

// @desc    Get Google OAuth URL
// @route   GET /api/google-sheets/auth-url
// @access  Private
export const getAuthUrl = async (req, res) => {
  try {
    const returnUrl = req.query.returnUrl || '/projects';
    const payload = JSON.stringify({ userId: req.user._id, returnUrl });
    const signature = signState(payload);
    const state = Buffer.from(JSON.stringify({ payload, signature })).toString('base64');

    const authUrl = generateAuthUrl(state);
    res.json({ authUrl });
  } catch (error) {
    console.error('Get auth URL error:', error);
    res.status(500).json({ message: 'Failed to generate Google auth URL' });
  }
};

// @desc    Handle Google OAuth callback
// @route   GET /api/google-sheets/callback
// @access  Public (redirected from Google)
export const handleCallback = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(`${clientUrl}/projects?googleAuth=error&message=${encodeURIComponent(oauthError)}`);
    }

    if (!code || !state) {
      return res.redirect(`${clientUrl}/projects?googleAuth=error&message=${encodeURIComponent('Missing authorization code')}`);
    }

    // Verify state signature
    const { payload, signature } = JSON.parse(Buffer.from(state, 'base64').toString());
    const expectedSig = signState(payload);
    if (signature !== expectedSig) {
      return res.redirect(`${clientUrl}/projects?googleAuth=error&message=${encodeURIComponent('Invalid state parameter')}`);
    }

    const { userId, returnUrl } = JSON.parse(payload);

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Encrypt and store tokens
    const encryptedTokens = encrypt(JSON.stringify(tokens));
    await User.findByIdAndUpdate(userId, { googleTokens: encryptedTokens });

    res.redirect(`${clientUrl}${returnUrl}?googleAuth=success`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${clientUrl}/projects?googleAuth=error&message=${encodeURIComponent('Authentication failed')}`);
  }
};

// @desc    Check if user has Google tokens connected
// @route   GET /api/google-sheets/status
// @access  Private
export const getConnectionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+googleTokens');
    res.json({ connected: !!user.googleTokens });
  } catch (error) {
    console.error('Get connection status error:', error);
    res.status(500).json({ message: 'Failed to check Google connection status' });
  }
};

// @desc    Create a new Google Sheet for a project
// @route   POST /api/google-sheets/:projectId/create
// @access  Private
export const createSheetForProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project || project.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user._id).select('+googleTokens');
    if (!user.googleTokens) {
      return res.status(400).json({ message: 'Google account not connected. Please authenticate first.' });
    }

    const auth = await getAuthenticatedClient(user.googleTokens, user._id);
    const templateFields = project.testCaseTemplate?.fields || [];

    // Create the sheet
    const { spreadsheetId, spreadsheetUrl } = await createSheet(
      auth,
      `QA-TestCraft: ${project.name}`,
      templateFields
    );

    // Update project with sheet info
    project.googleSheetId = spreadsheetId;
    project.googleSheetUrl = spreadsheetUrl;

    // Sync existing test cases if any
    const testCases = await TestCase.find({ project: project._id }).sort('-createdAt');
    if (testCases.length > 0) {
      await writeTestCasesToSheet(auth, spreadsheetId, testCases, templateFields);
    }

    project.lastSyncedAt = new Date();
    project.syncStatus = 'success';
    project.syncError = null;
    await project.save();

    res.status(201).json({
      message: 'Google Sheet created and synced',
      googleSheetId: project.googleSheetId,
      googleSheetUrl: project.googleSheetUrl,
      lastSyncedAt: project.lastSyncedAt,
      rowsSynced: testCases.length,
    });
  } catch (error) {
    console.error('Create sheet error:', error);
    if (error.message?.includes('invalid_grant') || error.message?.includes('Token has been expired')) {
      return res.status(401).json({ message: 'Google authentication expired. Please reconnect your Google account.' });
    }
    res.status(500).json({ message: 'Failed to create Google Sheet' });
  }
};

// @desc    Connect an existing Google Sheet to a project
// @route   POST /api/google-sheets/:projectId/connect
// @access  Private
export const connectExistingSheet = async (req, res) => {
  try {
    const { error, value } = connectSheetSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const project = await Project.findById(req.params.projectId);
    if (!project || project.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user._id).select('+googleTokens');
    if (!user.googleTokens) {
      return res.status(400).json({ message: 'Google account not connected. Please authenticate first.' });
    }

    // Extract spreadsheet ID from URL if URL provided
    let spreadsheetId = value.sheetId;
    if (value.sheetUrl) {
      const match = value.sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        return res.status(400).json({ message: 'Invalid Google Sheets URL' });
      }
      spreadsheetId = match[1];
    }

    const auth = await getAuthenticatedClient(user.googleTokens, user._id);

    // Validate access
    const validation = await validateSheetAccess(auth, spreadsheetId);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    project.googleSheetId = spreadsheetId;
    project.googleSheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    project.syncStatus = 'idle';
    project.syncError = null;
    await project.save();

    res.json({
      message: `Connected to "${validation.title}"`,
      googleSheetId: project.googleSheetId,
      googleSheetUrl: project.googleSheetUrl,
    });
  } catch (error) {
    console.error('Connect sheet error:', error);
    if (error.message?.includes('invalid_grant') || error.message?.includes('Token has been expired')) {
      return res.status(401).json({ message: 'Google authentication expired. Please reconnect your Google account.' });
    }
    res.status(500).json({ message: 'Failed to connect Google Sheet' });
  }
};

// @desc    Sync test cases to Google Sheet
// @route   POST /api/google-sheets/:projectId/sync
// @access  Private
export const syncToSheet = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project || project.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.googleSheetId) {
      return res.status(400).json({ message: 'No Google Sheet connected to this project' });
    }

    const user = await User.findById(req.user._id).select('+googleTokens');
    if (!user.googleTokens) {
      return res.status(400).json({ message: 'Google account not connected' });
    }

    // Mark as syncing
    project.syncStatus = 'syncing';
    await project.save();

    const auth = await getAuthenticatedClient(user.googleTokens, user._id);
    const templateFields = project.testCaseTemplate?.fields || [];
    const testCases = await TestCase.find({ project: project._id }).sort('-createdAt');

    const rowsSynced = await writeTestCasesToSheet(
      auth,
      project.googleSheetId,
      testCases,
      templateFields
    );

    project.syncStatus = 'success';
    project.lastSyncedAt = new Date();
    project.syncError = null;
    await project.save();

    res.json({
      message: 'Sync complete',
      rowsSynced,
      lastSyncedAt: project.lastSyncedAt,
    });
  } catch (error) {
    console.error('Sync error:', error);

    // Update sync status to error
    try {
      await Project.findByIdAndUpdate(req.params.projectId, {
        syncStatus: 'error',
        syncError: error.message || 'Sync failed',
      });
    } catch (updateErr) {
      console.error('Failed to update sync status:', updateErr);
    }

    if (error.message?.includes('invalid_grant') || error.message?.includes('Token has been expired')) {
      return res.status(401).json({ message: 'Google authentication expired. Please reconnect your Google account.' });
    }
    res.status(500).json({ message: 'Failed to sync test cases to Google Sheet' });
  }
};

// @desc    Disconnect Google Sheet from project
// @route   POST /api/google-sheets/:projectId/disconnect
// @access  Private
export const disconnectSheet = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project || project.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.googleSheetId = null;
    project.googleSheetUrl = null;
    project.lastSyncedAt = null;
    project.syncStatus = 'idle';
    project.syncError = null;
    await project.save();

    res.json({ message: 'Google Sheet disconnected' });
  } catch (error) {
    console.error('Disconnect sheet error:', error);
    res.status(500).json({ message: 'Failed to disconnect Google Sheet' });
  }
};
