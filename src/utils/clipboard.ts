/**
 * Tiện ích sao chép vào Clipboard đa tầng (Multi-tier Clipboard Utility)
 * 
 * Khắc phục hoàn toàn các lỗi:
 * - "Failed to execute 'write' on 'Clipboard': Document is not focused."
 * - "NotAllowedError: Must be handling a user gesture."
 * - Lỗi iframe sandbox bảo mật chặn navigator.clipboard.write.
 */

/**
 * Sao chép đồng thời HTML và Văn bản thuần vào Clipboard
 * Đảm bảo tương thích cao nhất với Microsoft Word và các trình duyệt.
 */
export async function copyHtmlAndText(html: string, plainText: string): Promise<boolean> {
  // 1. Cố gắng lấy focus cho tài liệu
  try {
    if (typeof window !== 'undefined') {
      window.focus();
    }
  } catch {
    // Bỏ qua nếu môi trường không cho phép window.focus
  }

  // 2. Thử nghiệm qua Modern Clipboard API (nếu tài liệu đang có focus)
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.write === 'function' &&
    typeof ClipboardItem !== 'undefined'
  ) {
    try {
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        }),
      ]);
      return true;
    } catch (apiErr: any) {
      console.warn('Modern clipboard.write failed, switching to execCommand fallback:', apiErr?.message || apiErr);
    }
  }

  // 3. Fallback: Dùng document.execCommand('copy') kết hợp sự kiện 'copy'
  // Kỹ thuật này hoạt động ngay cả khi document.hasFocus() = false trong iframe!
  if (typeof document !== 'undefined') {
    try {
      let copySuccess = false;
      const copyHandler = (e: ClipboardEvent) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.clipboardData) {
          e.clipboardData.setData('text/html', html);
          e.clipboardData.setData('text/plain', plainText);
          copySuccess = true;
        }
      };

      document.addEventListener('copy', copyHandler, true);

      // Tạo một phần tử tạm có thể chọn được để kích hoạt lệnh copy
      const tempEl = document.createElement('div');
      tempEl.contentEditable = 'true';
      tempEl.setAttribute('aria-hidden', 'true');
      tempEl.style.position = 'fixed';
      tempEl.style.left = '-9999px';
      tempEl.style.top = '0';
      tempEl.style.opacity = '0';
      tempEl.style.pointerEvents = 'none';
      tempEl.innerText = plainText;
      document.body.appendChild(tempEl);

      tempEl.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(tempEl);
      selection?.removeAllRanges();
      selection?.addRange(range);

      try {
        const result = document.execCommand('copy');
        if (result || copySuccess) {
          copySuccess = true;
        }
      } catch (execErr) {
        console.warn('execCommand copy error:', execErr);
      } finally {
        selection?.removeAllRanges();
        if (tempEl.parentNode) {
          document.body.removeChild(tempEl);
        }
        document.removeEventListener('copy', copyHandler, true);
      }

      if (copySuccess) {
        return true;
      }
    } catch (fallbackErr) {
      console.warn('Fallback HTML copy failed:', fallbackErr);
    }
  }

  // 4. Fallback cuối cùng: Sao chép văn bản thuần qua copyText
  return copyPlainText(plainText);
}

/**
 * Sao chép văn bản thuần với fallback an toàn
 */
export async function copyPlainText(text: string): Promise<boolean> {
  // Thử navigator.clipboard.writeText trước
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Tiếp tục xuống fallback
    }
  }

  // Fallback dùng textarea + execCommand('copy')
  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, 999999);

      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (successful) return true;
    } catch {
      // Bỏ qua
    }
  }

  return false;
}
