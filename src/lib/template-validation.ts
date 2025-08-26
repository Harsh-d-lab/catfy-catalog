import { TemplateConfig, CATALOG_TEMPLATES } from '@/components/catalog-templates'

/**
 * Get template configuration by ID
 */
export function getTemplateById(templateId: string): TemplateConfig | null {
  return CATALOG_TEMPLATES.find(template => template.id === templateId) || null
}

/**
 * Validate if a field is supported by a specific template
 */
export function isFieldSupported(
  templateId: string,
  fieldType: 'products' | 'categories' | 'profile',
  fieldName: string
): boolean {
  const template = getTemplateById(templateId)
  if (!template) return true // Default to allowing all fields if template not found
  
  return template.supportedFields[fieldType].includes(fieldName)
}

/**
 * Get all supported fields for a template
 */
export function getSupportedFields(
  templateId: string,
  fieldType: 'products' | 'categories' | 'profile'
): string[] {
  const template = getTemplateById(templateId)
  if (!template) return [] // Return empty array if template not found
  
  return template.supportedFields[fieldType]
}

/**
 * Validate form data against template requirements
 */
export function validateFormData(
  templateId: string,
  data: any,
  fieldType: 'products' | 'categories' | 'profile'
): { isValid: boolean; errors: string[] } {
  const template = getTemplateById(templateId)
  if (!template) {
    return { isValid: true, errors: [] } // Allow all if template not found
  }
  
  const supportedFields = template.supportedFields[fieldType]
  const errors: string[] = []
  
  // Check if any unsupported fields are being used
  Object.keys(data).forEach(fieldName => {
    if (!supportedFields.includes(fieldName)) {
      errors.push(`Field '${fieldName}' is not supported by template '${template.name}'`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Filter form data to only include supported fields
 */
export function filterSupportedFields(
  templateId: string,
  data: any,
  fieldType: 'products' | 'categories' | 'profile'
): any {
  const template = getTemplateById(templateId)
  if (!template) return data // Return all data if template not found
  
  const supportedFields = template.supportedFields[fieldType]
  const filteredData: any = {}
  
  supportedFields.forEach(fieldName => {
    if (data.hasOwnProperty(fieldName)) {
      filteredData[fieldName] = data[fieldName]
    }
  })
  
  return filteredData
}

/**
 * Get template-specific form schema for dynamic form generation
 */
export function getTemplateFormSchema(
  templateId: string,
  fieldType: 'products' | 'categories' | 'profile'
): { fieldName: string; isRequired: boolean; type: string }[] {
  const template = getTemplateById(templateId)
  if (!template) return []
  
  const supportedFields = template.supportedFields[fieldType]
  
  // Define field configurations (this could be extended or moved to template config)
  const fieldConfigs: Record<string, { isRequired: boolean; type: string }> = {
    // Product fields
    name: { isRequired: true, type: 'text' },
    description: { isRequired: false, type: 'textarea' },
    price: { isRequired: false, type: 'number' },
    images: { isRequired: false, type: 'file' },
    sku: { isRequired: false, type: 'text' },
    tags: { isRequired: false, type: 'array' },
    currency: { isRequired: false, type: 'select' },
    priceDisplay: { isRequired: false, type: 'select' },
    
    // Category fields
    color: { isRequired: false, type: 'color' },
    
    // Profile fields
    companyName: { isRequired: true, type: 'text' },
    logo: { isRequired: false, type: 'file' },
    email: { isRequired: true, type: 'email' },
    phone: { isRequired: false, type: 'tel' },
    website: { isRequired: false, type: 'url' },
    address: { isRequired: false, type: 'textarea' },
    tagline: { isRequired: false, type: 'text' },
    socialLinks: { isRequired: false, type: 'object' }
  }
  
  return supportedFields.map(fieldName => ({
    fieldName,
    isRequired: fieldConfigs[fieldName]?.isRequired || false,
    type: fieldConfigs[fieldName]?.type || 'text'
  }))
}