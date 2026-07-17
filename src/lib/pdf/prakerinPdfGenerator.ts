import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { PrakerinRecapData, ThemeColors } from "@/lib/types";
import { prakerinGradeFromScore, prakerinGradeLabel, RECAP_THEMES } from "@/lib/types";

function getGradeColor(score: number) {
  if (score >= 90) return { bg: rgb(0.94, 1, 0.96), text: rgb(0.05, 0.5, 0.2), border: rgb(0.4, 0.85, 0.5) };
  if (score >= 80) return { bg: rgb(0.93, 0.96, 1), text: rgb(0.15, 0.39, 0.92), border: rgb(0.5, 0.7, 0.95) };
  if (score >= 70) return { bg: rgb(1, 0.96, 0.88), text: rgb(0.75, 0.4, 0.02), border: rgb(0.95, 0.75, 0.3) };
  return { bg: rgb(1, 0.94, 0.94), text: rgb(0.8, 0.1, 0.1), border: rgb(0.95, 0.5, 0.5) };
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

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? rgb(parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255) : rgb(0.06, 0.09, 0.16);
}

export async function generatePrakerinPdf(data: PrakerinRecapData, themeKey = "navy"): Promise<Uint8Array> {
  const tc = (RECAP_THEMES[themeKey] || RECAP_THEMES.navy).colors;
  const PRIMARY = hexToRgb(tc.primary);
  const PRIMARY_LIGHT = hexToRgb(tc.primaryLight);
  const ACCENT = hexToRgb(tc.accent);
  const HEADER_BG = hexToRgb(tc.headerBg);
  const HEADER_TEXT = hexToRgb(tc.headerText);
  const ROW_EVEN = hexToRgb(tc.rowEven);
  const ROW_ODD = rgb(1, 1, 1);
  const BORDER = hexToRgb(tc.border);
  const TEXT_DARK = hexToRgb(tc.primary);
  const TEXT_MUTED = rgb(0.4, 0.45, 0.55);

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const MARGIN = 45;
  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  // ═══ Helper Functions ═══════════════════════════
  const drawLine = (x1: number, yy1: number, x2: number, yy2: number, thickness = 1, color = BORDER) => {
    page.drawLine({ start: { x: x1, y: yy1 }, end: { x: x2, y: yy2 }, thickness, color });
  };

  const drawRect = (x: number, yy: number, w: number, h: number, color: any) => {
    page.drawRectangle({ x, y: yy, width: w, height: h, color });
  };

  const drawText = (text: string, x: number, yy: number, size: number, font_: any, color: any) => {
    page.drawText(text, { x, y: yy, size, font: font_, color });
  };

  // ═══ Header ════════════════════════════════════
  drawRect(0, PAGE_H - 110, PAGE_W, 110, PRIMARY);

  drawText("POLITEKNIK SSR", MARGIN, PAGE_H - 38, 20, bold, HEADER_TEXT);
  drawText("Sistem Informasi Prakerin", MARGIN, PAGE_H - 56, 10, font, rgb(0.75, 0.82, 0.92));
  drawText("Tahun Akademik 2025/2026", PAGE_W - MARGIN - 180, PAGE_H - 56, 9, font, rgb(0.65, 0.72, 0.85));

  drawLine(MARGIN, PAGE_H - 66, PAGE_W - MARGIN, PAGE_H - 66, 2, rgb(0.25, 0.4, 0.6));

  drawText("REKAP PENILAIAN SISWA PRAKERIN", MARGIN, PAGE_H - 88, 17, bold, HEADER_TEXT);
  y = PAGE_H - 120;

  // ═══ Identity Block ════════════════════════════
  const idY = y;
  const idH = 85;
  drawRect(MARGIN, idY - idH, PAGE_W - MARGIN * 2, idH, rgb(0.97, 0.98, 0.99));
  drawRect(MARGIN, idY - 22, PAGE_W - MARGIN * 2, 22, PRIMARY_LIGHT);
  drawText("IDENTITAS SISWA", MARGIN + 12, idY - 16, 9, bold, HEADER_TEXT);

  const col1X = MARGIN + 14;
  const col2X = MARGIN + 210;
  const col3X = MARGIN + 405;
  const lineH = 18;

  const fields = [
    [
      ["Nama Siswa", data.studentName],
      ["NIS", data.nis],
    ],
    [
      ["Kelas", data.kelas],
      ["Program Keahlian", data.programKeahlian],
    ],
    [
      ["Industri", data.industri],
      ["Periode", data.periode || `${data.pklStartDate || "-"} — ${data.pklEndDate || "-"}`],
    ],
  ];

  fields.forEach((row, ri) => {
    const fy = idY - 38 - ri * lineH;
    row.forEach((field, fi) => {
      const fx = fi === 0 ? col1X : col2X;
      drawText(`${field[0]}:`, fx, fy, 7.5, font, TEXT_MUTED);
      const val = field[1] || "-";
      drawText(val, fx + 75, fy, 8.5, bold, TEXT_DARK);
    });
  });

  y = idY - idH - 12;

  // ═══ Table 1: Unsur Nilai ═════════════════════
  const sectionH = 18;
  drawRect(MARGIN, y - sectionH, PAGE_W - MARGIN * 2, sectionH, PRIMARY);
  drawText("TABEL UNSUR NILAI", MARGIN + 10, y - 12.5, 9, bold, HEADER_TEXT);
  y -= sectionH + 5;

  const t1RowH = 20;
  const t1ColDef = [
    { x: MARGIN, w: 32, label: "NO" },
    { x: MARGIN + 36, w: 130, label: "UNSUR PENILAIAN" },
    { x: MARGIN + 170, w: 75, label: "NILAI ANGKA" },
    { x: MARGIN + 249, w: 65, label: "NILAI HURUF" },
    { x: MARGIN + 318, w: PAGE_W - MARGIN * 2 - 324, label: "KETERANGAN" },
  ];

  // Header row
  drawRect(MARGIN, y - t1RowH, PAGE_W - MARGIN * 2, t1RowH, HEADER_BG);
  t1ColDef.forEach((col, ci) => {
    const tw = bold.widthOfTextAtSize(col.label, 7.5);
    const cx = ci >= 2 ? col.x + (col.w - tw) / 2 : col.x + 8;
    drawText(col.label, cx, y - t1RowH + 6, 7.5, bold, HEADER_TEXT);
  });
  y -= t1RowH;

  // Data rows
  data.unsurNilai.forEach((item, idx) => {
    const ry = y - t1RowH;
    drawRect(MARGIN, ry, PAGE_W - MARGIN * 2, t1RowH, idx % 2 === 0 ? ROW_EVEN : ROW_ODD);

    // Borders
    drawLine(MARGIN, ry, PAGE_W - MARGIN, ry, 0.75, BORDER);

    const no = String(idx + 1);
    drawText(no, MARGIN + 14, ry + 6, 8.5, bold, TEXT_DARK);
    drawText(item.name, MARGIN + 44, ry + 6, 8.5, font, TEXT_DARK);

    const score = item.score;
    const scoreStr = score > 0 ? String(Math.round(score)) : "-";
    drawText(scoreStr, MARGIN + 207, ry + 6, 8.5, bold, TEXT_DARK);

    const grade = score > 0 ? prakerinGradeFromScore(score) : "-";
    const gradeLabel = score > 0 ? prakerinGradeLabel(score) : "";
    const gradeColor = getGradeColor(score);
    
    // Draw grade badge
    if (score > 0) {
      const badgeX = MARGIN + 275;
      const badgeY = ry + 3;
      const badgeW = 22;
      const badgeH = 14;
      drawRect(badgeX, badgeY, badgeW, badgeH, gradeColor.bg);
      drawLine(badgeX, badgeY, badgeX + badgeW, badgeY, 0.5, gradeColor.border);
      drawLine(badgeX, badgeY, badgeX, badgeY + badgeH, 0.5, gradeColor.border);
      drawLine(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + badgeH, 0.5, gradeColor.border);
      drawLine(badgeX, badgeY + badgeH, badgeX + badgeW, badgeY + badgeH, 0.5, gradeColor.border);
      const gw = bold.widthOfTextAtSize(grade, 8);
      drawText(grade, badgeX + (badgeW - gw) / 2, badgeY + 3, 8, bold, gradeColor.text);
    } else {
      drawText(grade, MARGIN + 282, ry + 6, 8.5, bold, TEXT_DARK);
    }
    
    drawText(gradeLabel, MARGIN + 328, ry + 6, 7.5, font, TEXT_MUTED);

    y = ry;
  });

  // Border bottom
  drawLine(MARGIN, y, PAGE_W - MARGIN, y, 1.5, PRIMARY);

  // Average row
  const avgY = y - t1RowH;
  drawRect(MARGIN, avgY, PAGE_W - MARGIN * 2, t1RowH, rgb(0.92, 0.96, 1));
  drawLine(MARGIN, avgY, PAGE_W - MARGIN, avgY, 1, PRIMARY);

  const activeScores = data.unsurNilai.filter((u) => u.score > 0);
  const avg = activeScores.length > 0 ? activeScores.reduce((s, u) => s + u.score, 0) / activeScores.length : 0;
  const avgGrade = avg > 0 ? prakerinGradeFromScore(avg) : "-";
  const avgLabel = avg > 0 ? prakerinGradeLabel(avg) : "";
  const avgColor = getGradeColor(avg);

  drawText("RATA-RATA", MARGIN + 44, avgY + 6, 8.5, bold, PRIMARY);
  drawText(avg > 0 ? String(Math.round(avg)) : "-", MARGIN + 207, avgY + 6, 9.5, bold, PRIMARY);
  
  // Draw average grade badge
  if (avg > 0) {
    const badgeX = MARGIN + 275;
    const badgeY = avgY + 3;
    const badgeW = 22;
    const badgeH = 14;
    drawRect(badgeX, badgeY, badgeW, badgeH, avgColor.bg);
    drawLine(badgeX, badgeY, badgeX + badgeW, badgeY, 0.5, avgColor.border);
    drawLine(badgeX, badgeY, badgeX, badgeY + badgeH, 0.5, avgColor.border);
    drawLine(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + badgeH, 0.5, avgColor.border);
    drawLine(badgeX, badgeY + badgeH, badgeX + badgeW, badgeY + badgeH, 0.5, avgColor.border);
    const gw = bold.widthOfTextAtSize(avgGrade, 9);
    drawText(avgGrade, badgeX + (badgeW - gw) / 2, badgeY + 3, 9, bold, avgColor.text);
  } else {
    drawText(avgGrade, MARGIN + 282, avgY + 6, 9.5, bold, PRIMARY);
  }
  
  drawText(avgLabel, MARGIN + 328, avgY + 6, 8.5, bold, PRIMARY);

  y = avgY - 16;

  // ═══ Table 2: Bidang Keahlian ═════════════════
  drawRect(MARGIN, y - sectionH, PAGE_W - MARGIN * 2, sectionH, PRIMARY);
  drawText("BIDANG KEAHLIAN YANG DILATIHKAN", MARGIN + 10, y - 12.5, 9, bold, HEADER_TEXT);
  y -= sectionH + 5;

  const t2RowH = 20;
  const t2ColDef = [
    { x: MARGIN, w: 32, label: "NO" },
    { x: MARGIN + 36, w: 130, label: "BIDANG KEAHLIAN" },
    { x: MARGIN + 170, w: 75, label: "NILAI ANGKA" },
    { x: MARGIN + 249, w: 65, label: "NILAI HURUF" },
    { x: MARGIN + 318, w: PAGE_W - MARGIN * 2 - 324, label: "KETERANGAN" },
  ];

  drawRect(MARGIN, y - t2RowH, PAGE_W - MARGIN * 2, t2RowH, HEADER_BG);
  t2ColDef.forEach((col, ci) => {
    const tw = bold.widthOfTextAtSize(col.label, 7.5);
    const cx = ci >= 2 ? col.x + (col.w - tw) / 2 : col.x + 8;
    drawText(col.label, cx, y - t2RowH + 6, 7.5, bold, HEADER_TEXT);
  });
  y -= t2RowH;

  data.bidangKeahlian.forEach((item, idx) => {
    const ry = y - t2RowH;
    drawRect(MARGIN, ry, PAGE_W - MARGIN * 2, t2RowH, idx % 2 === 0 ? ROW_EVEN : ROW_ODD);
    drawLine(MARGIN, ry, PAGE_W - MARGIN, ry, 0.75, BORDER);

    const score = item.score;
    const scoreStr = score > 0 ? String(Math.round(score)) : "-";
    const grade = score > 0 ? prakerinGradeFromScore(score) : "-";
    const gradeLabel = score > 0 ? prakerinGradeLabel(score) : "";
    const gradeColor = getGradeColor(score);

    drawText(String(idx + 1), MARGIN + 14, ry + 6, 8.5, bold, TEXT_DARK);
    drawText(item.name || "-", MARGIN + 44, ry + 6, 8, font, TEXT_DARK);
    drawText(scoreStr, MARGIN + 207, ry + 6, 8.5, bold, TEXT_DARK);

    if (score > 0) {
      const badgeX = MARGIN + 275;
      const badgeY = ry + 3;
      const badgeW = 22;
      const badgeH = 14;
      drawRect(badgeX, badgeY, badgeW, badgeH, gradeColor.bg);
      drawLine(badgeX, badgeY, badgeX + badgeW, badgeY, 0.5, gradeColor.border);
      drawLine(badgeX, badgeY, badgeX, badgeY + badgeH, 0.5, gradeColor.border);
      drawLine(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + badgeH, 0.5, gradeColor.border);
      drawLine(badgeX, badgeY + badgeH, badgeX + badgeW, badgeY + badgeH, 0.5, gradeColor.border);
      const gw = bold.widthOfTextAtSize(grade, 8);
      drawText(grade, badgeX + (badgeW - gw) / 2, badgeY + 3, 8, bold, gradeColor.text);
    } else {
      drawText(grade, MARGIN + 282, ry + 6, 8.5, bold, TEXT_DARK);
    }

    drawText(gradeLabel, MARGIN + 328, ry + 6, 7.5, font, TEXT_MUTED);

    y = ry;
  });
  drawLine(MARGIN, y, PAGE_W - MARGIN, y, 1.5, PRIMARY);
  y -= 16;

  // ═══ Catatan ═══════════════════════════════════
  if (data.notes) {
    drawRect(MARGIN, y - sectionH, PAGE_W - MARGIN * 2, sectionH, PRIMARY_LIGHT);
    drawText("CATATAN", MARGIN + 10, y - 12.5, 9, bold, HEADER_TEXT);
    y -= sectionH + 5;

    const noteLines = wrapText(data.notes, font, 8.5, PAGE_W - MARGIN * 2 - 20);
    const noteH = noteLines.length * 14 + 12;
    drawRect(MARGIN, y - noteH, PAGE_W - MARGIN * 2, noteH, rgb(0.97, 0.98, 0.99));

    noteLines.forEach((line, li) => {
      drawText(line, MARGIN + 10, y - 5 - li * 14, 8.5, font, TEXT_DARK);
    });
    y -= noteH + 12;
  }

  // ═══ Skala Penilaian ═══════════════════════════
  y -= 5;
  drawRect(MARGIN, y - sectionH, (PAGE_W - MARGIN * 2) / 2 - 5, sectionH, PRIMARY_LIGHT);
  drawText("SKALA PENILAIAN", MARGIN + 10, y - 12.5, 8, bold, HEADER_TEXT);
  y -= sectionH + 5;

  const skalaData: [string, string, string, any, any, any][] = [
    ["90 – 100", "Sangat Baik", "A", rgb(0.94, 1, 0.96), rgb(0.05, 0.5, 0.2), rgb(0.4, 0.85, 0.5)],
    ["80 – 89", "Baik", "B", rgb(0.93, 0.96, 1), rgb(0.15, 0.39, 0.92), rgb(0.5, 0.7, 0.95)],
    ["70 – 79", "Cukup", "C", rgb(1, 0.96, 0.88), rgb(0.75, 0.4, 0.02), rgb(0.95, 0.75, 0.3)],
    ["0 – 69", "Kurang", "D", rgb(1, 0.94, 0.94), rgb(0.8, 0.1, 0.1), rgb(0.95, 0.5, 0.5)],
  ];

  const halfW = (PAGE_W - MARGIN * 2) / 2 - 5;
  const skRowH = 16;
  skalaData.forEach((row, idx) => {
    const ry = y - skRowH;
    drawRect(MARGIN, ry, halfW, skRowH, idx % 2 === 0 ? ROW_EVEN : ROW_ODD);
    drawText(row[0] as string, MARGIN + 10, ry + 5, 7.5, bold, TEXT_DARK);
    drawText(`= ${row[1]}`, MARGIN + 65, ry + 5, 7.5, font, TEXT_DARK);
    drawText(`(${row[2]})`, MARGIN + halfW - 35, ry + 5, 7.5, bold, row[4] as any);
    y = ry;
  });
  drawLine(MARGIN, y, MARGIN + halfW, y, 0.75, BORDER);

  // ═══ Signature Section ═════════════════════════
  y -= 45;
  const signX1 = MARGIN;
  const signX2 = MARGIN + (PAGE_W - MARGIN * 2) / 2 + 25;
  const signW = 155;

  async function drawSignature(x: number, label: string, nip: string, ttdDataUrl: string | null, nama: string) {
    drawText("Mengetahui,", x, y, 8.5, font, TEXT_MUTED);
    drawText(label, x, y - 14, 8.5, font, TEXT_MUTED);

    let ttdY = y - 60;

    if (ttdDataUrl) {
      try {
        const imgData = ttdDataUrl.split(",")[1];
        let img: any;
        if (ttdDataUrl.startsWith("data:image/png")) {
          img = await doc.embedPng(imgData);
        } else {
          img = await doc.embedJpg(imgData);
        }
        const aspect = img.width / img.height;
        const imgH = 45;
        const imgW = imgH * aspect;
        const imgX = x + (signW - imgW) / 2;
        drawRect(imgX, ttdY - imgH, imgW, imgH, rgb(1, 1, 1));
        page.drawImage(img, { x: imgX, y: ttdY - imgH, width: imgW, height: imgH });
        ttdY -= imgH + 10;
      } catch { /* fallback ke garis */ }
    }

    drawLine(x, ttdY, x + signW, ttdY, 1, TEXT_DARK);
    const namaText = nama || "_________________________";
    drawText(namaText, x, ttdY - 14, 8.5, bold, TEXT_DARK);
    drawText(nip ? `NIP. ${nip}` : "NIP. _____________________", x, ttdY - 28, 7.5, font, TEXT_MUTED);
  }

  await drawSignature(signX1, "Pembimbing Sekolah", data.pembimbingSekolahNip, data.pembimbingSekolahTtd || null, data.pembimbingSekolahNama);
  await drawSignature(signX2, "Pembimbing Industri / Perusahaan", data.pembimbingIndustriNip, data.pembimbingIndustriTtd || null, data.pembimbingIndustriNama);

  // ═══ Footer ════════════════════════════════════
  drawLine(MARGIN, 38, PAGE_W - MARGIN, 38, 0.75, BORDER);
  drawText(
    `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
    MARGIN, 24, 7.5, oblique, TEXT_MUTED
  );

  const pageCount = doc.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const p = doc.getPages()[i];
    p.drawText(`Halaman ${i + 1} dari ${pageCount}`, {
      x: PAGE_W - MARGIN - 85, y: 24, size: 7.5, font: oblique, color: TEXT_MUTED,
    });
  }

  return doc.save();
}

export async function downloadPrakerinPdf(data: PrakerinRecapData, themeKey = "navy"): Promise<void> {
  const pdfBytes = await generatePrakerinPdf(data, themeKey);
  const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rekap-prakerin-${data.studentName.replace(/\s+/g, "-").toLowerCase() || "siswa"}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}