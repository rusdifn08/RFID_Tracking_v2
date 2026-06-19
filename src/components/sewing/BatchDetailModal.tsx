import { memo, useMemo, type ReactNode } from 'react';
import batchData from '../../data/sewing/sewing-batch-dashboard.json';
import type { SewingBatchMeta, SewingFlowBatch } from '../../types/sewingDashboard';
import { parseOrderBundleCount, resolveCurrentBundle } from '../../utils/sewingBatchDetailData';
import type { SimulationState } from '../../utils/sewingBatchSimulation';
import {
  buildBatchBundleStatusList,
  buildBatchProgressFromMetrics,
  pcsToBundleCount,
  type BatchBundleStatus,
  type BatchInOutMetrics,
} from '../../utils/sewingBatchInOut';
import { cn } from './sewingBatchTw';
import { ModalHeroGlow, ModalHeroGrid, SewingDetailModalShell } from './SewingDetailModalShell';

type OrderInfo = typeof batchData.order;

type BatchDetailModalProps = {
  open: boolean;
  onClose: () => void;
  batch: SewingBatchMeta | null;
  lane: SewingFlowBatch | null;
  order: OrderInfo;
  pcsPerBundle: number;
  sim?: SimulationState;
  useLiveSim?: boolean;
  inOutMetrics?: (BatchInOutMetrics & { batch: number }) | null;
};

const modalCard = 'rounded-[0.65rem] border border-blue-100 bg-white p-2.5 shadow-[0_2px_10px_rgba(37,99,235,0.06)]';
const modalCardHead = 'mb-2 flex items-center justify-between gap-2';
const modalCardTitle = 'm-0 text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500';
const modalLabel = 'mb-0.5 block text-[0.56rem] font-bold uppercase tracking-wide text-slate-400';
/** Warna nilai data — sama dengan OverviewMetaField (WO / Style / Buyer) di dashboard utama */
const modalDataValue = 'text-blue-700';
const modalStrong = `text-[0.78rem] font-extrabold leading-snug ${modalDataValue} break-words`;

const heroMetricBox = (label: string, value: ReactNode, sub?: ReactNode) => (
  <div className="flex min-w-[3.25rem] shrink-0 flex-col items-center justify-center rounded-lg border border-white/30 bg-white/15 px-2 py-1.5 text-center backdrop-blur-sm">
    <span className="block text-[0.5rem] font-bold uppercase tracking-wide opacity-90">{label}</span>
    <strong className="mt-0.5 block text-[clamp(0.88rem,1.7vh,1.2rem)] font-black leading-none">
      {value}
    </strong>
    {sub ? (
      <small className="mt-0.5 block text-[0.55rem] font-bold leading-tight opacity-85">{sub}</small>
    ) : null}
  </div>
);

const metricCell = (label: string, value: string, valueClass?: string) => (
  <div className="rounded-md border border-slate-200 bg-gradient-to-b from-white to-[#f8fbff] px-1 py-1.5 text-center">
    <span className="block text-[0.54rem] font-bold uppercase tracking-wide text-slate-400">{label}</span>
    <b className={cn('mt-0.5 block text-[0.88rem] font-black', modalDataValue, valueClass)}>{value}</b>
  </div>
);

const batchMetricCell = (label: string, value: ReactNode, sub?: ReactNode) => (
  <div className="rounded-md border border-slate-200 bg-gradient-to-b from-white to-[#f8fbff] px-1 py-2 text-center flex flex-col items-center justify-center">
    <span className="block text-[0.54rem] font-bold uppercase tracking-wide text-slate-400">{label}</span>
    <b className={cn('mt-0.5 block text-[1rem] font-black', modalDataValue)}>{value}</b>
    {sub ? (
      <small className="mt-0.5 block text-[0.55rem] font-bold leading-tight text-slate-500">{sub}</small>
    ) : null}
  </div>
);

const scanBadge = (ok: boolean, label: string) => (
  <span
    className={cn(
      'rounded-full px-1.5 py-0.5 text-[0.54rem] font-extrabold',
      ok ? 'bg-emerald-500/15 text-emerald-700' : 'bg-slate-200 text-slate-500'
    )}
  >
    {label} {ok ? '✓' : '○'}
  </span>
);

