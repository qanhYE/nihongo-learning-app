'use client'

import { useRef, useState } from 'react'
import { fileToImagePages, ACCEPTED_TYPES, isAcceptedFile } from '@/lib/pdfToImages'
import styles from './DocumentUploader.module.css'

export type PdfType = 'bai' | 'kanji' | 'auto'

interface Props {
    onResult: (data: {
        vocabulary: unknown[]; grammar: unknown[]; kanjiEntries?: unknown[]
    }, fileName: string, pdfType: PdfType) => void
    onError: (msg: string) => void
    onBatchResult?: (results: BatchFileResult[]) => void
}

export interface BatchFileResult {
    fileName: string
    pdfType: PdfType
    lessonNumber: string
    data: { vocabulary: unknown[]; grammar: unknown[]; kanjiEntries?: unknown[] }
}

/**
 * Parse filename to determine type and lesson number.
 * Patterns:
 *   tv_bai_1.png, tv_bai_1(1).png  → type: 'bai', lesson: '1'
 *   np_bai_1.png, np_bai_2.png     → type: 'bai', lesson: '1'/'2'
 *   kanji_bai_1.png, kanji_1.png   → type: 'kanji', lesson: '1'
 *   bai_1.png                      → type: 'bai', lesson: '1'
 */
export function parseFileName(fileName: string): { pdfType: PdfType; lessonNumber: string; category: 'tv' | 'np' | 'kanji' | 'mixed' } {
    const name = fileName.toLowerCase().replace(/\.[^.]+$/, '') // remove extension

    // tv_bai_X or tv_bai_X(n) → Vocabulary
    if (/^tv[_\-\s]?bai[_\-\s]?(\d+)/.test(name)) {
        const num = name.match(/(\d+)/)?.[1] ?? '?'
        return { pdfType: 'bai', lessonNumber: num, category: 'tv' }
    }

    // np_bai_X → Grammar
    if (/^np[_\-\s]?bai[_\-\s]?(\d+)/.test(name)) {
        const num = name.match(/(\d+)/)?.[1] ?? '?'
        return { pdfType: 'bai', lessonNumber: num, category: 'np' }
    }

    // kanji_bai_X or kanji_X → Kanji
    if (/^kanji[_\-\s]?(bai[_\-\s]?)?(\d+)/.test(name)) {
        const num = name.match(/(\d+)/)?.[1] ?? '?'
        return { pdfType: 'kanji', lessonNumber: num, category: 'kanji' }
    }

    // bai_X → Lesson (mixed vocab + grammar)
    if (/^bai[_\-\s]?(\d+)/.test(name)) {
        const num = name.match(/(\d+)/)?.[1] ?? '?'
        return { pdfType: 'bai', lessonNumber: num, category: 'mixed' }
    }

    // Unknown → auto detect
    const num = name.match(/(\d+)/)?.[1] ?? '?'
    return { pdfType: 'auto', lessonNumber: num, category: 'mixed' }
}

export default function DocumentUploader({ onResult, onError, onBatchResult }: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [dragging, setDragging] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [progress, setProgress] = useState({ current: 0, total: 0, fileName: '' })

    const getApiKey = () => localStorage.getItem('nihongo_api_key') ?? ''

    async function processFile(file: File): Promise<BatchFileResult | null> {
        const apiKey = getApiKey()
        if (!apiKey) {
            onError('Chưa có Gemini API Key. Vào Cài đặt để nhập key.')
            return null
        }

        try {
            const parsed = parseFileName(file.name)
            const pages = await fileToImagePages(file)

            const res = await fetch('/api/ocr-classify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pages, pdfType: parsed.pdfType, apiKey }),
            })

            if (!res.ok) {
                const e = await res.json()
                throw new Error(e.error ?? 'Lỗi máy chủ')
            }

            const data = await res.json()
            return {
                fileName: file.name,
                pdfType: parsed.pdfType,
                lessonNumber: parsed.lessonNumber,
                data,
            }
        } catch (err) {
            onError(`Lỗi file "${file.name}": ${err instanceof Error ? err.message : 'Không xác định'}`)
            return null
        }
    }

    async function processFiles(files: File[]) {
        const validFiles = files.filter(f => isAcceptedFile(f))
        if (validFiles.length === 0) {
            onError('Không có file hợp lệ. Hỗ trợ: PDF, JPG, PNG, WEBP.')
            return
        }

        setProcessing(true)
        setProgress({ current: 0, total: validFiles.length, fileName: '' })

        // Single file → use old behavior
        if (validFiles.length === 1) {
            const file = validFiles[0]
            setProgress({ current: 1, total: 1, fileName: file.name })
            const result = await processFile(file)
            if (result) {
                onResult(result.data, result.fileName, result.pdfType)
            }
            setProcessing(false)
            return
        }

        // Multi-file → batch process
        const results: BatchFileResult[] = []
        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i]
            setProgress({ current: i + 1, total: validFiles.length, fileName: file.name })
            const result = await processFile(file)
            if (result) results.push(result)
        }

        if (results.length > 0 && onBatchResult) {
            onBatchResult(results)
        }
        setProcessing(false)
    }

    // Drag & Drop
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        const files = Array.from(e.dataTransfer.files)
        processFiles(files)
    }

    return (
        <div className={styles.wrapper}>
            {/* Drop zone */}
            <div
                className={`${styles.dropZone} ${dragging ? styles.dragging : ''} ${processing ? styles.busy : ''}`}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => !processing && inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    multiple
                    className={styles.hidden}
                    onChange={e => {
                        const files = Array.from(e.target.files ?? [])
                        if (files.length > 0) processFiles(files)
                    }}
                />

                {processing ? (
                    <div className={styles.processingState}>
                        <div className="spinner" />
                        <p>
                            Đang xử lý {progress.current}/{progress.total}: <strong>{progress.fileName}</strong>
                        </p>
                        <div className="progress-bar" style={{ width: 200 }}>
                            <div className="progress-fill" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
                        </div>
                    </div>
                ) : (
                    <div className={styles.idleState}>
                        <div className={styles.uploadIcon}>📄</div>
                        <p className={styles.uploadTitle}>Kéo thả hoặc nhấn để chọn file</p>
                        <p className={styles.uploadSub}>Hỗ trợ: PDF, JPG, PNG, WEBP — <strong>Có thể chọn nhiều file</strong></p>
                        <p className={styles.uploadSub} style={{ fontSize: 12, marginTop: 4 }}>
                            Đặt tên file theo mẫu: <code>tv_bai_1.png</code> (từ vựng), <code>np_bai_1.png</code> (ngữ pháp), <code>kanji_bai_1.png</code> (kanji)
                        </p>
                        <button
                            className={`btn btn-ghost btn-sm ${styles.cameraBtn}`}
                            onClick={e => {
                                e.stopPropagation()
                                const input = document.createElement('input')
                                input.type = 'file'
                                input.accept = 'image/*'
                                input.setAttribute('capture', 'camera')
                                input.onchange = () => { if (input.files?.[0]) processFiles([input.files[0]]) }
                                input.click()
                            }}
                        >
                            📷 Chụp ảnh tài liệu
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
