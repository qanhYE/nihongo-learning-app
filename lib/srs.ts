import { db, type SrsRecord } from './db'

// ─── SM-2 ALGORITHM ──────────────────────────────────────────────
// score: 0 = blackout, 1 = wrong, 2 = wrong but familiar
//        3 = correct but hard, 4 = correct, 5 = perfect

export function calculateSM2(record: SrsRecord, score: 0 | 1 | 2 | 3 | 4 | 5): Omit<SrsRecord, 'id' | 'itemId' | 'itemType'> {
    let { easinessFactor, interval, repetitions } = record

    if (score < 3) {
        // Failed → reset
        repetitions = 0
        interval = 1
    } else {
        if (repetitions === 0) interval = 1
        else if (repetitions === 1) interval = 6
        else interval = Math.round(interval * easinessFactor)
        repetitions += 1
    }

    // Adjust easiness factor
    easinessFactor = Math.max(
        1.3,
        easinessFactor + 0.1 - (5 - score) * (0.08 + (5 - score) * 0.02)
    )

    const dueDate = Date.now() + interval * 24 * 60 * 60 * 1000

    return { easinessFactor, interval, repetitions, dueDate, lastScore: score }
}

// ─── UPDATE SRS ───────────────────────────────────────────────────

export async function updateSRS(
    itemId: number,
    itemType: SrsRecord['itemType'],
    score: 0 | 1 | 2 | 3 | 4 | 5
): Promise<void> {
    // Guard: skip if itemId or itemType is invalid
    if (itemId == null || itemType == null) {
        console.warn('[SRS] skipped update: invalid itemId or itemType', { itemId, itemType })
        return
    }

    const existing = await db.srsRecords
        .where('[itemId+itemType]')
        .equals([itemId, itemType])
        .first()

    const defaults: Omit<SrsRecord, 'id'> = {
        itemId, itemType,
        easinessFactor: 2.5, interval: 0, repetitions: 0,
        dueDate: Date.now(), lastScore: score,
    }

    const base = existing ?? defaults
    const updated = calculateSM2(base as SrsRecord, score)

    if (existing?.id) {
        await db.srsRecords.update(existing.id, updated)
    } else {
        await db.srsRecords.add({ ...defaults, ...updated })
    }

    // Sync vocabulary status based on SRS progress
    if (itemType === 'vocab') {
        const newReps = updated.repetitions
        let newStatus: 'learning' | 'mastered' | undefined
        if (newReps >= 3 && score >= 4) {
            newStatus = 'mastered'
        } else if (score >= 3) {
            newStatus = 'learning'
        }
        if (newStatus) {
            const vocab = await db.vocabulary.get(itemId)
            if (vocab && vocab.status !== newStatus) {
                // Don't downgrade from mastered to learning
                if (!(vocab.status === 'mastered' && newStatus === 'learning')) {
                    await db.vocabulary.update(itemId, { status: newStatus })
                }
            }
        }
        // If score is very low, reset to learning
        if (score <= 1) {
            await db.vocabulary.update(itemId, { status: 'learning' })
        }
    }
}



// ─── GET DUE ITEMS ────────────────────────────────────────────────

export async function getDueVocabs() {
    const now = Date.now()
    const dueRecords = await db.srsRecords
        .where('itemType').equals('vocab')
        .and(r => r.dueDate <= now)
        .toArray()
    const ids = dueRecords.map(r => r.itemId)
    return db.vocabulary.where('id').anyOf(ids).toArray()
}

export async function getDueKanji() {
    const now = Date.now()
    const dueRecords = await db.srsRecords
        .where('itemType').equals('kanji')
        .and(r => r.dueDate <= now)
        .toArray()
    const ids = dueRecords.map(r => r.itemId)
    return db.kanjiEntries.where('id').anyOf(ids).toArray()
}

export async function getDueCount(): Promise<number> {
    const now = Date.now()
    return db.srsRecords.where('dueDate').belowOrEqual(now).count()
}

// ─── WEIGHTED QUIZ POOL ───────────────────────────────────────────
// Items with poor results appear more frequently

export interface WeightedItem {
    itemId: number
    itemType: SrsRecord['itemType']
    weight: number
}

export async function getWeightedQuizPool(count: number): Promise<WeightedItem[]> {
    const allRecords = await db.srsRecords.toArray()

    // If no SRS records exist yet, build pool from ALL data directly
    if (allRecords.length === 0) {
        const pool: WeightedItem[] = []
        const allVocab = await db.vocabulary.toArray()
        const allGrammar = await db.grammar.toArray()
        const allKanji = await db.kanjiEntries.toArray()

        for (const v of allVocab) {
            if (v.id != null) pool.push({ itemId: v.id, itemType: 'vocab', weight: 2 })
        }
        for (const g of allGrammar) {
            if (g.id != null) pool.push({ itemId: g.id, itemType: 'grammar', weight: 2 })
        }
        for (const k of allKanji) {
            if (k.id != null) pool.push({ itemId: k.id, itemType: 'kanji', weight: 1 })
        }

        // Shuffle and take `count`
        const shuffled = pool.sort(() => Math.random() - 0.5)
        return shuffled.slice(0, count)
    }

    const weighted: WeightedItem[] = allRecords.map(r => {
        let weight = 1
        if (r.lastScore <= 2) weight = 3
        if (r.repetitions >= 5) weight *= 0.3
        if (r.repetitions === 0) weight = 2
        return { itemId: r.itemId, itemType: r.itemType, weight }
    })

    // Weighted random sampling
    const selected: WeightedItem[] = []
    const pool = [...weighted]

    for (let i = 0; i < Math.min(count, pool.length); i++) {
        const totalWeight = pool.reduce((s, w) => s + w.weight, 0)
        let rand = Math.random() * totalWeight
        for (let j = 0; j < pool.length; j++) {
            rand -= pool[j].weight
            if (rand <= 0) {
                selected.push(pool[j])
                pool.splice(j, 1)
                break
            }
        }
    }

    return selected
}


// ─── STREAK ───────────────────────────────────────────────────────

export function getTodayKey() {
    return new Date().toISOString().slice(0, 10)
}

export function getStreak(): number {
    const stored = localStorage.getItem('nihongo_streak')
    if (!stored) return 0
    const { lastDate, count } = JSON.parse(stored) as { lastDate: string; count: number }
    const today = getTodayKey()
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (lastDate === today) return count
    if (lastDate === yesterday) return count
    return 0
}

export function recordDailyComplete() {
    const today = getTodayKey()
    const stored = localStorage.getItem('nihongo_streak')
    let count = 1
    if (stored) {
        const prev = JSON.parse(stored) as { lastDate: string; count: number }
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        if (prev.lastDate === yesterday) count = prev.count + 1
        else if (prev.lastDate === today) count = prev.count
    }
    localStorage.setItem('nihongo_streak', JSON.stringify({ lastDate: today, count }))
}
