import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get default template library
// @route   GET /api/templates/defaults
// @access  Public
export const getDefaultTemplates = async (req, res) => {
  try {
    // Read the default templates JSON file
    const templatesPath = path.join(__dirname, '../data/defaultTemplates.json');
    const templatesData = await fs.readFile(templatesPath, 'utf-8');
    const templates = JSON.parse(templatesData);

    res.json(templates);
  } catch (error) {
    console.error('Get default templates error:', error);

    // Check if it's a file not found error
    if (error.code === 'ENOENT') {
      return res.status(500).json({
        message: 'Default templates file not found. Please contact support.',
      });
    }

    res.status(500).json({
      message: 'Failed to load default templates',
    });
  }
};