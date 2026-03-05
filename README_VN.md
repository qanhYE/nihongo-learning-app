# Nihongo N5 Mastery 🇯🇵

Ứng dụng học tiếng Nhật N5 hỗ trợ bởi AI, được thiết kế để giúp bạn học tập từ các tài liệu cá nhân một cách thông minh và hiệu quả.

> [!NOTE]
> **English Version**: [README.md](./README.md)

## ✨ Tính năng nổi bật

- **Xử lý tài liệu bằng AI**: Tải lên ảnh chụp sách hoặc file PDF. Sử dụng **Gemini 2.5 Flash** để tự động trích xuất từ vựng và ngữ pháp.
- **Nhận diện tên bài thông minh**: Tự động đặt tên bài dựa trên tên file (VD: `bai_1.png` sẽ được lưu là "Bài 1").
- **Hệ thống SRS (Ghi nhớ ngắt quãng)**: Sử dụng thuật toán SM-2 để tối ưu hóa việc ôn tập dựa trên mức độ ghi nhớ của bạn.
- **Kho dữ liệu Kanji & Ngữ pháp**: Trích xuất chi tiết cấu trúc ngữ pháp, ví dụ minh họa và các từ ghép Kanji.
- **Quiz thông minh**: Tự động tạo 7 dạng câu hỏi trắc nghiệm và điền từ từ kho kiến thức bạn đã tải lên.
- **Toggle Furigana**: Nút chuyển đổi phiên âm tiện lợi trên toàn hệ thống.

## 🚀 Bắt đầu

### Yêu cầu cấu hình

- **Node.js**: Phiên bản 18.0 trở lên.
- **npm** hoặc **yarn**.
- **Gemini API Key**: Đăng ký miễn phí tại [Google AI Studio](https://aistudio.google.com/app/apikey).

### Cài đặt Local

1. **Clone project**:
   ```bash
   git clone <url-repository-cua-ban>
   cd personal_project
   ```

2. **Cài đặt thư viện**:
   ```bash
   npm install
   ```

3. **Chạy server phát triển**:
   ```bash
   npm run dev
   ```

4. **Truy cập**: Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt.

5. **Cấu hình API Key**: Vào trang **Cài đặt** trong ứng dụng và dán API Key của bạn vào.

## ☁️ Triển khai (Deploy)

### Triển khai lên Vercel (Khuyến nghị)

Cách đơn giản nhất để deploy ứng dụng Next.js là sử dụng [Vercel](https://vercel.com/new).

1. Đẩy code của bạn lên GitHub/GitLab/Bitbucket.
2. Import project vào Vercel.
3. Vercel sẽ tự động cấu hình build.
4. **Biến môi trường**: Bạn không cần cài đặt biến môi trường trên Vercel, vì API Key được lưu trực tiếp trong `localStorage` của trình duyệt thông qua trang Cài đặt của app.

### Build thủ công

```bash
npm run build
npm start
```

## 🛠 Công nghệ sử dụng

- **Framework**: Next.js 14 (App Router)
- **Cơ sở dữ liệu**: IndexedDB (qua Dexie.js) - Toàn bộ dữ liệu nằm trên thiết bị của bạn.
- **AI**: Google Gemini 2.5 Flash
- **Styling**: Vanilla CSS

## 📄 Bản quyền

Dự án này là mã nguồn mở. Bạn có thể tự do sử dụng và chỉnh sửa cho mục đích học tập cá nhân!
