import ExcelJS from 'exceljs';
import { writeExportTitleBlock } from './exportExcelBanner';

type RoomMetrics = {
  waiting: number;
  checkin: number;
  checkout: number;
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

/** Normalisasi satu section (object atau string JSON dari export generik lama). */
function parseRoomSection(raw: unknown): RoomMetrics {
  let v: unknown = raw;
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v) as unknown;
    } catch {
      return { waiting: 0, checkin: 0, checkout: 0 };
    }
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) {
    return { waiting: 0, checkin: 0, checkout: 0 };
  }
  const o = v as Record<string, unknown>;
  return {
    waiting: Number(o.waiting) || 0,
    checkin: Number(o.checkin) || 0,
    checkout: Number(o.checkout) || 0,
  };
}

/** Ambil objek { dryroom, folding, reject_room } dari berbagai bentuk response API. */
function extractFinishingPayload(payload: unknown): {
  dryroom: RoomMetrics;
  folding: RoomMetrics;
  reject_room: RoomMetrics & { reject_mati: number };
} {
  let root: unknown = payload;
  if (root && typeof root === 'object' && !Array.isArray(root)) {
    const r = root as Record<string, unknown>;
    if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
      root = r.data;
    }
  }
  const o = (root && typeof root === 'object' && !Array.isArray(root) ? root : {}) as Record<string, unknown>;
  const rejectRaw = o.reject_room ?? o['reject room'];
  const reject = parseRoomSection(rejectRaw);
  const rj = rejectRaw && typeof rejectRaw === 'object' && !Array.isArray(rejectRaw) ? (rejectRaw as Record<string, unknown>) : {};
  return {
    dryroom: parseRoomSection(o.dryroom),
    folding: parseRoomSection(o.folding),
    reject_room: {
      ...reject,
      reject_mati: Number(rj.reject_mati) || 0,
    },
  };
}

const thinBorder = {
  top: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
  left: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
  bottom: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
  right: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
};

/** Warna pastel mengikuti template: kolom status + baris area. */
const COL_WAITING = 'FFFFF9C4'; // kuning muda
const COL_CHECKIN = 'FFC8E6C9'; // hijau muda
const COL_CHECKOUT = 'FFB2EBF2'; // cyan muda
const ROW_DRYROOM = 'FFBBDEFB'; // biru muda
const ROW_FOLDING = 'FFC8E6C9';
const ROW_REJECT = 'FFFFE0B2'; // oranye muda

export async function exportFinishingSummaryExcel({
  payload,
  filterDateFrom,
  filterDateTo,
}: {
  payload: unknown;
  filterDateFrom?: string;
  filterDateTo?: string;
}): Promise<void> {
  const data = extractFinishingPayload(payload);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RFID Tracking';
  const sheet = workbook.addWorksheet('Finishing Summary', {
    views: [{ state: 'frozen', ySplit: 3, showGridLines: true }],
  });

  const ncol = 4;
  writeExportTitleBlock(sheet, ncol, {
    title: 'Finishing Summary',
    filterDateFrom,
    filterDateTo,
  });

  const from = toDateToken(filterDateFrom);
  const to = toDateToken(filterDateTo);
  const matrixTop = 4;

  sheet.getColumn(1).width = 22;
  sheet.getColumn(2).width = 14;
  sheet.getColumn(3).width = 14;
  sheet.getColumn(4).width = 14;

  const applyCell = (
    row: number,
    col: number,
    value: string | number,
    opts: { fill?: string; bold?: boolean; fontColor?: string; hAlign?: 'left' | 'center' | 'right' }
  ) => {
    const cell = sheet.getCell(row, col);
    cell.value = value;
    cell.font = {
      bold: opts.bold ?? false,
      size: 12,
      name: 'Calibri',
      color: { argb: opts.fontColor ?? 'FF0F172A' },
    };
    cell.alignment = { vertical: 'middle', horizontal: opts.hAlign ?? 'center', wrapText: true };
    cell.border = thinBorder;
    if (opts.fill) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.fill } };
    }
  };

  // Sudut kosong + header kolom (Waiting | Check In | Check Out)
  applyCell(matrixTop, 1, '', { fill: 'FFFFFFFF', hAlign: 'center' });
  applyCell(matrixTop, 2, 'Waiting', { fill: COL_WAITING, bold: true, hAlign: 'center' });
  applyCell(matrixTop, 3, 'Check In', { fill: COL_CHECKIN, bold: true, hAlign: 'center' });
  applyCell(matrixTop, 4, 'Check Out', { fill: COL_CHECKOUT, bold: true, hAlign: 'center' });

  const rowsDef: { label: string; rowFill: string; metrics: RoomMetrics }[] = [
    { label: 'Dryroom', rowFill: ROW_DRYROOM, metrics: data.dryroom },
    { label: 'Folding', rowFill: ROW_FOLDING, metrics: data.folding },
    { label: 'Reject Room', rowFill: ROW_REJECT, metrics: data.reject_room },
  ];

  rowsDef.forEach((def, i) => {
    const r = matrixTop + 1 + i;
    applyCell(r, 1, def.label, { fill: def.rowFill, bold: true, hAlign: 'left', fontColor: 'FF0F172A' });
    applyCell(r, 2, def.metrics.waiting, { hAlign: 'center' });
    applyCell(r, 3, def.metrics.checkin, { hAlign: 'center' });
    applyCell(r, 4, def.metrics.checkout, { hAlign: 'center' });
  });

  [matrixTop, matrixTop + 1, matrixTop + 2, matrixTop + 3].forEach((rn) => {
    sheet.getRow(rn).height = 24;
  });

  const today = toDateToken(new Date().toISOString());
  const f = from || today;
  const t = to || f;
  const filename = `finishing_summary_${f}_to_${t}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
