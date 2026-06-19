import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import SewingPageShell from '../../components/sewing/SewingPageShell';
import { cn } from '../../components/sewing/sewingBatchTw';
import {
  getInitialEnvironment,
  getEnvironmentFromAPI,
  postPrepOpBatch,
  getPrepBatchLayout,
  type PrepOpBatchPayload,
  type PrepOpBatchResponseData,
  type PrepBatchLayoutData,
  type BackendEnvironment,
} from '../../config/api';
import {
  productionLinesCLN,
  productionLinesMJL,
  productionLinesMJL2,
  productionLinesGCC,
  type ProductionLine,
} from '../../data/production_line';
import { filterVisibleProductionLines } from '../../config/hide';
import { normalizeSewingLineKey } from '../../utils/sewingLayoutUtils';
import {
  LayoutGrid,
  Save,
  CheckCircle2,
  XCircle,
  Search,
  User,
  Hash,
  Layers,
  ScanLine,
  Power,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */

const glassCard =
  'relative rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(16,24,40,0.06)] overflow-hidden';

const inputBase =
  'w-full rounded-xl border border-slate-200/80 bg-white/90 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-blue-300 focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 focus:shadow-[0_0_0_1px_rgba(59,130,246,0.15)]';

const selectBase =
  'w-full appearance-none rounded-xl border border-slate-200/80 bg-white/90 px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-800 outline-none transition-all duration-200 hover:border-blue-300 focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 cursor-pointer bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_10px_center] bg-no-repeat';

const labelBase = 'flex flex-col gap-1.5';

const labelText = 'flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-slate-500';

const sectionTitle = 'flex items-center gap-2.5 text-[0.95rem] font-bold text-slate-800';

const kv = (label: string, value: React.ReactNode, accent = false) => (
  <div className="flex items-start gap-3 py-2.5">
    <span className="min-w-[6.5rem] shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
    <span className={cn('text-sm font-medium', accent ? 'text-blue-700' : 'text-slate-800')}>{value}</span>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Get real production lines for the current environment (exclude "All" cards). */
function getVisibleProductionLines(env: BackendEnvironment): ProductionLine[] {
  let base: ProductionLine[];
  if (env === 'MJL2') base = productionLinesMJL2;
  else if (env === 'MJL') base = productionLinesMJL;
  else if (env === 'GCC') base = productionLinesGCC;
  else base = productionLinesCLN;

  // Exclude "All" cards
  const filtered = base.filter(
    (l) => l.id !== 0 && l.id !== 111 && l.id !== 112 && l.id !== 113 && l.line != null
  );
  return filterVisibleProductionLines(filtered, env);
}

const BATCH_OPTIONS = Array.from({ length: 7 }, (_, i) => i + 1);

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const SewingPositioningPage = memo(() => {
  const { id: lineId } = useParams();
  const normalizedLine = normalizeSewingLineKey(lineId ?? '1');

  const [environment, setEnvironment] = useState<BackendEnvironment>(getInitialEnvironment);

  // Fetch real env
  useEffect(() => {
    getEnvironmentFromAPI().then((env) => setEnvironment(env));
  }, []);

  const visibleLines = useMemo(() => getVisibleProductionLines(environment), [environment]);

  /* ---------- Form Operator Batch state ---------- */
  const [form, setForm] = useState<PrepOpBatchPayload>({
    nik: '',
    line: normalizedLine,
    batch: '1',
    ket_batch: '',
    scan_type: 'in',
    is_active: '1',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<PrepOpBatchResponseData | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastFadingOut, setToastFadingOut] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------- Check Batch Layout state ---------- */
  const [rfidSearch, setRfidSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [layoutData, setLayoutData] = useState<PrepBatchLayoutData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  /* ---------- Handlers ---------- */
  const handleChange = useCallback((field: keyof PrepOpBatchPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
    setFormSuccess(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form.nik.trim()) { setFormError('NIK wajib diisi.'); return; }
    if (!form.line.trim()) { setFormError('Line wajib diisi.'); return; }
    if (!form.batch.trim()) { setFormError('Batch wajib diisi.'); return; }
    if (!form.ket_batch.trim()) { setFormError('Keterangan Batch wajib diisi.'); return; }

    setSaving(true);
    setFormError(null);
    setFormSuccess(null);
    setResponseData(null);
    setToastVisible(false);
    setToastFadingOut(false);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (toastFadeTimer.current) clearTimeout(toastFadeTimer.current);

    try {
      const result = await postPrepOpBatch(form);
      if (result.success && result.data) {
        setFormSuccess(
          `Data berhasil disimpan — ${result.data.operator_name} (${result.data.nik})`
        );
        setResponseData(result.data);
        // Show toast popup
        setToastVisible(true);
        setToastFadingOut(false);
        // Start fade-out after 4.5s, then hide at 5.5s
        toastFadeTimer.current = setTimeout(() => setToastFadingOut(true), 4500);
        toastTimer.current = setTimeout(() => {
          setToastVisible(false);
          setToastFadingOut(false);
        }, 5500);
      } else {
        setFormError(result.error || 'Gagal menyimpan data operator batch.');
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  }, [form]);

  const handleSearch = useCallback(async () => {
    if (!rfidSearch.trim()) { setSearchError('RFID User wajib diisi.'); return; }

    setSearching(true);
    setSearchError(null);
    setLayoutData(null);
    setHasSearched(true);

    try {
      const result = await getPrepBatchLayout(rfidSearch.trim());
      if (result.success && result.data) {
        setLayoutData(result.data);
      } else {
        setSearchError(result.error || 'Data batch layout tidak ditemukan.');
      }
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    } finally {
      setSearching(false);
    }
  }, [rfidSearch]);

  return (
    <SewingPageShell>
      {/* Inline keyframes */}
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes toastSlideIn { from { opacity:0; transform:translateX(24px) scale(0.96); } to { opacity:1; transform:translateX(0) scale(1); } }
        @keyframes toastFadeOut { from { opacity:1; transform:translateX(0) scale(1); } to { opacity:0; transform:translateX(24px) scale(0.96); } }
        .animate-fade-in-up { animation: fadeInUp .45s cubic-bezier(.22,1,.36,1) both; }
        .delay-1 { animation-delay: .06s; }
        .delay-2 { animation-delay: .12s; }
        .delay-3 { animation-delay: .18s; }
        .shimmer-bg { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 2.5s infinite; }
        .toast-enter { animation: toastSlideIn .4s cubic-bezier(.22,1,.36,1) both; }
        .toast-exit { animation: toastFadeOut .5s cubic-bezier(.4,0,.2,1) both; }
      `}</style>

      {/* ====== TOAST POPUP ====== */}
      {toastVisible && responseData && (
        <div className={cn(
          'fixed top-20 right-5 z-[9999] w-[22rem] max-w-[calc(100vw-2.5rem)]',
          toastFadingOut ? 'toast-exit' : 'toast-enter'
        )}>
          <div className="rounded-2xl border border-white/60 bg-white/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(16,24,40,0.12),0_0_0_1px_rgba(0,0,0,0.03)] overflow-hidden">
            {/* Progress bar */}
            <div className="h-[3px] bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full"
                style={{
                  animation: 'toastProgress 5s linear both',
                }}
              />
            </div>
            <style>{`@keyframes toastProgress { from { width: 100%; } to { width: 0%; } }`}</style>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">{responseData.operator_name}</p>
                <p className="text-[0.68rem] text-slate-500">NIK {responseData.nik} • RFID {responseData.rfid_user}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setToastFadingOut(true);
                  setTimeout(() => { setToastVisible(false); setToastFadingOut(false); }, 400);
                  if (toastTimer.current) clearTimeout(toastTimer.current);
                  if (toastFadeTimer.current) clearTimeout(toastFadeTimer.current);
                }}
                className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Tutup"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-3 gap-px bg-slate-100/80 mx-3 mb-3 rounded-xl overflow-hidden text-center">
              <div className="bg-white/90 py-2 px-1">
                <p className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">Line</p>
                <p className="text-sm font-extrabold text-slate-800 mt-0.5">{responseData.line_no}</p>
              </div>
              <div className="bg-white/90 py-2 px-1">
                <p className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">Batch</p>
                <p className="text-sm font-extrabold text-slate-800 mt-0.5">{responseData.batch_no}</p>
              </div>
              <div className="bg-white/90 py-2 px-1">
                <p className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">Scan</p>
                <p className={cn(
                  'text-sm font-extrabold mt-0.5',
                  responseData.scan_type === 'in' ? 'text-emerald-600' : 'text-amber-600'
                )}>{responseData.scan_type}</p>
              </div>
            </div>

            {/* Footer info */}
            <div className="flex items-center justify-between px-4 pb-3 text-[0.62rem] text-slate-400">
              <span>{responseData.ket_batch}</span>
              <span className={cn(
                'rounded-full px-2 py-0.5 text-[0.6rem] font-bold',
                responseData.is_active === 1 ? 'bg-emerald-500/15 text-emerald-700' : 'bg-red-500/15 text-red-700'
              )}>
                {responseData.is_active === 1 ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-[min(100%,76rem)] px-[clamp(0.5rem,2vw,1.5rem)] py-[clamp(0.5rem,2vh,1.25rem)]">
        {/* ====== HEADER ====== */}
        <section
          className={cn(
            glassCard,
            'animate-fade-in-up p-5 sm:p-6',
            'bg-gradient-to-br from-white/95 via-blue-50/40 to-indigo-50/30'
          )}
        >
          {/* Decorative shimmer overlay */}
          <div className="shimmer-bg pointer-events-none absolute inset-0 rounded-2xl opacity-40" />

          <div className="relative z-10">
            {/* Chip */}
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-3 py-1.5 text-xs font-bold text-blue-800">
              <LayoutGrid className="h-3.5 w-3.5" />
              Batch Position • Line {normalizedLine}
            </div>

            <h1 className="m-0 text-[clamp(1.4rem,3vw,2.15rem)] font-extrabold leading-tight tracking-tight text-slate-900">
              Atur Posisi Batch
            </h1>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-500">
              Kelola pengaturan akses operator batch prep dan cek data batch layout berdasarkan RFID user.
            </p>
          </div>
        </section>

        {/* ====== TWO COLUMN LAYOUT ====== */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* ── LEFT: Form Operator Batch ── */}
          <section className={cn(glassCard, 'animate-fade-in-up delay-1 p-5 sm:p-6')}>
            {/* Accent bar top */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-t-2xl" />

            <div className={sectionTitle}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25">
                <FileText className="h-4 w-4" />
              </div>
              Form Operator Batch
            </div>
            <p className="mt-1 mb-5 text-xs text-slate-400">
              POST <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-slate-600">/api/prep/op_batch</code>
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* NIK */}
              <label className={labelBase}>
                <span className={labelText}>
                  <User className="h-3 w-3 text-blue-500" /> NIK
                </span>
                <input
                  id="field-nik"
                  type="text"
                  value={form.nik}
                  onChange={(e) => handleChange('nik', e.target.value)}
                  className={inputBase}
                  placeholder="Contoh: 92300014"
                />
              </label>

              {/* Line */}
              <label className={labelBase}>
                <span className={labelText}>
                  <Layers className="h-3 w-3 text-indigo-500" /> Line
                </span>
                <select
                  id="field-line"
                  value={form.line}
                  onChange={(e) => handleChange('line', e.target.value)}
                  className={selectBase}
                >
                  {visibleLines.map((l) => (
                    <option key={l.id} value={l.line!}>
                      Line {l.line}
                    </option>
                  ))}
                </select>
              </label>

              {/* Batch */}
              <label className={labelBase}>
                <span className={labelText}>
                  <Hash className="h-3 w-3 text-violet-500" /> Batch
                </span>
                <select
                  id="field-batch"
                  value={form.batch}
                  onChange={(e) => handleChange('batch', e.target.value)}
                  className={selectBase}
                >
                  {BATCH_OPTIONS.map((b) => (
                    <option key={b} value={String(b)}>
                      Batch {b}
                    </option>
                  ))}
                </select>
              </label>

              {/* Keterangan Batch */}
              <label className={labelBase}>
                <span className={labelText}>
                  <FileText className="h-3 w-3 text-emerald-500" /> Keterangan Batch
                </span>
                <input
                  id="field-ket-batch"
                  type="text"
                  value={form.ket_batch}
                  onChange={(e) => handleChange('ket_batch', e.target.value)}
                  className={inputBase}
                  placeholder="Contoh: Kelim Bawah"
                />
              </label>

              {/* Scan Type */}
              <label className={labelBase}>
                <span className={labelText}>
                  <ScanLine className="h-3 w-3 text-amber-500" /> Scan Type
                </span>
                <select
                  id="field-scan-type"
                  value={form.scan_type}
                  onChange={(e) => handleChange('scan_type', e.target.value)}
                  className={selectBase}
                >
                  <option value="in">in</option>
                  <option value="out">out</option>
                </select>
              </label>

              {/* Is Active */}
              <label className={labelBase}>
                <span className={labelText}>
                  <Power className="h-3 w-3 text-green-500" /> Is Active
                </span>
                <select
                  id="field-is-active"
                  value={form.is_active}
                  onChange={(e) => handleChange('is_active', e.target.value)}
                  className={selectBase}
                >
                  <option value="1">1 — Aktif</option>
                  <option value="0">0 — Tidak Aktif</option>
                </select>
              </label>
            </div>

            {/* Submit */}
            <div className="mt-5">
              <button
                id="btn-submit"
                type="button"
                onClick={() => void handleSubmit()}
                disabled={saving}
                className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 transition-transform group-hover:scale-110" />
                )}
                {saving ? 'Menyimpan…' : 'Simpan Data'}
              </button>
            </div>

            {/* Messages */}
            {formError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 backdrop-blur-sm">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm font-medium text-red-700">{formError}</p>
              </div>
            )}
            {formSuccess && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 backdrop-blur-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <p className="text-sm font-medium text-emerald-700">{formSuccess}</p>
              </div>
            )}


          </section>

          {/* ── RIGHT: Check Batch Layout ── */}
          <section className={cn(glassCard, 'animate-fade-in-up delay-2 p-5 sm:p-6')}>
            {/* Accent bar top */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-t-2xl" />

            <div className={sectionTitle}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
                <Search className="h-4 w-4" />
              </div>
              Check Batch Layout
            </div>
            <p className="mt-1 mb-5 text-xs text-slate-400">
              GET <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-slate-600">/api/prep/batch_layout</code>
            </p>

            {/* Search input */}
            <label className={labelBase}>
              <span className={labelText}>
                <ScanLine className="h-3 w-3 text-emerald-500" /> RFID User
              </span>
              <div className="flex gap-2">
                <input
                  id="field-rfid-search"
                  type="text"
                  value={rfidSearch}
                  onChange={(e) => {
                    setRfidSearch(e.target.value);
                    setSearchError(null);
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleSearch(); }}
                  className={cn(inputBase, 'flex-1')}
                  placeholder="Contoh: 0015117752"
                />
                <button
                  id="btn-search"
                  type="button"
                  onClick={() => void handleSearch()}
                  disabled={searching}
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none"
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 transition-transform group-hover:scale-110" />
                  )}
                  Cari
                </button>
              </div>
            </label>

            {/* Error */}
            {searchError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 backdrop-blur-sm">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm font-medium text-red-700">{searchError}</p>
              </div>
            )}

            {/* Result Card */}
            {layoutData && (
              <div className="mt-5 rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50/80 to-white/90 p-4 animate-fade-in-up">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Batch Layout Data
                </div>
                <div className="divide-y divide-slate-100/80">
                  {kv('Batch Layout ID', layoutData.batch_layout_id)}
                  {kv('Nama', layoutData.nama, true)}
                  {kv('NIK', <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold">{layoutData.nik}</code>)}
                  {kv('RFID User', <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold">{layoutData.rfid_user}</code>)}
                  {kv('Branch', layoutData.branch)}
                  {kv('Line', layoutData.line)}
                  {kv('Batch', layoutData.batch)}
                  {kv('Ket Batch', layoutData.ket_batch)}
                  {kv('Status', (
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold',
                      layoutData.isDone === 0
                        ? 'bg-blue-500/15 text-blue-800'
                        : 'bg-emerald-500/15 text-emerald-800'
                    )}>
                      {layoutData.isDone === 0 ? 'Belum Selesai' : 'Selesai'}
                    </span>
                  ))}
                  {kv('Timestamp', new Date(layoutData.timestamp).toLocaleString('id-ID'))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {hasSearched && !searching && !searchError && !layoutData && (
              <div className="mt-8 flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100/80">
                  <Search className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">Data batch layout tidak ditemukan</p>
                <p className="text-xs text-slate-400">Coba gunakan RFID user yang berbeda</p>
              </div>
            )}

            {/* Initial empty state */}
            {!hasSearched && !layoutData && (
              <div className="mt-8 flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/60">
                  <ScanLine className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">Masukkan RFID User untuk mencari data batch layout</p>
                <p className="text-xs text-slate-400">Menampilkan record terbaru dari tabel batch_layout</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </SewingPageShell>
  );
});

SewingPositioningPage.displayName = 'SewingPositioningPage';

export default SewingPositioningPage;
