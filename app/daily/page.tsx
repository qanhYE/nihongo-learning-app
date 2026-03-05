'use client'

import { useState, useEffect } from 'react'
import { db, type Vocabulary } from '@/lib/db'
import { getDueVocabs, recordDailyComplete } from '@/lib/srs'
import Flashcard from '@/components/Flashcard'
import QuizCard from '@/components/QuizCard'
import type { QuizQuestion } from '@/lib/gemini'
import styles from './page.module.css'

type Step = 'start' | 'review' | 'learn' | 'quiz' | 'complete'

export default function DailyPracticePage() {
    const [step, setStep] = useState<Step>('start')
    const [dueVocab, setDueVocab] = useState<Vocabulary[]>([])
    const [newVocab, setNewVocab] = useState<Vocabulary[]>([])
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        async function load() {
            const due = await getDueVocabs()
            const allNew = await db.vocabulary.where('status').equals('new').limit(5).toArray()
            setDueVocab(due)
            setNewVocab(allNew)
        }
        load()
    }, [])

    const startReview = () => setStep('review')

    const finishReview = () => {
        if (newVocab.length > 0) setStep('learn')
        else startQuizGeneration()
    }

    const startQuizGeneration = async () => {
        const apiKey = localStorage.getItem('nihongo_api_key')
        if (!apiKey) {
            setStep('complete')
            recordDailyComplete()
            return
        }

        setLoading(true)
        try {
            // Pick 5 random items for quick quiz
            const all = [...dueVocab, ...newVocab]
            const sample = all.sort(() => Math.random() - 0.5).slice(0, 5)

            const res = await fetch('/api/generate-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pool: sample.map(v => ({ itemId: v.id, itemType: 'vocab', data: v })),
                    count: 5,
                    apiKey
                })
            })
            const { questions } = await res.json()
            setQuizQuestions(questions)
            setStep('quiz')
        } catch (err) {
            setStep('complete')
            recordDailyComplete()
        } finally {
            setLoading(false)
        }
    }

    const finishDaily = () => {
        recordDailyComplete()
        setStep('complete')
    }

    if (loading) return <div className="container">Đang chuẩn bị bài học...</div>

    return (
        <div className="container">
            {step === 'start' && (
                <div className={styles.centered}>
                    <h1>🌟 Phiên học hôm nay</h1>
                    <div className="card" style={{ width: '100%', maxWidth: 400 }}>
                        <div className={styles.goalItem}>
                            <span>⏰ Ôn tập:</span> <strong>{dueVocab.length} từ</strong>
                        </div>
                        <div className={styles.goalItem}>
                            <span>✨ Học mới:</span> <strong>{newVocab.length} từ</strong>
                        </div>
                        <div className={styles.goalItem}>
                            <span>📝 Mini Quiz:</span> <strong>5 câu</strong>
                        </div>
                        <button className="btn btn-primary btn-lg" onClick={startReview} style={{ width: '100%', marginTop: 20 }}>
                            Bắt đầu ngay (10 phút)
                        </button>
                    </div>
                </div>
            )}

            {step === 'review' && (
                <div>
                    <h2 className={styles.stepTitle}>Bước 1: Ôn tập SRS</h2>
                    <Flashcard cards={dueVocab} onComplete={finishReview} />
                </div>
            )}

            {step === 'learn' && (
                <div className={styles.centered}>
                    <h2 className={styles.stepTitle}>Bước 2: Học từ mới</h2>
                    <div className={styles.newWordsGrid}>
                        {newVocab.map(v => (
                            <div key={v.id} className="card">
                                <ruby className="jp" style={{ fontSize: '2rem' }}>{v.kanji}<rt>{v.hiragana}</rt></ruby>
                                <div style={{ marginTop: 10 }}>{v.meaning}</div>
                            </div>
                        ))}
                    </div>
                    <button className="btn btn-primary" onClick={startQuizGeneration} style={{ marginTop: 30 }}>
                        Tiếp tục đến Quiz →
                    </button>
                </div>
            )}

            {step === 'quiz' && (
                <div>
                    <h2 className={styles.stepTitle}>Bước 3: Mini Quiz nhanh</h2>
                    <QuizCard questions={quizQuestions} onComplete={finishDaily} />
                </div>
            )}

            {step === 'complete' && (
                <div className={styles.centered}>
                    <div style={{ fontSize: '5rem' }}>🔥</div>
                    <h1>Tuyệt vời!</h1>
                    <p>Bạn đã hoàn thành phiên học hôm nay.</p>
                    <div className="card" style={{ marginTop: 20 }}>
                        <strong>Streak hiện tại: 7 ngày</strong>
                    </div>
                    <a href="/" className="btn btn-primary" style={{ marginTop: 20 }}>Về trang chủ</a>
                </div>
            )}
        </div>
    )
}
