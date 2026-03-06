package com.nihongo.n5.data

import androidx.room.*

@Entity(tableName = "lessons")
data class Lesson(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val lessonNumber: String,
    val pdfSource: String,
    val createdAt: Long
)

@Entity(
    tableName = "vocabulary",
    foreignKeys = [
        ForeignKey(
            entity = Lesson::class,
            parentColumns = ["id"],
            childColumns = ["lessonId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class Vocabulary(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val lessonId: Long,
    val hiragana: String,
    val kanji: String?,
    val meaning: String,
    val verbGroup: String?,
    val status: String = "new"
)

@Entity(
    tableName = "grammar",
    foreignKeys = [
        ForeignKey(
            entity = Lesson::class,
            parentColumns = ["id"],
            childColumns = ["lessonId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class Grammar(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val lessonId: Long,
    val title: String,
    val pattern: String,
    val explanation: String,
    val examplesJson: String // Serialized JSON string
)

@Entity(tableName = "kanji_sets")
data class KanjiSet(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val setId: String,
    val pdfSource: String,
    val createdAt: Long
)

@Entity(
    tableName = "kanji_entries",
    foreignKeys = [
        ForeignKey(
            entity = KanjiSet::class,
            parentColumns = ["id"],
            childColumns = ["kanjiSetId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class KanjiEntry(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val kanjiSetId: Long,
    val type: String,
    val form: String,
    val reading: String,
    val meaning: String,
    val onyomi: String?,
    val kunyomi: String?,
    val strokeNotes: String?,
    val examplesJson: String // Serialized JSON string
)
