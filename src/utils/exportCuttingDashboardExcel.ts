import ExcelJS from 'exceljs';
import type { GccSewingDashboardItem } from '../config/api';
import { EXPORT_BANNER_BORDER, formatExportedAtId, toDisplayDateToken } from './exportExcelBanner';
import { excelCellRef, excelRangeRef, woCellValue } from './exportExcelAnalytics';
import { renderHourlyLineChartPng } from './exportHourlyChartPng';

const BORDER = EXPORT_BANNER_BORDER;
const WHITE = 'FFFFFFFF';
const SLATE = 'FF1E293B';
const DETAIL_TABLE = 'FF2F75B5';
const DETAIL_TABLE_SOFT = 'FFDDEBF7';

const DETAIL_FONT_HEADER = 12;
const DETAIL_FONT_DATA = 11;
const DETAIL_HEADER_HEIGHT = 30;
const DETAIL_DATA_HEIGHT = 22;

type Theme = {
  primary: string;
  light: string;
  soft: string;
  accent: string;
  detailSection: string;
};

const EMERALD: Theme = {
  primary: 'FF059669',
  light: 'FFD1FAE5',
  soft: 'FFECFDF5',
  accent: 'FF047857',
  detailSection: 'FF0369A1',
};

const VIOLET: Theme = {
  primary: 'FF6D28D9',
  light: 'FFEDE9FE',
  soft: 'FFF5F3FF',
  accent: 'FF5B21B6',
  detailSection: 'FF5B21B6',
};

const KPI_ACCENTS = {
  emerald: { bg: 'FFD1FAE5', fg: 'FF047857' },
  sky: { bg: 'FFDBEAFE', fg: 'FF1D4ED8' },
  violet: { bg: 'FFEDE9FE', fg: 'FF6D28D9' },
  purple: { bg: 'FFF3E8FF', fg: 'FF7E22CE' },
};

function n(v: unknown): number {
  const x = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

function str(v: unknown): string {
  if (v == null) return '—';
  const s = String(v).trim();
  return s === '' ? '—' : s;
}

function formatDt(iso?: string): string {
  if (!iso?.trim()) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function downloadBuffer(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function styleSectionHeader(cell: ExcelJS.Cell, text: string, fillArgb: string): void {
  cell.value = text;
  cell.font = { bold: true, size: 12, name: 'Calibri', color: { argb: WHITE } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
  cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  cell.border = BORDER;
}

function styleSummaryLabel(cell: ExcelJS.Cell, text: string): void {
  cell.value = text;
  cell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF475569' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  cell.border = BORDER;
}

function styleSummaryValue(
  cell: ExcelJS.Cell,
  value: string | number,
  accent?: { bg: string; fg: string }
): void {
  cell.value = value;
  cell.font = { bold: true, size: 11, name: 'Calibri', color: { argb: accent?.fg ?? SLATE } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: accent?.bg ?? WHITE } };
  cell.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
  cell.border = BORDER;
}

function writeTitleBlock(
  ws: ExcelJS.Worksheet,
  ncol: number,
  title: string,
  from: string,
  to: string,
  theme: Theme,
  subtitle?: string
): void {
  const periodText = `Periode filter: ${toDisplayDateToken(from) || '-'}  s/d  ${toDisplayDateToken(to) || '-'}`;
  const exported = formatExportedAtId();

  ws.mergeCells(1, 1, 1, ncol);
  const c1 = ws.getCell(1, 1);
  c1.value = title;
  c1.font = { bold: true, size: 18, name: 'Calibri', color: { argb: WHITE } };
  c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.primary } };
  c1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  c1.border = BORDER;
  ws.getRow(1).height = 38;

  ws.mergeCells(2, 1, 2, ncol);
  const c2 = ws.getCell(2, 1);
  c2.value = periodText;
  c2.font = { size: 12, name: 'Calibri', color: { argb: SLATE } };
  c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.light } };
  c2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  c2.border = BORDER;
  ws.getRow(2).height = 26;

  ws.mergeCells(3, 1, 3, ncol);
  const c3 = ws.getCell(3, 1);
  c3.value = `Waktu ekspor: ${exported}${subtitle ? `  ·  ${subtitle}` : ''}`;
  c3.font = { size: 11, name: 'Calibri', color: { argb: 'FF475569' }, italic: true };
  c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.soft } };
  c3.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true };
  c3.border = BORDER;
  ws.getRow(3).height = 24;
}

