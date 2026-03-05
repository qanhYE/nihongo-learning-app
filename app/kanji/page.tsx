'use client'

import { useState, useEffect } from 'react'
import { db, type KanjiEntry } from '@/lib/db'
import KanjiCard from '@/components/KanjiCard'
import styles from './page.module.css'

export default function KanjiPracticePage() {
    const [entries, setEntries] = useState<KanjiEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [isPracticing, setIsPracticing] = useState(false)

    useEffect(() => {
        async function load() {
            const all = await db.kanjiEntries.toArray()
            setEntries(all)
            setLoading(false)
        }
        load()
    }, [])

    if (loading) return <div className="container">Đang tải...</div>

    if (isPracticing) {
        return (
            <div className="container">
                <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginBottom: 20 }}
                    onClick={() => setIsPracticing(false)}
                >
                    ← Quay lại
                </button>
                <KanjiCard entries={entries} onComplete={() => setIsPracticing(false)} />
            </div>
        )
    }

    return (
        <div className="container">
            <div className={styles.header}>
                <h1>漢字 Kanji & Từ ghép</h1>
                <p>Luyện tập nhận diện Kanji và các từ ghép N5.</p>
            </div>

            {entries.length === 0 ? (
                <div className={styles.empty}>
                    <p>Chưa có dữ liệu Kanji. Hãy <a href="/upload">tải lên tài liệu Kanji</a> để bắt đầu.</p>
                </div>
            ) : (
                <div className={styles.stats}>
                    <div className="stat-card">
                        <div className="stat-value">{entries.length}</div>
                        <div className="stat-label">Tổng số Kanji/Từ ghép</div>
                    </div>
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => setIsPracticing(true)}
                    >
                        Bắt đầu luyện tập
                    </button>
                </div>
            )}

            <div className={styles.kanjiGrid}>
                {entries.map(e => (
                    <div key={e.id} className="card">
                        <ruby className="jp">
                            {e.form}
                            <rt>{e.reading}</rt>
                        </ruby>
                        <div className={styles.entryMeaning}>{e.meaning}</div>
                        <div className={styles.entryType}>
                            <span className={`badge ${e.type === 'single' ? 'badge-blue' : 'badge-green'}`}>
                                {e.type === 'single' ? 'Kanji đơn' : 'Từ ghép'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
