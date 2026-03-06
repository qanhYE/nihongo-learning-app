import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Vocabulary, Grammar, KanjiEntry } from './db'

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */

export interface ClassifyResult {
  vocabulary: Omit<Vocabulary, 'id' | 'lessonId' | 'status'>[]
  grammar: Omit<Grammar, 'id' | 'lessonId'>[]
}

export interface KanjiClassifyResult {
  kanjiEntries: Omit<KanjiEntry, 'id' | 'kanjiSetId'>[]
}

export interface QuizQuestion {
  id: string
  type:
  | 'meaning_mc'
  | 'fill_word'
  | 'translate_nj_tv'
  | 'translate_tv_nj'
  | 'kanji_kana'
  | 'fill_blank'
  | 'listen_choose'
  | 'arrange_words'

  question: string
  questionJp?: string
  options?: string[]
  correctAnswer: string
  explanation?: string
  itemId: number
  itemType: 'vocab' | 'grammar' | 'kanji'
}

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */

const MAX_RETRY = 3
const PARALLEL_LIMIT = 4

/* ─────────────────────────────────────────────
   CLIENT
───────────────────────────────────────────── */

function getClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  })
}

/* ─────────────────────────────────────────────
   UTIL
───────────────────────────────────────────── */

function cleanJson(text: string) {
  return text.replace(/```json|```/g, '').trim()
}

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text)
  } catch {
    try {
      const fixed = text
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')

      return JSON.parse(fixed)
    } catch {
      return null
    }
  }
}

function stripBase64Prefix(data: string) {
  return data.replace(/^data:image\/\w+;base64,/, '')
}

async function retry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr

  for (let i = 0; i < MAX_RETRY; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      await new Promise(r => setTimeout(r, 800 * (i + 1)))
    }
  }

  throw lastErr
}

async function mapLimit<T, R>(
  list: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = []
  const executing: Promise<void>[] = []

  for (let i = 0; i < list.length; i++) {
    const p = fn(list[i], i).then(res => {
      results[i] = res
    })

    executing.push(p)

    if (executing.length >= limit) {
      await Promise.race(executing)
      executing.splice(
        executing.findIndex(e => e === p),
        1
      )
    }
  }

  await Promise.all(executing)

  return results
}

/* ─────────────────────────────────────────────
   OCR LESSON
───────────────────────────────────────────── */

export async function classifyLessonPages(
  pages: string[],
  apiKey: string,
  onProgress?: (page: number, total: number) => void
): Promise<ClassifyResult> {

  const model = getClient(apiKey)

  const results = await mapLimit(
    pages,
    PARALLEL_LIMIT,
    async (page, i) => {

      onProgress?.(i + 1, pages.length)

      const prompt = `Bạn là trợ lý OCR cho tài liệu học tiếng Nhật JLPT N5 bằng tiếng Việt.

Trang có cấu trúc:

PHẦN I - TỪ VỰNG:
[hira/kana] [kanji] [nghĩa TV]

PHẦN IV - NGỮ PHÁP:
mẫu câu → giải thích → ví dụ

Trả JSON:

{
"vocabulary":[
{"hiragana":"","kanji":"","meaning":"","verbGroup":"I|II|III|null"}
],
"grammar":[
{
"sectionNumber":1,
"title":"",
"pattern":"",
"explanation":"",
"examples":[
{"japanese":"","furigana":"","vietnamese":""}
]
}
]
}

Không markdown.`

      const base64 = stripBase64Prefix(page)

      const parsed = await retry(async () => {

        const res = await model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64
            }
          }
        ])

        const text = cleanJson(res.response.text())

        const json = safeJsonParse<ClassifyResult>(text)

        if (!json) {
          console.error("RAW RESPONSE:", text)
          throw new Error('Invalid JSON')
        }

        return json
      })

      return parsed
    }
  )

  const vocabulary: ClassifyResult['vocabulary'] = []
  const grammar: ClassifyResult['grammar'] = []

  for (const r of results) {
    vocabulary.push(...(r?.vocabulary ?? []))
    grammar.push(...(r?.grammar ?? []))
  }

  return { vocabulary, grammar }
}

/* ─────────────────────────────────────────────
   OCR KANJI
───────────────────────────────────────────── */

