import express from "express";
import { GoogleGenAI } from "@google/genai";
import { Document, Packer, Paragraph, TextRun, Math } from "docx";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// API Route for Word Export
app.post("/api/export-docx", async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content) {
      return res.status(400).json({ message: "Nội dung không được để trống" });
    }

    const parts = content.split(/(\$.*?\$)/g);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: parts.map((part: string, index: number) => {
                if (part.startsWith("$") && part.endsWith("$")) {
                  const latex = part.slice(1, -1).trim();
                  return new Math({
                    children: [
                      new TextRun({
                        text: latex,
                        font: "Cambria Math",
                      }),
                    ],
                  });
                }

                let textVal = part.replace(/[^\S\r\n]{2,}/g, " ");

                if (parts[index + 1] && parts[index + 1].startsWith("$") && textVal.endsWith(" ")) {
                  textVal = textVal.slice(0, -1) + "\u00A0";
                }
                if (parts[index - 1] && parts[index - 1].startsWith("$") && textVal.startsWith(" ")) {
                  textVal = "\u00A0" + textVal.slice(1);
                }

                return new TextRun({
                  text: textVal,
                  font: "Times New Roman",
                  size: 26,
                });
              }),
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename=${encodeURIComponent(title || "GiaoAn")}.docx`);
    return res.send(buffer);
  } catch (error: any) {
    console.error("Lỗi Server:", error);
    return res.status(500).json({ message: "Lỗi khi tạo tệp Word", error: error.message });
  }
});

// API Route for Gemini handwriting recognition proxied safely on server
app.post("/api/gemini", async (req, res) => {
  try {
    const { image, prompt } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Missing image data" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not defined on the server" });
    }

    const ai = new GoogleGenAI({ apiKey });
    const imagePart = {
      inlineData: {
        mimeType: "image/png",
        data: image,
      },
    };
    const textPart = {
      text: prompt || "Convert this handwritten math/physics/chemistry formula to LaTeX. Return ONLY the LaTeX string without any markdown formatting or dollar signs.",
    };

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
    });
    res.json({ text: result.text || "" });
  } catch (err: any) {
    console.error("Gemini Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default app;
