import { generateTestCases as claudeGenerate } from './aiService.js';
import { generateTestCases as geminiGenerate } from './geminiService.js';
import { generateTestCases as groqGenerate } from './groqService.js';

/**
 * AI Service Factory
 *
 * Switches between AI providers based on the AI_PROVIDER env variable.
 *
 * To switch providers, set in your .env file:
 *   AI_PROVIDER=groq     → Uses Groq API with Llama (GROQ_API_KEY required) [recommended free tier]
 *   AI_PROVIDER=gemini   → Uses Google Gemini API (GEMINI_API_KEY required)
 *   AI_PROVIDER=claude   → Uses Anthropic Claude API (ANTHROPIC_API_KEY + ANTHROPIC_BASE_URL required)
 *
 * Default: groq
 */

const providers = {
  claude: claudeGenerate,
  gemini: geminiGenerate,
  groq: groqGenerate,
};

export function getActiveProvider() {
  return process.env.AI_PROVIDER || 'groq';
}

export async function generateTestCases(params) {
  const provider = getActiveProvider();
  const generateFn = providers[provider];

  if (!generateFn) {
    throw new Error(
      `Unknown AI_PROVIDER: "${provider}". Supported values: ${Object.keys(providers).join(', ')}`
    );
  }

  return generateFn(params);
}
