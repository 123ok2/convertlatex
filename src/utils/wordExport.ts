import { mml2omml } from 'mathml2omml';
import katex from 'katex';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImportedXmlComponent
} from 'docx';

/**
 * Giải mã toàn diện các thực thể HTML và loại bỏ các ký tự vô hình/word joiner
 * Giúp văn bản sao chép từ AI hoặc web như &#44;&#x2060; hiển thị thành dấu phẩy và ký tự sạch
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      if (code === 0x2060 || code === 0x200b || code === 0xfeff) return '';
      return String.fromCharCode(code);
    })
    .replace(/&#([0-9]+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      if (code === 0x2060 || code === 0x200b || code === 0xfeff) return '';
      return String.fromCharCode(code);
    })
    .replace(/[\u2060\u200B\uFEFF]/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Chuẩn hóa chuỗi LaTeX trước khi biên dịch thành MathML/OMML:
 * - Chuẩn hóa thanh cận tích phân Newton-Leibniz: | _a^b, \ | \ _a^b, \mid _a^b, \Big|_a^b thành |_a^b
 * - Giúp KaTeX và Word nhận diện chính xác thanh gạch là cơ số của cận thay vì để cận gắn vào khoảng trắng
 */
export function cleanLatexString(latex: string): string {
  if (!latex) return '';
  let s = decodeHtmlEntities(latex).trim();
  // Chuẩn hóa thanh cận tích phân (Newton - Leibniz): | _a^b, \ | \ _a^b, \vert _a^b...
  s = s.replace(/(\||\\vert|\\mid|\\Big\||\\big\||\\Bigg\||\\bigg\|)\s*\\?\s*([_\^])/g, '|$2');
  // Chuẩn hóa khoảng trắng vi phân đứng sau hàm số: f(x) dx -> f(x) \,dx
  s = s.replace(/([^\\])\s+d([xyzut])\b/g, '$1 \\,d$2');
  return s;
}

/**
 * Chuẩn hóa sâu chuỗi OMML XML sinh ra từ mathml2omml:
 * 1. Loại bỏ các thuộc tính không hợp lệ như m:val="undefined" và thẻ <m:sty/> rỗng.
 * 2. Loại bỏ <w:rPr> bị nhúng sai bên trong <m:r> (vi phạm schema OpenXML Office Math).
 * 3. Nếu có dấu gạch đứng | hoặc ∣ đứng ngay trước sSubSup/sSub/sSup có cơ số rỗng,
 *    tự động gộp thanh gạch đứng vào làm cơ số m:e để tạo cận tích phân Newton-Leibniz hoàn hảo (không sinh ô vuông ⬚).
 * 4. Chuẩn hóa n-ary operators (tích phân ∫, tổng ∑, tích ∏):
 *    chuyển đổi m:nary thành <m:sSubSup> với toán tử là cơ số, cận dưới/trên chuẩn xác.
 * 5. Chuẩn hóa thanh gạch cận trong sSubSup/sSub/sSup:
 *    - Thay Unicode U+2223 (∣) bằng ASCII '|' (Cambria Math hiểu chuẩn xác 100%)
 *    - Loại bỏ hoàn toàn m:nor (normal text mode) trong m:e vì nó khiến Word tách thanh gạch và vẽ ô vuông giữ chỗ \square.
 * 6. Đảm bảo mọi thẻ <m:t> đều có xml:space="preserve" để không bị dính chữ.
 */
