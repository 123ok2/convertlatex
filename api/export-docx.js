// File: /api/export-docx.js
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

export default async function handler(req, res) {
    // 1. Chỉ nhận dữ liệu gửi lên (POST)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { content, title } = req.body;

        // 2. Tạo nội dung file Word với Font Times New Roman
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: title || "GIÁO ÁN ĐIỆN TỬ",
                                bold: true,
                                size: 28, // 14pt
                                font: "Times New Roman",
                            }),
                        ],
                        spacing: { after: 400 },
                    }),
                    // Chia nhỏ nội dung theo dòng để tạo Paragraph
                    ...content.split('\n').map(line => (
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: line,
                                    size: 26, // 13pt
                                    font: "Times New Roman",
                                }),
                            ],
                            spacing: { line: 360 }, // Giãn dòng 1.5
                        })
                    )),
                ],
            }],
        });

        // 3. Đóng gói thành Buffer (dữ liệu file)
        const buffer = await Packer.toBuffer(doc);

        // 4. Trả file về cho trình duyệt
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename=GiaoAn_DuyHanh.docx');
        res.send(buffer);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
