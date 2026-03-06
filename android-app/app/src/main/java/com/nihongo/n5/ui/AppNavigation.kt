package com.nihongo.n5.ui

import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Create
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.nihongo.n5.data.AppDatabase
import com.nihongo.n5.data.DataImportManager
import kotlinx.coroutines.launch

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Dashboard : Screen("dashboard", "Trang chủ", Icons.Filled.Home)
    object Vocabulary : Screen("vocabulary", "Từ vựng", Icons.Filled.List)
    object Grammar : Screen("grammar", "Ngữ pháp", Icons.Filled.Create)
    object Kanji : Screen("kanji", "Kanji", Icons.Filled.Star)
}

val bottomNavItems = listOf(Screen.Dashboard, Screen.Vocabulary, Screen.Grammar, Screen.Kanji)

@Composable
fun AppNavigation(
    db: AppDatabase
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // Live data from DB
    val vocabList by db.vocabularyDao().getAllVocab().collectAsState(initial = emptyList())
    val grammarList by db.vocabularyDao().getAllGrammar().collectAsState(initial = emptyList())
    val kanjiList by db.kanjiDao().getAllEntries().collectAsState(initial = emptyList())
    val vocabCount by db.vocabularyDao().getVocabCount().collectAsState(initial = 0)
    val grammarCount by db.vocabularyDao().getGrammarCount().collectAsState(initial = 0)
    val kanjiCount by db.kanjiDao().getKanjiCount().collectAsState(initial = 0)

    // File Picker
    val filePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            scope.launch {
                try {
                    val inputStream = context.contentResolver.openInputStream(it)
                    if (inputStream != null) {
                        val importer = DataImportManager(context)
                        val result = importer.importFromJson(inputStream)
                        result.onSuccess { summary ->
                            Toast.makeText(
                                context,
                                "Đã nhập: ${summary.vocabCount} từ, ${summary.grammarCount} ngữ pháp, ${summary.kanjiCount} kanji",
                                Toast.LENGTH_LONG
                            ).show()
                        }
                        result.onFailure { err ->
                            Toast.makeText(
                                context,
                                "Lỗi import: ${err.message}",
                                Toast.LENGTH_LONG
                            ).show()
                        }
                    }
                } catch (e: Exception) {
                    Toast.makeText(context, "Không thể đọc file: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    Scaffold(
        bottomBar = {
            NavigationBar {
                bottomNavItems.forEach { screen ->
                    NavigationBarItem(
                        icon = { Icon(screen.icon, contentDescription = screen.title) },
                        label = { Text(screen.title) },
                        selected = currentRoute == screen.route,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Dashboard.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Dashboard.route) {
                DashboardScreen(
                    onVocabClick = { navController.navigate(Screen.Vocabulary.route) },
                    onGrammarClick = { navController.navigate(Screen.Grammar.route) },
                    onKanjiClick = { navController.navigate(Screen.Kanji.route) },
                    onImportClick = { filePicker.launch("application/json") },
                    vocabCount = vocabCount,
                    grammarCount = grammarCount,
                    kanjiCount = kanjiCount,
                    dueCount = 0
                )
            }
            composable(Screen.Vocabulary.route) {
                VocabularyListScreen(vocabulary = vocabList)
            }
            composable(Screen.Grammar.route) {
                GrammarListScreen(grammarList = grammarList)
            }
            composable(Screen.Kanji.route) {
                KanjiListScreen(kanjiEntries = kanjiList)
            }
        }
    }
}
