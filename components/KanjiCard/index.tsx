'use client'

import { useState, useEffect } from 'react'
import type { KanjiEntry } from '@/lib/db'
import { updateSRS } from '@/lib/srs'
import styles from './KanjiCard.module.css'

interface Props {
    entries: KanjiEntry[]
    onComplete?: () => void
}

export default function KanjiCard({ entries, onComplete }: Props) {
    const [index, setIndex] = useState(0)
    const [showReading, setShowReading] = useState(false)
    const [quizMode, setQuizMode] = useState(false)
    const [quizResult, setQuizResult] = useState<boolean | null>(null)

    const entry = entries[index]

    if (!entry) {
        return (
            <div className={styles.empty}>
                <h2>🎉 Hoàn thành!</h2>
                <button className="btn btn-primary" onClick={onComplete}>Quay lại</button>
            </div>
        )
    }

    const handleNext = async (score: 0 | 5) => {
        await updateSRS(entry.id!, 'kanji', score)
        if (index + 1 < entries.length) {
            setIndex(index + 1)
            setShowReading(false)
            setQuizMode(false)
            setQuizResult(null)
        } else {
            onComplete?.()
        }
    }

    return (
        <div className={styles.container}>
            <div className="card">
                <div className={styles.top}>
                    <ruby className={`jp ${styles.mainKanji}`}>
                        {entry.form}
                        {showReading && <rt>{entry.reading}</rt>}
                    </ruby>
                    <div className={styles.meaning}>{entry.meaning}</div>
                </div>

                <div className={styles.details}>
                    {entry.type === 'single' && (
                        <div className={styles.readings}>
                            <div className={styles.readingItem}>
                                <strong>On:</strong> {entry.onyomi || '—'}
                            </div>
                            <div className={styles.readingItem}>
                                <strong>Kun:</strong> {entry.kunyomi || '—'}
                            </div>
                            <div className={styles.readingItem}>
                                <strong>Nét:</strong> {entry.strokeNotes || '—'}
                            </div>
                        </div>
                    )}

                    {entry.type === 'compound' && entry.baseKanji && (
                        <div className={styles.baseKanji}>
                            <strong>Cấu thành từ:</strong> {entry.baseKanji.join(', ')}
                        </div>
                    )}
                </div>

                {entry.usageExamples && entry.usageExamples.length > 0 && (
                    <div className={styles.examples}>
                        <h4>Ví dụ:</h4>
                        {entry.usageExamples.map((ex, i) => (
                            <div key={i} className={styles.exampleItem}>
                                <div className="jp">{ex.sentence}</div>
                                <div className={styles.exMeaning}>{ex.meaning}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div className={styles.actions}>
                    <button
                        className="btn btn-ghost"
                        onClick={() => setShowReading(!showReading)}
                    >
                        {showReading ? 'Ẩn cách đọc' : 'Hiện cách đọc'}
                    </button>
                    <button className="btn btn-srs-bad" onClick={() => handleNext(0)}>Chưa nhớ</button>
                    <button className="btn btn-srs-easy" onClick={() => handleNext(5)}>Đã nhớ</button>
                </div>
            </div>
        </div>
    )
}
