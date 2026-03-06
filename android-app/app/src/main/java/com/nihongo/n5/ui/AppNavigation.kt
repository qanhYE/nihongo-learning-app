package com.nihongo.n5.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.nihongo.n5.data.AppDatabase

@Composable
fun AppNavigation(
    db: AppDatabase
) {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "dashboard") {
        composable("dashboard") {
            DashboardScreen(
                onImportClick = { /* File Picker logic in Activity */ },
                onStartLearningClick = { navController.navigate("flashcards") },
                vocabCount = 0, // Should be observed from DB
                dueCount = 0
            )
        }
        composable("flashcards") {
            // Pick a word from DB and show FlashcardScreen
            // For MVP, if empty show a message
            Text("Không có từ nào cần ôn tập.")
        }
        composable("vocabulary") {
            VocabularyListScreen(vocabulary = emptyList()) // Should be observed from DB
        }
    }
}
