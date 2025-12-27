import { jsPDF } from "jspdf";

/**
 * Export utilities for Sadoo Web App
 * Provides beautiful PDF, Word, and TXT export functionality
 */

// ========== PDF EXPORT ==========
export const exportToPdf = (text: string, title?: string) => {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Page settings
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let currentY = margin;

    // ===== HEADER =====
    doc.setFillColor(79, 70, 229); // Indigo color
    doc.rect(0, 0, pageWidth, 35, "F");

    // Logo text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Sadoo", margin, 21);

    // Subtitle
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Audio/Video Transkripsiya", margin, 29);

    currentY = 50;

    // ===== TITLE =====
    if (title) {
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin, currentY);
      currentY += 10;
    }

    // ===== DATE =====
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    const dateStr = new Date().toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.text(`Yaratilgan: ${dateStr}`, margin, currentY);
    currentY += 8;

    // ===== SEPARATOR =====
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    // ===== CONTENT =====
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);

    // Convert special Uzbek characters for PDF compatibility
    const safeText = text
      .replace(/ў/g, "o'")
      .replace(/Ў/g, "O'")
      .replace(/ғ/g, "g'")
      .replace(/Ғ/g, "G'")
      .replace(/қ/g, "q")
      .replace(/Қ/g, "Q")
      .replace(/ҳ/g, "h")
      .replace(/Ҳ/g, "H")
      .replace(/ш/g, "sh")
      .replace(/Ш/g, "Sh")
      .replace(/ч/g, "ch")
      .replace(/Ч/g, "Ch");

    // Split text into lines
    const lines = doc.splitTextToSize(safeText, contentWidth);

    // Add lines with page breaks
    for (const line of lines) {
      if (currentY > pageHeight - margin - 25) {
        addFooter(doc, pageWidth, pageHeight);
        doc.addPage();
        currentY = margin + 10;
      }
      doc.text(line, margin, currentY);
      currentY += 6;
    }

    // ===== FOOTER =====
    addFooter(doc, pageWidth, pageHeight);

    // Save
    doc.save("Sadoo-transkripsiya.pdf");
  } catch (e) {
    console.error("PDF Export Error", e);
    alert("PDF yaratishda xatolik. Iltimos Word formatini sinab ko'ring.");
  }
};

// Footer helper
function addFooter(doc: jsPDF, pageWidth: number, pageHeight: number) {
  const footerY = pageHeight - 12;

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);

  // Footer text
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  doc.text(
    "© Sadoo - Audio/Video Transkripsiya Xizmati",
    pageWidth / 2,
    footerY,
    {
      align: "center",
    }
  );

  // Page number
  const pageNum = (doc as any).internal.getNumberOfPages();
  doc.text(`${pageNum}`, pageWidth - 20, footerY, { align: "right" });
}

// ========== WORD EXPORT ==========
export const exportToWord = (text: string, title?: string) => {
  const docTitle = title || "Sadoo Transkripsiya";
  const dateStr = new Date().toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Beautiful HTML structure for Word
  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${docTitle}</title>
      <style>
        @page {
          margin: 2.5cm;
          mso-header-margin: 1cm;
          mso-footer-margin: 1cm;
        }
        body { 
          font-family: 'Calibri', 'Arial', sans-serif; 
          font-size: 11pt;
          line-height: 1.6;
          color: #1e1e1e;
        }
        .header {
          background: linear-gradient(135deg, #4F46E5, #7C3AED);
          background-color: #4F46E5;
          padding: 20px;
          margin: -2.5cm -2.5cm 20px -2.5cm;
          text-align: left;
        }
        .header h1 {
          color: white;
          font-size: 24pt;
          margin: 0;
          font-weight: bold;
        }
        .header p {
          color: #E0E7FF;
          font-size: 10pt;
          margin: 5px 0 0 0;
        }
        .meta {
          color: #666;
          font-size: 10pt;
          font-style: italic;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #ddd;
        }
        .content {
          text-align: justify;
        }
        .content p {
          margin: 0 0 10px 0;
          text-indent: 1.5em;
        }
        .content p:first-child {
          text-indent: 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 9pt;
          color: #888;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎯 Sadoo</h1>
        <p>Audio/Video Transkripsiya Xizmati</p>
      </div>
      
      <div class="meta">
        <strong>📅 Yaratilgan:</strong> ${dateStr}
      </div>
      
      <div class="content">
        ${text
          .split("\n")
          .filter((p) => p.trim())
          .map((para) => `<p>${para}</p>`)
          .join("")}
      </div>
      
      <div class="footer">
        <p>© Sadoo - Barcha huquqlar himoyalangan</p>
        <p>🌐 www.sadoo.uz | 📱 @sadoouzBot</p>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff", html], {
    type: "application/msword",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Sadoo-transkripsiya.doc";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ========== TXT EXPORT ==========
export const exportToTxt = (text: string, title?: string) => {
  const docTitle = title || "Sadoo Transkripsiya";
  const dateStr = new Date().toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const divider = "═".repeat(50);
  const thinDivider = "─".repeat(50);

  const content = `${divider}
   🎯 SADOO - TRANSKRIPSIYA
${divider}

📋 ${docTitle}
📅 Yaratilgan: ${dateStr}

${thinDivider}

${text}

${thinDivider}

© Sadoo - Audio/Video Transkripsiya Xizmati
🌐 www.sadoo.uz | 📱 @sadoouzBot

${divider}
`;

  const blob = new Blob([content], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Sadoo-transkripsiya.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ========== COPY TO CLIPBOARD ==========
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};
