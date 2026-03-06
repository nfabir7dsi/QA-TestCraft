import { google } from 'googleapis';
import { encrypt, decrypt } from '../utils/encryption.js';
import User from '../models/User.js';

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function generateAuthUrl(state) {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
    state,
  });
}

export async function getTokensFromCode(code) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

/**
 * Creates an authenticated OAuth2 client from encrypted tokens.
 * Auto-refreshes expired tokens and persists the updated tokens.
 */
export async function getAuthenticatedClient(encryptedTokens, userId) {
  const tokensJson = decrypt(encryptedTokens);
  const tokens = JSON.parse(tokensJson);

  const client = getOAuth2Client();
  client.setCredentials(tokens);

  // Check if token is expired or about to expire (within 5 minutes)
  const now = Date.now();
  if (tokens.expiry_date && tokens.expiry_date - now < 5 * 60 * 1000) {
    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);

    // Persist refreshed tokens
    const updatedEncrypted = encrypt(JSON.stringify(credentials));
    await User.findByIdAndUpdate(userId, { googleTokens: updatedEncrypted });
  }

  return client;
}

/**
 * Creates a new Google Sheet with headers from template fields.
 */
export async function createSheet(auth, title, templateFields) {
  const sheets = google.sheets({ version: 'v4', auth });

  // Create the spreadsheet
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [
        {
          properties: {
            title: 'Test Cases',
            gridProperties: { frozenRowCount: 1 },
          },
        },
      ],
    },
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId;
  const spreadsheetUrl = spreadsheet.data.spreadsheetUrl;
  const sheetId = spreadsheet.data.sheets[0].properties.sheetId;

  // Build header row
  const headers = getHeadersFromTemplate(templateFields);

  // Write headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Test Cases!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: [headers],
    },
  });

  // Format header row (bold + background color)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)',
          },
        },
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: headers.length,
            },
          },
        },
      ],
    },
  });

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Writes test cases to a Google Sheet (full replacement from row 2 onward).
 */
export async function writeTestCasesToSheet(auth, spreadsheetId, testCases, templateFields) {
  const sheets = google.sheets({ version: 'v4', auth });
  const headers = getHeadersFromTemplate(templateFields);
  const fieldNames = getFieldNamesFromTemplate(templateFields);

  // Clear existing data (rows 2+)
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'Test Cases!A2:ZZ',
  });

  if (testCases.length === 0) {
    return 0;
  }

  // Map test cases to rows (must match header order: #, ...fields, Status, Tags)
  const rows = testCases.map((tc, index) => {
    const fieldValues = fieldNames.map((fieldName) => {
      const value = tc.data?.[fieldName];
      if (value === null || value === undefined) return '';
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
    return [
      index + 1,                                    // #
      ...fieldValues,                               // template fields
      tc.status || '',                              // Status
      (tc.tags || []).join(', '),                    // Tags
    ];
  });

  // Write all rows
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Test Cases!A2',
    valueInputOption: 'RAW',
    requestBody: {
      values: rows,
    },
  });

  return rows.length;
}

/**
 * Validates that the user has write access to a Google Sheet.
 */
export async function validateSheetAccess(auth, spreadsheetId) {
  const sheets = google.sheets({ version: 'v4', auth });
  try {
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    return { valid: true, title: response.data.properties.title };
  } catch (error) {
    if (error.code === 403) {
      return { valid: false, error: 'You do not have access to this spreadsheet' };
    }
    if (error.code === 404) {
      return { valid: false, error: 'Spreadsheet not found' };
    }
    return { valid: false, error: 'Unable to access spreadsheet' };
  }
}

// --- Helpers ---

function getHeadersFromTemplate(templateFields) {
  if (templateFields && templateFields.length > 0) {
    return ['#', ...templateFields.map((f) => f.label || f.name), 'Status', 'Tags'];
  }
  return ['#', 'Test Case ID', 'Title', 'Description', 'Steps', 'Expected Result', 'Status', 'Tags'];
}

function getFieldNamesFromTemplate(templateFields) {
  if (templateFields && templateFields.length > 0) {
    return templateFields.map((f) => f.name);
  }
  return ['testCaseId', 'title', 'description', 'steps', 'expectedResult'];
}
