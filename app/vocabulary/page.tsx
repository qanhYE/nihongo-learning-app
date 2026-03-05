'use client'

import { useState, useEffect } from 'react'
import { db, type Vocabulary, type Lesson } from '@/lib/db'
import styles from './page.module.css'

export default function VocabularyPage() {
    const [vocabs, setVocabs] = useState<Vocabulary[]>([])
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<{ lessonId: number | 'all', status: string }>({
        lessonId: 'all',
        status: 'all'
    })

    useEffect(() => {
        async function load() {
            const [v, l] = await Promise.all([
                db.vocabulary.toArray(),
                db.lessons.toArray()
            ])
            setVocabs(v)
            setLessons(l)
            setLoading(false)
        }
        load()
    }, [])

    const filteredVocabs = vocabs.filter(v => {
        const lessonMatch = filter.lessonId === 'all' || v.lessonId === filter.lessonId
        const statusMatch = filter.status === 'all' || v.status === filter.status
        return lessonMatch && statusMatch
    })

    const toggleStatus = async (id: number, currentStatus: string) => {
        const nextStatus = currentStatus === 'mastered' ? 'learning' : 'mastered'
        await db.vocabulary.update(id, { status: nextStatus })
        setVocabs(vocabs.map(v => v.id === id ? { ...v, status: nextStatus as any } : v))
    }

    if (loading) return <div className="container">Đang tải...</div>

    return (
        <div className="container">
            <div className={styles.header}>
                <h1>Kho từ vựng</h1>
                <p>Quản lý và tra cứu tất cả từ vựng N5 đã tải lên.</p>
            </div>

            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label>Bài học:</label>
                    <select
                        className="input"
                        value={filter.lessonId}
                        onChange={e => setFilter({ ...filter, lessonId: e.target.value === 'all' ? 'all' : Number(e.target.value) })}
                    >
                        <option value="all">Tất cả bài</option>
                        {lessons.map(l => (
                            <option key={l.id} value={l.id}>{l.title}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Trạng thái:</label>
                    <select
                        className="input"
                        value={filter.status}
                        onChange={e => setFilter({ ...filter, status: e.target.value })}
                    >
                        <option value="all">Tất cả</option>
                        <option value="new">Mới</option>
                        <option value="learning">Đang học</option>
                        <option value="mastered">Đã thuộc</option>
                    </select>
                </div>
            </div>

            <div className={styles.count}>
                Hiển thị <strong>{filteredVocabs.length}</strong> từ
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Hiragana</th>
                            <th>Kanji</th>
                            <th>Nghĩa</th>
                            <th>Nhóm</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVocabs.map(v => (
                            <tr key={v.id}>
                                <td className="jp">{v.hiragana}</td>
                                <td className="jp">{v.kanji}</td>
                                <td>{v.meaning}</td>
                                <td>
                                    {v.verbGroup ? <span className="badge badge-blue">V{v.verbGroup}</span> : '—'}
                                </td>
                                <td>
                                    <button
                                        className={`btn btn-sm ${v.status === 'mastered' ? 'btn-srs-good' : 'btn-ghost'}`}
                                        onClick={() => toggleStatus(v.id!, v.status)}
                                    >
                                        {v.status === 'mastered' ? 'Đã thuộc' : 'Chưa thuộc'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredVocabs.length === 0 && (
                <div className={styles.empty}>Không tìm thấy từ nào phù hợp.</div>
            )}
        </div>
    )
}
