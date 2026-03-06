'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Vocabulary } from '@/lib/db'
import { updateSRS } from '@/lib/srs'
import styles from './Flashcard.module.css'

interface Props {
    cards: Vocabulary[]
    onComplete?: (results: { id: number; score: number }[]) => void
}

const RATINGS = [
    { score: 0, label: 'Không nhớ', className: 'btn-srs-bad', key: '1' },
    { score: 2, label: 'Khó', className: 'btn-srs-hard', key: '2' },
    { score: 4, label: 'Được', className: 'btn-srs-good', key: '3' },
    { score: 5, label: 'Dễ', className: 'btn-srs-easy', key: '4' },
] as const

export default function Flashcard({ cards, onComplete }: Props) {
    const [index, setIndex] = useState(0)
    const [flipped, setFlipped] = useState(false)
    const [done, setDone] = useState(false)
    const [results, setResults] = useState<{ id: number; score: number }[]>([])

    const card = cards[index]
    const progress = Math.round((index / cards.length) * 100)

    // Keyboard nav
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f) }
            if (flipped) {
                const r = RATINGS.find(r => r.key === e.key)
                if (r) handleRate(r.score as 0 | 2 | 4 | 5)
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [flipped, index])

    const handleRate = useCallback(async (score: 0 | 1 | 2 | 3 | 4 | 5) => {
        if (!card?.id) return
        await updateSRS(card.id, 'vocab', score)
        const newResults = [...results, { id: card.id, score }]
        setResults(newResults)

        if (index + 1 >= cards.length) {
            setDone(true)
            onComplete?.(newResults)
        } else {
            setIndex(i => i + 1)
            setFlipped(false)
        }
    }, [card, index, cards.length, results, onComplete])

    if (done || cards.length === 0) {
        const correct = results.filter(r => r.score >= 3).length
        return (
            <div className={styles.doneScreen}>
                <div className={styles.doneIcon}>🎉</div>
                <h2>Hoàn thành phiên ôn!</h2>
                <p>{correct}/{results.length} từ trả lời đúng</p>
                <div className={styles.doneBtns}>
                    <button className="btn btn-primary btn-md" onClick={() => {
                        setIndex(0); setFlipped(false); setDone(false); setResults([])
                    }}>Ôn lại</button>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.session}>
            {/* Progress */}
            <div className={styles.header}>
                <span className="badge badge-muted">{index + 1} / {cards.length}</span>
                <div className="progress-bar" style={{ flex: 1, maxWidth: 300 }}>
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Space = lật</span>
            </div>

            {/* Card */}
            <div className="flashcard-scene" onClick={() => setFlipped(f => !f)}>
                <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
                    {/* Front */}
                    <div className="flashcard-face">
                        <div className={styles.cardType}>{card.verbGroup ? `Động từ nhóm ${card.verbGroup}` : 'Từ vựng'}</div>
                        <ruby className={styles.cardMain}>
                            <span className="jp">{card.kanji || card.hiragana}</span>
                            {card.kanji && card.kanji !== card.hiragana && <rt>{card.hiragana}</rt>}
                        </ruby>
                        <p className={styles.flipHint}>Nhấn để xem nghĩa</p>
                    </div>

                    {/* Back */}
                    <div className="flashcard-face back">
                        <ruby className={styles.cardMainSm}>
                            <span className="jp">{card.kanji || card.hiragana}</span>
                            {card.kanji && card.kanji !== card.hiragana && <rt>{card.hiragana}</rt>}
                        </ruby>
                        <div className={styles.meaning}>{card.meaning}</div>
                        {card.verbGroup && (
                            <span className="badge badge-blue">Nhóm {card.verbGroup}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Rating buttons — only after flip */}
            {flipped && (
                <div className={styles.ratings}>
                    {RATINGS.map(r => (
                        <button
                            key={r.score}
                            className={`btn btn-md ${r.className}`}
                            onClick={() => handleRate(r.score as 0 | 2 | 4 | 5)}
                        >
                            <span className={styles.ratingKey}>{r.key}</span>
                            {r.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