function writeKpiSection(
  ws: ExcelJS.Worksheet,
  startRow: number,
  ncol: number,
  sectionTitle: string,
  theme: Theme,
  metrics: { label: string; value: string | number; accent?: { bg: string; fg: string } }[]
): number {
  ws.mergeCells(startRow, 1, startRow, ncol);
  styleSectionHeader(ws.getCell(startRow, 1), sectionTitle, theme.accent);
  ws.getRow(startRow).height = 28;

  let r = startRow + 1;
  for (const item of metrics) {
    ws.mergeCells(r, 1, r, 2);
    ws.mergeCells(r, 3, r, ncol);
    styleSummaryLabel(ws.getCell(r, 1), item.label);
    styleSummaryValue(ws.getCell(r, 3), item.value, item.accent);
    ws.getRow(r).height = 22;
    r += 1;
  }
  return r + 1;
}

const SUPPLY_KPI_COL_END = 4;
const SUPPLY_CHART_COL_START = 5;

function writeSupplyKpiWithHourlyChart(
  wb: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  startRow: number,
  ncol: number,
  theme: Theme,
  metrics: { label: string; value: string | number; accent?: { bg: string; fg: string } }[],
  hourlyRows: { jam: string; gm1: number; gm2: number; other: number }[]
): number {
  const chartColEnd = ncol;

  ws.mergeCells(startRow, 1, startRow, SUPPLY_KPI_COL_END);
  styleSectionHeader(ws.getCell(startRow, 1), 'RINGKASAN KPI — SUPPLY SEWING', theme.accent);

  ws.mergeCells(startRow, SUPPLY_CHART_COL_START, startRow, chartColEnd);
  styleSectionHeader(ws.getCell(startRow, SUPPLY_CHART_COL_START), 'DATA PER JAM', theme.accent);
  ws.getRow(startRow).height = 28;

  let kpiEndRow = startRow;
  let r = startRow + 1;
  for (const item of metrics) {
    ws.mergeCells(r, 1, r, 2);
    ws.mergeCells(r, 3, r, SUPPLY_KPI_COL_END);
    styleSummaryLabel(ws.getCell(r, 1), item.label);
    styleSummaryValue(ws.getCell(r, 3), item.value, item.accent);
    ws.getRow(r).height = 22;
    kpiEndRow = r;
    r += 1;
  }

  const chartTopRow = startRow + 1;
  const chartBottomRow = startRow + 8;
  for (let row = chartTopRow; row <= chartBottomRow; row++) {
    ws.getRow(row).height = 22;
  }

  const chartPng = renderHourlyLineChartPng(
    hourlyRows.map((h) => h.jam),
    [
      { label: 'GM 1', color: '#7c3aed', values: hourlyRows.map((h) => h.gm1) },
      { label: 'GM 2', color: '#a855f7', values: hourlyRows.map((h) => h.gm2) },
      { label: 'Lainnya', color: '#5b21b6', values: hourlyRows.map((h) => h.other) },
    ]
  );

  const imageId = wb.addImage({
    base64: chartPng.replace(/^data:image\/png;base64,/, ''),
    extension: 'png',
  });

  ws.addImage(imageId, excelRangeRef(chartTopRow, SUPPLY_CHART_COL_START, chartBottomRow, chartColEnd));

  return Math.max(kpiEndRow, chartBottomRow) + 2;
}

function writeHourlySection(
  ws: ExcelJS.Worksheet,
  startRow: number,
  ncol: number,
  theme: Theme,
  headers: string[],
  rows: (string | number)[][],
  centerFromCol = 0
): number {
  ws.mergeCells(startRow, 1, startRow, ncol);
  styleSectionHeader(ws.getCell(startRow, 1), 'DATA PER JAM', theme.accent);
  ws.getRow(startRow).height = 28;

  const headerRow = startRow + 1;
  headers.forEach((h, i) => {
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 11, name: 'Calibri', color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.primary } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = BORDER;
  });
  ws.getRow(headerRow).height = 26;

  let r = headerRow + 1;
  rows.forEach((vals, idx) => {
    vals.forEach((v, colIdx) => {
      const cell = ws.getCell(r, colIdx + 1);
      cell.value = v;
      cell.font = { size: 11, name: 'Calibri', color: { argb: SLATE } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colIdx >= centerFromCol ? 'center' : 'left',
        indent: colIdx >= centerFromCol ? 0 : 1,
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: idx % 2 === 0 ? WHITE : theme.soft },
      };
      cell.border = BORDER;
    });
    ws.getRow(r).height = 22;
    r += 1;
  });
  return r + 1;
}

