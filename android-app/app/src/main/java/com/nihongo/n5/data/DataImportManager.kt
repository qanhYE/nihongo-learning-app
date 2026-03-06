package com.nihongo.n5.data

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.InputStream
import java.nio.charset.Charset

// ─── Raw JSON models matching Web App export ─────────────────────

@Serializable
data class ExportData(
    val version: Int = 1,
    val exportedAt: String = "",
    val lessons: List<LessonRaw> = emptyList(),
    val vocabulary: List<VocabRaw> = emptyList(),
    val grammar: List<GrammarRaw> = emptyList(),
    val kanjiSets: List<KanjiSetRaw> = emptyList(),
    val kanjiEntries: List<KanjiEntryRaw> = emptyList(),
    val srsRecords: List<SrsRecordRaw> = emptyList()
)

@Serializable
data class LessonRaw(
    val id: Long? = null,
    val title: String = "",
    val lessonNumber: String = "",
    val pdfSource: String = "",
    val createdAt: Long = 0
)

@Serializable
data class VocabRaw(
    val id: Long? = null,
    val lessonId: Long = 0,
    val hiragana: String = "",
    val kanji: String = "",
    val meaning: String = "",
    val verbGroup: String? = null,
    val status: String = "new"
)

@Serializable
data class GrammarRaw(
    val id: Long? = null,
    val lessonId: Long = 0,
    val sectionNumber: Int = 0,
    val title: String = "",
    val pattern: String = "",
    val explanation: String = "",
    val examples: List<GrammarExampleRaw> = emptyList()
)

@Serializable
data class GrammarExampleRaw(
    val japanese: String = "",
    val furigana: String = "",
    val vietnamese: String = ""
)

@Serializable
data class KanjiSetRaw(
    val id: Long? = null,
    val setId: String = "",
    val pdfSource: String = "",
    val createdAt: Long = 0
)

@Serializable
data class KanjiEntryRaw(
    val id: Long? = null,
    val kanjiSetId: Long = 0,
    val type: String = "single",
    val form: String = "",
    val reading: String = "",
    val meaning: String = "",
    val onyomi: String? = null,
    val kunyomi: String? = null,
    val strokeNotes: String? = null,
    val baseKanji: List<String>? = null,
    val usageExamples: List<KanjiUsageRaw> = emptyList()
)

@Serializable
data class KanjiUsageRaw(
    val sentence: String = "",
    val reading: String = "",
    val meaning: String = ""
)

@Serializable
data class SrsRecordRaw(
    val id: Long? = null,
    val itemId: Long = 0,
    val itemType: String = "",
    val easinessFactor: Double = 2.5,
    val interval: Int = 0,
    val repetitions: Int = 0,
    val dueDate: Long = 0,
    val lastScore: Int = 0
)

// ─── Import Manager ──────────────────────────────────────────────

class DataImportManager(private val context: Context) {
    private val db = AppDatabase.getDatabase(context)
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    suspend fun importFromJson(inputStream: InputStream): Result<ImportSummary> {
        return try {
            val content = inputStream.bufferedReader(Charset.forName("UTF-8")).use { it.readText() }
            val data = json.decodeFromString<ExportData>(content)

            // Clear existing data first
            db.lessonDao().deleteAllLessons()
            db.vocabularyDao().deleteAllVocab()
            db.kanjiDao().deleteAllSets()
            db.kanjiDao().deleteAllEntries()

            // Import Lessons and map old IDs to new IDs
            val lessonIdMap = mutableMapOf<Long, Long>()
            for (raw in data.lessons) {
                val entity = Lesson(
                    title = raw.title,
                    lessonNumber = raw.lessonNumber,
                    pdfSource = raw.pdfSource,
                    createdAt = raw.createdAt
                )
                val newId = db.lessonDao().insertLesson(entity)
                raw.id?.let { lessonIdMap[it] = newId }
            }

            // Import Vocabulary with remapped lesson IDs
            val vocabEntities = data.vocabulary.map { raw ->
                Vocabulary(
                    lessonId = lessonIdMap[raw.lessonId] ?: raw.lessonId,
                    hiragana = raw.hiragana,
                    kanji = raw.kanji.ifEmpty { null },
                    meaning = raw.meaning,
                    verbGroup = raw.verbGroup,
                    status = raw.status
                )
            }
            if (vocabEntities.isNotEmpty()) {
                db.vocabularyDao().insertAll(vocabEntities)
            }

            // Import Grammar with remapped lesson IDs
            val grammarEntities = data.grammar.map { raw ->
                val examplesStr = json.encodeToString(
                    kotlinx.serialization.builtins.ListSerializer(GrammarExampleRaw.serializer()),
                    raw.examples
                )
                Grammar(
                    lessonId = lessonIdMap[raw.lessonId] ?: raw.lessonId,
                    title = raw.title,
                    pattern = raw.pattern,
                    explanation = raw.explanation,
                    examplesJson = examplesStr
                )
            }
            if (grammarEntities.isNotEmpty()) {
                db.vocabularyDao().insertAllGrammar(grammarEntities)
            }

            // Import Kanji Sets and map IDs
            val kanjiSetIdMap = mutableMapOf<Long, Long>()
            for (raw in data.kanjiSets) {
                val entity = KanjiSet(
                    setId = raw.setId,
                    pdfSource = raw.pdfSource,
                    createdAt = raw.createdAt
                )
                val newId = db.kanjiDao().insertSet(entity)
                raw.id?.let { kanjiSetIdMap[it] = newId }
            }

            // Import Kanji Entries with remapped set IDs
            val kanjiEntities = data.kanjiEntries.map { raw ->
                val usageStr = json.encodeToString(
                    kotlinx.serialization.builtins.ListSerializer(KanjiUsageRaw.serializer()),
                    raw.usageExamples
                )
                KanjiEntry(
                    kanjiSetId = kanjiSetIdMap[raw.kanjiSetId] ?: raw.kanjiSetId,
                    type = raw.type,
                    form = raw.form,
                    reading = raw.reading,
                    meaning = raw.meaning,
                    onyomi = raw.onyomi,
                    kunyomi = raw.kunyomi,
                    strokeNotes = raw.strokeNotes,
                    examplesJson = usageStr
                )
            }
            if (kanjiEntities.isNotEmpty()) {
                db.kanjiDao().insertEntries(kanjiEntities)
            }

            Result.success(ImportSummary(
                vocabCount = vocabEntities.size,
                grammarCount = grammarEntities.size,
                kanjiCount = kanjiEntities.size
            ))
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }
}

data class ImportSummary(
    val vocabCount: Int,
    val grammarCount: Int,
    val kanjiCount: Int
)
