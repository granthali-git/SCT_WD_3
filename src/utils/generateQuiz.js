/**
 * Calls the Gemini 3.5 Flash API (with Gemini 3.1 Flash Lite fallback) to generate quiz questions.
 *
 * @param {string} topic - Quiz topic
 * @param {string} difficulty - "Easy" | "Medium" | "Hard"
 * @param {number} count - Number of questions (4, 6, 8, 10)
 * @param {Array<string>} [previousQuestions=[]] - List of previously generated question texts to avoid repeating
 * @returns {Promise<Array>} Array of generated question objects
 */
export async function generateQuiz(topic, difficulty, count = 6, previousQuestions = []) {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  if (!apiKey) throw new Error('API key not configured. Add VITE_GEMINI_API_KEY to your .env file and restart the dev server.');
  if (!topic || !topic.trim()) throw new Error('Quiz topic is required.');

  const sessionMarker = `Session: ${Math.random().toString(36).slice(2, 8)}-${Date.now()}`;

  const excludeInstruction = Array.isArray(previousQuestions) && previousQuestions.length > 0
    ? `\nCRITICAL: Do NOT repeat any of these previously asked questions:\n${previousQuestions.map((q) => `- "${q}"`).join('\n')}\n`
    : '';

  const prompt = `You are an expert quiz generator. Generate a quiz array of exactly ${count} questions about "${topic}" at "${difficulty}" difficulty level.

Generate completely fresh, unique questions each time — do not reuse common or predictable trivia questions.
${excludeInstruction}
Return ONLY a raw JSON array containing exactly ${count} question objects. Do not wrap the JSON in Markdown fences, code blocks, or extra text.

Mix the following three question types roughly evenly across the ${count} questions:
1. "single": 4 options in "options" array. Exactly one correct answer index in "correctIndices" array (e.g. [1]).
2. "multi": 5 options in "options" array. Exactly two correct answer indices in "correctIndices" array (e.g. [0, 3]).
3. "fill": A question containing "____" for the blank, plus an "answer" string containing the correct text.

Each question object MUST strictly follow this schema:
- "type": "single" | "multi" | "fill"
- "question": string
- "explanation": string (one sentence explaining the correct answer)
- For "single": "options": [string, string, string, string], "correctIndices": [number]
- For "multi": "options": [string, string, string, string, string], "correctIndices": [number, number]
- For "fill": "answer": string (do NOT include options or correctIndices for fill questions)

Format example:
[
  {
    "type": "single",
    "question": "Sample question text?",
    "options": ["Opt A", "Opt B", "Opt C", "Opt D"],
    "correctIndices": [0],
    "explanation": "Opt A is correct because..."
  },
  {
    "type": "multi",
    "question": "Sample multi question text? (Select 2)",
    "options": ["Opt A", "Opt B", "Opt C", "Opt D", "Opt E"],
    "correctIndices": [1, 3],
    "explanation": "Opt B and D are correct because..."
  },
  {
    "type": "fill",
    "question": "The ____ is a sample fill question.",
    "answer": "answer word",
    "explanation": "The answer word fits the blank because..."
  }
]

${sessionMarker}`;

  const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];
  let lastError = null;
  let response = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.ok) {
        break; // Success, proceed to parse
      }

      let errorMessage = `API request failed with status code ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.error.message) {
          errorMessage = `Gemini API Error (${response.status}): ${errorData.error.message}`;
        }
      } catch {
        // Ignore JSON parse error on response error body
      }
      lastError = new Error(errorMessage);
    } catch (err) {
      lastError = err;
    }
  }

  if (!response || !response.ok) {
    throw lastError || new Error('Gemini API call failed.');
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini API returned an empty or unparseable response.');
  }

  // Strip markdown code fences (```json ... ``` or ``` ... ```) if present
  let cleanedText = rawText.trim();
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }

  let questions;
  try {
    questions = JSON.parse(cleanedText);
  } catch (err) {
    throw new Error(`Failed to parse quiz response into JSON: ${err.message}`);
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('No quiz questions were returned by Gemini. Please try again.');
  }

  // Deduplicate within the same batch (case-insensitive, trimmed comparison)
  const seen = new Set();
  const uniqueQuestions = [];

  for (const q of questions) {
    const norm = (q && q.question ? q.question : '').trim().toLowerCase();
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      uniqueQuestions.push(q);
    } else {
      console.warn('Filtered duplicate question within generated batch:', q.question);
    }
  }

  return uniqueQuestions;
}

/**
 * Calls the Gemini API to generate a short, subtle hint for a question.
 *
 * @param {string} apiKey - User's Gemini API Key
 * @param {string|object} question - Question text or object
 * @param {Array|string} [options] - Question options
 * @returns {Promise<string>} Hint text
 */
export async function getHint(question, options) {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('API key not configured. Add VITE_GEMINI_API_KEY to your .env file and restart the dev server.');
  }

  let qText = '';
  if (typeof question === 'object' && question !== null) {
    qText = question.question || '';
    if (!options) options = question.options;
  } else {
    qText = String(question || '');
  }

  let optionsText = '';
  if (Array.isArray(options)) {
    optionsText = options.join(', ');
  } else if (typeof options === 'string') {
    optionsText = options;
  }

  const prompt = `You are a helpful quiz assistant. Provide ONE subtle, helpful hint (maximum 15 words) for the following question without directly giving away the correct answer.

Question: ${qText}
${optionsText ? `Options: ${optionsText}` : ''}

Return ONLY the hint text as plain text. Do not wrap in quotes or add extra commentary.`;

  const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];
  let lastError = null;
  let response = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ]
        })
      });

      if (response.ok) {
        break;
      }

      let errorMessage = `API request failed with status code ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.error.message) {
          errorMessage = `Gemini API Error (${response.status}): ${errorData.error.message}`;
        }
      } catch {
        // Ignore parse error
      }
      lastError = new Error(errorMessage);
    } catch (err) {
      lastError = err;
    }
  }

  if (!response || !response.ok) {
    throw lastError || new Error('Failed to fetch hint from Gemini.');
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini API returned an empty hint.');
  }

  let cleanedHint = rawText.trim().replace(/^["']|["']$/g, '');
  return cleanedHint;
}
