/** Trend output pcs per jam per batch — dummy & normalisasi chart */

export type BatchHourlyOutputPoint = {
  hour: string;
} & Record<string, number | string>;

export type BatchHourlyOutputSeries = {
  batch: number;
  dataKey: string;
  label: string;
  color: string;
};

/** Warna garis per batch (1–8) */
export const BATCH_HOURLY_OUTPUT_COLORS: Record<number, string> = {
  1: '#4f81bd',
  2: '#9f7ae2',
  3: '#4ba3a5',
  4: '#db953b',
  5: '#d4657a',
  6: '#4b9e74',
  7: '#7a82e6',
  8: '#52b2a8',
};

export const batchHourlyOutputKey = (batchNo: number): string => `batch${batchNo}`;

export const buildBatchHourlyOutputSeries = (batchNos: number[]): BatchHourlyOutputSeries[] =>
  batchNos.map((batch) => ({
    batch,
    dataKey: batchHourlyOutputKey(batch),
    label: `Batch ${batch}`,
    color: BATCH_HOURLY_OUTPUT_COLORS[batch] ?? '#64748b',
  }));

/** Pastikan setiap titik punya key batch yang dibutuhkan */
export const normalizeHourlyBatchOutput = (
  rows: BatchHourlyOutputPoint[],
  batchNos: number[]
): BatchHourlyOutputPoint[] =>
  rows.map((row) => {
    const next: BatchHourlyOutputPoint = { hour: String(row.hour) };
    batchNos.forEach((b) => {
      const key = batchHourlyOutputKey(b);
      const raw = row[key];
      next[key] = typeof raw === 'number' ? raw : Number(raw) || 0;
    });
    return next;
  });
