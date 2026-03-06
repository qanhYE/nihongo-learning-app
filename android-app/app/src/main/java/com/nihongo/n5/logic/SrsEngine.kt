package com.nihongo.n5.logic

import kotlin.math.max

data class SrsState(
    val interval: Int,
    val repetitions: Int,
    val easeFactor: Double,
    val nextReview: Long
)

object SrsEngine {
    /**
     * SM-2 Algorithm Implementation
     * @param quality: 0-5 (0: total failure, 5: perfect response)
     */
    fun calculateNextState(
        quality: Int,
        prevInterval: Int,
        prevRepetitions: Int,
        prevEaseFactor: Double
    ): SrsState {
        var interval: Int
        var repetitions: Int
        var easeFactor: Double

        if (quality >= 3) {
            if (prevRepetitions == 0) {
                interval = 1
            } else if (prevRepetitions == 1) {
                interval = 6
            } else {
                interval = (prevInterval * prevEaseFactor).toInt()
            }
            repetitions = prevRepetitions + 1
            easeFactor = prevEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        } else {
            repetitions = 0
            interval = 1
            easeFactor = prevEaseFactor
        }

        if (easeFactor < 1.3) {
            easeFactor = 1.3
        }

        val nextReview = System.currentTimeMillis() + (interval.toLong() * 24 * 60 * 60 * 1000)

        return SrsState(interval, repetitions, easeFactor, nextReview)
    }
}
