import { generateWithGemini } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  text: string;
  existingCategories?: Array<{ id: string; name: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { text, existingCategories } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, error: "Text input is required" },
        { status: 400 }
      );
    }

    const categories = existingCategories?.map(c => c.name).join(", ") || 
      "Fashion, Health & Skin Care, FMCG, Interiors & Home Decor, Furniture";

    const prompt = `Given these categories: ${categories}

    Choose the most appropriate category for this product: ${text}

    Respond with ONLY the category name, exactly as written above. Pick the closest match.`;

    const suggestedCategory = await generateWithGemini(prompt);
    
    if (!suggestedCategory) {
      throw new Error("No category suggested");
    }

    const categoryMatch = existingCategories?.find(
      c => c.name.toLowerCase() === suggestedCategory.trim().toLowerCase()
    );

    return NextResponse.json({
      success: true,
      category: categoryMatch || { 
        id: "uncategorized", 
        name: suggestedCategory.trim() 
      }
    });

  } catch (error) {
    console.error('Category suggestion error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to suggest category" },
      { status: 500 }
    );
  }
}