export function sanitizeOmml(rawOmml: string): string {
  let xml = rawOmml;

  // 1. Loại bỏ các thuộc tính rác "undefined" và thẻ style rỗng
  xml = xml.replace(/\s*m:val="undefined"/g, '');
  xml = xml.replace(/<m:sty\s*\/>/g, '');
  xml = xml.replace(/<m:sty><\/m:sty>/g, '');

  // 2. Loại bỏ <w:rPr> nằm trong <m:r>
  xml = xml.replace(/<m:r>(\s*<w:rPr[^>]*>[\s\S]*?<\/w:rPr>|\s*<w:rPr\s*\/>)/g, '<m:r>');

  // 3. Nếu có dấu gạch đứng | hoặc ∣ đứng ngay trước sSubSup/sSub/sSup có m:e rỗng hoặc chỉ có khoảng trắng,
  // tự động gộp thanh gạch đứng vào làm cơ số m:e để tạo cận tích phân Newton-Leibniz hoàn hảo
  xml = xml.replace(
    /<m:r[^>]*>(?:<m:rPr>[\s\S]*?<\/m:rPr>)?<m:t[^>]*>[|∣]<\/m:t><\/m:r>\s*(<m:(sSubSup|sSub|sSup)>[\s\S]*?<m:e>)\s*(?:<m:r>(?:<m:rPr>[\s\S]*?<\/m:rPr>)?<m:t[^>]*>\s*<\/m:t><\/m:r>)?\s*(<\/m:e>)/g,
    '$1<m:r><m:t xml:space="preserve">|</m:t></m:r>$3'
  );

  // 4. Chuẩn hóa m:nary (tích phân ∫, tổng ∑, tích ∏, v.v.)
  xml = xml.replace(/<m:nary>([\s\S]*?)<\/m:nary>/g, (_match, naryBody) => {
    const chrMatch = naryBody.match(/<m:chr\s+m:val="([^"]+)"/);
    const chr = chrMatch ? chrMatch[1] : '∫';

    const subMatch = naryBody.match(/<m:sub>([\s\S]*?)<\/m:sub>/);
    const supMatch = naryBody.match(/<m:sup>([\s\S]*?)<\/m:sup>/);
    const eMatch = naryBody.match(/<m:e>([\s\S]*?)<\/m:e>/);

    const sub = subMatch ? subMatch[1] : '';
    const sup = supMatch ? supMatch[1] : '';
    let eContent = eMatch ? eMatch[1] : '';

    // Nếu eContent có chữ trần chưa bọc <m:r><m:t>
    if (eContent && !eContent.includes('<m:r>')) {
      eContent = `<m:r><m:t xml:space="preserve">${eContent}</m:t></m:r>`;
    } else if (eContent) {
      eContent = eContent.replace(/(^|>)([^<]+)($|<)/g, (full, p1, txt, p3) => {
        if (!txt.trim()) return full;
        return `${p1}<m:r><m:t xml:space="preserve">${txt}</m:t></m:r>${p3}`;
      });
    }

    const chrElem = `<m:e><m:r><m:t xml:space="preserve">${chr}</m:t></m:r></m:e>`;
    let result = '';

    if (sub && sup) {
      result = `<m:sSubSup>${chrElem}<m:sub>${sub}</m:sub><m:sup>${sup}</m:sup></m:sSubSup>`;
    } else if (sub) {
      result = `<m:sSub>${chrElem}<m:sub>${sub}</m:sub></m:sSub>`;
    } else if (sup) {
      result = `<m:sSup>${chrElem}<m:sup>${sup}</m:sup></m:sSup>`;
    } else {
      result = `<m:r><m:t xml:space="preserve">${chr}</m:t></m:r>`;
    }

    return result + (eContent || '');
  });

  // 5. Chuẩn hóa thanh gạch cận trong sSubSup/sSub/sSup:
  // - Thay Unicode U+2223 (∣) bằng ASCII '|' (Cambria Math hiểu chuẩn xác 100%)
  // - Loại bỏ hoàn toàn m:nor (normal text mode) trong m:e vì nó khiến Word tách thanh gạch và vẽ ô vuông giữ chỗ \square
  xml = xml.replace(/(<m:(sSubSup|sSub|sSup)>[\s\S]*?<m:e>)([\s\S]*?)(<\/m:e>)/g, (_m, open, _tag, body, close) => {
    let cleanBody = body.replace(/\u2223/g, '|');
    cleanBody = cleanBody.replace(/<m:nor\s*\/>/g, '');
    cleanBody = cleanBody.replace(/<m:rPr>\s*<\/m:rPr>/g, '');
    if (!cleanBody.trim() || cleanBody.includes('<m:t xml:space="preserve"></m:t>')) {
      cleanBody = `<m:r><m:t xml:space="preserve">|</m:t></m:r>`;
    }
    return open + cleanBody + close;
  });

  // 6. Xóa m:nor rỗng hoặc thừa trong các biểu thức toán
  xml = xml.replace(/<m:rPr>\s*<m:nor\s*\/>\s*<\/m:rPr>/g, '');

  // 7. Khử lồng ghép thẻ trùng lặp hoặc rỗng
  xml = xml.replace(/<m:r[^>]*>\s*<m:t[^>]*>\s*<m:r[^>]*>\s*<m:t[^>]*>([\s\S]*?)<\/m:t>\s*<\/m:r>\s*<\/m:t>\s*<\/m:r>/g, '<m:r><m:t xml:space="preserve">$1</m:t></m:r>');
  xml = xml.replace(/<m:r[^>]*>\s*<m:t[^>]*>\s*<\/m:t>\s*<\/m:r>/g, '');

  // 8. Đảm bảo toàn bộ thẻ <m:t> có thuộc tính xml:space="preserve"
  xml = xml.replace(/<m:t(?!\s+xml:space="preserve")>/g, '<m:t xml:space="preserve">');

  return xml;
}

