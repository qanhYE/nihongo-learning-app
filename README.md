# Nihongo N5 Mastery 🇯🇵

An AI-powered Japanese learning application designed specifically for the JLPT N5 level. This app allows you to upload study materials (PDF/Images), extract vocabulary and grammar using Gemini 2.5 Flash, and master them using a Spaced Repetition System (SRS).

> [!NOTE]
> **Vietnamese Version**: [README_VN.md](./README_VN.md)

## ✨ Features

- **AI Document Processing**: Upload scanned textbooks or photos of your lessons. Powered by **Gemini 2.5 Flash** for high-accuracy OCR and classification.
- **Dynamic Lesson Naming**: Automatically recognizes lesson names from filenames (e.g., `bai_1.png` becomes "Bài 1").
- **SRS Learning (Spaced Repetition)**: Uses the SM-2 algorithm to optimize your long-term memory.
- **Grammar & Kanji Modules**: Detailed extraction of grammar patterns and Kanji compounds with usage examples.
- **Smart Quizzes**: Generates 7 different types of quiz questions based on your current knowledge pool.
- **Furigana Toggle**: Global toggle for reading aids in grammar and vocabulary.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18.0 or higher.
- **npm** or **yarn**.
- **Gemini API Key**: Get one for free at [Google AI Studio](https://aistudio.google.com/app/apikey).

### Local Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd personal_project
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Access the app**: Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Configure API Key**: Go to the **Settings** page in the app and paste your Gemini API Key.

## ☁️ Deployment

### Deploying to Vercel (Recommended)

The easiest way to deploy this Next.js app is via the [Vercel Platform](https://vercel.com/new).

1. Push your code to GitHub/GitLab/Bitbucket.
2. Import your project into Vercel.
3. Vercel will automatically detect Next.js and configure the build settings.
4. **Environment Variables**: You don't need to set any environment variables in Vercel, as the API Key is stored securely in your browser's `localStorage` via the app's Settings page.

### Manual Build

```bash
npm run build
npm start
```

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: IndexedDB (via Dexie.js) - All data stays on your device.
- **AI**: Google Gemini 2.5 Flash
- **Styling**: Vanilla CSS (Custom Design System)

## 📄 License

This project is open-source. Feel free to use and modify it for your own learning journey!
