import { createClient } from '@/lib/supabase/client'

// File validation constants
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
] as const

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_FILES_PER_UPLOAD = 5

// File validation functions
export function validateFileType(file: File, allowedTypes: readonly string[] = ALLOWED_IMAGE_TYPES): boolean {
  return allowedTypes.includes(file.type)
}

export function validateFileSize(file: File, maxSize: number = MAX_FILE_SIZE): boolean {
  return file.size <= maxSize
}

export function validateFile(file: File, options?: {
  allowedTypes?: readonly string[]
  maxSize?: number
}): { isValid: boolean; error?: string } {
  const { allowedTypes = ALLOWED_IMAGE_TYPES, maxSize = MAX_FILE_SIZE } = options || {}
  
  if (!validateFileType(file, allowedTypes)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }
  
  if (!validateFileSize(file, maxSize)) {
    return {
      isValid: false,
      error: `File size ${formatFileSize(file.size)} exceeds maximum allowed size of ${formatFileSize(maxSize)}`
    }
  }
  
  return { isValid: true }
}

// File utility functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function generateFileName(originalName: string, prefix?: string): string {
  const timestamp = Date.now()
  const extension = getFileExtension(originalName)
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_')
  
  return prefix 
    ? `${prefix}_${baseName}_${timestamp}.${extension}`
    : `${baseName}_${timestamp}.${extension}`
}

// Image processing functions
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'))
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    reader.readAsDataURL(file)
  })
}

export function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }
      
      // Set canvas dimensions
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        file.type,
        quality
      )
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    img.src = URL.createObjectURL(file)
  })
}

// Supabase storage functions
export async function uploadFileToSupabase(
  file: File,
  path: string,
  bucket: string = 'uploads'
): Promise<{ url: string; path: string }> {
  const supabase = createClient()
  
  // Convert file to array buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)
  
  // Upload to Supabase
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return {
    url: publicUrl,
    path: data.path
  }
}

export async function deleteFileFromSupabase(
  path: string,
  bucket: string = 'uploads'
): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])
  
  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

export async function getFileFromSupabase(
  path: string,
  bucket: string = 'uploads'
): Promise<Blob> {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path)
  
  if (error) {
    throw new Error(`Download failed: ${error.message}`)
  }
  
  return data
}

// File download function
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Batch file operations
export async function uploadMultipleFiles(
  files: File[],
  pathGenerator: (file: File, index: number) => string,
  bucket: string = 'uploads',
  onProgress?: (progress: number) => void
): Promise<Array<{ file: File; url: string; path: string }>> {
  const results = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const path = pathGenerator(file, i)
    
    try {
      const result = await uploadFileToSupabase(file, path, bucket)
      results.push({ file, ...result })
      
      // Report progress
      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100)
      }
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error)
      throw error
    }
  }
  
  return results
}

export async function deleteMultipleFiles(
  paths: string[],
  bucket: string = 'uploads'
): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove(paths)
  
  if (error) {
    throw new Error(`Batch delete failed: ${error.message}`)
  }
}

// Image optimization utilities
export function getOptimalImageDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight
  
  let width = originalWidth
  let height = originalHeight
  
  // Scale down if necessary
  if (width > maxWidth) {
    width = maxWidth
    height = width / aspectRatio
  }
  
  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height)
  }
}

export function createImageThumbnail(
  file: File,
  size: number = 150
): Promise<Blob> {
  return resizeImage(file, size, size, 0.7)
}