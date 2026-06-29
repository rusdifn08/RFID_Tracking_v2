export type HourlyChartSeries = {
  label: string;
  color: string;
  values: number[];
};

type RenderOpts = {
  title?: string;
  width?: number;
  height?: number;
};

/** Render line chart per jam ke PNG base64 (untuk embed di Excel). */
export function renderHourlyLineChartPng(
  labels: string[],
  series: HourlyChartSeries[],
  opts?: RenderOpts
): string {
  const width = opts?.width ?? 720;
  const height = opts?.height ?? 260;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak tersedia untuk membuat grafik');

  const pad = { top: 28, right: 20, bottom: 40, left: 42 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.strokeRect(pad.left, pad.top, chartW, chartH);

  const maxVal = Math.max(1, ...series.flatMap((s) => s.values));
  const yMax = Math.ceil(maxVal * 1.2) || 1;
  const ySteps = 4;

  ctx.font = '11px Calibri, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= ySteps; i++) {
    const y = pad.top + chartH - (chartH * i) / ySteps;
    const val = Math.round((yMax * i) / ySteps);
    ctx.strokeStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillStyle = '#64748B';
    ctx.fillText(String(val), pad.left - 6, y);
  }

  const n = Math.max(labels.length, 1);
  const xAt = (i: number) => pad.left + (chartW * i) / Math.max(n - 1, 1);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#64748B';
  labels.forEach((lbl, i) => {
    if (n > 8 && i % 2 !== 0 && i !== n - 1) return;
    ctx.fillText(lbl, xAt(i), pad.top + chartH + 8);
  });

  series.forEach((s) => {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    s.values.forEach((v, i) => {
      const x = xAt(i);
      const y = pad.top + chartH - (v / yMax) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    s.values.forEach((v, i) => {
      const x = xAt(i);
      const y = pad.top + chartH - (v / yMax) * chartH;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(x, y, v > 0 ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  });

  let legendX = pad.left;
  const legendY = 8;
  series.forEach((s) => {
    ctx.fillStyle = s.color;
    ctx.fillRect(legendX, legendY, 14, 3);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 11px Calibri, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.label, legendX + 18, legendY + 1.5);
    legendX += ctx.measureText(s.label).width + 36;
  });

  return canvas.toDataURL('image/png');
}