/**
 * Chuyển đổi mã LaTeX thành component OMML của thư viện docx
 */
export function latexToOmmlComponent(latex: string, isBlock = false): any {
  try {
    const cleanedLatex = cleanLatexString(latex);
    let mml = katex.renderToString(cleanedLatex, { output: 'mathml', displayMode: isBlock });
    // Loại bỏ hoàn toàn annotation và semantics để Word không bị lặp văn bản
    mml = mml.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/gi, '').replace(/<\/?semantics>/gi, '');
    const match = mml.match(/<math[\s\S]*?<\/math>/i);
    if (!match) {
      return new TextRun({ text: latex, font: 'Cambria Math' });
    }
    const rawOmml = mml2omml(match[0]);
    const omml = sanitizeOmml(rawOmml);
    const comp = ImportedXmlComponent.fromXmlString(omml) as any;
    return comp.root && comp.root[0] ? comp.root[0] : comp;
  } catch (e) {
    return new TextRun({ text: latex, font: 'Cambria Math' });
  }
}

/**
 * Chuyển đổi mã LaTeX thành chuỗi OMML XML trực tiếp (dùng cho HTML xuất bản/clipboard Word)
 */
export function latexToOmmlXml(latex: string, isBlock = false): string {
  try {
    const cleanedLatex = cleanLatexString(latex);
    let mml = katex.renderToString(cleanedLatex, { output: 'mathml', displayMode: isBlock });
    mml = mml.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/gi, '').replace(/<\/?semantics>/gi, '');
    const match = mml.match(/<math[\s\S]*?<\/math>/i);
    if (!match) return latex;
    const rawOmml = mml2omml(match[0]);
    const omml = sanitizeOmml(rawOmml);
    if (isBlock) {
      return `<p align="center" style="text-align:center;margin:12pt 0;"><m:oMathPara>${omml}</m:oMathPara></p>`;
    }
    return omml;
  } catch (e) {
    return latex;
  }
}

/**
 * Trích xuất và chuẩn hóa MathML từ KaTeX math element để dán vào Word
 */
export function cleanMathMlFromElement(mathEl: Element): string {
  const clone = mathEl.cloneNode(true) as Element;
  clone.querySelectorAll('annotation').forEach(el => el.remove());
  clone.querySelectorAll('semantics').forEach(el => {
    // Di chuyển các phần tử con ra ngoài semantics
    while (el.firstChild) {
      el.parentNode?.insertBefore(el.firstChild, el);
    }
    el.remove();
  });
  return clone.outerHTML;
}

