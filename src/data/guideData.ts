import { BrowserType, FaqItem, MockChatMessage, StepItem } from '../types';

export const GITHUB_REPO_URL = 'https://github.com/123ok2/extentiongemini';
export const DIRECT_ZIP_URL = '/extentiongemini.zip';
export const GITHUB_ZIP_URL = 'https://github.com/123ok2/extentiongemini/archive/refs/heads/main.zip';
export const EXTENSION_VERSION = '2.5.0';

export const BROWSER_DATA: Record<BrowserType, {
  name: string;
  url: string;
  devModeGuide: string;
  iconName: string;
  unpackedBtnText: string;
}> = {
  chrome: {
    name: 'Google Chrome',
    url: 'chrome://extensions',
    devModeGuide: 'Gạt công tắc "Chế độ dành cho nhà phát triển" (Developer mode) ở góc trên bên phải sang BẬT',
    iconName: 'Chrome',
    unpackedBtnText: 'Tải tiện ích đã giải nén (Load unpacked)'
  },
  edge: {
    name: 'Microsoft Edge',
    url: 'edge://extensions',
    devModeGuide: 'Bật công tắc "Chế độ dành cho nhà phát triển" ở cột bên trái',
    iconName: 'Compass',
    unpackedBtnText: 'Tải phần mở rộng đã giải nén (Load unpacked)'
  },
  coccoc: {
    name: 'Cốc Cốc',
    url: 'coccoc://extensions',
    devModeGuide: 'Bật "Chế độ cho nhà phát triển" ở góc trên bên phải trang Quản lý tiện ích',
    iconName: 'Globe',
    unpackedBtnText: 'Tải tiện ích đã giải nén'
  },
  brave: {
    name: 'Brave Browser',
    url: 'brave://extensions',
    devModeGuide: 'Gạt công tắc "Developer mode" ở góc trên cùng bên phải',
    iconName: 'Shield',
    unpackedBtnText: 'Load unpacked'
  }
};