const BundleListItem = ({ status }: { status: BatchBundleStatus }) => (
  <li className="list-none rounded-md border border-slate-200 bg-gradient-to-r from-white to-[#f8fbff] px-2.5 py-2">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <span className={cn('block text-[0.68rem] font-extrabold', modalDataValue)}>
          Bundle {status.bundleNo}
        </span>
        <span className="block font-mono text-[0.58rem] font-bold tracking-wide text-slate-500">
          RFID {status.rfid}
        </span>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 text-[0.6rem] font-bold text-slate-700">
        {scanBadge(status.scannedIn, 'IN')}
        {scanBadge(status.scannedOut, 'OUT')}
      </div>
    </div>
    <div className="mt-2 grid grid-cols-3 gap-1.5 border-t border-slate-100 pt-2">
      <div>
        <span className={modalLabel}>Waktu IN</span>
        <strong className={modalStrong}>{status.scanInAt ?? '—'}</strong>
      </div>
      <div>
        <span className={modalLabel}>Waktu OUT</span>
        <strong className={modalStrong}>{status.scanOutAt ?? '—'}</strong>
      </div>
      <div>
        <span className={modalLabel}>Durasi</span>
        <strong className={modalStrong}>{status.durationLabel ?? '—'}</strong>
      </div>
    </div>
  </li>
);

