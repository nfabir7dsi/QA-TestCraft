import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

/**
 * Builds the system prompt that instructs Claude on the exact output format
 * based on the project's template fields.
 */
function buildSystemPrompt(templateFields) {
  const fieldDescriptions = templateFields
    .sort((a, b) => a.order - b.order)
    .map((f) => {
      let desc = `- "${f.name}" (${f.type}): ${f.label}`;
      if (f.required) desc += ' [REQUIRED]';
      if (f.options && f.options.length > 0) {
        desc += ` | Allowed values: ${f.options.join(', ')}`;
      }
      if (f.helpText) desc += ` | Hint: ${f.helpText}`;
      return desc;
    })
    .join('\n');

  return `You are a senior QA engineer and test case design expert. You generate structured test cases in JSON format.

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no code fences, no explanation text.
2. Return a JSON object with a single key "testCases" containing an array of test case objects.
3. Each test case object must have exactly these field keys (matching the template):
${fieldDescriptions}
4. For "select" fields, use ONLY the allowed values listed above.
5. For "multiselect" fields, return an array of values from the allowed values.
6. For "boolean" fields, return true or false.
7. For "number" fields, return a number.
8. For "date" fields, return an ISO 8601 date string (YYYY-MM-DD).
9. For "text" and "textarea" fields, return a string.
10. Make test cases detailed, realistic, and actionable.
11. Each test case should be independent and self-contained.
12. Use the sequential test case IDs provided (TC-XXX format) when numbering test cases.`;
}

/**
 * Builds the user prompt with the testing context and requirements.
 */
function buildUserPrompt({ websiteUrl, description, options, path, testData, projectContext, pageContent, documentContent, nextTestCaseId }) {
  const scenarioDescriptions = {
    positive: 'Positive/happy path scenarios (valid inputs, expected workflows)',
    negative: 'Negative scenarios (invalid inputs, error handling, unauthorized access)',
    edge: 'Edge case scenarios (empty inputs, max lengths, special characters, concurrent actions)',
    boundary: 'Boundary value scenarios (min/max values, off-by-one, limits)',
  };

  const scenarioText = options.scenarios
    .map((s) => scenarioDescriptions[s] || s)
    .join('\n- ');

  let prompt = `Generate exactly ${options.count} test cases for the following:

**Website/Application:** ${websiteUrl}
**Page/Route:** ${path || '/'}
**Full URL:** ${websiteUrl}${path || ''}`;

  if (testData) {
    prompt += `\n\n**Test Data / Auth Context:** ${testData}`;
  }

  if (documentContent) {
    prompt += `\n\n**Project Requirements (from uploaded documents):**\n${documentContent}`;
  }

  if (pageContent) {
    prompt += `\n\n**Page Structure (auto-scraped):**\n${pageContent}`;
  }

  prompt += `\n\n**What to test:** ${description}

**Scenario types to include:**
- ${scenarioText}`;

  if (projectContext) {
    prompt += `\n\n**Project Context (previous test generations):**\n${projectContext}`;
  }

  if (nextTestCaseId) {
    prompt += `\n\n**Test Case Numbering:** Start IDs from ${nextTestCaseId} (format: TC-001, TC-002, ...).`;
  }

  prompt += `\n\nGenerate ${options.count} test cases as a JSON object with key "testCases".`;

  return prompt;
}

/**
 * Robustly parses AI response text into an array of test case objects.
 * Uses a three-tier fallback strategy.
 */
function parseAIResponse(text) {
  // Tier 1: Direct JSON parse
  try {
    const data = JSON.parse(text);
    if (data.testCases && Array.isArray(data.testCases)) return data.testCases;
    if (Array.isArray(data)) return data;
  } catch {
    // Fall through to next tier
  }

  // Tier 2: Extract from markdown code fences
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1].trim());
      if (data.testCases && Array.isArray(data.testCases)) return data.testCases;
      if (Array.isArray(data)) return data;
    } catch {
      // Fall through to next tier
    }
  }

  // Tier 3: Find raw JSON object in text
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      const data = JSON.parse(objectMatch[0]);
      if (data.testCases && Array.isArray(data.testCases)) return data.testCases;
      if (Array.isArray(data)) return data;
    } catch {
      // Fall through to error
    }
  }

  throw new Error('Failed to parse AI response as valid test case JSON');
}

/**
 * Generates test cases by calling the Anthropic API.
 *
 * @param {Object} params
 * @param {string} params.websiteUrl - The project's website URL
 * @param {string} params.description - User's natural language description of what to test
 * @param {Object} params.options - Generation options (count, scenarios)
 * @param {Array} params.templateFields - Template field definitions from the project
 * @returns {Array} Array of test case data objects
 */
export async function generateTestCases({ websiteUrl, description, options, templateFields, path, testData, projectContext, pageContent, documentContent, nextTestCaseId }) {
  const systemPrompt = buildSystemPrompt(templateFields);
  const userPrompt = buildUserPrompt({ websiteUrl, description, options, path, testData, projectContext, pageContent, documentContent, nextTestCaseId });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const responseText = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  return parseAIResponse(responseText);
}