export const INSTALL_STEPS: StepItem[] = [
  {
    number: 1,
    title: 'Tải về và Giải nén file tiện ích',
    subtitle: 'Tải trọn bộ mã nguồn extension dạng file nén .ZIP về máy',
    description: 'Bấm vào nút "Tải Trọn Bộ Extension (.ZIP)" bên dưới để tải file về máy tính. Sau khi tải xong, click chuột phải vào file .zip và chọn "Extract All..." (hoặc "Giải nén ở đây") để mở thư mục.',
    actionText: 'Tải File ZIP (55 KB)',
    actionType: 'download',
    actionPayload: DIRECT_ZIP_URL,
    tips: [
      'Sau khi giải nén, bạn sẽ thấy thư mục con tên là `extentiongemini-main`.',
      'Kiểm tra bên trong thư mục có các file: `manifest.json`, `content.js`, `background.js`, `popup.html`.'
    ],
    warning: 'Không xóa thư mục này sau khi cài đặt, vì Chrome sẽ đọc code trực tiếp từ thư mục này mỗi khi bạn mở trình duyệt!'
  },
  {
    number: 2,
    title: 'Mở trang Quản lý Tiện ích của Trình duyệt',
    subtitle: 'Truy cập trang cài đặt extensions trên Chrome, Edge, Cốc Cốc',
    description: 'Sao chép đường dẫn `chrome://extensions` và dán vào thanh địa chỉ của trình duyệt, sau đó nhấn Enter. Hoặc bạn có thể bấm vào Menu (biểu tượng 3 chấm) -> Tiện ích mở rộng -> Quản lý tiện ích.',
    actionText: 'Sao chép chrome://extensions',
    actionType: 'copy',
    actionPayload: 'chrome://extensions',
    tips: [
      'Nếu bạn dùng Edge: gõ `edge://extensions`',
      'Nếu bạn dùng Cốc Cốc: gõ `coccoc://extensions`',
      'Trình duyệt bảo mật không cho phép web tự động mở link chrome:// nên bạn chỉ cần dán vào thanh URL.'
    ]
  },
  {
    number: 3,
    title: 'Bật "Chế độ dành cho nhà phát triển"',
    subtitle: 'Kích hoạt Developer Mode để cho phép cài đặt tiện ích từ thư mục',
    description: 'Nhìn lên góc trên cùng bên phải của trang Quản lý Tiện ích, bạn sẽ thấy nút gạt có tên "Chế độ dành cho nhà phát triển" (hoặc Developer mode). Hãy gạt nút này sang màu xanh (BẬT).',
    tips: [
      'Khi công tắc này được bật, một thanh công cụ phụ gồm 3 nút sẽ xuất hiện ở góc trên bên trái: "Tải tiện ích đã giải nén", "Đóng gói tiện ích", "Cập nhật".'
    ]
  },
  {
    number: 4,
    title: 'Tải tiện ích đã giải nén vào Trình duyệt',
    subtitle: 'Chọn thư mục chứa mã nguồn tiện ích vừa giải nén',
    description: 'Bấm vào nút "Tải tiện ích đã giải nén" (Load unpacked) ở góc trên bên trái. Cửa sổ chọn thư mục sẽ mở ra: Hãy duyệt và chọn đúng thư mục `extentiongemini-main` (nơi có chứa file manifest.json) rồi nhấn "Select Folder".',
    tips: [
      'Ngay lập tức, thẻ tiện ích "Gemini Study Exporter" phiên bản 2.6.0 sẽ hiển thị trong danh sách tiện ích.',
      'Nếu thấy báo lỗi "Không thể tải tệp kê khai", hãy kiểm tra lại bạn đã chọn đúng thư mục cấp trong chứa trực tiếp file `manifest.json` hay chưa.'
    ]
  },
  {
    number: 5,
    title: 'Ghim Tiện ích và Bắt đầu Trải nghiệm!',
    subtitle: 'Ghim icon lên thanh công cụ trình duyệt để tiện theo dõi',
    description: 'Nhấn vào biểu tượng mảnh ghép xếp hình (Extensions) ở góc trên bên phải trình duyệt, tìm "Gemini Study Exporter" và bấm vào biểu tượng chiếc ghim (Pin). Giờ đây, chỉ cần vào gemini.google.com là bạn đã có thể xuất trọn vẹn tài liệu học tập!',
    actionText: 'Mở Google Gemini',
    actionType: 'link',
    actionPayload: 'https://gemini.google.com',
    tips: [
      'Sau khi cài xong, bạn hãy F5 (Reload) lại tab Gemini đang mở để tiện ích bắt đầu chèn thanh công cụ xuất.',
      'Mỗi câu trả lời sẽ xuất hiện checkbox "Chọn phần này" và nút "Tải đoạn này".'
    ]
  }
];

