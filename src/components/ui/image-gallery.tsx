'use client'

import React, { useState } from 'react'
import { X, Eye, Download, Trash2, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ImageItem {
  id?: string
  url: string
  name: string
  size?: number
  type?: string
  path?: string
  alt?: string
}

interface ImageGalleryProps {
  images: ImageItem[]
  onDelete?: (image: ImageItem, index: number) => void
  onReorder?: (images: ImageItem[]) => void
  className?: string
  showActions?: boolean
  maxHeight?: string
  columns?: number
  aspectRatio?: 'square' | 'video' | 'auto'
  allowPreview?: boolean
  allowDownload?: boolean
  allowDelete?: boolean
}

export function ImageGallery({
  images,
  onDelete,
  onReorder,
  className,
  showActions = true,
  maxHeight = '400px',
  columns = 4,
  aspectRatio = 'square',
  allowPreview = true,
  allowDownload = true,
  allowDelete = true
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number>(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const openPreview = (image: ImageItem, index: number) => {
    if (!allowPreview) return
    setSelectedImage(image)
    setPreviewIndex(index)
    setIsPreviewOpen(true)
  }

  const closePreview = () => {
    setIsPreviewOpen(false)
    setSelectedImage(null)
  }

  const navigatePreview = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (previewIndex - 1 + images.length) % images.length
      : (previewIndex + 1) % images.length
    
    setPreviewIndex(newIndex)
    setSelectedImage(images[newIndex])
  }

  const handleDownload = async (image: ImageItem) => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = image.name || 'image'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleDelete = async (image: ImageItem, index: number) => {
    if (!allowDelete || !onDelete) return
    
    try {
      await onDelete(image, index)
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square'
      case 'video':
        return 'aspect-video'
      default:
        return 'aspect-auto'
    }
  }

  const getGridClass = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-2'
      case 3:
        return 'grid-cols-2 md:grid-cols-3'
      case 4:
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      case 5:
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
      case 6:
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
      default:
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
    }
  }

  if (images.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        <Eye className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p>No images to display</p>
      </div>
    )
  }

  return (
    <>
      <div 
        className={cn('w-full', className)}
        style={{ maxHeight }}
      >
        <div className={cn('grid gap-4 overflow-y-auto', getGridClass())}>
          {images.map((image, index) => (
            <div key={image.id || index} className="group relative">
              <div 
                className={cn(
                  'relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 cursor-pointer transition-all hover:shadow-md',
                  getAspectRatioClass()
                )}
                onClick={() => openPreview(image, index)}
              >
                <img
                  src={image.url}
                  alt={image.alt || image.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* File info badge */}
                {image.size && (
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 left-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {formatFileSize(image.size)}
                  </Badge>
                )}
              </div>

              {/* Image name */}
              <p className="mt-2 text-sm text-gray-600 truncate">
                {image.name}
              </p>

              {/* Actions dropdown */}
              {showActions && (allowDownload || allowDelete) && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {allowPreview && (
                        <DropdownMenuItem onClick={() => openPreview(image, index)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                      )}
                      {allowDownload && (
                        <DropdownMenuItem onClick={() => handleDownload(image)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                      )}
                      {allowDelete && onDelete && (
                        <DropdownMenuItem 
                          onClick={() => handleDelete(image, index)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedImage?.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {previewIndex + 1} of {images.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closePreview}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative flex-1 p-6 pt-0">
            {selectedImage && (
              <div className="relative">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.alt || selectedImage.name}
                  className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                />
                
                {/* Navigation buttons */}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2"
                      onClick={() => navigatePreview('prev')}
                    >
                      ←
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                      onClick={() => navigatePreview('next')}
                    >
                      →
                    </Button>
                  </>
                )}
              </div>
            )}
            
            {/* Image details */}
            {selectedImage && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">File name:</span>
                    <p className="text-gray-600">{selectedImage.name}</p>
                  </div>
                  {selectedImage.size && (
                    <div>
                      <span className="font-medium text-gray-700">File size:</span>
                      <p className="text-gray-600">{formatFileSize(selectedImage.size)}</p>
                    </div>
                  )}
                  {selectedImage.type && (
                    <div>
                      <span className="font-medium text-gray-700">File type:</span>
                      <p className="text-gray-600">{selectedImage.type}</p>
                    </div>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-2 mt-4">
                  {allowDownload && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedImage)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  )}
                  {allowDelete && onDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        handleDelete(selectedImage, previewIndex)
                        closePreview()
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}