import type { Metadata } from 'next'
import '@/styles/globals.css'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
    title: 'Nihongo N5 — Học Tiếng Nhật',
    description: 'Website học tiếng Nhật JLPT N5 dành cho người Việt. Flashcard, ngữ pháp, kanji, luyện tập hàng ngày với Spaced Repetition.',
    keywords: 'học tiếng nhật, JLPT N5, flashcard, kanji, ngữ pháp nhật',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body>
                <NavBar />
                <main className="page-content">
                    {children}
                </main>
            </body>
        </html>
    )
}
