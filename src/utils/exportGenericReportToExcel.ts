import ExcelJS from 'exceljs';
import { writeExportTitleBlock } from './exportExcelBanner';

type ExportGenericArgs = {
  reportTitle: string;
  payload: unknown;
  filePrefix: string;
  filterDateFrom?: string;
  filterDateTo?: string;
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

const normalizeRows = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload.map((item) => (item && typeof item === 'object' ? { ...(item as Record<string, unknown>) } : { value: item }));
  }
  if (payload && typeof payload === 'object') {
    return [{ ...(payload as Record<string, unknown>) }];
  }
  return [{ value: payload ?? '' }];
};

const toDisplayHeader = (key: string): string =>
  key
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toRowsWithKeys = (rows: Record<string, unknown>[]): string[] => {
  const keySet = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((k) => keySet.add(k));
  });
  return [...keySet];
};

type Preset = {
  preferredOrder: string[];
  headerColorByKey: (key: string) => string;
};

const PRESETS: Record<string, Preset> = {
  'line-production-targets': {
    preferredOrder: ['line', 'target_hari', 'target_jam', 'spv', 'nik'],
    headerColorByKey: (key) => {
      const k = key.toLowerCase();
      if (k === 'line') return 'FF1D4ED8';
      if (k.includes('target')) return 'FF0E7490';
      if (k === 'spv') return 'FF7C3AED';
      if (k === 'nik') return 'FF166534';
      return 'FF334155';
    },
  },
  'output-per-jam': {
    preferredOrder: [
      'id',
      'rfid_user',
      'last_status',
      'nama',
      'bagian',
      'line',
      'rfid_garment',
      'id_garment',
      'style',
      'item',
      'buyer',
      'wo',
      'color',
      'size',
      'branch',
      'rejectCount',
      'reworkCount',
      'timestamp',
      'update',
      ...Array.from({ length: 24 }, (_, i) => `jam_${String(i).padStart(2, '0')}`),
    ],
    headerColorByKey: (key) => {
      const k = key.toLowerCase();
      if (['id', 'rfid_user', 'rfid_garment', 'id_garment', 'line'].includes(k)) return 'FF1D4ED8';
      if (['last_status', 'nama', 'bagian', 'style', 'item', 'buyer', 'wo', 'color', 'size', 'branch'].includes(k)) return 'FF0E7490';
      if (k.includes('count') || k.startsWith('jam_') || k === 'update') return 'FF7C3AED';
      if (k.includes('timestamp')) return 'FF166534';
      return 'FF334155';
    },
  },
};

const resolveOrderedKeys = (rows: Record<string, unknown>[], filePrefix: string): string[] => {
  const allKeys = toRowsWithKeys(rows);
  const preset = PRESETS[filePrefix];
  if (!preset) return allKeys;

  const front = preset.preferredOrder.filter((k) => allKeys.includes(k));
  const rest = allKeys.filter((k) => !front.includes(k));
  return [...front, ...rest];
};

const widthByKey = (key: string): number => {
  const k = key.toLowerCase();
  if (['id', 'line', 'size', 'color', 'wo', 'update'].includes(k)) return 10;
  if (k.includes('target_hari') || k.includes('target_jam')) return 14;
  if (k === 'spv' || k === 'nik') return 16;
  if (k.includes('timestamp')) return 22;
  if (k.includes('buyer') || k.includes('item') || k.includes('needle_parameter')) return 28;
  if (k.includes('nama') || k.includes('style') || k.includes('last_status')) return 20;
  if (k.includes('rfid')) return 16;
  if (k.includes('count') || k.startsWith('jam_')) return 11;
  return 14;
};

const isCenterColumn = (key: string): boolean => {
  const k = key.toLowerCase();
  if (
    ['id', 'line', 'size', 'color', 'wo', 'update', 'target_hari', 'target_jam'].includes(k) ||
    k.includes('nik') ||
    k.includes('rfid') ||
    k.includes('count') ||
    k.startsWith('jam_') ||
    k.includes('timestamp')
  ) {
    return true;
  }
  return false;
};

export async function exportGenericReportToExcel({
  reportTitle,
  payload,
  filePrefix,
  filterDateFrom,
  filterDateTo,
}: ExportGenericArgs): Promise<void> {
  const rows = normalizeRows(payload);
  if (!rows.length) {
    throw new Error('Data report kosong');
  }

  const orderedKeys = resolveOrderedKeys(rows, filePrefix);
  if (!orderedKeys.length) {
    throw new Error('Kolom report tidak ditemukan');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RFID Tracking';
  const worksheet = workbook.addWorksheet('Report');

  const headerRowNum = writeExportTitleBlock(worksheet, orderedKeys.length, {
    title: reportTitle || 'Report Export',
    filterDateFrom,
    filterDateTo,
  });

  orderedKeys.forEach((key, i) => {
    worksheet.getColumn(i + 1).width = widthByKey(key);
  });

  const border = {
    top: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
    left: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
    bottom: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
    right: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
  };

  const preset = PRESETS[filePrefix];
  const headerRow = worksheet.getRow(headerRowNum);
  headerRow.height = 32;
  orderedKeys.forEach((key, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.value = toDisplayHeader(key);
    const color = preset?.headerColorByKey(key) || 'FF334155';
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Calibri' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = border;
  });

  let rowNum = headerRowNum + 1;
  rows.forEach((row) => {
    const dataRow = worksheet.getRow(rowNum);
    dataRow.height = 22;
    const even = rowNum % 2 === 0;
    orderedKeys.forEach((key, colIdx) => {
      const v = row[key];
      const cell = dataRow.getCell(colIdx + 1);
      cell.value =
        v == null
          ? ''
          : typeof v === 'object' && !(v instanceof Date)
            ? JSON.stringify(v)
            : (v as import('exceljs').CellValue);
      cell.font = { size: 11, color: { argb: 'FF1F2937' }, name: 'Calibri' };
      cell.alignment = {
        vertical: 'middle',
        horizontal: isCenterColumn(key) ? 'center' : 'left',
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: even ? 'FFF8FAFC' : 'FFFFFFFF' },
      };
      cell.border = border;
    });
    rowNum += 1;
  });

  worksheet.autoFilter = {
    from: { row: headerRowNum, column: 1 },
    to: { row: headerRowNum, column: orderedKeys.length },
  };
  worksheet.views = [{ state: 'frozen', ySplit: headerRowNum }];

  const today = toDateToken(new Date().toISOString());
  const from = toDateToken(filterDateFrom) || today;
  const to = toDateToken(filterDateTo) || from;
  const safePrefix = filePrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safePrefix}_${from}_to_${to}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
