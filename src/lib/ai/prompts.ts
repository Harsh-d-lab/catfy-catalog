export function createPrompt(
  productName: string, 
  category?: string, 
  tags?: string[], 
  price?: number
): string {
  const basePrompt = `Write a compelling product description for: ${productName}`
  
  let contextPrompt = basePrompt
  
  if (category) {
    contextPrompt += `\nCategory: ${category}`
  }
  
  if (tags && tags.length > 0) {
    contextPrompt += `\nKey features: ${tags.join(', ')}`
  }
  
  if (price) {
    const priceRange = getPriceRange(price)
    contextPrompt += `\nPrice range: ${priceRange}`
  }
  
  contextPrompt += `\n\nRequirements:
- Write 2-3 sentences (50-150 words)
- Focus on benefits and value proposition
- Use engaging, professional tone
- Include relevant keywords for SEO
- Avoid technical jargon
- Make it customer-focused`
  
  return contextPrompt
}

function getPriceRange(price: number): string {
  if (price < 50) return 'budget-friendly'
  if (price < 200) return 'mid-range'
  if (price < 500) return 'premium'
  return 'luxury'
}

export function generateFallbackDescription(productName?: string, category?: string): string {
  const fallbacks = [
    "High-quality product designed for modern needs and exceptional performance.",
    "Premium item crafted with attention to detail and superior materials.",
    "Innovative solution combining style, functionality, and reliability.",
    "Professional-grade product built to exceed expectations and deliver value.",
    "Carefully designed item that enhances your lifestyle with quality and convenience."
  ]
  
  // Add some context if available
  if (productName && category) {
    return `${productName} is a ${category.toLowerCase()} that delivers exceptional quality and value. ${fallbacks[Math.floor(Math.random() * fallbacks.length)]}`
  }
  
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}