type DetailColDef = {
  header: string;
  width: number;
  getValue: (row: Record<string, unknown>, idx: number) => string | number;
  align?: 'left' | 'center' | 'right';
  isWo?: boolean;
  accent?: (row: Record<string, unknown>) => { bg: string; fg: string } | null;
};

function writeDetailSection(
  ws: ExcelJS.Worksheet,
  startRow: number,
  sectionTitle: string,
  theme: Theme,
  columns: DetailColDef[],
  rows: Record<string, unknown>[]
): number {
  const ncol = columns.length;
  ws.mergeCells(startRow, 1, startRow, ncol);
  styleSectionHeader(ws.getCell(startRow, 1), sectionTitle, theme.detailSection);
  ws.getRow(startRow).height = 28;

  const headerRow = startRow + 1;
  columns.forEach((col, i) => {
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = col.header;
    cell.font = { bold: true, size: DETAIL_FONT_HEADER, name: 'Calibri', color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DETAIL_TABLE } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = BORDER;
  });
  ws.getRow(headerRow).height = DETAIL_HEADER_HEIGHT;

  if (rows.length === 0) {
    const emptyRow = headerRow + 1;
    ws.mergeCells(emptyRow, 1, emptyRow, ncol);
    const c = ws.getCell(emptyRow, 1);
    c.value = 'Tidak ada data pada periode ini.';
    c.font = { italic: true, size: 11, color: { argb: 'FF64748B' } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.soft } };
    return emptyRow + 2;
  }

  rows.forEach((row, idx) => {
    const r = headerRow + 1 + idx;
    columns.forEach((col, colIdx) => {
      const cell = ws.getCell(r, colIdx + 1);
      let val = col.getValue(row, idx);
      if (col.isWo) {
        const wo = woCellValue(val);
        cell.value = wo ?? '—';
        if (typeof wo === 'number') cell.numFmt = '0';
      } else {
        cell.value = val;
      }
      cell.border = BORDER;
      cell.font = { size: DETAIL_FONT_DATA, name: 'Calibri', color: { argb: SLATE } };
      const align = col.align ?? (typeof val === 'number' ? 'right' : 'left');
      cell.alignment = {
        vertical: 'middle',
        horizontal: align,
        indent: align === 'left' ? 1 : 0,
        wrapText: colIdx === 1 || colIdx === 2,
      };
      const accent = col.accent?.(row);
      if (accent) {
        cell.font = { bold: true, size: DETAIL_FONT_DATA, name: 'Calibri', color: { argb: accent.fg } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: accent.bg } };
      } else {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: idx % 2 === 0 ? WHITE : DETAIL_TABLE_SOFT },
        };
      }
    });
    ws.getRow(r).height = DETAIL_DATA_HEIGHT;
  });

  ws.autoFilter = {
    from: excelCellRef(headerRow, 1),
    to: excelCellRef(headerRow + Math.max(rows.length, 1), ncol),
  };

  return headerRow + 1 + rows.length + 1;
}

function filenameToken(from: string, to: string, prefix: string): string {
  const f = toDisplayDateToken(from) || 'all';
  const t = toDisplayDateToken(to) || f;
  return `${prefix}_${f}_to_${t}.xlsx`;
}

function createReportSheet(wb: ExcelJS.Workbook, name: string): ExcelJS.Worksheet {
  return wb.addWorksheet(name, {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: true }],
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.35, right: 0.35, top: 0.45, bottom: 0.45, header: 0.3, footer: 0.3 },
    },
  });
}

// ─── Bundle Cutting ───────────────────────────────────────────────────────────

export type BundleCuttingExportRow = {
  rfid?: string;
  barcode?: string;
  wo?: string;
  style?: string;
  buyer?: string;
  color?: string;
  size?: string;
  no_ikat?: string | number;
  no_urut?: string;
  meja?: string;
  season?: string;
  placing?: string;
  batch?: string;
  operator?: string;
  nik?: string;
  qty_bdl?: string | number;
  qty_out?: string | number;
  status?: string;
  waktu?: string;
};