/**
 * Chuẩn hóa khoảng trắng quanh công thức để tránh dính chữ trong Word
 */
export function normalizeSpacesInClone(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.nodeValue) {
      node.nodeValue = node.nodeValue.replace(/[^\S\r\n]{2,}/g, ' ');
    }
  }

  root.querySelectorAll('.katex, m\\:oMath, m\\:oMathPara, math').forEach(el => {
    const prev = el.previousSibling;
    if (prev && prev.nodeType === Node.TEXT_NODE) {
      const txt = prev.nodeValue || '';
      if (txt.endsWith(' ')) {
        prev.nodeValue = txt.slice(0, -1) + '\u00A0';
      }
    }
    const next = el.nextSibling;
    if (next && next.nodeType === Node.TEXT_NODE) {
      const txt = next.nodeValue || '';
      if (txt.startsWith(' ')) {
        next.nodeValue = '\u00A0' + txt.slice(1);
      }
    }
  });
}

/**
 * Tạo tài liệu HTML tối ưu tuyệt đối cho Microsoft Word
 * - Xóa sạch lớp bảo vệ / nút bấm / katex-html
 * - Loại bỏ toàn bộ thẻ <annotation> (nguyên nhân gây lặp chữ 50 g50\text{ g})
 * - Thay thế công thức bằng OMML chuẩn (<m:oMath>)
 * - Tích hợp đầy đủ namespace Office Word
 */
