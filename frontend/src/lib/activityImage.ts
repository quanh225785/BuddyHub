import { ACTIVITY_IMAGE_MAX_BYTES } from './validateActivity'

const MAX_IMAGE_EDGE = 1920
const INITIAL_QUALITY = 0.86
const MIN_QUALITY = 0.6
const QUALITY_STEP = 0.08

function isResizableImage(file: File) {
  return file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
}

function getOutputName(file: File) {
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'activity-image'
  return `${baseName}.jpg`
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Cannot load image'))
    }
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Cannot resize image'))
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      quality,
    )
  })
}

export async function resizeActivityImage(file: File) {
  if (!isResizableImage(file)) {
    return file
  }

  const image = await loadImage(file)
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))

  if (scale === 1 && file.size <= ACTIVITY_IMAGE_MAX_BYTES) {
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    return file
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  let quality = INITIAL_QUALITY
  let blob = await canvasToBlob(canvas, quality)

  while (blob.size > ACTIVITY_IMAGE_MAX_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP)
    blob = await canvasToBlob(canvas, quality)
  }

  if (blob.size > ACTIVITY_IMAGE_MAX_BYTES) {
    return file
  }

  return new File([blob], getOutputName(file), {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}
