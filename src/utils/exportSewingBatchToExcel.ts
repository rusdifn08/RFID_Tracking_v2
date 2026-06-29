import ExcelJS from 'exceljs';

/** Format Date to Indonesian format: "dd Bulan YYYY" (e.g. "18 Juni 2026") */
function formatDateIndo(date: Date): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export async function exportSewingBatchToExcel(
  lineNo: string,
  order: {
    wo: string;
    style: string;
    size: string;
    buyer: string;
    item: string;
    color: string;
  },
  batches: any[],
  dateFrom: string,
  dateTo: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Sewing Batch Dashboard', {
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
    },
  });

  // ---- Baris 1: Judul laporan (Merged A1:H1) ----
  ws.mergeCells('A1:H1');
  const titleCell = ws.getCell('A1');
  titleCell.value = `SEWING BATCH PRODUCTION REPORT - LINE ${lineNo}`;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
  titleCell.border = {
    bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
  };
  ws.getRow(1).height = 28;

  // ---- Baris 2: Periode (Merged A2:H2) ----
  ws.mergeCells('A2:H2');
  const fromLabel = dateFrom || '-';
  const toLabel = dateTo || '-';
  const subtitleCell = ws.getCell('A2');
  subtitleCell.value = `Periode: ${fromLabel} s/d ${toLabel}`;
  subtitleCell.font = { size: 10, color: { argb: 'FF64748B' } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 20;

  // ---- Metadata Order (WO, Style, Size, Color, Buyer, Item) ----
  ws.addRow([]); // empty spacing
  
  const addMetaRow = (label1: string, val1: string, label2: string, val2: string) => {
    const r = ws.addRow(['', label1, val1, '', '', label2, val2, '']);
    r.height = 18;
    r.getCell(2).font = { bold: true, size: 10, color: { argb: 'FF475569' } };
    r.getCell(3).font = { size: 10, color: { argb: 'FF1E293B' } };
    r.getCell(6).font = { bold: true, size: 10, color: { argb: 'FF475569' } };
    r.getCell(7).font = { size: 10, color: { argb: 'FF1E293B' } };
  };

  addMetaRow('Nomor WO:', order.wo, 'Ukuran (Size):', order.size);
  addMetaRow('Kode Style:', order.style, 'Warna (Color):', order.color);
  addMetaRow('Nama Buyer:', order.buyer, 'Nama Item:', order.item);

  ws.addRow([]); // empty spacing before table

  // ---- Table Header ----
  const headers = [
    'TANGGAL',
    'No. Batch',
    'Nama Batch',
    'Bundle Masuk (IN)',
    'Bundle Selesai (OUT)',
    'WIP Bundle',
    'Output Selesai (pcs)',
    'Persentase',
  ];

  const headerRow = ws.addRow(headers);
  headerRow.height = 25;
  headers.forEach((_, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    };
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF0F172A' } },
    };
  });

  // ---- Generate Dates List dari filter range ----
  const dates: string[] = [];
  if (dateFrom && dateTo) {
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
      const temp = new Date(start);
      let limit = 0;
      while (temp <= end && limit < 31) {
        dates.push(formatDateIndo(new Date(temp)));
        temp.setDate(temp.getDate() + 1);
        limit++;
      }
    }
  }
  
  if (dates.length === 0) {
    dates.push(formatDateIndo(new Date()));
  }

  // ---- Table Data ----
  dates.forEach((dateLabel) => {
    const startRow = ws.lastRow ? ws.lastRow.number + 1 : 11;
    
    batches.forEach((b, idx) => {
      const bundleIn = b.in || 0;
      const bundleOut = b.out || 0;
      const wipBundle = Math.max(0, bundleIn - bundleOut);
      const outputPcs = b.output_pcs || 0;
      const percentageVal = bundleIn > 0 ? `${Math.round((bundleOut / bundleIn) * 100)}%` : '0%';

      const rowData = [
        dateLabel,
        b.no_batch,
        b.nama_batch || '-',
        bundleIn,
        bundleOut,
        wipBundle,
        outputPcs,
        percentageVal,
      ];

      const r = ws.addRow(rowData);
      r.height = 20;
      const isEven = idx % 2 === 0;
      const rowFill = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

      rowData.forEach((_, i) => {
        const cell = r.getCell(i + 1);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowFill },
        };
        cell.font = { size: 10, color: { argb: 'FF1E293B' } };
        cell.alignment = {
          horizontal: i === 0 || i === 7 ? 'center' : (i === 2 ? 'left' : 'center'),
          vertical: 'middle',
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    const endRow = ws.lastRow ? ws.lastRow.number : startRow;
    
    // Merge cells untuk kolom TANGGAL pada baris-baris batch milik tanggal bersangkutan
    if (endRow >= startRow) {
      ws.mergeCells(`A${startRow}:A${endRow}`);
      const mergedDateCell = ws.getCell(`A${startRow}`);
      mergedDateCell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
      // Format border agar sekeliling sel gabungan rapi
      for (let rNum = startRow; rNum <= endRow; rNum++) {
        const cell = ws.getCell(`A${rNum}`);
        cell.border = {
          top: rNum === startRow ? { style: 'thin', color: { argb: 'FFE2E8F0' } } : undefined,
          bottom: rNum === endRow ? { style: 'thin', color: { argb: 'FFE2E8F0' } } : undefined,
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      }
    }
  });

  // Set widths
  const widths = [18, 12, 22, 18, 18, 15, 20, 15];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sewing-line-${lineNo}-batch-report.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
