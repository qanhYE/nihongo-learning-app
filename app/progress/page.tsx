'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import { getDueVocabs, getDueKanji } from '@/lib/srs'
import styles from './page.module.css'

export default function ProgressPage() {
    const [stats, setStats] = useState({
        total: 0,
        reinforce: 0,
        learning: 0,
        mastered: 0,
        dueVocabs: 0,
        dueKanji: 0
    })

    useEffect(() => {
        async function load() {
            const [all, dueV, dueK] = await Promise.all([
                db.vocabulary.toArray(),
                getDueVocabs(),
                getDueKanji()
            ])

            setStats({
                total: all.length,
                reinforce: all.filter(v => v.status === 'learning' && Math.random() < 0.2).length, // Placeholder logic for reinforce
                learning: all.filter(v => v.status === 'learning').length,
                mastered: all.filter(v => v.status === 'mastered').length,
                dueVocabs: dueV.length,
                dueKanji: dueK.length
            })
        }
        load()
    }, [])

    return (
        <div className="container">
            <div className={styles.header}>
                <h1>Tiến độ học tập</h1>
                <p>Thống kê chi tiết quá trình học và các mục cần ôn tập.</p>
            </div>

            <div className={styles.grid}>
                <div className="card">
                    <h3>Trạng thái từ vựng</h3>
                    <div className={styles.statList}>
                        <div className={styles.statItem}>
                            <span className="status-dot status-reinforce"></span>
                            <strong>Cần củng cố:</strong> {stats.dueVocabs} từ
                        </div>
                        <div className={styles.statItem}>
                            <span className="status-dot status-learning"></span>
                            <strong>Đang học:</strong> {stats.learning} từ
                        </div>
                        <div className={styles.statItem}>
                            <span className="status-dot status-mastered"></span>
                            <strong>Thành thạo:</strong> {stats.mastered} từ
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3>Hàng đợi ôn tập</h3>
                    <div className={styles.dueInfo}>
                        <div className={styles.dueItem}>
                            <div className={styles.dueValue}>{stats.dueVocabs}</div>
                            <div className={styles.dueLabel}>Từ vựng quá hạn</div>
                        </div>
                        <div className={styles.dueItem}>
                            <div className={styles.dueValue}>{stats.dueKanji}</div>
                            <div className={styles.dueLabel}>Kanji quá hạn</div>
                        </div>
                    </div>
                    <a href="/daily" className="btn btn-primary" style={{ width: '100%', marginTop: 20 }}>
                        Ôn tập ngay
                    </a>
                </div>
            </div>

            <div className={styles.section}>
                <h3>Biểu đồ học tập</h3>
                <div className={styles.placeholderChart}>
                    <svg viewBox="0 0 800 200" className={styles.chart}>
                        <rect x="0" y="0" width="800" height="200" fill="var(--bg-elevated)" rx="12" />
                        <path
                            d="M50,150 Q150,120 250,140 T450,80 T650,100 T750,50"
                            fill="none"
                            stroke="var(--accent)"
                            strokeWidth="4"
                        />
                        {/* Dots */}
                        {[50, 150, 250, 450, 650, 750].map((x, i) => (
                            <circle key={i} cx={x} cy={150 - i * 20} r="6" fill="var(--accent)" />
                        ))}
                    </svg>
                    <div className={styles.chartLegend}>Số từ mới đã thuộc 7 ngày qua</div>
                </div>
            </div>
        </div>
    )
}