export function prepareHtmlForWord(sourceEl: HTMLElement): { fullHtml: string; cleanText: string } {
  const clone = sourceEl.cloneNode(true) as HTMLElement;

  // 1. Xóa các nút bấm thao tác và các lớp thừa
  clone.querySelectorAll('.copy-protection-decoy, button, .formula-action-btn, [data-copy-hidden="true"]').forEach(el => el.remove());

  // 2. Xóa các phần tử hiển thị SVG/HTML của KaTeX, chỉ giữ MathML/OMML
  clone.querySelectorAll('.katex-html').forEach(el => el.remove());

  // 3. XÓA BỎ TOÀN BỘ THẺ ANNOTATION (Nguyên nhân chính gây lỗi lặp chữ)
  clone.querySelectorAll('annotation').forEach(el => el.remove());

  // 4. Chuyển đổi các công thức .katex thành OMML chuẩn của Word với cơ chế Token để giữ nguyên chữ hoa/thường (m:oMath, m:fPr...)
  const mathReplacements: { token: string; omml: string }[] = [];
  const katexElements = Array.from(clone.querySelectorAll('.katex'));

  katexElements.forEach((el, index) => {
    const isBlock = el.closest('.katex-display') !== null;
    const mathEl = el.querySelector('math');
    const token = `__WORD_OMML_MATH_TOKEN_${index}__`;

    if (mathEl) {
      try {
        const cleanMml = cleanMathMlFromElement(mathEl);
        const rawOmml = mml2omml(cleanMml);
        const sanitized = sanitizeOmml(rawOmml);
        const ommlStr = isBlock
          ? `<p align="center" style="text-align:center;margin:12pt 0;"><m:oMathPara>${sanitized}</m:oMathPara></p>`
          : sanitized;

        mathReplacements.push({ token, omml: ommlStr });
      } catch (e) {
        const cleanMml = cleanMathMlFromElement(mathEl);
        mathReplacements.push({ token, omml: cleanMml });
      }
    } else {
      mathReplacements.push({ token, omml: el.textContent || '' });
    }

    const tokenSpan = document.createElement('span');
    tokenSpan.textContent = token;
    if (isBlock) {
      const displayParent = el.closest('.katex-display');
      if (displayParent) {
        displayParent.replaceWith(tokenSpan);
      } else {
        el.replaceWith(tokenSpan);
      }
    } else {
      el.replaceWith(tokenSpan);
    }
  });

  // 5. Chuẩn hóa khoảng trắng để văn bản không bị dính chữ
  normalizeSpacesInClone(clone);

  // 6. Xử lý định dạng bảng biểu
  clone.querySelectorAll('table').forEach(table => {
    table.setAttribute('border', '1');
    table.setAttribute('cellspacing', '0');
    table.setAttribute('cellpadding', '6');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.margin = '12pt 0';
    table.style.border = '1px solid black';
  });
  clone.querySelectorAll('td, th').forEach(cell => {
    (cell as HTMLElement).style.border = '1px solid black';
    (cell as HTMLElement).style.padding = '6pt';
  });

  let bodyContent = clone.innerHTML;
  bodyContent = decodeHtmlEntities(bodyContent);
  // Khôi phục chính xác các chuỗi OMML XML nguyên bản, bảo toàn 100% cú pháp PascalCase/camelCase của Office Word
  for (const { token, omml } of mathReplacements) {
    bodyContent = bodyContent.replace(token, omml);
  }

  const cleanText = decodeHtmlEntities(clone.innerText || clone.textContent || '');

  const fullHtml = `<!DOCTYPE html>
<html xmlns:v='urn:schemas-microsoft-com:vml'
      xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns:m='http://schemas.openxmlformats.org/officeDocument/2006/math' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>Tài liệu chuyển đổi</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 13pt;
      line-height: 1.5;
      color: #000000;
      background-color: #ffffff;
      margin: 20mm;
    }
    p {
      margin-top: 0;
      margin-bottom: 8pt;
      text-align: justify;
    }
    m\\:oMath {
      font-family: 'Cambria Math', serif;
    }
    m\\:oMathPara {
      text-align: center;
      margin: 12pt 0;
    }
    h1 {
      font-size: 18pt;
      font-weight: bold;
      color: #1e40af;
      margin-top: 14pt;
      margin-bottom: 6pt;
    }
    h2 {
      font-size: 16pt;
      font-weight: bold;
      color: #1e40af;
      margin-top: 12pt;
      margin-bottom: 5pt;
    }
    h3 {
      font-size: 14pt;
      font-weight: bold;
      color: #1e40af;
      margin-top: 10pt;
      margin-bottom: 4pt;
    }
    ul, ol {
      margin-top: 0;
      margin-bottom: 8pt;
      padding-left: 24pt;
    }
    li {
      margin-bottom: 3pt;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 10pt 0;
    }
    th, td {
      border: 1px solid black;
      padding: 6pt;
      text-align: left;
    }
    th {
      font-weight: bold;
      background-color: #f1f5f9;
    }
    blockquote {
      border-left: 3pt solid #94a3b8;
      padding-left: 10pt;
      margin: 8pt 0;
      color: #475569;
      font-style: italic;
    }
  </style>
</head>
<body>
<!--StartFragment-->
${bodyContent}
<!--EndFragment-->
</body>
</html>`;

  return { fullHtml, cleanText };
}

/**
 * Phân tích văn bản nội dòng chứa công thức toán ($...$), in đậm (**...**), in nghiêng (*...*), và mã (`...`)
 * Hỗ trợ các cấu trúc phức tạp như in đậm bọc công thức toán (ví dụ: **Phương pháp (Đổi biến $u$)**)
 */
