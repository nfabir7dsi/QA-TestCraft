import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

/**
 * Extracts text content from a PDF file.
 * @param {string} filePath - Absolute path to the PDF file
 * @returns {Promise<string>} Extracted text content
 */
export async function extractTextFromPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);
  return data.text;
}
