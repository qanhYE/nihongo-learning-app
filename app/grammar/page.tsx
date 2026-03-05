'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/db'
import type { Grammar, Lesson } from '@/lib/db'
import styles from './page.module.css'

export default function GrammarPage() {
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [grammar, setGrammar] = useState<Grammar[]>([])
    const [selectedLesson, setSelectedLesson] = useState<number | 'all'>('all')
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const [fillAnswers, setFillAnswers] = useState<Record<number, string>>({})
    const [fillResults, setFillResults] = useState<Record<number, boolean | null>>({})

    useEffect(() => {
        async function load() {
            const [ls, gr] = await Promise.all([db.lessons.toArray(), db.grammar.toArray()])
            setLessons(ls)
            setGrammar(gr)
        }
        load()
    }, [])

    const filtered = selectedLesson === 'all'
        ? grammar
        : grammar.filter(g => g.lessonId === selectedLesson)

    function checkFill(grammarId: number, answer: string, correct: string) {
        setFillResults(r => ({ ...r, [grammarId]: answer.trim() === correct.trim() }))
    }

    if (grammar.length === 0) {
        return (
            <div className="container">
                <div className={styles.header}><h1>📖 Luyện Ngữ Pháp</h1></div>
                <div className={styles.empty}><p>Chưa có ngữ pháp. <a href="/upload">Tải tài liệu lên</a>.</p></div>
            </div>
        )
    }

    return (
        <div className="container">
            <div className={styles.header}>
                <h1>📖 Luyện Ngữ Pháp</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    Nút <strong>「あ」</strong> trên thanh điều hướng để ẩn/hiện phiên âm toàn trang
                </p>
            </div>

            {/* Lesson filter */}
            <div className={styles.filterRow}>
                <button className={`chip ${selectedLesson === 'all' ? 'active' : ''}`} onClick={() => setSelectedLesson('all')}>
                    Tất cả ({grammar.length})
                </button>
                {lessons.map(l => (
                    <button key={l.id} className={`chip ${selectedLesson === l.id ? 'active' : ''}`}
                        onClick={() => setSelectedLesson(l.id!)}>
                        {l.title}
                    </button>
                ))}
            </div>

            {/* Grammar cards */}
            <div className={styles.grammarList}>
                {filtered.map(g => (
                    <div key={g.id} className={`card ${styles.grammarCard}`}>
                        <div className={styles.grammarHeader} onClick={() => setExpandedId(expandedId === g.id ? null : g.id!)}>
                            <div>
                                <span className="badge badge-red">Mục {g.sectionNumber}</span>
                                <span className={styles.grammarTitle}>{g.title}</span>
                            </div>
                            <ruby className={`jp ${styles.pattern}`}>
                                {g.pattern}
                            </ruby>
                            <span className={styles.chevron}>{expandedId === g.id ? '▲' : '▼'}</span>
                        </div>

                        {expandedId === g.id && (
                            <div className={styles.grammarBody}>
                                <p className={styles.explanation}>{g.explanation}</p>

                                {/* Examples */}
                                {g.examples?.length > 0 && (
                                    <div className={styles.examples}>
                                        <div className={styles.examplesLabel}>Câu ví dụ:</div>
                                        {g.examples.map((ex, i) => (
                                            <div key={i} className={styles.example}>
                                                <ruby className="jp">
                                                    {ex.japanese}
                                                    <rt>{ex.furigana}</rt>
                                                </ruby>
                                                <div className={styles.exTrans}>{ex.vietnamese}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Quick fill exercise */}
                                {g.examples?.[0] && (
                                    <div className={styles.fillExercise}>
                                        <div className={styles.fillLabel}>📝 Bài tập nhanh:</div>
                                        <p className={styles.fillQuestion}>
                                            Dịch: <em>&ldquo;{g.examples[0].vietnamese}&rdquo;</em>
                                        </p>
                                        <div className={styles.fillRow}>
                                            <input
                                                className="input"
                                                placeholder="Nhập câu tiếng Nhật..."
                                                value={fillAnswers[g.id!] ?? ''}
                                                onChange={e => setFillAnswers(a => ({ ...a, [g.id!]: e.target.value }))}
                                                style={{ maxWidth: 400 }}
                                            />
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => checkFill(g.id!, fillAnswers[g.id!] ?? '', g.examples[0].japanese)}
                                            >Kiểm tra</button>
                                        </div>
                                        {fillResults[g.id!] !== undefined && fillResults[g.id!] !== null && (
                                            <div className={fillResults[g.id!] ? styles.correct : styles.wrong}>
                                                {fillResults[g.id!] ? '✅ Đúng!' : `❌ Đáp án: ${g.examples[0].japanese}`}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
