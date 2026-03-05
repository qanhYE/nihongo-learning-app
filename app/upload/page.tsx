'use client'

import { useState } from 'react'
import DocumentUploader from '@/components/DocumentUploader'
import { db } from '@/lib/db'
import type { Vocabulary, Grammar, KanjiEntry, KanjiSet } from '@/lib/db'
import styles from './page.module.css'

type PreviewData = {
    vocabulary: Omit<Vocabulary, 'id' | 'lessonId' | 'status'>[]
    grammar: Omit<Grammar, 'id' | 'lessonId'>[]
    kanjiEntries?: Omit<KanjiEntry, 'id' | 'kanjiSetId'>[]
    fileName: string
    pdfType: 'bai' | 'kanji' | 'auto'
}

export default function UploadPage() {
    const [preview, setPreview] = useState<PreviewData | null>(null)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    async function handleSave() {
        if (!preview) return
        setSaving(true)
        try {
            const isKanji = preview.pdfType === 'kanji' ||
                (preview.pdfType === 'auto' && (preview.kanjiEntries?.length ?? 0) > 0 && (preview.vocabulary?.length ?? 0) === 0)

            if (isKanji) {
                // Save as KanjiSet
                // Pattern: kanji_1.png -> Kanji 1
                let setId = preview.fileName.replace(/\.[^.]+$/, '')
                if (setId.toLowerCase().startsWith('kanji_')) {
                    const num = setId.match(/\d+/)?.[0]
                    setId = num ? `Kanji ${num}` : setId.replace('kanji_', 'Kanji ')
                } else {
                    setId = setId.slice(0, 20)
                }

                const kanjiSetId = await db.kanjiSets.add({
                    setId, pdfSource: preview.fileName, createdAt: Date.now(),
                } as KanjiSet)
                const entries = (preview.kanjiEntries ?? []).map(e => ({
                    ...e, kanjiSetId, usageExamples: e.usageExamples ?? [],
                }))
                await db.kanjiEntries.bulkAdd(entries as KanjiEntry[])
            } else {
                // Save as Lesson + vocab + grammar
                // Pattern: bai_1.png -> Bài 1
                const lessonNumber = preview.fileName.match(/\d+/)?.[0] ?? '?'
                const title = preview.fileName.toLowerCase().includes('bai')
                    ? `Bài ${lessonNumber}`
                    : preview.fileName.replace(/\.[^.]+$/, '').slice(0, 30)

                const lessonId = await db.lessons.add({
                    title,
                    lessonNumber,
                    pdfSource: preview.fileName,
                    createdAt: Date.now(),
                })
                const vocabs = preview.vocabulary.map(v => ({
                    ...v, lessonId, status: 'new' as const,
                }))
                await db.vocabulary.bulkAdd(vocabs)
                await db.grammar.bulkAdd(
                    preview.grammar.map(g => ({ ...g, lessonId }))
                )
            }
            setSaved(true)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="container">
            <div className={styles.header}>
                <h1>Tải tài liệu lên</h1>
                <p>Upload PDF hoặc ảnh chụp bài học. Gemini Vision sẽ tự động trích xuất nội dung.</p>
            </div>

            {saved ? (
                <div className={styles.successBanner}>
                    ✅ Đã lưu thành công! <a href="/vocabulary">Xem kho từ vựng →</a>
                </div>
            ) : (
                <>
                    <DocumentUploader
                        onResult={(data, fileName, pdfType) => {
                            setError('')
                            const previewData = data as any
                            setPreview({
                                vocabulary: previewData?.vocabulary || [],
                                grammar: previewData?.grammar || [],
                                kanjiEntries: previewData?.kanjiEntries || [],
                                fileName,
                                pdfType
                            })
                        }}
                        onError={setError}
                    />

                    {error && <div className={styles.errorBanner}>{error}</div>}

                    {/* Preview */}
                    {preview && (
                        <div className={styles.preview}>
                            <h2>Kết quả trích xuất — {preview.fileName}</h2>

                            {/* Vocab preview */}
                            {(preview.vocabulary?.length ?? 0) > 0 && (
                                <section>
                                    <h3>Từ vựng ({preview.vocabulary?.length ?? 0} từ)</h3>
                                    <div className={styles.previewTable}>
                                        <div className={styles.tableHead}>
                                            <span>Hiragana</span><span>Kanji</span><span>Nghĩa</span><span>Nhóm</span>
                                        </div>
                                        {preview.vocabulary?.slice(0, 20).map((v, i) => (
                                            <div key={i} className={styles.tableRow}>
                                                <span className="jp">{v.hiragana}</span>
                                                <span className="jp">{v.kanji}</span>
                                                <span>{v.meaning}</span>
                                                <span>{v.verbGroup ? <span className="badge badge-blue">{v.verbGroup}</span> : '—'}</span>
                                            </div>
                                        ))}
                                        {(preview.vocabulary?.length ?? 0) > 20 && (
                                            <p className={styles.more}>...và {(preview.vocabulary?.length ?? 0) - 20} từ nữa</p>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Grammar preview */}
                            {(preview.grammar?.length ?? 0) > 0 && (
                                <section>
                                    <h3>Ngữ pháp ({preview.grammar?.length ?? 0} mục)</h3>
                                    {preview.grammar?.slice(0, 3).map((g, i) => (
                                        <div key={i} className="card" style={{ marginBottom: 8 }}>
                                            <div className="jp" style={{ fontWeight: 600, fontSize: 18 }}>{g.pattern}</div>
                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0' }}>{g.explanation}</div>
                                        </div>
                                    ))}
                                </section>
                            )}

                            {/* Kanji preview */}
                            {(preview.kanjiEntries?.length ?? 0) > 0 && (
                                <section>
                                    <h3>Kanji ({preview.kanjiEntries!.length} mục)</h3>
                                    <div className={styles.kanjiGrid}>
                                        {preview.kanjiEntries!.slice(0, 12).map((k, i) => (
                                            <div key={i} className={`card ${styles.kanjiPreviewCard}`}>
                                                <ruby className="jp" style={{ fontSize: 28, fontWeight: 700 }}>
                                                    {k.form}<rt>{k.reading}</rt>
                                                </ruby>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k.meaning}</div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleSave}
                                disabled={saving}
                                style={{ marginTop: 16 }}
                            >
                                {saving ? 'Đang lưu...' : '💾 Lưu vào thư viện'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
