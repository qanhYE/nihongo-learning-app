package com.nihongo.n5.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun DashboardScreen(
    onVocabClick: () -> Unit,
    onGrammarClick: () -> Unit,
    onKanjiClick: () -> Unit,
    onImportClick: () -> Unit,
    vocabCount: Int,
    grammarCount: Int,
    kanjiCount: Int,
    dueCount: Int
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Header
        Text(
            text = "Nihongo N5",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Ứng dụng học tiếng Nhật",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Due review card
        if (dueCount > 0) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "📖 Cần ôn tập ngay",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(text = "$dueCount từ đang chờ ôn tập", style = MaterialTheme.typography.bodyMedium)
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // 3 Category Cards
        Text("Danh mục học tập", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            CategoryCard(
                modifier = Modifier.weight(1f),
                title = "Từ vựng",
                emoji = "📝",
                count = vocabCount,
                onClick = onVocabClick
            )
            CategoryCard(
                modifier = Modifier.weight(1f),
                title = "Ngữ pháp",
                emoji = "📖",
                count = grammarCount,
                onClick = onGrammarClick
            )
            CategoryCard(
                modifier = Modifier.weight(1f),
                title = "Kanji",
                emoji = "漢",
                count = kanjiCount,
                onClick = onKanjiClick
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        // Import button
        OutlinedButton(
            onClick = onImportClick,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(text = "📥 Nhập dữ liệu từ Web (.json)")
        }
    }
}

@Composable
fun CategoryCard(
    modifier: Modifier = Modifier,
    title: String,
    emoji: String,
    count: Int,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .aspectRatio(0.9f)
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(text = emoji, fontSize = 32.sp)
            Spacer(Modifier.height(8.dp))
            Text(text = title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            Text(text = "$count", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
