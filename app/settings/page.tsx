'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import styles from './page.module.css'

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState('')
    const [status, setStatus] = useState<string | null>(null)

    useEffect(() => {
        const saved = localStorage.getItem('nihongo_api_key')
        if (saved) setApiKey(saved)
    }, [])

    const save = () => {
        localStorage.setItem('nihongo_api_key', apiKey)
        setStatus('Đã lưu thành công!')
        setTimeout(() => setStatus(null), 3000)
    }

    const clearData = async () => {
        if (!window.confirm('CẢNH BÁO: Tất cả từ vựng, ngữ pháp, kanji đã tải lên và tiến độ học tập của bạn sẽ bị xóa vĩnh viễn. Bạn có chắc chắn muốn tiếp tục?')) {
            return
        }

        try {
            // Clear all tables in IndexedDB
            await Promise.all([
                db.lessons.clear(),
                db.vocabulary.clear(),
                db.grammar.clear(),
                db.kanjiSets.clear(),
                db.kanjiEntries.clear(),
                db.srsRecords.clear(),
                db.quizResults.clear(),
            ])
            // Clear LocalStorage
            localStorage.clear()
            alert('Đã xóa toàn bộ dữ liệu. Trang web sẽ tải lại.')
            window.location.href = '/'
        } catch (err) {
            console.error('Lỗi khi xóa dữ liệu:', err)
            alert('Có lỗi xảy ra khi xóa dữ liệu.')
        }
    }

    return (
        <div className="container">
            <div className={styles.header}>
                <h1>Cài đặt</h1>
                <p>Cấu hình ứng dụng và kết nối API.</p>
            </div>

            <div className="card">
                <div className={styles.settingItem}>
                    <label>Gemini API Key</label>
                    <p className={styles.desc}>Cần thiết để thực hiện OCR và tạo Quiz. Đăng ký tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>.</p>
                    <input
                        type="password"
                        className="input"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Nhập API key của bạn..."
                    />
                </div>

                <div className={styles.actions}>
                    <button className="btn btn-primary" onClick={save}>Lưu cài đặt</button>
                    {status && <span className={styles.status}>{status}</span>}
                </div>
            </div>

            <div className={styles.dangerZone}>
                <h2>Vùng nguy hiểm</h2>
                <p className={styles.desc}>Xóa toàn bộ dữ liệu bài học, từ vựng và tiến độ học tập đã lưu trên trình duyệt này.</p>
                <button className={styles.btnDanger} onClick={clearData}>Xóa toàn bộ dữ liệu</button>
            </div>

            <div className={styles.footer}>
                <p>Ứng dụng Nihongo N5 v0.1.0 — Dữ liệu được lưu trữ cục bộ trên trình duyệt của bạn.</p>
            </div>
        </div>
    )
}
