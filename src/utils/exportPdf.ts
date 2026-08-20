import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AiExecutiveBrief, School, RegionFilter, AppBrandingConfig } from '../types';

interface ExportPdfOptions {
  brief: AiExecutiveBrief | null;
  schools: School[];
  filter: RegionFilter;
  elementIdToCapture?: string; // Optional element ID for capturing rendered charts/DOM
  branding?: AppBrandingConfig;
}

export async function exportExecutiveSummaryToPdf({
  brief,
  schools,
  filter,
  elementIdToCapture = 'executive-summary-content',
  branding
}: ExportPdfOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Primary colors
  const primaryTeal = [13, 92, 117]; // #0D5C75
  const darkTeal = [7, 57, 74];     // #07394A
  const goldAccent = [212, 175, 55]; // #D4AF37
  const slateDark = [30, 41, 59];    // #1E293B
  const slateMuted = [100, 116, 139];// #64748B
  const bgLight = [248, 250, 252];   // #F8FAFC

  let currentY = margin;

  // -------------------------------------------------------------
  // HEADER BANNER
  // -------------------------------------------------------------
  doc.setFillColor(darkTeal[0], darkTeal[1], darkTeal[2]);
  doc.roundedRect(margin, currentY, contentWidth, 24, 3, 3, 'F');

  // Accent Gold Stripe on Left
  doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.roundedRect(margin, currentY, 3.5, 24, 1.5, 1.5, 'F');

  // App Title & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(branding?.appTitle ? `${branding.appTitle} COPILOT` : 'AKTARA INTELLIGENCE COPILOT', margin + 8, currentY + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(212, 175, 55);
  doc.text(branding?.bannerHeadline || 'EXECUTIVE BRIEF & MARKET EXPANSION DOSSIER', margin + 8, currentY + 14);

  // Region & Date Badge on right
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`Wilayah: ${filter.cityDistrict || 'Semua Wilayah'}`, pageWidth - margin - 6, currentY + 8.5, { align: 'right' });
  doc.text(`Institusi: ${branding?.organizationName || 'PT AKTARA EDUKASI INDONESIA'} • ${dateStr}`, pageWidth - margin - 6, currentY + 14, { align: 'right' });

  currentY += 28;

  // -------------------------------------------------------------
  // 1. EXECUTIVE SUMMARY (AI Brief)
  // -------------------------------------------------------------
  if (brief) {
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 32, 2, 2, 'FD');

    // Teal bar
    doc.setFillColor(primaryTeal[0], primaryTeal[1], primaryTeal[2]);
    doc.rect(margin, currentY, 2.5, 32, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primaryTeal[0], primaryTeal[1], primaryTeal[2]);
    doc.text('1. EXECUTIVE SUMMARY & MARKET SYNTHESIS (AI-GENERATED)', margin + 6, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);

    const summaryText = brief.executiveBrief || 'Analisis pasar komprehensif mengindikasikan peluang strategis tinggi.';
    const splitSummary = doc.splitTextToSize(summaryText, contentWidth - 12);
    doc.text(splitSummary.slice(0, 4), margin + 6, currentY + 12, { lineHeightFactor: 1.35 });

    currentY += 36;
  }

  // -------------------------------------------------------------
  // 2. KEY METRICS CARDS (3 Columns)
  // -------------------------------------------------------------
  const totalSchools = schools.length;
  const totalStudents = schools.reduce((acc, s) => acc + (s.totalStudents || 0), 0);
  const negeriCount = schools.filter(s => s.status === 'Negeri').length;
  const swastaCount = schools.filter(s => s.status === 'Swasta').length;
  const maleStudents = schools.reduce((acc, s) => acc + (s.maleStudents || 0), 0);
  const femaleStudents = schools.reduce((acc, s) => acc + (s.femaleStudents || 0), 0);

  const colWidth = (contentWidth - 6) / 3;
  const cardHeight = 22;

  // Card 1: Total Sekolah
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, colWidth, cardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('TOTAL SEKOLAH TERDATA', margin + 4, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(darkTeal[0], darkTeal[1], darkTeal[2]);
  doc.text(`${totalSchools}`, margin + 4, currentY + 12);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Unit Institusi', margin + 18, currentY + 12);

  doc.setFontSize(6.8);
  doc.setTextColor(primaryTeal[0], primaryTeal[1], primaryTeal[2]);
  doc.text(`${negeriCount} Negeri | ${swastaCount} Swasta`, margin + 4, currentY + 18);

  // Card 2: Total Siswa Aktif
  const col2X = margin + colWidth + 3;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(col2X, currentY, colWidth, cardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('AKUMULASI SISWA AKTIF', col2X + 4, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(darkTeal[0], darkTeal[1], darkTeal[2]);
  doc.text(`${totalStudents.toLocaleString('id-ID')}`, col2X + 4, currentY + 12);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Siswa', col2X + 26, currentY + 12);

  doc.setFontSize(6.8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`Putra: ${maleStudents.toLocaleString('id-ID')} | Putri: ${femaleStudents.toLocaleString('id-ID')}`, col2X + 4, currentY + 18);

  // Card 3: Dominasi & Potensi
  const col3X = margin + (colWidth * 2) + 6;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(col3X, currentY, colWidth, cardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('DOMINASI PASAR WILAYAH', col3X + 4, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  const domText = brief?.keyMetrics.marketDominance || (swastaCount > negeriCount ? 'Dominan Swasta' : 'Dominan Negeri');
  doc.text(domText, col3X + 4, currentY + 12);

  doc.setFontSize(6.8);
  doc.setTextColor(primaryTeal[0], primaryTeal[1], primaryTeal[2]);
  doc.text('Peluang Penetrasi: Tinggi', col3X + 4, currentY + 18);

  currentY += cardHeight + 5;

  // -------------------------------------------------------------
  // 3. CAPTURED VISUAL CHARTS (From ExecutiveSummaryCharts component if present)
  // -------------------------------------------------------------
  let capturedCanvas: HTMLCanvasElement | null = null;
  const targetElement = document.getElementById(elementIdToCapture);

  if (targetElement) {
    try {
      capturedCanvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF'
      });
    } catch (err) {
      console.warn('Gagal mengambil screenshot chart DOM:', err);
    }
  }

  if (capturedCanvas) {
    const imgData = capturedCanvas.toDataURL('image/png');
    // Calculate aspect ratio
    const imgWidth = contentWidth;
    const imgHeight = (capturedCanvas.height * imgWidth) / capturedCanvas.width;
    const maxAllowedHeight = 82;
    const finalHeight = Math.min(imgHeight, maxAllowedHeight);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, finalHeight + 8, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryTeal[0], primaryTeal[1], primaryTeal[2]);
    doc.text('2. VISUALISASI DISTRIBUSI & TOP RANKING SEKOLAH', margin + 4, currentY + 5.5);

    doc.addImage(imgData, 'PNG', margin + 2, currentY + 7, imgWidth - 4, finalHeight - 1);
    currentY += finalHeight + 12;
  }

  // -------------------------------------------------------------
  // 4. STRATEGIC RECOMMENDATIONS TABLE (If space allows, or Page 2)
  // -------------------------------------------------------------
  if (brief && brief.strategicRecommendations && brief.strategicRecommendations.length > 0) {
    // Check if we need page break
    if (currentY + 45 > pageHeight - 15) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(226, 232, 240);
    const recBoxHeight = Math.min(48, brief.strategicRecommendations.length * 14 + 10);
    doc.roundedRect(margin, currentY, contentWidth, recBoxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryTeal[0], primaryTeal[1], primaryTeal[2]);
    doc.text('3. REKOMENDASI STRATEGIS KEMITRAAN AKTARA', margin + 4, currentY + 6);

    let recY = currentY + 12;
    brief.strategicRecommendations.slice(0, 3).forEach((rec, idx) => {
      // Number icon
      doc.setFillColor(primaryTeal[0], primaryTeal[1], primaryTeal[2]);
      doc.circle(margin + 6, recY - 1, 2.3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text(`${idx + 1}`, margin + 5, recY + 0.3);

      // Text
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const splitRec = doc.splitTextToSize(rec, contentWidth - 18);
      doc.text(splitRec.slice(0, 2), margin + 12, recY, { lineHeightFactor: 1.25 });

      recY += 11;
    });

    currentY += recBoxHeight + 5;
  }

  // -------------------------------------------------------------
  // 5. TOP TARGET PRIORITY SCHOOLS TABLE
  // -------------------------------------------------------------
  if (currentY + 50 > pageHeight - 15) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  const tableSchools = [...schools]
    .sort((a, b) => (b.aktaraCompatibility?.fitScore || 0) - (a.aktaraCompatibility?.fitScore || 0))
    .slice(0, 5);

  const tableHeight = 10 + tableSchools.length * 7.5;
  doc.roundedRect(margin, currentY, contentWidth, tableHeight, 2, 2, 'FD');

  // Table Header
  doc.setFillColor(darkTeal[0], darkTeal[1], darkTeal[2]);
  doc.roundedRect(margin, currentY, contentWidth, 7, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('TARGET SEKOLAH PRIORITAS', margin + 4, currentY + 4.8);
  doc.text('KECAMATAN', margin + 70, currentY + 4.8);
  doc.text('STATUS', margin + 105, currentY + 4.8);
  doc.text('SISWA', margin + 130, currentY + 4.8);
  doc.text('AKTARA FIT', margin + 155, currentY + 4.8);

  let rowY = currentY + 12;
  tableSchools.forEach((s, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    const schoolName = s.name.length > 32 ? s.name.substring(0, 30) + '...' : s.name;
    doc.text(`${idx + 1}. ${schoolName}`, margin + 4, rowY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(s.subDistrict || '-', margin + 70, rowY);
    doc.text(s.status || '-', margin + 105, rowY);
    doc.text(`${s.totalStudents.toLocaleString('id-ID')}`, margin + 130, rowY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryTeal[0], primaryTeal[1], primaryTeal[2]);
    doc.text(`${s.aktaraCompatibility?.fitScore || 85}%`, margin + 155, rowY);

    // Row divider
    if (idx < tableSchools.length - 1) {
      doc.setDrawColor(241, 245, 249);
      doc.line(margin + 4, rowY + 2, margin + contentWidth - 4, rowY + 2);
    }

    rowY += 7.5;
  });

  currentY += tableHeight + 6;

  // -------------------------------------------------------------
  // FOOTER (Page number & Confidentiality notice)
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    
    // Bottom line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.text(
      'Dokumen Rahasia & Strategis Internal • Dihasilkan otomatis oleh AKTARA GIS Platform & Google Gemini',
      margin,
      pageHeight - 6.5
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
  }

  // Save the PDF
  const filename = `AKTARA_Executive_Summary_${(filter.cityDistrict || 'Garut').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
