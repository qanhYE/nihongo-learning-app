package com.nihongo.n5.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface LessonDao {
    @Query("SELECT * FROM lessons ORDER BY createdAt DESC")
    fun getAllLessons(): Flow<List<Lesson>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLesson(lesson: Lesson): Long

    @Query("SELECT * FROM vocabulary WHERE lessonId = :lessonId")
    fun getVocabularyByLesson(lessonId: Long): Flow<List<Vocabulary>>

    @Query("SELECT * FROM grammar WHERE lessonId = :lessonId")
    fun getGrammarByLesson(lessonId: Long): Flow<List<Grammar>>

    @Query("DELETE FROM lessons WHERE id = :lessonId")
    suspend fun deleteLesson(lessonId: Long)

    @Query("DELETE FROM lessons")
    suspend fun deleteAllLessons()
}

@Dao
interface VocabularyDao {
    @Query("SELECT * FROM vocabulary")
    fun getAllVocab(): Flow<List<Vocabulary>>

    @Query("SELECT COUNT(*) FROM vocabulary")
    fun getVocabCount(): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(vocab: List<Vocabulary>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAllGrammar(grammar: List<Grammar>)

    @Update
    suspend fun updateVocab(vocab: Vocabulary)

    @Query("DELETE FROM vocabulary")
    suspend fun deleteAllVocab()

    @Query("SELECT * FROM grammar")
    fun getAllGrammar(): Flow<List<Grammar>>

    @Query("SELECT COUNT(*) FROM grammar")
    fun getGrammarCount(): Flow<Int>
}

@Dao
interface KanjiDao {
    @Query("SELECT * FROM kanji_sets")
    fun getAllSets(): Flow<List<KanjiSet>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSet(set: KanjiSet): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEntries(entries: List<KanjiEntry>)

    @Query("SELECT * FROM kanji_entries WHERE kanjiSetId = :setId")
    fun getEntriesBySet(setId: Long): Flow<List<KanjiEntry>>

    @Query("SELECT * FROM kanji_entries")
    fun getAllEntries(): Flow<List<KanjiEntry>>

    @Query("SELECT COUNT(*) FROM kanji_entries")
    fun getKanjiCount(): Flow<Int>

    @Query("DELETE FROM kanji_sets")
    suspend fun deleteAllSets()

    @Query("DELETE FROM kanji_entries")
    suspend fun deleteAllEntries()
}
