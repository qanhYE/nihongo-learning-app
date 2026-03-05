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
}

export default function DocumentUploader({ onResult, onError }: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [dragging, setDragging] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [progress, setProgress] = useState({ page: 0, total: 0 })
    const [pdfType, setPdfType] = useState<PdfType>('auto')

    const getApiKey = () => localStorage.getItem('nihongo_api_key') ?? ''

    async function processFile(file: File) {
        if (!isAcceptedFile(file)) {
            onError('Định dạng file không được hỗ trợ. Vui lòng dùng PDF, JPG, PNG, WEBP.')
            return
        }
        const apiKey = getApiKey()
        if (!apiKey) {
            onError('Chưa có Gemini API Key. Vào Cài đặt để nhập key.')
            return
        }

        setProcessing(true)
        setProgress({ page: 0, total: 0 })

        try {
            const pages = await fileToImagePages(file)
            setProgress({ page: 0, total: pages.length })

            const res = await fetch('/api/ocr-classify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pages, pdfType, apiKey }),
            })

            if (!res.ok) {
                const e = await res.json()
                throw new Error(e.error ?? 'Lỗi máy chủ')
            }

            const data = await res.json()
            onResult(data, file.name, pdfType)
        } catch (err) {
            onError(err instanceof Error ? err.message : 'Lỗi không xác định')
        } finally {
            setProcessing(false)
        }
    }

    // ── Drag & Drop ──────────────────────────────────────────────────
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) processFile(file)
    }

    return (
        <div className={styles.wrapper}>
            {/* Type selector */}
            <div className={styles.typeRow}>
                <span className={styles.typeLabel}>Loại tài liệu:</span>
                {(['auto', 'bai', 'kanji'] as PdfType[]).map(t => (
                    <button
                        key={t}
                        className={`chip ${pdfType === t ? 'active' : ''}`}
                        onClick={() => setPdfType(t)}
                    >
                        {t === 'auto' ? '🔍 Tự động' : t === 'bai' ? '📚 Bài học' : '漢 Kanji'}
                    </button>
                ))}
            </div>

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
                    className={styles.hidden}
                    onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }}
                />

                {processing ? (
                    <div className={styles.processingState}>
                        <div className="spinner" />
                        <p>
                            {progress.total > 0
                                ? `Đang xử lý trang ${progress.page}/${progress.total}...`
                                : 'Đang phân tích tài liệu...'}
                        </p>
                        {progress.total > 0 && (
                            <div className="progress-bar" style={{ width: 200 }}>
                                <div className="progress-fill" style={{ width: `${(progress.page / progress.total) * 100}%` }} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.idleState}>
                        <div className={styles.uploadIcon}>📄</div>
                        <p className={styles.uploadTitle}>Kéo thả hoặc nhấn để chọn file</p>
                        <p className={styles.uploadSub}>Hỗ trợ: PDF, JPG, PNG, WEBP</p>
                        {/* Mobile camera */}
                        <button
                            className={`btn btn-ghost btn-sm ${styles.cameraBtn}`}
                            onClick={e => {
                                e.stopPropagation()
                                const input = document.createElement('input')
                                input.type = 'file'
                                input.accept = 'image/*'
                                input.setAttribute('capture', 'camera')
                                input.onchange = () => { if (input.files?.[0]) processFile(input.files[0]) }
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
