// PDF or image → array of base64 JPEG strings (one per page/image)

export async function fileToImagePages(file: File): Promise<string[]> {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (isPdf) return pdfToImages(file)
    return [await imageFileToBase64(file)]
}

// ─── PDF → Images ─────────────────────────────────────────────────

async function pdfToImages(file: File): Promise<string[]> {
    const arrayBuffer = await file.arrayBuffer()

    // Dynamically import pdfjs to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const pages: string[] = []

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 2.0 }) // High res for OCR

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({ canvasContext: ctx, viewport }).promise
        // Convert to JPEG base64 (smaller than PNG, good for Gemini)
        const base64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1]
        pages.push(base64)
    }

    return pages
}

// ─── Image file → base64 ──────────────────────────────────────────

async function imageFileToBase64(file: File): Promise<string> {
    // Always convert to JPEG to match Gemini prompt declaration
    return resizeImage(file, 2048)
}

async function resizeImage(file: File, maxWidth: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => {
            const scale = Math.min(1, maxWidth / img.width)
            const canvas = document.createElement('canvas')
            canvas.width = img.width * scale
            canvas.height = img.height * scale
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            URL.revokeObjectURL(url)
            resolve(canvas.toDataURL('image/jpeg', 0.88).split(',')[1])
        }
        img.onerror = reject
        img.src = url
    })
}

// ─── ACCEPTED FILE TYPES ──────────────────────────────────────────

export const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.webp,.heic'
export const ACCEPTED_MIME = [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp', 'image/heic',
]

export function isAcceptedFile(file: File): boolean {
    return ACCEPTED_MIME.some(t => file.type === t) ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.pdf')
}
