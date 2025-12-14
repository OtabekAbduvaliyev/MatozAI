import { jsPDF } from "jspdf";

export const exportToPdf = (text: string) => {
  try {
    const doc = new jsPDF();

    // Split text to fit page width
    // Page width is usually 210mm. Margins 10mm. Usable 190mm.
    const splitText = doc.splitTextToSize(text, 180);

    // Add text
    // Note: Standard jsPDF fonts only support Latin characters.
    // For Cyrillic, this might render garbage characters without a custom font.
    // However, since we can't easily embed a 500KB font file in this code format,
    // we use the standard font. Word export is recommended for full Cyrillic support.
    doc.setFont("helvetica");
    doc.setFontSize(12);
    doc.text(splitText, 15, 20);

    doc.save("Sado-transkripsiya.pdf");
  } catch (e) {
    console.error("PDF Export Error", e);
    alert("PDF yaratishda xatolik. Iltimos Word formatini sinab ko'ring.");
  }
};

export const exportToWord = (text: string) => {
  // Create a minimal HTML structure for Word
  // This method (HTML to Word) supports UTF-8 (Cyrillic) perfectly without external fonts.
  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Sado Transkripsiya</title>
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; }
      </style>
    </head>
    <body>
  `;
  const footer = "</body></html>";

  // Convert newlines to breaks
  const htmlContent = text.split('\n').map(para => `<p>${para}</p>`).join('');

  const sourceHTML = header + htmlContent + footer;

  const blob = new Blob(['\ufeff', sourceHTML], {
    type: 'application/msword'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Sado-transkripsiya.doc';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};