package com.nihongo.n5.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFFE63946),
    secondary = Color(0xFF457B9D),
    tertiary = Color(0xFFA8DADC),
    background = Color(0xFF1D3557),
    surface = Color(0xFF1D3557),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.Black,
    onBackground = Color(0xFFF1FAEE),
    onSurface = Color(0xFFF1FAEE),
)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFFE63946),
    secondary = Color(0xFF457B9D),
    tertiary = Color(0xFF1D3557),
    background = Color(0xFFF1FAEE),
    surface = Color.White,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.White,
    onBackground = Color(0xFF1D3557),
    onSurface = Color(0xFF1D3557),
)

@Composable
fun NihongoN5Theme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
