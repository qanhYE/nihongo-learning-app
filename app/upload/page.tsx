'use client'

import { useState } from 'react'
import DocumentUploader, { type BatchFileResult, parseFileName } from '@/components/DocumentUploader'
import type { PdfType } from '@/components/DocumentUploader'
import { db } from '@/lib/db'
import type { Vocabulary, Grammar, KanjiEntry, KanjiSet } from '@/lib/db'
import styles from './page.module.css'

type PreviewData = {
    vocabulary: Omit<Vocabulary, 'id' | 'lessonId' | 'status'>[]
    grammar: Omit<Grammar, 'id' | 'lessonId'>[]
    kanjiEntries?: Omit<KanjiEntry, 'id' | 'kanjiSetId'>[]
    fileName: string
    pdfType: PdfType
}

// Group batch results by lesson number
type GroupedLesson = {
    lessonNumber: string
    files: BatchFileResult[]
    vocabulary: any[]
    grammar: any[]
    kanjiEntries: any[]
    pdfType: PdfType
}

function groupByLesson(results: BatchFileResult[]): GroupedLesson[] {
    const map = new Map<string, GroupedLesson>()

    for (const r of results) {
        const parsed = parseFileName(r.fileName)
        const key = `${parsed.pdfType}_${parsed.lessonNumber}`

        if (!map.has(key)) {
            map.set(key, {
                lessonNumber: parsed.lessonNumber,
                files: [],
                vocabulary: [],
                grammar: [],
                kanjiEntries: [],
                pdfType: parsed.pdfType,
            })
        }
        const group = map.get(key)!
        group.files.push(r)
        group.vocabulary.push(...(r.data.vocabulary ?? []))
        group.grammar.push(...(r.data.grammar ?? []))
        group.kanjiEntries.push(...(r.data.kanjiEntries ?? []))
    }

    return Array.from(map.values())
}

export default function UploadPage() {
    const [preview, setPreview] = useState<PreviewData | null>(null)
    const [batchGroups, setBatchGroups] = useState<GroupedLesson[]>([])
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    async function handleSave() {
        if (!preview && batchGroups.length === 0) return
        setSaving(true)
        try {
            if (batchGroups.length > 0) {
                // Batch save
                for (const group of batchGroups) {
                    await saveGroup(group)
                }
            } else if (preview) {
                // Single file save (backwards compatible)
                const parsed = parseFileName(preview.fileName)
                await saveGroup({
                    lessonNumber: parsed.lessonNumber,
                    files: [{ fileName: preview.fileName, pdfType: preview.pdfType, lessonNumber: parsed.lessonNumber, data: preview }],
                    vocabulary: preview.vocabulary ?? [],
                    grammar: preview.grammar ?? [],
                    kanjiEntries: preview.kanjiEntries ?? [],
                    pdfType: preview.pdfType,
                })
            }
            setSaved(true)
        } finally {
            setSaving(false)
        }
    }

    async function saveGroup(group: GroupedLesson) {
        const isKanji = group.pdfType === 'kanji' ||
            (group.pdfType === 'auto' && (group.kanjiEntries.length) > 0 && group.vocabulary.length === 0)

        if (isKanji) {
            const setId = `Kanji ${group.lessonNumber}`
            const kanjiSetId = await db.kanjiSets.add({
                setId, pdfSource: group.files.map(f => f.fileName).join(', '), createdAt: Date.now(),
            } as KanjiSet)
            const entries = group.kanjiEntries.map((e: any) => ({
                ...e, kanjiSetId, usageExamples: e.usageExamples ?? [],
            }))
            await db.kanjiEntries.bulkAdd(entries as KanjiEntry[])
        } else {
            const title = `Bài ${group.lessonNumber}`
            const lessonId = await db.lessons.add({
                title,
                lessonNumber: group.lessonNumber,
                pdfSource: group.files.map(f => f.fileName).join(', '),
                createdAt: Date.now(),
            })
            const vocabs = group.vocabulary.map((v: any) => ({
                ...v, lessonId, status: 'new' as const,
            }))
            if (vocabs.length > 0) await db.vocabulary.bulkAdd(vocabs)
            if (group.grammar.length > 0) {
                await db.grammar.bulkAdd(
                    group.grammar.map((g: any) => ({ ...g, lessonId }))
                )
            }
        }
    }

    const totalVocab = batchGroups.reduce((s, g) => s + g.vocabulary.length, 0) + (preview?.vocabulary?.length ?? 0)
    const totalGrammar = batchGroups.reduce((s, g) => s + g.grammar.length, 0) + (preview?.grammar?.length ?? 0)
    const totalKanji = batchGroups.reduce((s, g) => s + g.kanjiEntries.length, 0) + (preview?.kanjiEntries?.length ?? 0)
    const hasPreview = preview || batchGroups.length > 0

    return (
        <div className="container">
            <div className={styles.header}>
                <h1>Tải tài liệu lên</h1>
                <p>Upload nhiều ảnh cùng lúc. Đặt tên file theo mẫu để tự động phân loại.</p>
            </div>

            {/* Hướng dẫn đặt tên */}
            <div className="card" style={{ marginBottom: 16, padding: 16 }}>
                <h3 style={{ marginBottom: 8 }}>📋 Quy tắc đặt tên file</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
                    <div><code>tv_bai_1.png</code> → <strong>Từ vựng</strong> Bài 1</div>
                    <div><code>tv_bai_1(1).png</code> → Từ vựng Bài 1 (thêm trang)</div>
                    <div><code>np_bai_1.png</code> → <strong>Ngữ pháp</strong> Bài 1</div>
                    <div><code>kanji_bai_1.png</code> → <strong>Kanji</strong> Bài 1</div>
                </div>
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
                            setBatchGroups([])
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
                        onBatchResult={(results) => {
                            setError('')
                            setPreview(null)
                            setBatchGroups(groupByLesson(results))
                        }}
                    />

                    {error && <div className={styles.errorBanner}>{error}</div>}

                    {/* Batch Preview */}
                    {batchGroups.length > 0 && (
                        <div className={styles.preview}>
                            <h2>Kết quả phân loại — {batchGroups.reduce((s, g) => s + g.files.length, 0)} file</h2>

                            {batchGroups.map((group, i) => (
                                <div key={i} className="card" style={{ marginBottom: 12, padding: 16 }}>
                                    <h3>
                                        {group.pdfType === 'kanji' ? `漢 Kanji ${group.lessonNumber}` : `📚 Bài ${group.lessonNumber}`}
                                        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>
                                            ({group.files.length} file)
                                        </span>
                                    </h3>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                        Files: {group.files.map(f => f.fileName).join(', ')}
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
                                        {group.vocabulary.length > 0 && <span>📝 {group.vocabulary.length} từ vựng</span>}
                                        {group.grammar.length > 0 && <span>📖 {group.grammar.length} ngữ pháp</span>}
                                        {group.kanjiEntries.length > 0 && <span>漢 {group.kanjiEntries.length} kanji</span>}
                                    </div>
                                </div>
                            ))}

                            <div style={{ padding: '12px 0', fontWeight: 600 }}>
                                Tổng: {totalVocab} từ vựng, {totalGrammar} ngữ pháp, {totalKanji} kanji
                            </div>

                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Đang lưu...' : '💾 Lưu tất cả vào thư viện'}
                            </button>
                        </div>
                    )}

                    {/* Single file Preview */}
                    {preview && (
                        <div className={styles.preview}>
                            <h2>Kết quả trích xuất — {preview.fileName}</h2>

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