export const FORMAT_DETAILS = [
  {
    format: 'pdf',
    name: 'Tài liệu PDF (A4)',
    color: 'bg-red-500 text-white',
    badge: 'Khuyên dùng cho In ấn & Nộp bài',
    description: 'Tự động mở cửa sổ in chuyên nghiệp, định dạng trang chuẩn A4 không bị che khuất lề, ngắt trang thông minh, bảo tồn hoàn hảo công thức toán, biểu đồ và khối code.',
    bestFor: 'Lưu trữ tài liệu học tập lâu dài, in ra giấy, nộp báo cáo hoặc gửi bài luận cho giáo viên.'
  },
  {
    format: 'word',
    name: 'File Word (.doc)',
    color: 'bg-blue-600 text-white',
    badge: 'Chỉnh sửa & Làm báo cáo',
    description: 'Xuất văn bản có cấu trúc tiêu đề, đoạn văn và bảng biểu rõ ràng, dễ dàng mở bằng Microsoft Word, Google Docs hoặc WPS Office để tiếp tục viết thêm.',
    bestFor: 'Sao chép vào đồ án, bài tập lớn, chèn thêm ghi chú cá nhân hoặc chỉnh sửa lời văn.'
  },
  {
    format: 'md',
    name: 'File Markdown (.md)',
    color: 'bg-purple-600 text-white',
    badge: 'Chuẩn LaTeX $...$ & $$...$$',
    description: 'Bảo lưu cú pháp Markdown nguyên bản với các khối công thức toán LaTeX bao quanh bởi `$..$` (nội dòng) và `$$..$$` (khối riêng biệt), tương thích 100% với các công cụ ghi chú hiện đại.',
    bestFor: 'Người dùng Obsidian, Notion, Logseq, Overleaf LaTeX, GitHub Readme hoặc lập trình viên.'
  },
  {
    format: 'html',
    name: 'File HTML Tự Chứa (Standalone)',
    color: 'bg-emerald-600 text-white',
    badge: 'Giao diện gốc 100%',
    description: 'File web tĩnh đóng gói trọn gói toàn bộ style CSS, font chữ và công thức toán. Bấm đúp chuột là mở được trên mọi máy tính và điện thoại mà không cần phần mềm đặc biệt.',
    bestFor: 'Gửi nhanh cho bạn bè xem ngay trên trình duyệt mà vẫn giữ nguyên màu sắc giao diện đẹp mắt.'
  }
];

export const FAQ_LIST: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'error',
    question: 'Tại sao khi bấm "Tải tiện ích đã giải nén" lại báo lỗi "Không thể tải tệp kê khai (manifest.json)"?',
    answer: 'Nguyên nhân phổ biến nhất là do bạn chọn nhầm thư mục mẹ (chứa thêm 1 thư mục con). Hãy giải nén file zip, mở vào bên trong và chọn thư mục cấp trong cùng có chứa trực tiếp file "manifest.json" (thường có tên là "extentiongemini-main").'
  },
  {
    id: 'faq-2',
    category: 'security',
    question: 'Tiện ích này có gửi dữ liệu hay cuộc trò chuyện của tôi lên mạng không?',
    answer: 'Hoàn toàn KHÔNG! Tiện ích này hoạt động 100% Client-side (xử lý trực tiếp trên trình duyệt của máy bạn). Không có bất kỳ API bên thứ ba, không gửi request mạng nào ra ngoài, không thu thập cookie hay token tài khoản cá nhân. Vì vậy tiện ích hoàn toàn an toàn và riêng tư.'
  },
  {
    id: 'faq-3',
    category: 'usage',
    question: 'Tại sao các tiện ích khác thường bị lỗi "Failed to fetch", còn tiện ích này thì không?',
    answer: 'Hầu hết các extension xuất chat thông thường gửi toàn bộ nội dung HTML lên một máy chủ đám mây (NodeJS / Python server) để chuyển đổi sang PDF. Khi server đó quá tải, mạng chập chờn hoặc hết hạn mức, người dùng sẽ nhận thông báo lỗi "Failed to fetch". Extension này sử dụng bộ engine kết xuất trực tiếp trên chính trình duyệt (Browser Native Renderer), không phụ thuộc vào bất kỳ server trung gian nào, tốc độ tải gần như tức thì.'
  },
  {
    id: 'faq-4',
    category: 'usage',
    question: 'Làm sao để chỉ lưu 1 hoặc 2 câu trả lời quan trọng chứ không muốn tải toàn bộ?',
    answer: 'Khi bạn kích hoạt extension và vào Gemini, ở góc mỗi tin nhắn sẽ có ô vuông checkbox ghi "Chọn phần này" hoặc nút "Tải đoạn này". Bạn chỉ cần tick vào những câu trả lời bạn muốn, thanh công cụ ở góc phải sẽ tự động hiển thị số mục đã chọn (ví dụ: "Đã chọn 2 phần") và bạn chỉ cần bấm "Tải Phần Đã Chọn".'
  },
  {
    id: 'faq-5',
    category: 'install',
    question: 'Khi tác giả cập nhật bản mới trên GitHub (https://github.com/123ok2/extentiongemini), làm sao tôi nâng cấp?',
    answer: 'Rất đơn giản: Bạn chỉ cần tải file ZIP mới nhất về, giải nén đè lên thư mục cũ, sau đó vào lại `chrome://extensions` và bấm vào nút biểu tượng Mũi tên xoay vòng (Cập nhật / Reload 🔄) tại thẻ extension là xong ngay.'
  },
  {
    id: 'faq-6',
    category: 'usage',
    question: 'Khi xuất PDF, làm thế nào để trang in sạch đẹp, không bị dính dòng ngày giờ hoặc tiêu đề URL của Chrome?',
    answer: 'Trong hộp thoại In của trình duyệt (Ctrl + P), hãy bấm mở rộng mục "Cài đặt khác" (More settings) -> Bỏ chọn ô "Tiêu đề và chân trang" (Headers and footers), đồng thời tick chọn ô "Đồ họa nền" (Background graphics). Trang tài liệu của bạn sẽ trông như một cuốn sách giáo trình chuyên nghiệp.'
  }
];

