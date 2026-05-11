# Hướng dẫn cài đặt Chrome Extension: MathType AI Online

Bạn có thể chuyển đổi ứng dụng hiện tại thành công cụ trên trình duyệt theo các bước sau:

### Bước 1: Chuẩn bị Source Code & Build (Quan trọng)
1. Nhấn vào menu **Settings** (biểu tượng bánh răng) trong AI Studio.
2. Chọn **Export to ZIP** để tải toàn bộ mã nguồn về máy tính.
3. Giải nén file ZIP.
4. Mở terminal tại thư mục vừa giải nén và chạy các lệnh sau:
   - `npm install` (để cài đặt thư viện)
   - `npm run build` (để tạo bản biên dịch cho Extension)

### Bước 2: Cài đặt vào Chrome
1. Mở trình duyệt Chrome, truy cập địa chỉ: `chrome://extensions/`.
2. Bật chế độ **Developer mode** (Góc trên bên phải).
3. Nhấn nút **Load unpacked**.
4. **CHÚ Ý:** Chọn thư mục `dist` (được tạo ra sau khi chạy lệnh build ở Bước 1), KHÔNG CHỌN thư mục gốc.

### Tại sao nhấp vào biểu tượng lại không thấy gì (Trắng xóa)?
- **Chưa Build:** Chrome không thể đọc trực tiếp file `.tsx` hoặc `.ts`. Bạn phải chạy `npm run build` để chuyển đổi chúng thành `.js` mà trình duyệt hiểu được.
- **Sai thư mục:** Bạn phải chọn thư mục `dist` khi Load unpacked.
- **Lỗi CSP (Bảo mật Chrome):** Extension MV3 không cho phép nạp script từ bên ngoài. Để sửa lỗi này:
   1. Xóa đoạn `<script src="https://cdn.tailwindcss.com"></script>` trong `index.html`.
   2. Xóa toàn bộ đoạn `<script type="importmap">...</script>` trong `index.html`.
   3. Thay thế bằng việc cài đặt qua npm (`npm install tailwindcss lucide-react ...`).
   4. Thêm `@import "tailwindcss";` vào `index.css`.

- **Thiếu Icon:** Đảm bảo thư mục `public` có chứa các file icon (icon16.png, icon48.png, icon128.png). Nếu chưa có, bạn có thể copy bất kỳ ảnh png nào vào và đổi tên.

### Cấu hình API Key
Sau khi build, nếu bạn muốn dùng tính năng AI:
- Hãy tạo file `.env` trong thư mục gốc (trước khi build) với nội dung: `GEMINI_API_KEY=your_key_here`.
- Hoặc cấu hình trực tiếp khóa API trong tệp `vite.config.ts`.


