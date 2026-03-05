'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './NavBar.module.css'

const NAV_LINKS = [
    { href: '/', label: 'Tổng quan' },
    { href: '/daily', label: '⭐ Hôm nay' },
    { href: '/flashcards', label: 'Từ vựng' },
    { href: '/grammar', label: 'Ngữ pháp' },
    { href: '/kanji', label: '漢字 Kanji' },
    { href: '/quiz', label: 'Quiz' },
    { href: '/vocabulary', label: 'Kho từ' },
    { href: '/progress', label: 'Tiến độ' },
    { href: '/settings', label: 'Cài đặt' },
]

export default function NavBar() {
    const pathname = usePathname()
    const [showFurigana, setShowFurigana] = useState(true)
    const [menuOpen, setMenuOpen] = useState(false)

    // Init furigana state from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('nihongo_furigana')
        const show = stored === null ? true : stored === 'true'
        setShowFurigana(show)
        document.documentElement.classList.toggle('furigana-hidden', !show)
    }, [])

    const toggleFurigana = () => {
        const next = !showFurigana
        setShowFurigana(next)
        localStorage.setItem('nihongo_furigana', String(next))
        document.documentElement.classList.toggle('furigana-hidden', !next)
    }

    return (
        <nav className={styles.navbar}>
            <div className={styles.inner}>
                {/* Logo */}
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoJp}>日本語</span>
                    <span className={styles.logoN5}>N5</span>
                </Link>

                {/* Desktop links */}
                <div className={styles.links}>
                    {NAV_LINKS.map(l => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={`${styles.link} ${pathname === l.href ? styles.active : ''}`}
                        >
                            {l.label}
                        </Link>
                    ))}
                </div>

                {/* Right controls */}
                <div className={styles.controls}>
                    {/* Furigana toggle */}
                    <button
                        className={`furigana-btn ${showFurigana ? 'active' : ''}`}
                        onClick={toggleFurigana}
                        title={showFurigana ? 'Ẩn furigana (luyện đọc kanji)' : 'Hiện furigana'}
                        aria-label="Bật/tắt furigana"
                    >
                        あ
                    </button>

                    {/* Upload shortcut */}
                    <Link href="/upload" className="btn btn-primary btn-sm">
                        + Tải lên
                    </Link>

                    {/* Hamburger */}
                    <button
                        className={styles.hamburger}
                        onClick={() => setMenuOpen(m => !m)}
                        aria-label="Mở menu"
                    >
                        <span /><span /><span />
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className={styles.mobileMenu}>
                    {NAV_LINKS.map(l => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={`${styles.mobileLink} ${pathname === l.href ? styles.active : ''}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            {l.label}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    )
}
