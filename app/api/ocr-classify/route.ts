import { NextRequest, NextResponse } from 'next/server'
import { classifyLessonPages, classifyKanjiPages } from '@/lib/gemini'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as {
            pages: string[]
            pdfType: 'bai' | 'kanji' | 'auto'
            apiKey: string
        }

        const { pages, pdfType, apiKey } = body

        if (!pages?.length) {
            return NextResponse.json({ error: 'Không có trang nào được gửi lên' }, { status: 400 })
        }
        if (!apiKey) {
            return NextResponse.json({ error: 'Thiếu Gemini API Key' }, { status: 401 })
        }

        if (pdfType === 'kanji') {
            const result = await classifyKanjiPages(pages, apiKey)
            return NextResponse.json(result)
        }

        // 'bai' or 'auto' → lesson
        const result = await classifyLessonPages(pages, apiKey)
        return NextResponse.json(result)

    } catch (err: any) {
        console.error('[ocr-classify] ERROR:', err)
        const msg = err?.message || 'Lỗi xử lý tài liệu'

        if (msg.includes('404') || msg.includes('not found')) {
            return NextResponse.json({
                error: 'Model AI chưa sẵn sàng ở vùng của bạn hoặc API Key không đúng dự án. Vui lòng kiểm tra lại Google AI Studio.'
            }, { status: 404 })
        }

        return NextResponse.json({
            error: msg.includes('API key') ? 'API Key không hợp lệ hoặc hết hạn' : msg
        }, { status: 500 })
    }
}
