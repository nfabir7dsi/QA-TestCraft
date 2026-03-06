# Sprint 4: AI-Powered Test Case Generation - Implementation Summary

## Overview

Sprint 4 implements the core AI feature: generating structured test cases using Anthropic Claude API based on project templates, website URLs, and natural language descriptions. Users can preview, edit, and save AI-generated test cases.

**Status:** ✅ Complete

---

## Key Features Implemented

### 1. AI-Powered Test Case Generation
- Users describe what to test in natural language (min 10 characters)
- Select scenario types: Positive, Negative, Edge Cases, Boundary
- Generate 1-20 test cases with custom count input or preset buttons
- AI generates structured test cases matching project's custom template fields
- Test cases displayed for preview/editing before saving

### 2. Smart Prompt Engineering
- System prompt dynamically built from template fields (name, type, label, required, options, helpText)
- Mandates JSON-only output format with `{ "testCases": [...] }` wrapper
- User prompt provides context: website URL, description, scenario types, exact count
- 3-tier JSON parser: direct parse → markdown extraction → raw object extraction

### 3. Test Case Management
- **Table view** with clipped descriptions (40 char + tooltip on hover)
- **Expand modal** with full unclipped display and inline editing
- **Edit functionality**: All field types (text, textarea, select, multiselect, boolean, number, date)
- **Status tracking**: draft/active/archived badges
- **Sorting**: Test cases sorted by creation order (`_id`)
- **CRUD operations**: Create, read, update, delete with proper ownership checks

### 4. Error Handling
- AI-specific errors: rate limits (429), auth failures (401), parse failures (502)
- Validation errors: empty description, invalid count, no template defined
- Toast notifications for all success/failure cases
- Form state preserved on failure for easy retry

---

## Files Created

### Backend (5 files)

#### 1. `server/models/TestCase.js`
- Mongoose schema with Mixed `data` field for flexible structure
- Fields: project (ref), user (ref), data, status (draft/active/archived), generatedBy (ai/manual), version, history array
- Timestamps for tracking creation/update
- Indexes on {project, createdAt} and {status} for fast queries

#### 2. `server/services/aiService.js`
- Anthropic SDK integration with custom base URL from env
- `generateTestCases()` - Calls Claude API with smart prompts
- `buildSystemPrompt()` - Lists all template fields with constraints
- `buildUserPrompt()` - Provides context and requirements
- `parseAIResponse()` - 3-tier fallback parser for JSON extraction
- Model: `claude-sonnet-4-20250514`

#### 3. `server/validators/testCaseValidator.js`
- `generateSchema`: projectId, description (10-2000 chars), options.count (1-20), options.scenarios (array)
- `saveTestCasesSchema`: projectId, testCases array (1-50 items)
- `updateTestCaseSchema`: data and/or status updates

#### 4. `server/controllers/testCaseController.js`
- `generateTestCasesHandler` - POST /generate: AI generation with error handling
- `saveTestCases` - POST /: Persist generated test cases, update project.testCaseCount
- `getTestCases` - GET /?projectId=xxx: Paginated list with optional status filter
- `updateTestCase` - PUT /:id: Update data with version history
- `deleteTestCase` - DELETE /:id: Remove test case, decrement count

#### 5. `server/routes/testCaseRoutes.js`
- Protected routes (auth required)
- POST /generate → generateTestCasesHandler
- GET / → getTestCases
- POST / → saveTestCases
- PUT /:id → updateTestCase
- DELETE /:id → deleteTestCase

### Frontend (5 files)

#### 6. `client/src/services/testCaseService.js`
- Axios service wrapping all 5 endpoints
- Returns response.data following existing pattern
- Methods: generateTestCases, saveTestCases, getTestCases, updateTestCase, deleteTestCase

#### 7. `client/src/store/testCaseStore.js`
- Zustand store with dual loading states:
  - `generating`: True during AI generation (10-30 sec)
  - `loading`: True during CRUD operations (fast)
- State: testCases, generatedTestCases (preview), loading, generating, error, pagination
- Actions: generateTestCases, saveTestCases, fetchTestCases, updateTestCase, deleteTestCase
- Preview helpers: updateGeneratedTestCase, removeGeneratedTestCase, clearGeneratedTestCases

#### 8. `client/src/components/TestCaseCard.jsx`
- Single test case card with view/edit modes
- Read-only display: field labels + values with type-aware rendering
- Edit mode: type-specific inputs (text, textarea, select, multiselect, boolean, number, date)
- Remove button for preview cards
- Status badge for saved test cases

