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

}

@Dao
interface VocabularyDao {
    @Query("SELECT * FROM vocabulary")
    fun getAllVocab(): Flow<List<Vocabulary>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(vocab: List<Vocabulary>)

    @Update
    suspend fun updateVocab(vocab: Vocabulary)
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
}
