import Dexie, { type Table } from 'dexie'

// ─── LESSON GROUP (linked to lesson) ────────────────────────────

export interface Lesson {
    id?: number
    title: string          // VD: "Bài 16"
    lessonNumber: string   // VD: "16"
    pdfSource: string      // tên file gốc
    createdAt: number      // timestamp
}

export interface Vocabulary {
    id?: number
    lessonId: number
    hiragana: string       // VD: "のります"
    kanji: string          // VD: "乗ります" (hoặc chuỗi ghép)
    meaning: string        // VD: "đi, lên [tàu]"
    verbGroup: 'I' | 'II' | 'III' | null
    status: 'new' | 'learning' | 'mastered'
}

export interface Grammar {
    id?: number
    lessonId: number
    sectionNumber: number
    title: string          // VD: "Cách nối 2 câu trở lên"
    pattern: string        // VD: "～て（で）"
    explanation: string    // giải thích tiếng Việt
    examples: GrammarExample[]
}

export interface GrammarExample {
    japanese: string
    furigana: string
    vietnamese: string
}

// ─── KANJI GROUP (independent from lessons) ─────────────────────

export interface KanjiSet {
    id?: number
    setId: string          // VD: "1-A", "1-B"
    pdfSource: string
    createdAt: number
}

export interface KanjiEntry {
    id?: number
    kanjiSetId: number
    type: 'single' | 'compound'
    form: string           // VD: "日" hoặc "日曜日"
    reading: string        // furigana: "にちようび"
    meaning: string        // nghĩa TV: "chủ nhật"
    // single only:
    onyomi?: string        // VD: "にち、じつ"
    kunyomi?: string       // VD: "ひ、か"
    strokeNotes?: string   // VD: "4 nét"
    // compound only:
    baseKanji?: string[]   // VD: ["日","曜","日"]
    usageExamples: KanjiUsage[]
}

export interface KanjiUsage {
    sentence: string
    reading: string
    meaning: string
}

// ─── SRS & QUIZ ──────────────────────────────────────────────────

export interface SrsRecord {
    id?: number
    itemId: number
    itemType: 'vocab' | 'grammar' | 'kanji'
    easinessFactor: number   // SM-2, bắt đầu 2.5
    interval: number         // số ngày đến lần ôn tiếp
    repetitions: number      // số lần đúng liên tiếp
    dueDate: number          // timestamp ngày cần ôn
    lastScore: number        // 0-5
}

export interface QuizResult {
    id?: number
    date: number
    itemId: number
    itemType: 'vocab' | 'grammar' | 'kanji'
    correct: boolean
    questionType: string
}

// ─── DATABASE CLASS ──────────────────────────────────────────────

class NihongoDB extends Dexie {
    lessons!: Table<Lesson>
    vocabulary!: Table<Vocabulary>
    grammar!: Table<Grammar>
    kanjiSets!: Table<KanjiSet>
    kanjiEntries!: Table<KanjiEntry>
    srsRecords!: Table<SrsRecord>
    quizResults!: Table<QuizResult>

    constructor() {
        super('NihongoDB')
        this.version(1).stores({
            lessons: '++id, lessonNumber, createdAt',
            vocabulary: '++id, lessonId, status, kanji',
            grammar: '++id, lessonId, sectionNumber',
            kanjiSets: '++id, setId, createdAt',
            kanjiEntries: '++id, kanjiSetId, type, form',
            srsRecords: '++id, [itemId+itemType], dueDate, itemType',
            quizResults: '++id, date, itemId, itemType',
        })
    }
}

export const db = new NihongoDB()

// ─── HELPERS ─────────────────────────────────────────────────────

export async function getAllVocabForLesson(lessonId: number) {
    return db.vocabulary.where('lessonId').equals(lessonId).toArray()
}

export async function getLearnedVocab() {
    return db.vocabulary.where('status').anyOf(['learning', 'mastered']).toArray()
}

export async function markVocabLearned(id: number) {
    await db.vocabulary.update(id, { status: 'learning' })
}
