'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import { getWeightedQuizPool, type WeightedItem } from '@/lib/srs'
import QuizCard from '@/components/QuizCard'
import type { QuizQuestion } from '@/lib/gemini'
import styles from './page.module.css'

export default function QuizPage() {
    const [questions, setQuestions] = useState<QuizQuestion[]>([])
    const [loading, setLoading] = useState(false)
    const [started, setStarted] = useState(false)
    const [results, setResults] = useState<{ id: string; correct: boolean }[] | null>(null)

    const startQuiz = async () => {
        const apiKey = localStorage.getItem('nihongo_api_key')
        if (!apiKey) {
            alert('Vui lòng cấu hình Gemini API Key trong Cài đặt.')
            return
        }

        setLoading(true)
        try {
            const pool = await getWeightedQuizPool(10)

            // Fetch full data for members in the pool
            const poolWithData = await Promise.all(pool.map(async (item) => {
                let data
                if (item.itemType === 'vocab') data = await db.vocabulary.get(item.itemId)
                if (item.itemType === 'grammar') data = await db.grammar.get(item.itemId)
                if (item.itemType === 'kanji') data = await db.kanjiEntries.get(item.itemId)
                return { ...item, data }
            }))

            const res = await fetch('/api/generate-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pool: poolWithData, count: 10, apiKey })
            })

            if (!res.ok) throw new Error('Không thể tạo câu hỏi')

            const { questions: generated } = await res.json()
            setQuestions(generated)
            setStarted(true)
        } catch (err) {
            alert('Lỗi: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'))
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="container">Đang tạo quiz bằng AI...</div>

    if (results) {
        const correctCount = results.filter(r => r.correct).length
        return (
            <div className="container">
                <div className={styles.results}>
                    <h1>Kết quả Quiz</h1>
                    <div className={styles.scoreCircle}>
                        <span className={styles.scoreValue}>{correctCount}</span>
                        <span className={styles.scoreTotal}>/ {results.length}</span>
                    </div>
                    <p>Bạn đã trả lời đúng {correctCount} câu hỏi.</p>
                    <button className="btn btn-primary" onClick={() => {
                        setStarted(false)
                        setResults(null)
                    }}>Thử lại</button>
                </div>
            </div>
        )
    }

    if (started) {
        return (
            <div className="container" style={{ padding: '20px 0' }}>
                <QuizCard questions={questions} onComplete={setResults} />
            </div>
        )
    }

    return (
        <div className="container">
            <div className={styles.header}>
                <h1>📝 Quiz Tổng Hợp</h1>
                <p>Hệ thống tự động tạo câu hỏi dựa trên mức độ thành thạo của bạn (AI-powered).</p>
            </div>

            <div className="card">
                <h3>Chuẩn bị Quiz</h3>
                <p>Hệ thống sẽ chọn 10 câu hỏi từ:</p>
                <ul>
                    <li>Các từ vựng hay sai</li>
                    <li>Ngữ pháp đã học</li>
                    <li>Kanji cần củng cố</li>
                </ul>
                <button className="btn btn-primary btn-lg" onClick={startQuiz}>
                    Bắt đầu ngay
                </button>
            </div>
        </div>
    )
}
