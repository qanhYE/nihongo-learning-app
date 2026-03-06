# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in C:\Users\quoca\AppData\Local\Android\Sdk/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.kts.

-keep class com.nihongo.n5.data.** { *; }
-keep class androidx.room.** { *; }
-keep class kotlinx.serialization.** { *; }
