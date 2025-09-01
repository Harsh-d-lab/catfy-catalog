const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_API_URL;

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export async function generateWithGemini(prompt: string, model = 'gemini-2.0-flash') {
  try {
    const response = await fetch(
      `${GEMINI_API_URL}/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY!
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.7,
            topP: 0.8,
            topK: 40
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    let generatedText = data.candidates[0]?.content?.parts[0]?.text || '';
    
    // Clean up the response
    generatedText = generatedText
      .trim()
      .replace(/^['"""']|['"""']$/g, '') // Remove quotes
      .replace(/\n+/g, ' ') // Replace multiple newlines with space
      .trim();

    if (!generatedText) {
      throw new Error('Empty response from Gemini API');
    }

    return generatedText;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}
