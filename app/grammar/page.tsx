'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/db'
import type { Grammar, Lesson, SrsRecord } from '@/lib/db'
import { updateSRS } from '@/lib/srs'
import styles from './page.module.css'

export default function GrammarPage() {
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [grammar, setGrammar] = useState<Grammar[]>([])
    const [selectedLesson, setSelectedLesson] = useState<number | 'all'>('all')
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const [fillAnswers, setFillAnswers] = useState<Record<number, string>>({})
    const [fillResults, setFillResults] = useState<Record<number, boolean | null>>({})
    const [learnedIds, setLearnedIds] = useState<Set<number>>(new Set())

    useEffect(() => {
        async function load() {
            const [ls, gr] = await Promise.all([db.lessons.toArray(), db.grammar.toArray()])
            setLessons(ls)
            setGrammar(gr)

            // Load which grammar items have been learned via SRS records
            const srsRecords = await db.srsRecords
                .where('itemType').equals('grammar')
                .toArray()
            const learned = new Set<number>(
                srsRecords.filter(r => r.lastScore >= 3).map(r => r.itemId)
            )
            setLearnedIds(learned)
        }
        load()
    }, [])

    const filtered = selectedLesson === 'all'
        ? grammar
        : grammar.filter(g => g.lessonId === selectedLesson)

    const learnedCount = grammar.filter(g => learnedIds.has(g.id!)).length

    async function toggleLearned(grammarId: number) {
        const isLearned = learnedIds.has(grammarId)
        if (isLearned) {
            // Mark as not learned: update SRS record with low score
            await updateSRS(grammarId, 'grammar', 0)
            setLearnedIds(prev => {
                const next = new Set(prev)
                next.delete(grammarId)
                return next
            })
        } else {
            // Mark as learned: create/update SRS record with high score
            await updateSRS(grammarId, 'grammar', 5)
            setLearnedIds(prev => new Set(prev).add(grammarId))
        }
    }

    function checkFill(grammarId: number, answer: string, correct: string) {
        const isCorrect = answer.trim() === correct.trim()
        setFillResults(r => ({ ...r, [grammarId]: isCorrect }))
        // If correct, auto-mark as learned
        if (isCorrect && !learnedIds.has(grammarId)) {
            updateSRS(grammarId, 'grammar', 4)
            setLearnedIds(prev => new Set(prev).add(grammarId))
        }
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
                    Đã học: <strong>{learnedCount}/{grammar.length}</strong> mục —
                    Nhấn ✅ để đánh dấu đã học
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
                {filtered.map(g => {
                    const isLearned = learnedIds.has(g.id!)
                    return (
                        <div key={g.id} className={`card ${styles.grammarCard}`}
                            style={isLearned ? { borderColor: 'rgba(74,222,128,0.3)' } : undefined}>
                            <div className={styles.grammarHeader} onClick={() => setExpandedId(expandedId === g.id ? null : g.id!)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button
                                        className={`btn btn-sm ${isLearned ? 'btn-srs-good' : 'btn-ghost'}`}
                                        onClick={(e) => { e.stopPropagation(); toggleLearned(g.id!) }}
                                        title={isLearned ? 'Đánh dấu chưa học' : 'Đánh dấu đã học'}
                                    >
                                        {isLearned ? '✅' : '⬜'}
                                    </button>
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
                    )
                })}
            </div>
        </div>
    )
}
