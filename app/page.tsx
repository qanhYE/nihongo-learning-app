'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { db } from '@/lib/db'
import { getDueCount, getStreak } from '@/lib/srs'
import styles from './page.module.css'

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalVocab: 0, learnedVocab: 0, totalKanji: 0,
        dueCount: 0, streak: 0, totalLessons: 0,
    })

    useEffect(() => {
        async function load() {
            const [totalVocab, learnedVocab, totalKanji, totalLessons, dueCount] = await Promise.all([
                db.vocabulary.count(),
                db.vocabulary.where('status').anyOf(['learning', 'mastered']).count(),
                db.kanjiEntries.count(),
                db.lessons.count(),
                getDueCount(),
            ])
            setStats({ totalVocab, learnedVocab, totalKanji, dueCount, streak: getStreak(), totalLessons })
        }
        load()
    }, [])

    const learnedPct = stats.totalVocab > 0
        ? Math.round(stats.learnedVocab / stats.totalVocab * 100) : 0

    return (
        <div className="container">
            <div className={styles.hero}>
                <div className={styles.heroText}>
                    <h1>Chào mừng trở lại! 👋</h1>
                    <p>Học tiếng Nhật mỗi ngày một chút — kiến thức sẽ được tích lũy bền vững.</p>
                </div>

                {/* Daily practice CTA */}
                <Link href="/daily" className={styles.dailyCta}>
                    <div className={styles.dailyIcon}>⭐</div>
                    <div className={styles.dailyInfo}>
                        <span className={styles.dailyLabel}>Bài học hôm nay</span>
                        <span className={styles.dailySub}>
                            {stats.dueCount > 0 ? `${stats.dueCount} từ cần ôn + từ mới` : 'Học từ mới hôm nay'}
                        </span>
                    </div>
                    <span className={styles.dailyArrow}>→</span>
                </Link>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className="stat-card">
                    <div className="stat-value">{stats.streak}</div>
                    <div className="stat-label">🔥 Ngày liên tiếp</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.learnedVocab}</div>
                    <div className="stat-label">📖 Từ đã học</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalKanji}</div>
                    <div className="stat-label">漢字 Kanji đã thêm</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: stats.dueCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
                        {stats.dueCount}
                    </div>
                    <div className="stat-label">⏰ Cần ôn hôm nay</div>
                </div>
            </div>

            {/* Progress bar */}
            {stats.totalVocab > 0 && (
                <div className={styles.progressSection}>
                    <div className={styles.progressHeader}>
                        <span>Tiến độ từ vựng</span>
                        <span>{learnedPct}% ({stats.learnedVocab}/{stats.totalVocab})</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${learnedPct}%` }} />
                    </div>
                </div>
            )}

            {/* Quick actions */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Luyện tập nhanh</h2>
                <div className={styles.moduleGrid}>
                    <Link href="/flashcards" className={styles.moduleCard}>
                        <div className={styles.moduleIcon}>🃏</div>
                        <div className={styles.moduleName}>Từ vựng</div>
                        <div className={styles.moduleDesc}>Flashcard lật thẻ</div>
                    </Link>
                    <Link href="/grammar" className={styles.moduleCard}>
                        <div className={styles.moduleIcon}>📖</div>
                        <div className={styles.moduleName}>Ngữ pháp</div>
                        <div className={styles.moduleDesc}>Mẫu câu + điền chỗ trống</div>
                    </Link>
                    <Link href="/kanji" className={styles.moduleCard}>
                        <div className={styles.moduleIcon}>漢</div>
                        <div className={styles.moduleName}>Kanji</div>
                        <div className={styles.moduleDesc}>Đơn lẻ và từ ghép</div>
                    </Link>
                    <Link href="/quiz" className={styles.moduleCard}>
                        <div className={styles.moduleIcon}>📝</div>
                        <div className={styles.moduleName}>Quiz</div>
                        <div className={styles.moduleDesc}>8 dạng câu hỏi</div>
                    </Link>
                </div>
            </div>

            {/* Upload CTA if no content */}
            {stats.totalLessons === 0 && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📄</div>
                    <h3>Chưa có tài liệu nào</h3>
                    <p>Upload PDF hoặc ảnh chụp tài liệu để bắt đầu học</p>
                    <Link href="/upload" className="btn btn-primary btn-lg" style={{ marginTop: 16 }}>
                        + Tải tài liệu lên
                    </Link>
                </div>
            )}
        </div>
    )
}
