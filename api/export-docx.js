import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

export default async function handler(req, res) {
    // --- QUAN TRỌNG: Cấu hình CORS để cho phép Extension kết nối ---
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Cho phép tất cả các nguồn
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Xử lý lệnh kiểm tra kết nối (Preflight request)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Chỉ chấp nhận POST' });
    }

    try {
        const { content, title } = req.body;

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: title || "GIÁO ÁN", bold: true, size: 28, font: "Times New Roman" })],
                        spacing: { after: 400 },
                    }),
                    ...content.split('\n').map(line => new Paragraph({
                        children: [new TextRun({ text: line, size: 26, font: "Times New Roman" })],
                        spacing: { line: 360 }
                    }))
                ]
            }]
        });

        const buffer = await Packer.toBuffer(doc);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename=GiaoAn_DuyHanhMath.docx');
        res.send(buffer);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
