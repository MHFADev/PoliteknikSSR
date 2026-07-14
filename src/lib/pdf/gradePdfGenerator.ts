import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { GradeData } from "@/actions/documents";

const PRIMARY = rgb(0.08, 0.18, 0.38);
const SECONDARY = rgb(0.15, 0.3, 0.55);
const ACCENT = rgb(0.12, 0.42, 0.72);
const HEADER_BG = rgb(0.08, 0.18, 0.38);
const HEADER_TEXT = rgb(1, 1, 1);
const ROW_EVEN = rgb(0.96, 0.97, 0.99);
const ROW_ODD = rgb(1, 1, 1);
const BORDER = rgb(0.82, 0.84, 0.88);
const TEXT_DARK = rgb(0.1, 0.12, 0.18);
const TEXT_MUTED = rgb(0.45, 0.48, 0.55);

export async function generateGradePdf(
  studentName: string,
  identityNumber: string,
  kelas: string,
  gradeData: GradeData
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  let page = doc.addPage([PAGE_W, PAGE_H]);
  const margin = 50;
  let y = PAGE_H - margin;

  const drawHeader = () => {
    page.drawRectangle({
      x: 0, y: PAGE_H - 120,
      width: PAGE_W, height: 120,
      color: PRIMARY,
    });

    page.drawText("REKAP NILAI", {
      x: margin, y: PAGE_H - 50, size: 24, font: bold, color: HEADER_TEXT,
    });
    page.drawText("PRAKTIK KERJA LAPANGAN (PKL)", {
      x: margin, y: PAGE_H - 76, size: 11, font, color: rgb(0.7, 0.78, 0.9),
    });
    page.drawText("Politeknik SSR", {
      x: margin, y: PAGE_H - 96, size: 8, font, color: rgb(0.6, 0.68, 0.82),
    });

    page.drawText("Tahun Akademik 2025/2026", {
      x: PAGE_W - margin - 220, y: PAGE_H - 96, size: 8, font,
      color: rgb(0.6, 0.68, 0.82),
    });

    y = PAGE_H - 145;
  };

  const drawSubHeader = () => {
    const boxX = margin;
    const boxY = y - 5;
    const boxW = PAGE_W - margin * 2;
    const boxH = 72;

    page.drawRectangle({
      x: boxX, y: boxY, width: boxW, height: boxH,
      color: rgb(0.96, 0.97, 0.99),
      borderColor: BORDER,
      borderWidth: 1,
    });

    page.drawRectangle({
      x: boxX, y: boxY + boxH - 22, width: boxW, height: 22,
      color: SECONDARY,
    });
    page.drawText("IDENTITAS SISWA", {
      x: boxX + 10, y: boxY + boxH - 17, size: 9, font: bold, color: HEADER_TEXT,
    });

    const dataY = boxY + boxH - 34;
    page.drawText(`Nama Lengkap`, { x: boxX + 12, y: dataY, size: 7.5, font, color: TEXT_MUTED });
    page.drawText(studentName, { x: boxX + 95, y: dataY, size: 8.5, font: bold, color: PRIMARY });

    page.drawText(`NIS / NIM`, { x: boxX + 230, y: dataY, size: 7.5, font, color: TEXT_MUTED });
    page.drawText(identityNumber || "-", { x: boxX + 290, y: dataY, size: 8.5, font: bold, color: PRIMARY });

    const dataY2 = boxY + boxH - 50;
    page.drawText(`Kelas`, { x: boxX + 12, y: dataY2, size: 7.5, font, color: TEXT_MUTED });
    page.drawText(kelas || "-", { x: boxX + 95, y: dataY2, size: 8.5, font: bold, color: PRIMARY });

    page.drawText(`Periode PKL`, { x: boxX + 230, y: dataY2, size: 7.5, font, color: TEXT_MUTED });
    const pklStart = gradeData.pklStartDate
      ? new Date(gradeData.pklStartDate + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      : "-";
    const pklEnd = gradeData.pklEndDate
      ? new Date(gradeData.pklEndDate + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      : "-";
    page.drawText(`${pklStart}  —  ${pklEnd}`, { x: boxX + 310, y: dataY2, size: 8, font: bold, color: PRIMARY });

    y = boxY - 10;
  };

  const drawDivider = () => {
    y -= 4;
    page.drawLine({
      start: { x: margin, y }, end: { x: PAGE_W - margin, y },
      thickness: 1, color: BORDER,
    });
    y -= 6;
  };

  drawHeader();
  drawSubHeader();
  drawDivider();

  const tableStartY = y;
  const rowH = 18;
  const colDefs = [
    { x: margin, w: 180, label: "UNSUR NILAI" },
    { x: margin + 185, w: 100, label: "SIFAT" },
    { x: margin + 290, w: 70, label: "SKOR" },
    { x: margin + 365, w: 55, label: "NILAI" },
    { x: margin + 425, w: PAGE_W - margin * 2 - 430, label: "KETERANGAN" },
  ];

  const drawRow = (idx: number, cells: string[], isHeader = false) => {
    const ry = y - rowH;

    if (isHeader) {
      page.drawRectangle({
        x: margin, y: ry, width: PAGE_W - margin * 2, height: rowH,
        color: HEADER_BG,
      });
    } else if (idx % 2 === 0) {
      page.drawRectangle({
        x: margin, y: ry, width: PAGE_W - margin * 2, height: rowH,
        color: ROW_EVEN,
      });
    } else {
      page.drawRectangle({
        x: margin, y: ry, width: PAGE_W - margin * 2, height: rowH,
        color: ROW_ODD,
      });
    }

    cells.forEach((text, ci) => {
      const col = colDefs[ci];
      if (!col) return;
      const f = isHeader ? bold : font;
      const fs = isHeader ? 8 : 7.5;
      const fColor = isHeader ? HEADER_TEXT : (ci === 3 ? PRIMARY : TEXT_DARK);
      const tw = f.widthOfTextAtSize(text, fs);
      const cx = ci === 2 || ci === 3
        ? col.x + (col.w - tw) / 2
        : col.x + 6;
      page.drawText(text, {
        x: cx,
        y: y - rowH + 5,
        size: fs,
        font: f,
        color: fColor,
        maxWidth: col.w - 8,
      });
    });

    y -= rowH;
  };

  drawRow(0, colDefs.map(c => c.label === "KETERANGAN" ? "KET." : c.label), true);
  y = tableStartY - rowH;

  gradeData.subjects.forEach((subj, idx) => {
    if (y < margin + 80) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - margin;
      colDefs.forEach(() => {
        drawRow(0, colDefs.map(c2 => c2.label), true);
      });
      y = PAGE_H - margin - rowH;
    }
    drawRow(idx, [
      subj.name,
      subj.sifat || "-",
      String(subj.score),
      subj.grade,
      "",
    ]);
  });

  y -= 4;
  page.drawLine({
    start: { x: margin, y }, end: { x: PAGE_W - margin, y },
    thickness: 1.5, color: PRIMARY,
  });
  y -= 12;

  if (gradeData.subjects.length > 0) {
    const avg = gradeData.subjects.reduce((s, sub) => s + sub.score, 0) / gradeData.subjects.length;
    const avgGrade = gradeData.subjects.reduce((acc, sub) => {
      const gv = sub.score >= 85 ? 4 : sub.score >= 75 ? 3.5 : sub.score >= 65 ? 3 : sub.score >= 55 ? 2.5 : sub.score >= 40 ? 2 : 1;
      return acc + gv;
    }, 0) / gradeData.subjects.length;
    const finalGrade = avgGrade >= 3.5 ? "A" : avgGrade >= 2.5 ? "B" : avgGrade >= 1.5 ? "C" : "D";

    page.drawRectangle({
      x: margin, y: y - 22, width: PAGE_W - margin * 2, height: 22,
      color: SECONDARY,
    });
    page.drawText(`RATA-RATA: ${avg.toFixed(1)}`, {
      x: margin + 10, y: y - 16, size: 9, font: bold, color: HEADER_TEXT,
    });
    page.drawText(`PREDIKAT: ${finalGrade}`, {
      x: PAGE_W - margin - 90, y: y - 16, size: 9, font: bold, color: HEADER_TEXT,
    });
    y -= 32;
  }

  if (gradeData.notes) {
    y -= 4;
    page.drawRectangle({
      x: margin, y: y, width: PAGE_W - margin * 2, height: 14,
      color: rgb(0.12, 0.42, 0.72),
    });
    page.drawText("CATATAN", {
      x: margin + 8, y: y + 3, size: 8, font: bold, color: HEADER_TEXT,
    });
    y -= 20;

    const lines = wrapText(gradeData.notes, font, 8, PAGE_W - margin * 2 - 16);
    page.drawRectangle({
      x: margin, y: y - lines.length * 14 - 8,
      width: PAGE_W - margin * 2, height: lines.length * 14 + 8,
      color: rgb(0.97, 0.98, 0.99),
    });

    lines.forEach((line, li) => {
      page.drawText(line, {
        x: margin + 8, y: y - 4 - li * 14, size: 8, font,
        color: TEXT_DARK,
      });
    });
    y -= lines.length * 14 + 12;
  }

  y -= 10;
  const signY = y;
  page.drawLine({
    start: { x: margin, y: signY },
    end: { x: PAGE_W - margin, y: signY },
    thickness: 0.5, color: BORDER,
  });
  y = signY - 6;

  page.drawText(
    `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
    { x: margin, y, size: 7, font: oblique, color: TEXT_MUTED }
  );

  const signX = PAGE_W - margin - 150;
  y -= 50;
  page.drawLine({
    start: { x: signX, y }, end: { x: signX + 120, y },
    thickness: 0.8, color: TEXT_DARK,
  });
  page.drawText("Kepala Program PKL", {
    x: signX, y: y - 16, size: 8, font,
    color: TEXT_MUTED, maxWidth: 120,
  });

  const pageCount = doc.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const p = doc.getPages()[i];
    const py = 20;
    p.drawText(`Halaman ${i + 1} dari ${pageCount}`, {
      x: PAGE_W - margin - 80, y: py, size: 7, font: oblique, color: TEXT_MUTED,
    });
  }

  return doc.save();
}

export async function downloadGradePdf(
  studentName: string,
  identityNumber: string,
  kelas: string,
  gradeData: GradeData
): Promise<void> {
  const pdfBytes = await generateGradePdf(studentName, identityNumber, kelas, gradeData);
  const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rekap-nilai-${studentName.replace(/\s+/g, "-").toLowerCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
