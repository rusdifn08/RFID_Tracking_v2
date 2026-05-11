import ExcelJS from 'exceljs';

export const EXPORT_BANNER_BORDER = {
  top: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
  left: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
  bottom: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
  right: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
};

/** dd-mm-yyyy untuk teks banner (input yyyy-mm-dd atau ISO). */
export function toDisplayDateToken(date?: string): string {
  if (!date?.trim()) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

/** Waktu ekspor (lokal Indonesia). */
export function formatExportedAtId(d: Date = new Date()): string {
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export type ExportBannerOpts = {
  title: string;
  filterDateFrom?: string;
  filterDateTo?: string;
  exportedAt?: Date;
};

/**
 * Tiga baris judul (gaya Daily Output Line): judul laporan, periode filter, waktu ekspor.
 * @returns Nomor baris pertama untuk header kolom tabel / isi laporan (biasanya 4).
 */
export function writeExportTitleBlock(
  ws: ExcelJS.Worksheet,
  ncol: number,
  opts: ExportBannerOpts
): number {
  const from = toDisplayDateToken(opts.filterDateFrom);
  const to = toDisplayDateToken(opts.filterDateTo) || from;
  const periodText =
    !from && !to
      ? 'Periode filter: (tanpa rentang tanggal)'
      : `Periode filter: ${from || '-'}  s/d  ${to || from || '-'}`;
  const exported = formatExportedAtId(opts.exportedAt ?? new Date());

  ws.mergeCells(1, 1, 1, ncol);
  const c1 = ws.getCell(1, 1);
  c1.value = opts.title;
  c1.font = { bold: true, size: 17, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
  c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
  c1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  c1.border = EXPORT_BANNER_BORDER;
  ws.getRow(1).height = 36;

  ws.mergeCells(2, 1, 2, ncol);
  const c2 = ws.getCell(2, 1);
  c2.value = periodText;
  c2.font = { size: 13, name: 'Calibri', color: { argb: 'FF0F172A' } };
  c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFBF1' } };
  c2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  c2.border = EXPORT_BANNER_BORDER;
  ws.getRow(2).height = 28;

  ws.mergeCells(3, 1, 3, ncol);
  const c3 = ws.getCell(3, 1);
  c3.value = `Waktu ekspor: ${exported}`;
  c3.font = { size: 12, name: 'Calibri', color: { argb: 'FF334155' }, italic: true };
  c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  c3.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  c3.border = EXPORT_BANNER_BORDER;
  ws.getRow(3).height = 24;

  return 4;
}
