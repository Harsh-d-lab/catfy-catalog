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
            content: `You are a product categorizer. Choose the most appropriate category from: ${
              existingCategories?.map(c => c.name).join(", ") || 
              "Fashion, Health & Skin Care, FMCG, Interiors & Home Decor, Furniture"
            }. Respond with only the category name.`
          },
          {
            role: "user",
            content: `Categorize this product: ${text}`
          }
        ],
        max_tokens: 50,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    const suggestedCategory = data.choices?.[0]?.message?.content?.trim();

    if (!suggestedCategory) {
      throw new Error("No category suggested");
    }

    const categoryMatch = existingCategories?.find(
      c => c.name.toLowerCase() === suggestedCategory.toLowerCase()
    );

    return NextResponse.json({
      success: true,
      category: categoryMatch || { 
        id: "uncategorized", 
        name: suggestedCategory 
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
