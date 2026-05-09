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
                        children: parts.map(part => {
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
                            // Nếu là văn bản thường
                            return new TextRun({
                                text: part,
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
