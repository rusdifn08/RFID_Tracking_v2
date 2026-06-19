import ExcelJS from 'exceljs';
import { writeExportTitleBlock } from './exportExcelBanner';

type ColDef = {
  /** Teks header di Excel (tanpa snake_case untuk kolom proses). */
  header: string;
  keys: string[];
  width: number;
  numeric: boolean;
  /** Header + nilai sel rata tengah (kolom qty proses). */
  center?: boolean;
};

const COLUMNS: ColDef[] = [
  { header: 'wo', keys: ['wo', 'WO', 'work_order'], width: 12, numeric: false },
  { header: 'style', keys: ['style', 'Style'], width: 13, numeric: false },
  { header: 'item', keys: ['item', 'Item'], width: 42, numeric: false },
  { header: 'buyer', keys: ['buyer', 'Buyer'], width: 36, numeric: false },
  { header: 'Factory', keys: ['Factory', 'factory', 'factory_code', 'plant'], width: 11, numeric: false },
  {
    header: 'PIC QTY Order',
    keys: ['PIC QTY Order', 'pic_qty_order', 'PIC_QTY_Order', 'pic_order', 'pic_qty', 'pic_name', 'spv_qty'],
    width: 24,
    numeric: false,
  },
  {
    header: 'PIC ID QTY Order',
    keys: ['PIC ID QTY Order', 'pic_id_qty_order', 'PIC_ID_QTY_Order', 'pic_id', 'nik_qty_order', 'nik'],
    width: 17,
    numeric: false,
  },
  {
    header: 'Output Sewing',
    keys: ['output_sewing', 'Output Sewing', 'outputSewing', 'output_sewing_qty'],
    width: 16,
    numeric: true,
    center: true,
  },
  { header: 'Good', keys: ['good', 'good_qc', 'QC', 'qc_good', 'goodQC'], width: 12, numeric: true, center: true },
  { header: 'PQC Good', keys: ['pqc_good', 'PQC Good', 'pqcGood'], width: 13, numeric: true, center: true },
  {
    header: 'In Dryroom',
    keys: ['in_dryroom', 'Dryroom_in', 'dryroom_in', 'dryRoomIn'],
    width: 14,
    numeric: true,
    center: true,
  },
  {
    header: 'Out Dryroom',
    keys: ['out_dryroom', 'Dryroom_out', 'dryroom_out', 'dryRoomOut'],
    width: 14,
    numeric: true,
    center: true,
  },
  { header: 'In Folding', keys: ['in_folding', 'folding_in', 'foldingIn'], width: 13, numeric: true, center: true },
  {
    header: 'Out Folding',
    keys: ['out_folding', 'folding_out', 'foldingOut'],
    width: 14,
    numeric: true,
    center: true,
  },
];

const BORDER = {
  top: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } },
};

/** Pewarnaan header dari key API utama (kolom pertama di `keys`). */
const headerFillForTotalPerWo = (col: ColDef): string => {
  const k = (col.keys[0] || '').toLowerCase();
  if (['wo', 'style'].includes(k)) return 'FF1E3A8A'; // Dark Blue
  if (['item', 'buyer'].includes(k)) return 'FF2563EB'; // Medium Blue
  if (k === 'factory') return 'FF3B82F6'; // Brighter Blue
  if (k.includes('pic id')) return 'FF60A5FA'; // Light Blue
  if (k.includes('pic') && k.includes('qty')) return 'FF3B82F6'; // Brighter Blue
  if (
    ['output_sewing', 'good', 'pqc_good', 'in_dryroom', 'out_dryroom', 'in_folding', 'out_folding'].includes(k)
  ) {
    return 'FF1D4ED8'; // Royal Blue
  }
  return 'FF2563EB'; // Default Medium Blue
};

const toDateToken = (date?: string): string => {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
};

function pickField(row: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(row, k)) {
      const v = row[k];
      if (v !== undefined && v !== null && v !== '') return v;
    }
  }
  const lowerKeys = keys.map((k) => k.toLowerCase());
  for (const rk of Object.keys(row)) {
    const lv = rk.toLowerCase();
    if (lowerKeys.includes(lv)) {
      const v = row[rk];
      if (v !== undefined && v !== null && v !== '') return v;
    }
  }
  return undefined;
}

function cellValue(row: Record<string, unknown>, col: ColDef): string | number {
  const raw = pickField(row, col.keys);
  if (col.numeric) {
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : '';
  }
  if (raw == null) return '';
  return String(raw);
}

export async function exportTotalPerWoExcel({
  rows,
  filterDateFrom,
  filterDateTo,
}: {
  rows: Record<string, unknown>[];
  filterDateFrom?: string;
  filterDateTo?: string;
}): Promise<void> {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Data Total Per WO kosong');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RFID Tracking';
  const ws = workbook.addWorksheet('Total Per WO', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: true }],
  });

  const ncol = COLUMNS.length;
  const headerRowNum = writeExportTitleBlock(ws, ncol, {
    title: 'Total Per WO',
    filterDateFrom,
    filterDateTo,
  });

  COLUMNS.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width;
  });

  const headerRow = ws.getRow(headerRowNum);
  headerRow.height = 34;
  COLUMNS.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { bold: true, size: 12, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerFillForTotalPerWo(col) } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = BORDER;
  });

  let rowNum = headerRowNum + 1;
  rows.forEach((raw) => {
    const rowObj = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
    const values = COLUMNS.map((c) => cellValue(rowObj, c));
    const r = ws.getRow(rowNum);
    r.height = 22;
    const even = rowNum % 2 === 1;
    values.forEach((val, i) => {
      const col = COLUMNS[i];
      const cell = r.getCell(i + 1);
      cell.value = val;
      cell.font = { size: 11, name: 'Calibri', color: { argb: 'FF111827' } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: col.center ? 'center' : col.numeric ? 'right' : 'left',
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: even ? 'FFF8FAFC' : 'FFFFFFFF' },
      };
      cell.border = BORDER;
      if (col.numeric && typeof cell.value === 'number') {
        cell.numFmt = '#,##0';
      }
    });
    rowNum += 1;
  });

  ws.autoFilter = {
    from: { row: headerRowNum, column: 1 },
    to: { row: headerRowNum, column: COLUMNS.length },
  };

  const today = toDateToken(new Date().toISOString());
  const from = toDateToken(filterDateFrom) || today;
  const to = toDateToken(filterDateTo) || from;
  const filename = `total_per_wo_${from}_to_${to}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