const BatchDetailModal = memo(
  ({ open, onClose, batch, lane, order, pcsPerBundle, sim, useLiveSim, inOutMetrics }: BatchDetailModalProps) => {
    const detail = useMemo(() => {
      if (!batch || !lane) return null;

      const simLane = sim?.batches.find((b) => b.batchNo === batch.batch);
      const orderBundleCount = parseOrderBundleCount(lane.demoQty);

      const metrics: BatchInOutMetrics = inOutMetrics ?? {
        pcsIn: 0,
        pcsOut: 0,
        wip: 0,
        efficiencyPct: 0,
        outProgressPct: 0,
      };
      const outputProgress = buildBatchProgressFromMetrics(metrics, pcsPerBundle);
      const bundleIn = pcsToBundleCount(metrics.pcsIn, pcsPerBundle);
      const bundleOut = pcsToBundleCount(metrics.pcsOut, pcsPerBundle);
      const wipBundle = Math.max(0, bundleIn - bundleOut);
      const outputPcs = (metrics.outputPcs != null && metrics.outputPcs > 0) ? metrics.outputPcs : bundleOut * pcsPerBundle;

      const currentBundle = inOutMetrics
        ? (inOutMetrics as any).currentBundle
        : resolveCurrentBundle(batch.batch, batch, simLane, useLiveSim);

      // Jika ada data dari API (inOutMetrics), buat list sederhana dari jumlah IN/OUT aktual
      // tanpa data dummy (waktu scan, durasi, RFID palsu).
      let bundleStatusList: BatchBundleStatus[];
      if (inOutMetrics) {
        const totalBundles = Math.max(bundleIn, bundleOut);
        bundleStatusList = Array.from({ length: totalBundles }, (_, i) => {
          const bundleNo = i + 1;
          const scannedIn = bundleNo <= bundleIn;
          const scannedOut = bundleNo <= bundleOut;
          return {
            bundleNo,
            rfid: '—',
            scannedIn,
            scannedOut,
            outputPcs: scannedOut ? pcsPerBundle : 0,
            targetPcs: pcsPerBundle,
            persentase: scannedOut ? 100 : 0,
            scanInAt: null,
            scanOutAt: null,
            durationLabel: scannedOut ? 'Selesai' : scannedIn ? 'Dalam proses' : null,
          } satisfies BatchBundleStatus;
        });
      } else {
        bundleStatusList = buildBatchBundleStatusList(
          batch.batch,
          lane,
          simLane,
          !!useLiveSim,
          pcsPerBundle
        );
      }

      return {
        currentBundle,
        outputProgress,
        orderBundleCount,
        bundleStatusList,
        bundleIn,
        bundleOut,
        wipBundle,
        outputPcs,
        progressPct: outputProgress.persentase,
      };
    }, [batch, lane, pcsPerBundle, sim, useLiveSim, inOutMetrics]);

    if (!open || !batch || !lane || !detail) return null;

    const {
      currentBundle,
      outputProgress: prog,
      orderBundleCount,
      bundleStatusList,
      bundleIn,
      bundleOut,
      wipBundle,
      outputPcs,
      progressPct,
    } = detail;

    return (
      <SewingDetailModalShell
        open={open}
        onClose={onClose}
        labelledBy="sd-v2-batch-detail-title"
        panelClassName="max-w-[38rem]"
        heroClassName="bg-gradient-to-br from-[#1e4d9c] via-blue-600 to-blue-500"
        footerLabel="Batch"
        hero={
          <>
            <ModalHeroGlow />
            <ModalHeroGrid />
            <div className="relative z-[1] flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2">
                <span className="inline-flex h-[1.65rem] min-w-[1.65rem] shrink-0 items-center justify-center rounded-md border border-white/35 bg-white/20 px-1.5 text-[0.62rem] font-black tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                  B{batch.batch}
                </span>
                <div className="min-w-0">
                  <h2
                    id="sd-v2-batch-detail-title"
                    className="m-0 text-[clamp(0.95rem,2vh,1.12rem)] font-black leading-tight tracking-tight uppercase text-white"
                  >
                    BATCH {batch.batch} : {batch.type}
                  </h2>
                </div>
              </div>
            </div>
            <div className="relative z-[1] mt-2.5 h-[0.35rem] overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-white to-white/75"
                style={{ width: `${Math.min(100, progressPct)}%` }}
              />
            </div>
          </>
        }
      >
        <section className={modalCard}>
          <div className={modalCardHead}>
            <h3 className={modalCardTitle}>Ringkasan Produksi Batch</h3>
          </div>
          <div className="grid grid-cols-4 gap-1.5 max-sm:grid-cols-2">
            {batchMetricCell('Bundle Masuk', bundleIn, 'bundle scan IN')}
            {batchMetricCell('Bundle Selesai', bundleOut, 'bundle scan OUT')}
            {batchMetricCell('WIP Bundle', wipBundle, 'belum selesai')}
            {batchMetricCell('Output', outputPcs, 'pcs produksi')}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
          <section className={modalCard}>
            <div className={modalCardHead}>
              <h3 className={modalCardTitle}>Status Bundle &amp; Output</h3>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <span className={modalLabel}>Bundle Sedang Dikerjakan</span>
                <strong className={modalStrong}>
                  {inOutMetrics ? (
                    bundleIn === 0 ? '—' : bundleIn === bundleOut ? 'Selesai' : `Ke-${bundleOut + 1}`
                  ) : (
                    `Ke-${currentBundle}`
                  )}
                </strong>
              </div>
              <div>
                <span className={modalLabel}>Total Output (pcs)</span>
                <strong className={modalStrong}>{outputPcs} pcs</strong>
              </div>
              {!inOutMetrics && (
                <>
                  <div>
                    <span className={modalLabel}>Jenis Output</span>
                    <strong className={modalStrong}>{lane.outputTag}</strong>
                  </div>
                  <div>
                    <span className={modalLabel}>Total Bundle Order</span>
                    <strong className={modalStrong}>
                      {orderBundleCount > 0 ? `${orderBundleCount} bundle` : lane.demoQty}
                    </strong>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className={modalCard}>
            <div className={modalCardHead}>
              <h3 className={modalCardTitle}>Data Order Produksi</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className={modalLabel}>Nomor WO</span>
                <strong className={modalStrong}>{order.wo}</strong>
              </div>
              <div>
                <span className={modalLabel}>Ukuran (Size)</span>
                <strong className={modalStrong}>{order.size ?? '—'}</strong>
              </div>
              <div>
                <span className={modalLabel}>Kode Style</span>
                <strong className={modalStrong}>{order.style}</strong>
              </div>
              <div>
                <span className={modalLabel}>Warna (Color)</span>
                <strong className={modalStrong}>{order.color ?? '—'}</strong>
              </div>
              <div className="col-span-2">
                <span className={modalLabel}>Nama Buyer</span>
                <strong className={cn('block', modalStrong)}>{order.buyer}</strong>
              </div>
            </div>
          </section>
        </div>

        <section className={modalCard}>
          <div className={modalCardHead}>
            <h3 className={modalCardTitle}>Riwayat Scan Bundle &amp; RFID</h3>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-600/10 px-2 py-0.5 text-[0.58rem] font-bold text-blue-700">
              {bundleStatusList.length} item
            </span>
          </div>
          {bundleStatusList.length === 0 ? (
            <p className="m-0 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-[0.66rem] text-slate-500">
              Belum ada data bundle. Data IN/OUT akan tampil sesuai data dari API.
            </p>
          ) : (
            <ul className="m-0 max-h-[min(22rem,50vh)] list-none space-y-1.5 overflow-auto p-0">
              {bundleStatusList.map((status) => (
                <BundleListItem key={status.bundleNo} status={status} />
              ))}
            </ul>
          )}
          <p className="mt-2 text-[0.62rem] leading-relaxed text-slate-500">
            RFID 12 digit (diawali 00). Waktu IN/OUT = scan masuk &amp; selesai batch. Durasi = lama
            pengerjaan dari IN s/d OUT.
          </p>
          <p className="mt-1 text-[0.62rem] leading-relaxed text-slate-500">
            Snapshot data: {lane.snapshotDate}
          </p>
        </section>
      </SewingDetailModalShell>
    );
  }
);

BatchDetailModal.displayName = 'BatchDetailModal';

export default BatchDetailModal;
