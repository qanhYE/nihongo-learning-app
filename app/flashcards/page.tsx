'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/db'
import type { Vocabulary } from '@/lib/db'
import { getDueVocabs } from '@/lib/srs'
import Flashcard from '@/components/Flashcard'
import styles from './page.module.css'

export default function FlashcardsPage() {
    const [allVocab, setAllVocab] = useState<Vocabulary[]>([])
    const [dueVocab, setDueVocab] = useState<Vocabulary[]>([])
    const [session, setSession] = useState<Vocabulary[] | null>(null)
    const [mode, setMode] = useState<'due' | 'new' | 'all'>('due')

    useEffect(() => {
        async function load() {
            const [all, due] = await Promise.all([
                db.vocabulary.toArray(),
                getDueVocabs(),
            ])
            setAllVocab(all)
            setDueVocab(due)
        }
        load()
    }, [])

    const newVocabs = allVocab.filter(v => v.status === 'new')

    function startSession(cards: Vocabulary[]) {
        // Shuffle
        const shuffled = [...cards].sort(() => Math.random() - 0.5)
        setSession(shuffled)
    }

    if (session) {
        return (
            <div className="container">
                <button className="btn btn-ghost btn-sm" style={{ margin: '24px 0 0' }} onClick={() => setSession(null)}>
                    ← Quay lại
                </button>
                <Flashcard cards={session} onComplete={() => { }} />
            </div>
        )
    }

    return (
        <div className="container">
            <div className={styles.header}>
                <h1>🃏 Luyện Từ Vựng</h1>
                <p>Học qua flashcard với đánh giá SM-2</p>
            </div>

            <div className={styles.modeCards}>
                <button className={`${styles.modeCard} ${mode === 'due' ? styles.active : ''}`} onClick={() => setMode('due')}>
                    <div className={styles.modeIcon}>⏰</div>
                    <div className={styles.modeName}>Ôn tập SRS</div>
                    <div className={styles.modeCount}>{dueVocab.length} từ</div>
                    <div className={styles.modeDesc}>Từ quá hạn cần ôn</div>
                </button>
                <button className={`${styles.modeCard} ${mode === 'new' ? styles.active : ''}`} onClick={() => setMode('new')}>
                    <div className={styles.modeIcon}>✨</div>
                    <div className={styles.modeName}>Học từ mới</div>
                    <div className={styles.modeCount}>{newVocabs.length} từ</div>
                    <div className={styles.modeDesc}>Chưa từng học</div>
                </button>
                <button className={`${styles.modeCard} ${mode === 'all' ? styles.active : ''}`} onClick={() => setMode('all')}>
                    <div className={styles.modeIcon}>📚</div>
                    <div className={styles.modeName}>Tất cả</div>
                    <div className={styles.modeCount}>{allVocab.length} từ</div>
                    <div className={styles.modeDesc}>Ôn toàn bộ từ vựng</div>
                </button>
            </div>

            <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}
                onClick={() => {
                    const cards = mode === 'due' ? dueVocab : mode === 'new' ? newVocabs : allVocab
                    if (cards.length) startSession(cards)
                }}
                disabled={(() => {
                    const c = mode === 'due' ? dueVocab : mode === 'new' ? newVocabs : allVocab
                    return c.length === 0
                })()}
            >
                Bắt đầu luyện tập
            </button>

            {allVocab.length === 0 && (
                <div className={styles.empty}>
                    <p>Chưa có từ vựng. <a href="/upload">Tải tài liệu lên</a> để bắt đầu.</p>
                </div>
            )}
        </div>
    )
}
