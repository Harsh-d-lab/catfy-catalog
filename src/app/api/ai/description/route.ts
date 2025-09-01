import { generateWithGemini } from "@/lib/gemini";
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

    if (!productName || typeof productName !== 'string' || productName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product name is required' },
        { status: 400 }
      );
    }

    const prompt = `Generate a short, engaging, and SEO-friendly product description (max 80 words) for:
      Product: ${productName}
      ${category ? `Category: ${category}` : ''}
      ${tags?.length ? `Tags: ${tags.join(', ')}` : ''}
      ${price ? `Price: $${price}` : ''}
      
      Make it professional, engaging, and focused on key features and benefits.
      Important: Return plain text only. Do not use markdown, asterisks (*), underscores (_), hashtags (#), or any other special formatting characters.`;

    let description = await generateWithGemini(prompt);
    
    // Clean and validate the generated description
    description = description.trim().replace(/[*_#]/g, '');
    if (!description) {
      throw new Error('Generated description is empty');
    }

    // Ensure description isn't too long (optional)
    if (description.length > 500) {
      description = description.slice(0, 497) + '...';
    }

    // Return in the exact format expected by the frontend
    return NextResponse.json({
      success: true,
      description,
      metadata: {
        model: 'gemini-2.0-flash',
        promptLength: prompt.length
      }
    });

  } catch (error) {
    console.error('Description generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to generate description",
        description: '' // Ensure consistent response format
      },
      { status: 500 }
    );
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
  const apiStatus = getApiStatus();
  
  return NextResponse.json({
    status: 'AI Description Generator API',
    version: '1.0.0',
    apiStatus,
    endpoints: {
      generate: 'POST /api/ai/description'
    }
  });
}
