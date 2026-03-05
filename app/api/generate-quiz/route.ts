import { NextRequest, NextResponse } from 'next/server'
import { generateQuizQuestions } from '@/lib/gemini'
import type { WeightedItem } from '@/lib/srs'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as {
            pool: Array<WeightedItem & { data: unknown }>
            count: number
            apiKey: string
        }

        const { pool, count = 10, apiKey } = body

        if (!pool?.length) {
            return NextResponse.json({ error: 'Pool trống' }, { status: 400 })
        }
        if (!apiKey) {
            return NextResponse.json({ error: 'Thiếu Gemini API Key' }, { status: 401 })
        }

        const questions = await generateQuizQuestions(pool, count, apiKey)
        return NextResponse.json({ questions })

    } catch (err) {
        console.error('[generate-quiz]', err)
        return NextResponse.json({ error: 'Lỗi tạo câu hỏi' }, { status: 500 })
    }
}
