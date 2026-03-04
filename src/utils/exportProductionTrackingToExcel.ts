import ExcelJS from 'exceljs';

/** Format detik ke string durasi (e.g. 90 -> "1m 30s") */
function formatDurationFromSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '-';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

/** Ambil nilai tampilan untuk cell dari item (sesuai dashboard) */
function getCellDisplay(item: any, key: string): string {
  switch (key) {
    case 'id_garment':
      return item.id_garment ?? '-';
    case 'style':
      return item.style ?? '-';
    case 'line':
      return String(item.line ?? '-');
    case 'buyer':
      return item.buyer ?? '-';
    case 'wo':
      return item.wo ?? '-';
    case 'start_time': {
      const startTime = item.start_time || item.START_TIME;
      if (!startTime) return '-';
      const date = new Date(startTime);
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    case 'output_qc':
      return item.duration_output_qc_formatted || formatDurationFromSeconds(item.duration_output_qc) || '-';
    case 'qc_rework_1':
      return item.qc_rework_1 != null ? formatDurationFromSeconds(item.qc_rework_1) : '-';
    case 'qc_rework_2':
      return item.qc_rework_2 != null ? formatDurationFromSeconds(item.qc_rework_2) : '-';
    case 'qc_rework_3':
      return item.qc_rework_3 != null ? formatDurationFromSeconds(item.qc_rework_3) : '-';
    case 'qc_reject':
      return item.qc_reject != null ? formatDurationFromSeconds(item.qc_reject) : '-';
    case 'qc_pqc':
      return item.duration_qc_pqc_formatted || formatDurationFromSeconds(item.duration_qc_pqc) || '-';
    case 'pqc_rework_1':
      return item.pqc_rework_1 != null ? formatDurationFromSeconds(item.pqc_rework_1) : '-';
    case 'pqc_rework_2':
      return item.pqc_rework_2 != null ? formatDurationFromSeconds(item.pqc_rework_2) : '-';
    case 'pqc_rework_3':
      return item.pqc_rework_3 != null ? formatDurationFromSeconds(item.pqc_rework_3) : '-';
    case 'pqc_reject':
      return item.pqc_reject != null ? formatDurationFromSeconds(item.pqc_reject) : '-';
    case 'dryroom_in':
      return item.dryroom_in_formatted || formatDurationFromSeconds(item.dryroom_in) || '-';
    case 'dryroom_out':
      return item.dryroom_out_formatted || formatDurationFromSeconds(item.dryroom_out) || '-';
    case 'folding_in':
      return item.folding_in_formatted || formatDurationFromSeconds(item.folding_in) || '-';
    case 'folding_out':
      return item.folding_out_formatted || formatDurationFromSeconds(item.folding_out) || '-';
    case 'total':
      return item.total_cycle_time_formatted || formatDurationFromSeconds(item.total_cycle_time) || '-';
    default:
      return '-';
  }
}

// Header: lebih terang (background terang, teks gelap agar kontras & teks tidak terpotong)
const HEADER = {
  gray: { fill: 'FFF1F5F9', font: 'FF334155' },
  blue: { fill: 'FFE0F2FE', font: 'FF0369A1' },
  yellow: { fill: 'FFFEF9C3', font: 'FFB45309' },
  red: { fill: 'FFFFE4E6', font: 'FFBE123C' },
  green: { fill: 'FFDCFCE7', font: 'FF166534' },
  purple: { fill: 'FFF3E8FF', font: 'FF7C3AED' },
  orange: { fill: 'FFFFEDD5', font: 'FFC2410C' },
  cyan: { fill: 'FFCFFAFE', font: 'FF0E7490' },
};

// Data: lebih soft (pastel lembut)
const DATA = {
  gray: { fill: 'FFFAFAFA', font: 'FF475569' },
  blue: { fill: 'FFEFF6FF', font: 'FF2563EB' },
  yellow: { fill: 'FFFEFCE8', font: 'FFCA8A04' },
  red: { fill: 'FFFFF1F2', font: 'FFDC2626' },
  green: { fill: 'FFF0FDF4', font: 'FF16A34A' },
  purple: { fill: 'FFFAF5FF', font: 'FF9333EA' },
  orange: { fill: 'FFFFF7ED', font: 'FFEA580C' },
  cyan: { fill: 'FFF0FDFA', font: 'FF0891B2' },
};

/** Format tanggal untuk tampilan (YYYY-MM-DD → DD/MM/YYYY) */
function formatDateLabel(iso: string): string {
  if (!iso?.trim()) return '-';
  const d = new Date(iso.trim() + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export async function exportProductionTrackingToExcel(
  data: any[],
  dateFrom: string,
  dateTo: string
): Promise<void> {
  if (!data?.length) {
    throw new Error('Data tidak boleh kosong');
  }

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Production Tracking', {
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
    },
  });

  // ---- Baris 1: Judul laporan (format profesional) ----
  ws.mergeCells('A1:S1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'PRODUCTION TRACKING REPORT';
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
  titleCell.border = {
    bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
  };
  ws.getRow(1).height = 28;

  // ---- Baris 2: Periode & jumlah data ----
  ws.mergeCells('A2:S2');
  const fromLabel = formatDateLabel(dateFrom);
  const toLabel = formatDateLabel(dateTo);
  const subtitleCell = ws.getCell('A2');
  subtitleCell.value = `Periode: ${fromLabel} s/d ${toLabel}  |  Jumlah baris: ${data.length}`;
  subtitleCell.font = { size: 10, color: { argb: 'FF64748B' } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 20;

  const headers = [
    'ID & Style',
    'Line',
    'Buyer / WO',
    'Start Time',
    'Output → QC',
    'QC Rework #1',
    'QC Rework #2',
    'QC Rework #3',
    'QC Reject',
    'QC → PQC',
    'PQC Rework #1',
    'PQC Rework #2',
    'PQC Rework #3',
    'PQC Reject',
    'Dryroom IN',
    'Dryroom OUT',
    'Folding IN',
    'Folding OUT',
    'Total',
  ];
  const keys: string[] = [
    'id_garment',
    'line',
    'buyer',
    'start_time',
    'output_qc',
    'qc_rework_1',
    'qc_rework_2',
    'qc_rework_3',
    'qc_reject',
    'qc_pqc',
    'pqc_rework_1',
    'pqc_rework_2',
    'pqc_rework_3',
    'pqc_reject',
    'dryroom_in',
    'dryroom_out',
    'folding_in',
    'folding_out',
    'total',
  ];

  // Header row — warna lebih terang, teks gelap; tinggi baris ditambah agar teks tidak terpotong
  const headerFills: string[] = [
    HEADER.gray.fill,
    HEADER.gray.fill,
    HEADER.gray.fill,
    HEADER.gray.fill,
    HEADER.blue.fill,
    HEADER.yellow.fill,
    HEADER.yellow.fill,
    HEADER.yellow.fill,
    HEADER.red.fill,
    HEADER.green.fill,
    HEADER.purple.fill,
    HEADER.purple.fill,
    HEADER.purple.fill,
    HEADER.red.fill,
    HEADER.orange.fill,
    HEADER.orange.fill,
    HEADER.cyan.fill,
    HEADER.cyan.fill,
    HEADER.gray.fill,
  ];
  const headerFonts: string[] = [
    HEADER.gray.font,
    HEADER.gray.font,
    HEADER.gray.font,
    HEADER.gray.font,
    HEADER.blue.font,
    HEADER.yellow.font,
    HEADER.yellow.font,
    HEADER.yellow.font,
    HEADER.red.font,
    HEADER.green.font,
    HEADER.purple.font,
    HEADER.purple.font,
    HEADER.purple.font,
    HEADER.red.font,
    HEADER.orange.font,
    HEADER.orange.font,
    HEADER.cyan.font,
    HEADER.cyan.font,
    HEADER.gray.font,
  ];

  // ---- Baris 3: Header tabel — tinggi ditambah agar teks tidak terpotong ----
  const headerRow = ws.addRow(headers);
  headerRow.height = 30;
  headerRow.font = { bold: true, size: 10 };
  headers.forEach((_, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: headerFills[i] },
    };
    cell.font = { bold: true, size: 10, color: { argb: headerFonts[i] } };
    cell.alignment = {
      horizontal: i === 0 || i === 2 ? 'left' : 'center',
      vertical: 'middle',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Data rows — warna lebih soft (pastel), tetap ada perbedaan dengan header
  data.forEach((item, rowIndex) => {
    const rowValues = [
      `${item.id_garment ?? '-'}\n${item.style ?? ''}`,
      String(item.line ?? '-'),
      `${item.buyer ?? '-'}\n${item.wo ?? ''}`,
      getCellDisplay(item, 'start_time'),
      getCellDisplay(item, 'output_qc'),
      getCellDisplay(item, 'qc_rework_1'),
      getCellDisplay(item, 'qc_rework_2'),
      getCellDisplay(item, 'qc_rework_3'),
      getCellDisplay(item, 'qc_reject'),
      getCellDisplay(item, 'qc_pqc'),
      getCellDisplay(item, 'pqc_rework_1'),
      getCellDisplay(item, 'pqc_rework_2'),
      getCellDisplay(item, 'pqc_rework_3'),
      getCellDisplay(item, 'pqc_reject'),
      getCellDisplay(item, 'dryroom_in'),
      getCellDisplay(item, 'dryroom_out'),
      getCellDisplay(item, 'folding_in'),
      getCellDisplay(item, 'folding_out'),
      getCellDisplay(item, 'total'),
    ];
    const row = ws.addRow(rowValues);
    row.height = 20;
    const isEven = rowIndex % 2 === 0;
    const rowFill = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    const dataFills = [
      rowFill,
      rowFill,
      rowFill,
      rowFill,
      DATA.blue.fill,
      DATA.yellow.fill,
      DATA.yellow.fill,
      DATA.yellow.fill,
      DATA.red.fill,
      DATA.green.fill,
      DATA.purple.fill,
      DATA.purple.fill,
      DATA.purple.fill,
      DATA.red.fill,
      DATA.orange.fill,
      DATA.orange.fill,
      DATA.cyan.fill,
      DATA.cyan.fill,
      rowFill,
    ];
    const dataFonts = [
      DATA.gray.font,
      DATA.gray.font,
      DATA.gray.font,
      DATA.gray.font,
      DATA.blue.font,
      DATA.yellow.font,
      DATA.yellow.font,
      DATA.yellow.font,
      DATA.red.font,
      DATA.green.font,
      DATA.purple.font,
      DATA.purple.font,
      DATA.purple.font,
      DATA.red.font,
      DATA.orange.font,
      DATA.orange.font,
      DATA.cyan.font,
      DATA.cyan.font,
      DATA.gray.font,
    ];

    keys.forEach((_, i) => {
      const cell = row.getCell(i + 1);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: dataFills[i] },
      };
      cell.font = { size: 10, color: { argb: dataFonts[i] } };
      // Kolom 1 (ID & Style) dan 3 (Buyer / WO) rata kiri seperti dashboard
      cell.alignment = {
        horizontal: i === 0 || i === 2 ? 'left' : 'center',
        vertical: 'middle',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    });
    // Kolom Total bold
    row.getCell(19).font = { size: 10, bold: true, color: { argb: DATA.gray.font } };
  });

  // Column widths
  const widths = [14, 8, 18, 16, 12, 10, 10, 10, 10, 12, 10, 10, 10, 10, 10, 10, 10, 10, 12];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  // Freeze: baris 1–3 (judul + subtitle + header) tetap terlihat saat scroll
  ws.views = [{ state: 'frozen', ySplit: 3, activeCell: 'A4', showGridLines: true }];

  // Print: repeat header di setiap halaman
  ws.pageSetup.printTitlesRow = '3:3';

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `production-tracking-${dateFrom}-to-${dateTo}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