#### 9. `client/src/components/TestCasePreview.jsx`
- Results container showing generated test cases
- Summary bar: count + "Save All" / "Generate More" actions
- Maps TestCaseCard components with update/remove callbacks
- Shows empty state when all cases removed

#### 10. `client/src/components/GenerateTestCasesModal.jsx`
- Full-screen modal (bg-gray-900, z-50) with three phases:

  **Phase 1 (Form):**
  - Description textarea (10-2000 chars)
  - Scenario type selector (4 checkboxes in 2x2 grid)
  - Count selector: preset buttons (1/3/5/10/15/20) + custom input (1-20, max enforced)
  - Template info display (field count, website URL)

  **Generating State:**
  - Animated spinner with "AI is generating..." message
  - Shows selected scenarios and count
  - Estimated time: 10-30 seconds

  **Phase 2 (Preview):**
  - TestCasePreview component with full edit/delete capability
  - Save All / Generate More buttons

### Modified Files (2 files)

#### 11. `server/server.js`
- Added import: `import testCaseRoutes from './routes/testCaseRoutes.js'`
- Registered route: `app.use('/api/testcases', testCaseRoutes)`

#### 12. `client/src/pages/ProjectDetail.jsx`
**Imports:**
- GenerateTestCasesModal, useTestCaseStore

**New States:**
- `expandedTestCase`: Currently viewed test case in modal
- `editingExpanded`: Edit mode toggle in detail modal
- `editData`: Edited field values before save
- `templateFields`: Sorted template fields
- `sortedTestCases`: Test cases sorted by _id

**New Handlers:**
- Generate button click → opens GenerateTestCasesModal
- Expand icon → opens detail modal with full rendering
- Edit button → switches to editable mode with type-aware inputs
- Delete from table → removes with toast notification
- Delete from modal → removes with list refresh

**Table View:**
- Columns: # | [template fields...] | Status | Actions
- Field values clipped at 40 chars with hover tooltip
- Type-aware display: boolean badges, select/multiselect tags, multiselect shows first 2 + "+N more"
- Status badges: green (active), gray (archived), yellow (draft)
- Actions: expand (eye icon) + delete (trash icon)

**Detail Modal:**
- View mode: Full unclipped display of all fields
- Edit mode: Type-specific inputs for all field types
- Header: Status badge + Edit/Close buttons
- Footer: Save Changes/Cancel (in edit) or Delete/Close (in view)
- Handles version history on save

---

## User Flow

### Generate Test Cases
1. Project Detail page → click "Generate Test Cases" button
2. Modal opens with form
3. Enter description, pick scenario types, set count
4. Click "Generate" → AI processes request (10-30 sec)
5. Preview generated test cases with auto-populated template fields
6. Edit individual test cases (remove, modify fields)
7. Click "Save All" → test cases persisted to DB
8. Modal closes, test case list updates

### View & Edit Test Cases
1. Scroll to "Test Cases" table section
2. Click expand (eye) icon → detail modal opens
3. View all field values unclipped
4. Click "Edit" → all inputs become editable
5. Modify any field (type-aware inputs)
6. Click "Save Changes" → updates DB and refreshes
7. Or click "Delete" → removes test case

### Custom Count Input
- Preset buttons: 1, 3, 5, 10, 15, 20 (highlight when selected)
- Custom input: Type any value 1-20 (enforced by min/max + validation)
- Shows "max 20" label for guidance
- Either method updates count for generation

---

## Technical Decisions

### 1. Generation Workflow (Preview-then-Save)
- AI returns preview data (not auto-saved)
- User can edit/remove before committing
- Prevents saving unwanted AI output
- Provides full control and transparency

### 2. Dual Loading States
- `generating`: Long-running AI operation → show "thinking" animation
- `loading`: Fast CRUD → show spinner
- Distinct UX feedback for different operation types

### 3. Template-Driven Prompts
- System prompt dynamically built from template fields
- Auto-adapts to any custom template structure
- No hardcoded field assumptions
- Flexible for future template variations

### 4. Flexible Data Storage
- TestCase.data uses Mixed type (same as Project template)
- Stores any field structure matching template
- No schema migrations on template changes
- Lightweight versioning with history array

