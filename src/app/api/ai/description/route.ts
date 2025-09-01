import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  productName: string;
  category?: string;
  tags?: string[];
  price?: number;
}

export async function POST(request: NextRequest) {
  const DEBUG = process.env.NODE_ENV === 'development';
  
  try {
    const body: RequestBody = await request.json();
    const { productName, category, tags, price } = body;

    if (DEBUG) {
      console.log('🚀 AI Description API called with:', {
        productName,
        category,
        tags,
        price
      });
    }

    // Validate required fields
    if (!productName || typeof productName !== 'string' || productName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Product name is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedName = productName.trim().substring(0, 100)
    const sanitizedCategory = category?.trim()?.substring(0, 50)
    const sanitizedTags = Array.isArray(tags) 
      ? tags.filter(tag => typeof tag === 'string').map(tag => tag.trim()).slice(0, 10)
      : []
    const sanitizedPrice = typeof price === 'number' && price > 0 ? price : undefined

    // Create the prompt
    const prompt = `Write a short, engaging product description (max 100 words) for:
      Product: ${sanitizedName}
      ${sanitizedCategory ? `Category: ${sanitizedCategory}` : ''}
      ${sanitizedTags.length ? `Tags: ${sanitizedTags.join(', ')}` : ''}
      ${sanitizedPrice ? `Price: $${sanitizedPrice}` : ''}`;

    if (DEBUG) {
      console.log('📝 Generated prompt:', prompt);
    }

    // Generate description using AI
    const response = await fetch(process.env.FREE_AI_API_URL!, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional product description writer. Write concise, SEO-friendly descriptions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim();

    if (!description) {
      throw new Error("No description generated");
    }
    
    if (DEBUG) {
      console.log('✅ Final description:', description);
    }

    // Get API status for debugging
        const apiStatus = {
          env: process.env.NODE_ENV,
          timestamp: new Date().toISOString(),
          aiProvider: 'OpenAI'
        }
    
        return NextResponse.json({
      success: true,
      description,
      metadata: {
        productName: sanitizedName,
        category: sanitizedCategory,
        tags: sanitizedTags,
        price: sanitizedPrice,
        promptLength: prompt.length,
        apiStatus
      }
    })

  } catch (error) {
    console.error('❌ AI Description API Error:', error)
    
    if (DEBUG) {
      console.log('🔍 API Error Details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate description', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function getApiStatus() {
  return {
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    aiProvider: 'OpenAI'
  };
}

export async function GET() {
  // Health check endpoint
  const apiStatus = getApiStatus()
  
  return NextResponse.json({
    status: 'AI Description Generator API',
    version: '1.0.0',
    apiStatus,
    endpoints: {
      generate: 'POST /api/ai/description'
    }
  })
}