export const MOCK_CHAT_MESSAGES: MockChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'user',
    platform: 'gemini',
    content: 'Giải giúp mình tích phân suy rộng và tính định thức của ma trận cấp 2x2 sau nhé!',
    time: '14:20'
  },
  {
    id: 'ai-1',
    sender: 'ai',
    platform: 'gemini',
    content: 'Chào bạn! Dưới đây là lời giải chi tiết từng bước với công thức toán chuẩn xác:',
    mathSnippet: `\\int_{0}^{\\infty} x \\cdot e^{-x} \\, dx = \\left[ -x e^{-x} \\right]_0^\\infty + \\int_0^\\infty e^{-x} \\, dx = 0 + 1 = 1`,
    tableData: {
      headers: ['Thông số', 'Ký hiệu', 'Giá trị tính toán'],
      rows: [
        ['Tích phân', 'I_1', '1.000 (Hội tụ)'],
        ['Định thức ma trận A', '|A| = a_{11}a_{22} - a_{12}a_{21}', '14.50'],
        ['Trạng thái', 'Hội tụ tuyệt đối', 'Đạt chuẩn LaTeX']
      ]
    },
    codeSnippet: `# Code Python kiểm tra kết quả bằng thư viện Sympy
import sympy as sp

x = sp.Symbol('x')
f = x * sp.exp(-x)
result = sp.integrate(f, (x, 0, sp.oo))
print("Ket qua tich phan:", result) # Output: 1`,
    time: '14:21'
  },
  {
    id: 'msg-2',
    sender: 'user',
    platform: 'gemini',
    content: 'Hay quá! Bạn có thể tóm tắt dạng bảng để mình chép vào bài tập lớn không?',
    time: '14:22'
  },
  {
    id: 'ai-2',
    sender: 'ai',
    platform: 'gemini',
    content: 'Đây là bảng tổng hợp các công thức đạo hàm và tích phân thường gặp dành cho bạn:',
    tableData: {
      headers: ['Hàm số f(x)', 'Đạo hàm f\'(x)', 'Nguyên hàm F(x)'],
      rows: [
        ['x^n', 'n \\cdot x^{n-1}', '\\frac{x^{n+1}}{n+1} + C'],
        ['e^{ax}', 'a \\cdot e^{ax}', '\\frac{1}{a} e^{ax} + C'],
        ['\\sin(ax)', 'a \\cdot \\cos(ax)', '-\\frac{1}{a} \\cos(ax) + C']
      ]
    },
    time: '14:23'
  }
];
