package com.nihongo.n5.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.nihongo.n5.data.Vocabulary

@Composable
fun VocabularyListScreen(
    vocabulary: List<Vocabulary>
) {
    if (vocabulary.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Chưa có từ vựng nào.\nHãy import dữ liệu từ Web App.", style = MaterialTheme.typography.bodyLarge)
        }
        return
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp)
    ) {
        items(vocabulary) { item ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = item.kanji ?: item.hiragana, style = MaterialTheme.typography.titleLarge)
                        Text(text = item.verbGroup ?: "", style = MaterialTheme.typography.bodySmall)
                    }
                    Text(text = item.hiragana, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.secondary)
                    Spacer(Modifier.height(4.dp))
                    Text(text = item.meaning, style = MaterialTheme.typography.bodyLarge)
                }
            }
        }
    }
}
