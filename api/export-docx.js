export default async function handler(req, res) {
  // CORS (để extension gọi được)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { content } = req.body;

  // ⚠️ Demo: chưa tạo file thật
  // Bạn sẽ thay bằng code tạo docx sau
  const text = `Noi dung: ${content}`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=math.docx"
  );

  return res.send(Buffer.from(text));
}