const BUNDLE_DETAIL_COLS: DetailColDef[] = [
  { header: 'No', width: 6, getValue: (_r, i) => i + 1, align: 'center' },
  { header: 'RFID Bundle', width: 16, getValue: (r) => str(r.rfid) },
  { header: 'Barcode', width: 26, getValue: (r) => str(r.barcode) },
  { header: 'WO', width: 10, getValue: (r) => r.wo ?? '', isWo: true, align: 'center' },
  { header: 'Style', width: 12, getValue: (r) => str(r.style) },
  { header: 'Buyer', width: 12, getValue: (r) => str(r.buyer) },
  { header: 'Warna', width: 10, getValue: (r) => str(r.color) },
  { header: 'Size', width: 8, getValue: (r) => str(r.size), align: 'center' },
  { header: 'No. Ikat', width: 10, getValue: (r) => (r.no_ikat != null && r.no_ikat !== '' ? n(r.no_ikat) : '—'), align: 'center' },
  { header: 'No. Urut', width: 10, getValue: (r) => str(r.no_urut), align: 'center' },
  { header: 'Meja', width: 8, getValue: (r) => str(r.meja), align: 'center' },
  { header: 'Season', width: 9, getValue: (r) => str(r.season) },
  { header: 'Placing', width: 10, getValue: (r) => str(r.placing) },
  { header: 'Batch', width: 8, getValue: (r) => str(r.batch), align: 'center' },
  { header: 'Operator', width: 16, getValue: (r) => str(r.operator) },
  { header: 'NIK', width: 12, getValue: (r) => str(r.nik) },
  {
    header: 'QTY Bdl',
    width: 10,
    getValue: (r) => (r.qty_bdl != null && r.qty_bdl !== '' ? n(r.qty_bdl) : '—'),
    align: 'right',
  },
  {
    header: 'QTY Out',
    width: 10,
    getValue: (r) => n(r.qty_out ?? 0),
    align: 'right',
    accent: () => ({ bg: 'FFDBEAFE', fg: 'FF1D4ED8' }),
  },
  { header: 'Status', width: 14, getValue: (r) => str(r.status), align: 'center' },
  { header: 'Waktu', width: 22, getValue: (r) => str(r.waktu) },
];

export type BundleCuttingExportArgs = {
  filterDateFrom: string;
  filterDateTo: string;
  summary: { outputBundle: number; totalQtyOutput?: number; rowCount: number };
  hourlyRows: { jam: string; output: number }[];
  detailRows: BundleCuttingExportRow[];
};

export async function exportBundleCuttingDashboardExcel(args: BundleCuttingExportArgs): Promise<void> {
  const { filterDateFrom, filterDateTo, summary, hourlyRows, detailRows } = args;
  if (!detailRows.length) throw new Error('Tidak ada data untuk diekspor pada periode filter ini');

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Gistex Command Center';
  wb.created = new Date();

  const ncol = BUNDLE_DETAIL_COLS.length;
  const ws = createReportSheet(wb, 'Ringkasan');
  writeTitleBlock(
    ws,
    ncol,
    'LAPORAN DASHBOARD BUNDLE CUTTING',
    filterDateFrom,
    filterDateTo,
    EMERALD,
    'Data sesuai filter tanggal di dashboard'
  );

  let nextRow = writeKpiSection(
    ws,
    5,
    ncol,
    'RINGKASAN KPI — BUNDLE CUTTING',
    EMERALD,
    [
      { label: 'Output Bundle', value: summary.outputBundle, accent: KPI_ACCENTS.emerald },
      { label: 'Total QTY Output', value: summary.totalQtyOutput ?? '—', accent: KPI_ACCENTS.sky },
      { label: 'Jumlah baris detail', value: summary.rowCount },
    ]
  );

  nextRow = writeHourlySection(
    ws,
    nextRow,
    ncol,
    EMERALD,
    ['Jam', 'Output Bundle'],
    hourlyRows.map((r) => [r.jam, r.output]),
    0
  );

  writeDetailSection(
    ws,
    nextRow,
    'DETAIL PER BUNDLE',
    EMERALD,
    BUNDLE_DETAIL_COLS,
    detailRows as Record<string, unknown>[]
  );

  ws.columns = BUNDLE_DETAIL_COLS.map((c) => ({ width: c.width }));

  const buffer = await wb.xlsx.writeBuffer();
  downloadBuffer(buffer as ArrayBuffer, filenameToken(filterDateFrom, filterDateTo, 'bundle-cutting-dashboard'));
}

// ─── Supply Sewing ────────────────────────────────────────────────────────────

export type SupplySewingExportRow = {
  rfid: string;
  wo: string;
  style: string;
  buyer: string;
  color: string;
  size: string;
  qty: number;
  line: string;
  location: string;
  status: string;
  smarket_time: string;
  waktu: string;
};

