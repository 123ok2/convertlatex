import { Document, Packer, Paragraph, TextRun, Math } from 'docx';

export default async function handler(req, res) {
    // 1. Cấu hình CORS để Extension từ trình duyệt có thể gọi tới
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Chỉ chấp nhận phương thức POST' });
    }

    try {
        const { content, title } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Nội dung không được để trống' });
        }

        // 2. Thuật toán tách văn bản và LaTeX (Tìm các cụm nằm giữa dấu $)
        // Ví dụ: "Tính $\int x dx$" -> ["Tính ", "$\int x dx$"]
        const parts = content.split(/(\$.*?\$)/g);

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: parts.map((part, index) => {
                            // Kiểm tra nếu là công thức toán học
                            if (part.startsWith('$') && part.endsWith('$')) {
                                const latex = part.slice(1, -1).trim(); // Bỏ dấu $
                                return new Math({
                                    children: [
                                        new TextRun({
                                            text: latex,
                                            // Sử dụng font Cambria Math để Word nhận diện tốt nhất
                                            font: "Cambria Math",
                                        }),
                                    ],
                                });
                            }
                            
                            // Chỉnh sửa văn bản thường:
                            // 1. Thu nhỏ các khoảng trắng trùng lặp bên trong thành 1 khoảng trắng duy nhất
                            let textVal = part.replace(/[^\S\r\n]{2,}/g, ' ');

                            // 2. Chuyển đổi khoảng trắng kề sát với công thức toán ($) thành khoảng trắng không ngắt (\u00A0)
                            // Điều này giúp MS Word nhận diện và giữ nguyên khoảng trắng phân cách khi hiển thị/import công thức
                            if (parts[index + 1] && parts[index + 1].startsWith('$') && textVal.endsWith(' ')) {
                                textVal = textVal.slice(0, -1) + '\u00A0';
                            }
                            if (parts[index - 1] && parts[index - 1].startsWith('$') && textVal.startsWith(' ')) {
                                textVal = '\u00A0' + textVal.slice(1);
                            }

                            return new TextRun({
                                text: textVal,
                                font: "Times New Roman",
                                size: 26, // Tương đương 13pt trong Word
                            });
                        }),
                    }),
                ],
            }],
        });

        // 3. Đóng gói file Word và gửi về cho Extension
        const buffer = await Packer.toBuffer(doc);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=${title || 'GiaoAn'}.docx`);
        
        return res.send(buffer);

    } catch (error) {
        console.error("Lỗi Server:", error);
        return res.status(500).json({ message: 'Lỗi khi tạo file Word', error: error.message });
    }
}