export async function classifyKanjiPages(
  pages: string[],
  apiKey: string,
  onProgress?: (page: number, total: number) => void
): Promise<KanjiClassifyResult> {

  const model = getClient(apiKey)

  const results = await mapLimit(
    pages,
    PARALLEL_LIMIT,
    async (page, i) => {

      onProgress?.(i + 1, pages.length)

      const prompt = `OCR tài liệu học Kanji JLPT N5 cho người Việt.

Trích xuất kanji đơn và từ ghép. TẤT CẢ nghĩa (meaning) PHẢI bằng TIẾNG VIỆT.

JSON:

{
"kanjiEntries":[
{
"type":"single|compound",
"form":"漢字 hoặc từ ghép",
"reading":"cách đọc bằng hiragana",
"meaning":"nghĩa TIẾNG VIỆT (VD: nước, lửa, núi)",
"onyomi":"âm on bằng katakana",
"kunyomi":"âm kun bằng hiragana",
"baseKanji":[],
"usageExamples":[
{"sentence":"câu ví dụ","reading":"cách đọc","meaning":"nghĩa tiếng Việt"}
]
}
]
}`


      const base64 = stripBase64Prefix(page)

      const parsed = await retry(async () => {

        const res = await model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64
            }
          }
        ])

        const text = cleanJson(res.response.text())

        const json = safeJsonParse<KanjiClassifyResult>(text)

        if (!json) {
          console.error("RAW RESPONSE:", text)
          throw new Error("Invalid JSON")
        }

        return json
      })

      return parsed
    }
  )

  const kanjiEntries: KanjiClassifyResult['kanjiEntries'] = []

  for (const r of results) {
    kanjiEntries.push(...(r?.kanjiEntries ?? []))
  }

  return { kanjiEntries }
}

/* ─────────────────────────────────────────────
   GENERATE QUIZ
───────────────────────────────────────────── */

export async function generateQuizQuestions(
  items: Array<{ itemId: number; itemType: 'vocab' | 'grammar' | 'kanji'; data: unknown }>,
  count: number,
  apiKey: string
): Promise<QuizQuestion[]> {

  const model = getClient(apiKey)

  const prompt = `Bạn là giáo viên tiếng Nhật. Tạo chính xác ${count} câu hỏi quiz JLPT N5 cho người Việt từ dữ liệu sau.

Dữ liệu:
${JSON.stringify(items.slice(0, 50), null, 2)}

MỖI câu hỏi PHẢI có đúng cấu trúc JSON sau:
{
  "id": "q1",
  "type": "meaning_mc",
  "question": "Câu hỏi bằng tiếng Việt (BẮT BUỘC, KHÔNG ĐƯỢC ĐỂ TRỐNG)",
  "questionJp": "Phần tiếng Nhật nếu có",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "đáp án đúng (phải nằm trong options)",
  "explanation": "giải thích ngắn gọn",
  "itemId": 1,
  "itemType": "vocab"
}

QUY TẮC BẮT BUỘC:
- "question" PHẢI có nội dung câu hỏi rõ ràng bằng tiếng Việt, VÍ DỤ: "Từ 'たべます' có nghĩa là gì?"
- "type" PHẢI là một trong: "meaning_mc", "fill_blank", "translate_nj_tv", "translate_tv_nj", "kanji_kana"
- Nếu type là "meaning_mc", "translate_nj_tv" hoặc "fill_blank" thì BẮT BUỘC có "options" (array 4 lựa chọn)
- Nếu type là "translate_tv_nj" hoặc "kanji_kana" thì KHÔNG cần options (người dùng tự nhập)
- "correctAnswer" phải chính xác khớp với một trong các options (nếu có options)
- "itemId" và "itemType" phải lấy từ dữ liệu đầu vào
- "id" tăng dần: "q1", "q2", ...

Ưu tiên tạo câu hỏi trắc nghiệm (meaning_mc) để dễ làm hơn.

Trả về ĐÚNG JSON array, không thêm text nào khác.`

  const parsed = await retry(async () => {

    const res = await model.generateContent([prompt])

    const text = cleanJson(res.response.text())

    const json = safeJsonParse<QuizQuestion[]>(text)

    if (!json) {
      console.error("RAW RESPONSE:", text)
      throw new Error("Invalid JSON")
    }

    // Validate: ensure every question has the required 'question' field
    for (const q of json) {
      if (!q.question || q.question.trim() === '') {
        q.question = q.questionJp
          ? `Câu hỏi về: ${q.questionJp}`
          : `Câu hỏi #${q.id}`
      }
    }

    return json
  })

  return parsed
}


/* ─────────────────────────────────────────────
   MNEMONIC
───────────────────────────────────────────── */

export async function generateMnemonic(
  word: string,
  meaning: string,
  apiKey: string
): Promise<string> {

  const model = getClient(apiKey)

  const prompt = `Tạo mẹo nhớ cho người Việt học tiếng Nhật.

word: ${word}
meaning: ${meaning}

Trả JSON:
{
"mnemonic":"..."
}`

  const parsed = await retry(async () => {

    const res = await model.generateContent([prompt])

    const text = cleanJson(res.response.text())

    const json = safeJsonParse<{ mnemonic: string }>(text)

    if (!json) throw new Error('Invalid JSON')

    return json
  })

  return parsed.mnemonic
}