export function parseInlineRuns(text: string, options: { bold?: boolean; italics?: boolean } = {}): any[] {
  const runs: any[] = [];
  let remaining = decodeHtmlEntities(text);

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/s);
    const mathMatch = remaining.match(/^(.*?)\$([^\$]+?)\$/s);
    const italicMatch = remaining.match(/^(.*?)(?<!\*)\*([^*]+?)\*(?!\*)/s);
    const codeMatch = remaining.match(/^(.*?)`([^`]+?)`/s);

    let earliest: { pre: string; content: string; raw: string } | null = null;
    let type: 'bold' | 'math' | 'italic' | 'code' | null = null;

    if (boldMatch && (!earliest || boldMatch[1].length < earliest.pre.length)) {
      earliest = { pre: boldMatch[1], content: boldMatch[2], raw: boldMatch[0] };
      type = 'bold';
    }
    if (mathMatch && (!earliest || mathMatch[1].length < earliest.pre.length)) {
      earliest = { pre: mathMatch[1], content: mathMatch[2], raw: mathMatch[0] };
      type = 'math';
    }
    if (italicMatch && (!earliest || italicMatch[1].length < earliest.pre.length)) {
      earliest = { pre: italicMatch[1], content: italicMatch[2], raw: italicMatch[0] };
      type = 'italic';
    }
    if (codeMatch && (!earliest || codeMatch[1].length < earliest.pre.length)) {
      earliest = { pre: codeMatch[1], content: codeMatch[2], raw: codeMatch[0] };
      type = 'code';
    }

    if (!earliest) {
      if (remaining) {
        runs.push(
          new TextRun({
            text: remaining,
            font: 'Times New Roman',
            size: 26, // 13pt
            bold: options.bold || false,
            italics: options.italics || false,
          })
        );
      }
      break;
    }

    // Xử lý chuỗi văn bản đứng trước token nếu có
    if (earliest.pre.length > 0) {
      runs.push(...parseInlineRuns(earliest.pre, options));
    }

    // Xử lý token theo loại
    if (type === 'math') {
      runs.push(latexToOmmlComponent(earliest.content, false));
    } else if (type === 'bold') {
      runs.push(...parseInlineRuns(earliest.content, { ...options, bold: true }));
    } else if (type === 'italic') {
      runs.push(...parseInlineRuns(earliest.content, { ...options, italics: true }));
    } else if (type === 'code') {
      runs.push(
        new TextRun({
          text: earliest.content,
          font: 'Consolas',
          size: 22,
          bold: options.bold || false,
          italics: options.italics || false,
        })
      );
    }

    remaining = remaining.slice(earliest.pre.length + earliest.raw.length - earliest.pre.length);
  }

  return runs;
}

/**
 * Tạo file Word (.docx) chuyên nghiệp với công thức OMML chuẩn gốc từ mã Markdown
 */
export async function exportMarkdownToDocx(markdown: string, title = 'TaiLieuToan'): Promise<Blob> {
  const cleanMarkdown = decodeHtmlEntities(markdown);
  const lines = cleanMarkdown.split(/\r?\n/);
  const docChildren: any[] = [];

  let inBlockMath = false;
  let blockMathBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Xử lý block math nhiều dòng $$ ... $$
    if (inBlockMath) {
      if (trimmed.endsWith('$$')) {
        blockMathBuffer.push(trimmed.slice(0, -2));
        const fullLatex = blockMathBuffer.join('\n').trim();
        const mathComp = latexToOmmlComponent(fullLatex, true);
        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [mathComp],
          })
        );
        inBlockMath = false;
        blockMathBuffer = [];
      } else {
        blockMathBuffer.push(line);
      }
      continue;
    }

    if (trimmed.startsWith('$$')) {
      if (trimmed.endsWith('$$') && trimmed.length > 2 && trimmed.indexOf('$$', 2) !== -1) {
        // Block math 1 dòng
        const mathContent = trimmed.slice(2, -2).trim();
        const mathComp = latexToOmmlComponent(mathContent, true);
        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [mathComp],
          })
        );
      } else {
        inBlockMath = true;
        blockMathBuffer = [trimmed.slice(2)];
      }
      continue;
    }

    // Dòng trống
    if (!trimmed) {
      continue;
    }

    // Tiêu đề
    if (trimmed.startsWith('# ')) {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 280, after: 120 },
          children: parseInlineRuns(trimmed.slice(2).trim()),
        })
      );
    } else if (trimmed.startsWith('## ')) {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 100 },
          children: parseInlineRuns(trimmed.slice(3).trim()),
        })
      );
    } else if (trimmed.startsWith('### ')) {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 80 },
          children: parseInlineRuns(trimmed.slice(4).trim()),
        })
      );
    } else if (trimmed.startsWith('#### ')) {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 180, after: 70 },
          children: parseInlineRuns(trimmed.slice(5).trim()),
        })
      );
    } else if (trimmed.startsWith('##### ')) {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_5,
          spacing: { before: 160, after: 60 },
          children: parseInlineRuns(trimmed.slice(6).trim()),
        })
      );
    } else if (trimmed.startsWith('###### ')) {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_6,
          spacing: { before: 140, after: 50 },
          children: parseInlineRuns(trimmed.slice(7).trim()),
        })
      );
    } else if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
      // Dòng tiêu đề phụ / đoạn in đậm độc lập: ví dụ **Phương pháp đổi biến số (Đổi biến $u$)**
      docChildren.push(
        new Paragraph({
          spacing: { before: 180, after: 80 },
          children: parseInlineRuns(trimmed),
        })
      );
    } else if (trimmed.startsWith('*') && trimmed.endsWith('*') && trimmed.length > 2 && !trimmed.startsWith('* ')) {
      // Dòng ghi chú in nghiêng độc lập: ví dụ *Thứ tự ưu tiên chọn $u$...*
      docChildren.push(
        new Paragraph({
          spacing: { before: 80, after: 80 },
          children: parseInlineRuns(trimmed),
        })
      );
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      // Danh sách gạch đầu dòng
      docChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 60, after: 60 },
          children: parseInlineRuns(trimmed.slice(2).trim()),
        })
      );
    } else if (/^\d+\.\s+/.test(trimmed)) {
      // Danh sách có thứ tự
      const match = trimmed.match(/^(\d+)\.\s+(.*)$/);
      const content = match ? match[2] : trimmed;
      docChildren.push(
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [
            new TextRun({
              text: (match ? match[1] + '. ' : ''),
              bold: true,
              font: 'Times New Roman',
              size: 26,
            }),
            ...parseInlineRuns(content),
          ],
        })
      );
    } else {
      // Đoạn văn thông thường
      const isMcq = /^\s*[A-Ea-e][\.\)\:\-]\s+/.test(trimmed);
      docChildren.push(
        new Paragraph({
          spacing: { before: 60, after: 120 },
          indent: isMcq ? { left: 720, hanging: 360 } : undefined,
          children: parseInlineRuns(trimmed),
        })
      );
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 26, // 13pt
            color: '000000',
          },
          paragraph: {
            spacing: { line: 360, lineRule: 'auto', before: 60, after: 120 },
          },
        },
        heading1: {
          run: {
            font: 'Times New Roman',
            size: 36, // 18pt
            bold: true,
            color: '1E3A8A',
          },
          paragraph: {
            spacing: { before: 280, after: 120 },
          },
        },
        heading2: {
          run: {
            font: 'Times New Roman',
            size: 32, // 16pt
            bold: true,
            color: '1E3A8A',
          },
          paragraph: {
            spacing: { before: 240, after: 100 },
          },
        },
        heading3: {
          run: {
            font: 'Times New Roman',
            size: 28, // 14pt
            bold: true,
            color: '1E3A8A',
          },
          paragraph: {
            spacing: { before: 200, after: 80 },
          },
        },
        heading4: {
          run: {
            font: 'Times New Roman',
            size: 26, // 13pt
            bold: true,
            color: '1E3A8A',
          },
          paragraph: {
            spacing: { before: 180, after: 70 },
          },
        },
        heading5: {
          run: {
            font: 'Times New Roman',
            size: 24, // 12pt
            bold: true,
            color: '1E3A8A',
          },
          paragraph: {
            spacing: { before: 160, after: 60 },
          },
        },
        heading6: {
          run: {
            font: 'Times New Roman',
            size: 22, // 11pt
            bold: true,
            color: '1E3A8A',
          },
          paragraph: {
            spacing: { before: 140, after: 50 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: docChildren.length > 0 ? docChildren : [new Paragraph({ text: '' })],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