const SUPPLY_DETAIL_COLS: DetailColDef[] = [
  { header: 'No', width: 6, getValue: (_r, i) => i + 1, align: 'center' },
  { header: 'RFID Bundle', width: 16, getValue: (r) => str(r.rfid) },
  { header: 'WO', width: 10, getValue: (r) => r.wo ?? '', isWo: true, align: 'center' },
  { header: 'Style', width: 12, getValue: (r) => str(r.style) },
  { header: 'Buyer', width: 12, getValue: (r) => str(r.buyer) },
  { header: 'Warna', width: 10, getValue: (r) => str(r.color) },
  { header: 'Size', width: 8, getValue: (r) => str(r.size), align: 'center' },
  {
    header: 'QTY',
    width: 10,
    getValue: (r) => n(r.qty),
    align: 'right',
    accent: () => ({ bg: 'FFEDE9FE', fg: 'FF6D28D9' }),
  },
  { header: 'Line', width: 10, getValue: (r) => str(r.line), align: 'center' },
  { header: 'Location', width: 14, getValue: (r) => str(r.location) },
  { header: 'Status', width: 14, getValue: (r) => str(r.status), align: 'center' },
  { header: 'SMarket Time', width: 22, getValue: (r) => str(r.smarket_time) },
  { header: 'Waktu Supply', width: 22, getValue: (r) => str(r.waktu) },
];

export type SupplySewingExportArgs = {
  filterDateFrom: string;
  filterDateTo: string;
  summary: { bundle: number; gm1: number; gm2: number; total: number };
  hourlyRows: { jam: string; gm1: number; gm2: number; other: number }[];
  detailRows: SupplySewingExportRow[];
};

export async function exportSupplySewingDashboardExcel(args: SupplySewingExportArgs): Promise<void> {
  const { filterDateFrom, filterDateTo, summary, hourlyRows, detailRows } = args;
  if (!detailRows.length) throw new Error('Tidak ada data untuk diekspor pada periode filter ini');

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Gistex Command Center';
  wb.created = new Date();

  const ncol = SUPPLY_DETAIL_COLS.length;
  const ws = createReportSheet(wb, 'Ringkasan');
  writeTitleBlock(
    ws,
    ncol,
    'LAPORAN DASHBOARD SUPPLY SEWING CUTTING',
    filterDateFrom,
    filterDateTo,
    VIOLET,
    'Data sesuai filter tanggal di dashboard'
  );

  let nextRow = writeSupplyKpiWithHourlyChart(
    wb,
    ws,
    5,
    ncol,
    VIOLET,
    [
      { label: 'Pending Bundle', value: summary.bundle, accent: KPI_ACCENTS.violet },
      { label: 'GM 1', value: summary.gm1, accent: KPI_ACCENTS.purple },
      { label: 'GM 2', value: summary.gm2, accent: KPI_ACCENTS.purple },
      { label: 'Total Scan', value: summary.total, accent: KPI_ACCENTS.violet },
    ],
    hourlyRows
  );

  writeDetailSection(
    ws,
    nextRow,
    'DETAIL SUPPLY SEWING',
    VIOLET,
    SUPPLY_DETAIL_COLS,
    detailRows as Record<string, unknown>[]
  );

  ws.columns = SUPPLY_DETAIL_COLS.map((c) => ({ width: c.width }));

  const buffer = await wb.xlsx.writeBuffer();
  downloadBuffer(buffer as ArrayBuffer, filenameToken(filterDateFrom, filterDateTo, 'supply-sewing-cutting-dashboard'));
}

/** Map baris API GCC sewing ke baris export. */
export function mapGccSewingItemToExportRow(it: GccSewingDashboardItem): SupplySewingExportRow {
  const raw = it as GccSewingDashboardItem & {
    buyer?: string;
    country?: string;
    warna?: string;
    color?: string;
    size?: string;
    ukuran?: string;
  };
  return {
    rfid: str(it.rfid_bundles),
    wo: str(it.wo),
    style: str(it.style),
    buyer: str(raw.buyer || raw.country),
    color: str(raw.warna || raw.color),
    size: str(raw.size || raw.ukuran),
    qty: n(it.qty_sewing),
    line: str(it.line),
    location: str(it.branch),
    status: str(it.last_status),
    smarket_time: formatDt(it.smarket_time),
    waktu: formatDt(it.last_time_sewing || it.tanggal),
  };
}
