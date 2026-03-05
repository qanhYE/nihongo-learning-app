'use client'

import { useState, useEffect } from 'react'
import type { QuizQuestion } from '@/lib/gemini'
import { updateSRS } from '@/lib/srs'
import styles from './QuizCard.module.css'

interface Props {
    questions: QuizQuestion[]
    onComplete?: (results: { id: string; correct: boolean }[]) => void
}

export default function QuizCard({ questions, onComplete }: Props) {
    const [index, setIndex] = useState(0)
    const [answer, setAnswer] = useState('')
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [results, setResults] = useState<{ id: string; correct: boolean }[]>([])

    const q = questions[index]

    if (!q) {
        return (
            <div className={styles.done}>
                <h2>🎉 Kết thúc Quiz!</h2>
                <p>Bạn đã hoàn thành tất cả câu hỏi.</p>
                <button className="btn btn-primary" onClick={() => onComplete?.(results)}>
                    Xem kết quả
                </button>
            </div>
        )
    }

    const handleSubmit = async () => {
        if (isSubmitted) return

        const correct = answer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
        const newResults = [...results, { id: q.id, correct }]
        setResults(newResults)
        setIsSubmitted(true)

        // Update SRS
        await updateSRS(q.itemId, q.itemType, correct ? 5 : 1)
    }

    const handleNext = () => {
        if (index + 1 < questions.length) {
            setIndex(index + 1)
            setAnswer('')
            setIsSubmitted(false)
        } else {
            onComplete?.(results)
        }
    }

    return (
        <div className={styles.container}>
            <div className="card">
                <div className={styles.progress}>
                    Câu hỏi {index + 1} / {questions.length}
                </div>

                <h3 className={styles.question}>{q.question}</h3>
                {q.questionJp && <div className={`jp ${styles.questionJp}`}>{q.questionJp}</div>}

                <div className={styles.inputArea}>
                    {q.type === 'meaning_mc' || q.type === 'translate_nj_tv' || q.type === 'fill_blank' ? (
                        <div className={styles.options}>
                            {q.options?.map((opt, i) => (
                                <button
                                    key={i}
                                    className={`btn ${answer === opt ? 'btn-primary' : 'btn-ghost'} ${isSubmitted && opt === q.correctAnswer ? styles.correctOpt : ''
                                        } ${isSubmitted && answer === opt && opt !== q.correctAnswer ? styles.wrongOpt : ''}`}
                                    onClick={() => !isSubmitted && setAnswer(opt)}
                                    disabled={isSubmitted}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.textInput}>
                            <input
                                className={`input ${isSubmitted ? (answer.toLowerCase() === q.correctAnswer.toLowerCase() ? styles.correctInput : styles.wrongInput) : ''}`}
                                value={answer}
                                onChange={(e) => !isSubmitted && setAnswer(e.target.value)}
                                placeholder="Nhập câu trả lời..."
                                disabled={isSubmitted}
                            />
                            {isSubmitted && answer.toLowerCase() !== q.correctAnswer.toLowerCase() && (
                                <div className={styles.correctAnswerText}>
                                    Đáp án đúng: <strong>{q.correctAnswer}</strong>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {q.explanation && isSubmitted && (
                    <div className={styles.explanation}>
                        <strong>Gợi ý:</strong> {q.explanation}
                    </div>
                )}

                <div className={styles.actions}>
                    {!isSubmitted ? (
                        <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={!answer}>
                            Trả lời
                        </button>
                    ) : (
                        <button className="btn btn-primary btn-lg" onClick={handleNext}>
                            {index + 1 < questions.length ? 'Tiếp theo' : 'Hoàn thành'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
