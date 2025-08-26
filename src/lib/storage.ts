import { createServiceRoleClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/client'

const BUCKET_NAME = 'catfy-uploads'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_PDF_TYPES = ['application/pdf']

export interface UploadResult {
  url: string
  path: string
  error?: string
}

export function validateFile(file: File, allowPdf: boolean = false): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  const allowedTypes = allowPdf ? [...ALLOWED_TYPES, ...ALLOWED_PDF_TYPES] : ALLOWED_TYPES
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: allowPdf ? 'File type must be JPEG, PNG, WebP, GIF, or PDF' : 'File type must be JPEG, PNG, WebP, or GIF',
    }
  }

  return { valid: true }
}

export async function uploadFile(
  file: File,
  folder: string = 'general',
  userId?: string,
  allowPdf: boolean = false,
  useServiceRole: boolean = false
): Promise<UploadResult> {
  try {
    const validation = validateFile(file, allowPdf)
    if (!validation.valid) {
      return { url: '', path: '', error: validation.error }
    }

    // Use service role client for server-side uploads (bypasses RLS)
    const supabase = useServiceRole ? createServiceRoleClient() : createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = userId ? `${folder}/${userId}/${fileName}` : `${folder}/${fileName}`

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return { url: '', path: '', error: error.message }
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path,
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      url: '',
      path: '',
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

export async function uploadMultipleFiles(
  files: File[],
  folder: string = 'general',
  userId?: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => uploadFile(file, folder, userId))
  return Promise.all(uploadPromises)
}

export async function deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient()
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path])

    if (error) {
      console.error('Delete error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    }
  }
}

export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<{ url: string | null; error?: string }> {
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Signed URL error:', error)
      return { url: null, error: error.message }
    }

    return { url: data.signedUrl }
  } catch (error) {
    console.error('Signed URL error:', error)
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Failed to create signed URL',
    }
  }
}

export function getPublicUrl(path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)
  return data.publicUrl
}

export async function moveFile(
  fromPath: string,
  toPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient()
    const { error } = await supabase.storage.from(BUCKET_NAME).move(fromPath, toPath)

    if (error) {
      console.error('Move error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Move error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Move failed',
    }
  }
}

// Helper function to extract path from Supabase URL
export function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/)
    return pathMatch ? pathMatch[1] : null
  } catch {
    return null
  }
}