### 5. Sorting by _id
- MongoDB ObjectIds contain creation timestamp
- `localeCompare()` provides stable sort order
- No dependency on specific field formats
- Works across all template types

### 6. Three-Tier JSON Parser
- Handles various AI response formats
- Direct JSON parse (ideal case)
- Markdown code fence extraction (common wrapping)
- Raw JSON object extraction (last resort)
- Robust against formatting variations

---

## API Endpoints

### Test Case Endpoints (All Protected)

**POST /api/testcases/generate**
```
Body: {
  projectId: string,
  description: string (10-2000 chars),
  options: {
    count: number (1-20, default 5),
    scenarios: ["positive" | "negative" | "edge" | "boundary"]
  }
}
Response: { testCases: [...], count: number }
```

**POST /api/testcases**
```
Body: {
  projectId: string,
  testCases: [{
    data: object,
    status?: "draft" | "active" | "archived",
    generatedBy?: "ai" | "manual"
  }, ...]
}
Response: { testCases: [...], count: number }
```

**GET /api/testcases?projectId=xxx**
```
Optional: status=draft|active|archived, page=1, limit=50
Response: {
  testCases: [...],
  pagination: { total, page, pages }
}
```

**PUT /api/testcases/:id**
```
Body: { data?: object, status?: string }
Response: { _id, project, user, data, status, version, history, timestamps }
```

**DELETE /api/testcases/:id**
```
Response: { message: "Test case deleted successfully" }
```

---

## Error Handling

| Error | HTTP | User Message | Handling |
|-------|------|--------------|----------|
| AI rate limit | 429 | "AI rate limit reached. Please try again in a moment." | Retry logic |
| AI auth failure | 500 | "AI service authentication error. Please contact support." | Check credentials |
| AI parse failure | 502 | "AI returned an unexpected response. Please try again." | Retry generation |
| No template | 400 | "Project must have a template defined first." | Prevent generation |
| Invalid count | 400 | Joi validation message | Form validation |
| Empty description | 400 | Joi validation message | Form validation |
| Project not found | 404 | "Project not found" | Check ownership |

**Frontend Error Recovery:**
- Form state preserved on failure
- User can retry without re-entering description
- Toast notifications for all feedback
- No data loss on errors

---

## Testing Checklist

✅ Create project with template
✅ Click "Generate Test Cases" button
✅ Form validates: empty description, count limits
✅ Generate with custom count (e.g., 7) works
✅ Generate with preset button (e.g., 10) works
✅ AI generates structured test cases matching template
✅ Edit individual test case in preview
✅ Remove test case from preview
✅ Save all test cases to DB
✅ Project testCaseCount increments correctly
✅ Test cases appear in table, sorted by _id
✅ Expand icon opens detail modal with full content
✅ Edit mode switches all fields to inputs
✅ Save changes in edit mode updates DB
✅ Delete from table removes test case
✅ Delete from modal removes and refreshes
✅ Status badges display correctly (draft/active/archived)
✅ No template warning shows when template missing
✅ Field clipping in table shows tooltip on hover
✅ Type-aware rendering: boolean badges, select tags, multiselect "+N more"

---

## Performance Considerations

- Dual loading states prevent UI freezing during AI generation
- Table uses overflow-x-auto for responsive scrolling
- Test case count cached in Project model (no countDocuments query)
- Pagination support (default 50 per page)
- Version history lightweight (no separate collection)

---

## Future Enhancements (Out of Scope)

- Batch test case generation (generate multiple at once)
- AI refinement (regenerate subset, adjust tone/coverage)
- Test case templates (save/reuse generation prompts)
- Integration with Google Sheets (Sprint 6)
- Test case versioning UI (view/compare previous versions)
- Scenario weighting (e.g., 60% positive, 40% negative)
- Advanced validation rules (regex, custom validators)
- Test case grouping (by feature, priority, etc.)

---

## Summary

Sprint 4 successfully adds AI-powered test case generation to QA TestCraft, allowing users to:
- Generate realistic, structured test cases with natural language input
- Preview and edit test cases before saving
- Manage test cases in a clear table view with full CRUD operations
- Leverage custom templates to define test case structure
- Utilize multiple scenario types and flexible generation counts

The implementation follows all existing patterns (Zustand stores, Axios services, modal components, Joi validation) and integrates seamlessly with Sprint 3's template builder.

**Next Sprint:** Sprint 5 - Manual Test Case Execution & Results Tracking
