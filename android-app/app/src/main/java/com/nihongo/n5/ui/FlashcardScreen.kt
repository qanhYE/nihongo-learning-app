package com.nihongo.n5.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nihongo.n5.data.Vocabulary

@Composable
fun FlashcardScreen(
    word: Vocabulary,
    onAnswer: (quality: Int) -> Unit
) {
    var flipped by remember { mutableStateOf(false) }
    val rotation by animateFloatAsState(targetValue = if (flipped) 180f else 0f, label = "cardRotation")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Card Area
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .padding(vertical = 32.dp)
                .clickable { flipped = !flipped }
                .graphicsLayer {
                    rotationY = rotation
                    cameraDistance = 12f * density
                },
            contentAlignment = Alignment.Center
        ) {
            if (rotation <= 90f) {
                // Front: Kanji / Hiragana
                Card(modifier = Modifier.fillMaxSize()) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(
                            text = word.kanji ?: word.hiragana,
                            fontSize = 48.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            } else {
                // Back: Meaning
                Card(
                    modifier = Modifier
                        .fillMaxSize()
                        .graphicsLayer { rotationY = 180f }
                ) {
                    Column(
                        Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(text = word.meaning, fontSize = 28.sp)
                        Spacer(Modifier.height(8.dp))
                        Text(text = word.hiragana, fontSize = 18.sp, color = MaterialTheme.colorScheme.secondary)
                    }
                }
            }
        }

        // Action Buttons (Only visible if flipped)
        if (flipped || rotation > 90f) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                Button(onClick = { onAnswer(0) }, colors = ButtonDefaults.buttonColors(MaterialTheme.colorScheme.error)) {
                    Text("Quên")
                }
                Button(onClick = { onAnswer(3) }) {
                    Text("Khó")
                }
                Button(onClick = { onAnswer(4) }) {
                    Text("Được")
                }
                Button(onClick = { onAnswer(5) }) {
                    Text("Dễ")
                }
            }
        } else {
            Text(text = "Chạm vào thẻ để xem nghĩa", style = MaterialTheme.typography.bodyMedium)
        }
    }
}
