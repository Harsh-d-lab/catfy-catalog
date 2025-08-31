import { NextRequest, NextResponse } from 'next/server'
import { createPrompt } from '@/lib/ai/prompts'
import { generateDescription, getApiStatus } from '@/lib/ai/huggingface'

export async function POST(request: NextRequest) {
  const DEBUG = process.env.NODE_ENV === 'development';
  
  try {
    const body = await request.json()
    const { productName, category, tags, price } = body
    
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
    const prompt = createPrompt(sanitizedName, sanitizedCategory, sanitizedTags, sanitizedPrice)

    if (DEBUG) {
      console.log('📝 Generated prompt:', prompt);
    }

    // Generate description using AI
    const description = await generateDescription(
      prompt, 
      sanitizedName, 
      sanitizedCategory
    )
    
    if (DEBUG) {
      console.log('✅ Final description:', description);
    }

    // Get API status for debugging
    const apiStatus = getApiStatus()

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