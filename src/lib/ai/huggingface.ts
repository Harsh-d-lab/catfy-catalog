import { generateFallbackDescription } from './prompts'

// Try different models that might work better with free tier
const MODELS_TO_TRY = [
  'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
  'https://api-inference.huggingface.co/models/distilgpt2',
  'https://api-inference.huggingface.co/models/gpt2'
]
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY // Optional for free tier

// Debug logging
const DEBUG = process.env.NODE_ENV === 'development'

interface HuggingFaceResponse {
  generated_text?: string
  error?: string
}

export async function generateDescription(
  prompt: string, 
  productName?: string, 
  category?: string,
  maxRetries: number = 3
): Promise<string> {
  if (DEBUG) {
    console.log('🤖 AI Generation Debug Info:');
    console.log('- Product Name:', productName);
    console.log('- Category:', category);
    console.log('- Prompt Length:', prompt.length);
    console.log('- Models to try:', MODELS_TO_TRY.length);
    console.log('- Has API Key:', !!HF_API_KEY);
    console.log('- Full Prompt:', prompt);
  }

  // Try different models if the first ones fail
  for (const modelUrl of MODELS_TO_TRY) {
    if (DEBUG) {
      console.log(`🔄 Trying model: ${modelUrl}`);
    }
    
    try {
      const result = await tryModelGeneration(modelUrl, prompt, productName, category, maxRetries);
      if (result && result.length > 20) {
        if (DEBUG) console.log(`✅ Success with model: ${modelUrl}`);
        return result;
      }
    } catch (error) {
      if (DEBUG) console.log(`❌ Failed with model: ${modelUrl}`, error);
      continue; // Try next model
    }
  }
  
  // If all models fail, use fallback
  console.log('🔄 All models failed, falling back to template description');
  return generateFallbackDescription(productName, category);
}

async function tryModelGeneration(
  apiUrl: string,
  prompt: string, 
  productName?: string, 
  category?: string,
  maxRetries: number = 2
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (DEBUG) {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
      }

      const requestBody = {
        inputs: prompt,
        parameters: {
          max_length: 150,
          min_length: 50,
          do_sample: true,
          temperature: 0.7,
          top_p: 0.9,
          repetition_penalty: 1.1
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      };

      if (DEBUG) {
        console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2));
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (HF_API_KEY) {
        headers['Authorization'] = `Bearer ${HF_API_KEY}`;
        if (DEBUG) console.log('🔑 Using API Key for authentication');
      } else {
        if (DEBUG) console.log('🆓 Using free tier (no API key)');
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })

      if (DEBUG) {
        console.log('📥 Response Status:', response.status);
        console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ HF API Error (attempt ${attempt}):`, response.status, errorText)
        
        if (DEBUG) {
          console.log('🔍 Error Details:');
          console.log('- Status:', response.status);
          console.log('- Status Text:', response.statusText);
          console.log('- Error Response:', errorText);
        }
        
        // For 401 errors, try without authentication on free tier
        if (response.status === 401 && HF_API_KEY && attempt === 1) {
          console.log('🔄 Retrying without API key (free tier)');
          // Remove API key for this attempt
          const freeResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });
          
          if (freeResponse.ok) {
            const result: HuggingFaceResponse[] = await freeResponse.json();
            if (DEBUG) {
              console.log('✅ Free tier success:', result);
            }
            if (result && result.length > 0 && result[0].generated_text) {
              let generatedText = result[0].generated_text.trim();
              generatedText = cleanGeneratedText(generatedText, prompt);
              if (generatedText.length > 20) {
                return generatedText;
              }
            }
          }
        }
        
        if (attempt === maxRetries) {
          throw new Error(`HF API failed after ${maxRetries} attempts: ${response.status}`)
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = 1000 * attempt;
        if (DEBUG) console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }

      const result: HuggingFaceResponse[] = await response.json()
      
      if (DEBUG) {
        console.log('📥 API Response:', JSON.stringify(result, null, 2));
      }
      
      if (result && result.length > 0 && result[0].generated_text) {
        let generatedText = result[0].generated_text.trim()
        
        if (DEBUG) {
          console.log('📝 Raw Generated Text:', generatedText);
        }
        
        // Clean up the generated text
        generatedText = cleanGeneratedText(generatedText, prompt)
        
        if (DEBUG) {
          console.log('✨ Cleaned Generated Text:', generatedText);
        }
        
        if (generatedText.length > 20) {
          console.log('✅ AI Generation Successful!');
          return generatedText
        }
      }
      
      if (attempt === maxRetries) {
        throw new Error('Generated text too short or empty')
      }
      
    } catch (error) {
      console.error(`❌ AI Generation Error (attempt ${attempt}):`, error)
      
      if (DEBUG) {
        console.log('🔍 Error Stack:', error instanceof Error ? error.stack : 'No stack trace');
      }
      
      if (attempt === maxRetries) {
        console.log('🔄 Falling back to template description')
        return generateFallbackDescription(productName, category)
      }
      
      // Wait before retry
      const waitTime = 1000 * attempt;
      if (DEBUG) console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  // Final fallback
  return generateFallbackDescription(productName, category)
}

function cleanGeneratedText(text: string, originalPrompt: string): string {
  // Remove the original prompt if it appears in the response
  const promptLines = originalPrompt.split('\n')
  let cleaned = text
  
  // Remove prompt text that might be echoed back
  promptLines.forEach(line => {
    if (line.trim() && cleaned.includes(line.trim())) {
      cleaned = cleaned.replace(line.trim(), '').trim()
    }
  })
  
  // Remove common prefixes that models sometimes add
  const prefixesToRemove = [
    'Product description:',
    'Description:',
    'Here is a product description:',
    'This product is',
    'Write a compelling product description for:'
  ]
  
  prefixesToRemove.forEach(prefix => {
    if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
      cleaned = cleaned.substring(prefix.length).trim()
    }
  })
  
  // Ensure it starts with a capital letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }
  
  // Ensure it ends with proper punctuation
  if (cleaned.length > 0 && !cleaned.match(/[.!?]$/)) {
    cleaned += '.'
  }
  
  return cleaned
}

export function validateApiKey(): boolean {
  return !!HF_API_KEY && HF_API_KEY.length > 0
}

export function getApiStatus(): { hasKey: boolean; endpoint: string; models: string[] } {
  return {
    hasKey: validateApiKey(),
    endpoint: MODELS_TO_TRY[0], // Primary model
    models: MODELS_TO_TRY
  }
}