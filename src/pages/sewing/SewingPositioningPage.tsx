import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import SewingPageShell from '../../components/sewing/SewingPageShell';
import { cn } from '../../components/sewing/sewingBatchTw';
import {
  getInitialEnvironment,
  getEnvironmentFromAPI,
  postPrepOpBatch,
  getPrepOpAccess,
  getPrepListBatch,
  type PrepOpBatchPayload,
  type PrepOpBatchResponseData,
  type PrepOpAccessData,
  type PrepListBatchData,
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
  User,
  Hash,
  Layers,
  ScanLine,
  Power,
  FileText,
  Loader2,
  Users,
  RefreshCw,
  ChevronDown,
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

  /* ---------- Registered Operators state ---------- */
  const [opAccessList, setOpAccessList] = useState<PrepOpAccessData[]>([]);
  const [loadingOpAccess, setLoadingOpAccess] = useState(false);
  const [opAccessError, setOpAccessError] = useState<string>('');

  const [listBatch, setListBatch] = useState<PrepListBatchData[]>([]);

  const fetchOpAccess = useCallback(async () => {
    setLoadingOpAccess(true);
    setOpAccessError('');
    try {
      const [resAccess, resBatch] = await Promise.all([
        getPrepOpAccess(),
        getPrepListBatch()
      ]);
      
      if (resAccess.success && resAccess.data) {
        setOpAccessList(resAccess.data);
      } else {
        setOpAccessError(resAccess.error || 'Gagal memuat data operator batch');
      }

      if (resBatch.success && resBatch.data) {
        setListBatch(resBatch.data);
      }
    } catch (err: any) {
      setOpAccessError(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setLoadingOpAccess(false);
    }
  }, []);

  const uniqueOperators = useMemo(() => {
    const map = new Map<string, string>();
    opAccessList.forEach((op) => {
      if (op.nik && !map.has(op.nik)) {
        map.set(op.nik, op.operator_name);
      }
    });
    return Array.from(map.entries()).map(([nik, name]) => ({ nik, name }));
  }, [opAccessList]);

  const [showNikSuggestions, setShowNikSuggestions] = useState(false);
  const nikWrapperRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (nikWrapperRef.current && !nikWrapperRef.current.contains(event.target as Node)) {
        setShowNikSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOperators = useMemo(() => {
    if (!form.nik) return uniqueOperators.slice(0, 5);
    const lower = form.nik.toLowerCase();
    return uniqueOperators
      .filter(op => op.nik.toLowerCase().includes(lower) || op.name.toLowerCase().includes(lower))
      .slice(0, 5);
  }, [uniqueOperators, form.nik]);

  const [showKetBatchSuggestions, setShowKetBatchSuggestions] = useState(false);
  const [ketBatchDropdownOpen, setKetBatchDropdownOpen] = useState(false);
  const ketBatchWrapperRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    function handleClickOutsideKet(event: MouseEvent) {
      if (ketBatchWrapperRef.current && !ketBatchWrapperRef.current.contains(event.target as Node)) {
        setShowKetBatchSuggestions(false);
        setKetBatchDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutsideKet);
    return () => document.removeEventListener('mousedown', handleClickOutsideKet);
  }, []);

  const filteredKetBatch = useMemo(() => {
    if (!form.ket_batch) {
      return ketBatchDropdownOpen ? listBatch : listBatch.slice(0, 5);
    }
    const lower = form.ket_batch.toLowerCase();
    const matches = listBatch.filter(b => b.ket_batch.toLowerCase().includes(lower));
    return ketBatchDropdownOpen ? matches : matches.slice(0, 5);
  }, [listBatch, form.ket_batch, ketBatchDropdownOpen]);

  useEffect(() => {
    void fetchOpAccess();
  }, [fetchOpAccess]);

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

        // Refresh table
        void fetchOpAccess();
      } else {
        setFormError(result.error || 'Gagal menyimpan data operator batch.');
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  }, [form, fetchOpAccess]);

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

      <div className="mx-auto w-full max-w-[min(100%,76rem)] px-[clamp(0.5rem,2vw,1.5rem)] py-[clamp(0.5rem,2vh,1.25rem)] flex flex-col h-[calc(100vh-4rem)] sm:h-[calc(100vh-4.5rem)]">
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
        <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2 flex-1 min-h-0">
          {/* ── LEFT: Form Operator Batch ── */}
          <section className={cn(glassCard, 'animate-fade-in-up delay-1 p-5 sm:p-6 flex flex-col h-full overflow-y-auto min-h-0')}>
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
              <label className={labelBase} ref={nikWrapperRef}>
                <span className={labelText}>
                  <User className="h-3 w-3 text-blue-500" /> NIK
                </span>
                <div className="relative">
                  <input
                    id="field-nik"
                    type="text"
                    value={form.nik}
                    onFocus={() => setShowNikSuggestions(true)}
                    onChange={(e) => {
                      handleChange('nik', e.target.value);
                      setShowNikSuggestions(true);
                    }}
                    className={inputBase}
                    placeholder="Contoh: 92300014"
                    autoComplete="off"
                  />
                  {showNikSuggestions && form.nik.trim().length > 0 && filteredOperators.length > 0 && (
                    <ul className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-blue-900/5 animate-in fade-in slide-in-from-top-2">
                      {filteredOperators.map((op) => (
                        <li
                          key={op.nik}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleChange('nik', op.nik);
                            setShowNikSuggestions(false);
                          }}
                          className="group flex cursor-pointer items-center gap-3 border-b border-slate-50 px-3 py-2.5 last:border-0 hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="truncate text-[0.8rem] font-bold text-slate-700 group-hover:text-blue-700">
                              {op.nik}
                            </span>
                            <span className="truncate text-[0.65rem] font-medium text-slate-500 group-hover:text-blue-500/80">
                              {op.name}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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
              <label className={labelBase} ref={ketBatchWrapperRef}>
                <span className={labelText}>
                  <FileText className="h-3 w-3 text-emerald-500" /> Keterangan Batch
                </span>
                <div className="relative">
                  <input
                    id="field-ket-batch"
                    type="text"
                    value={form.ket_batch}
                    onFocus={() => setShowKetBatchSuggestions(true)}
                    onChange={(e) => {
                      handleChange('ket_batch', e.target.value);
                      setShowKetBatchSuggestions(true);
                      setKetBatchDropdownOpen(true);
                    }}
                    className={cn(inputBase, 'pr-10')}
                    placeholder="Contoh: Kelim Bawah"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setKetBatchDropdownOpen(prev => !prev);
                      setShowKetBatchSuggestions(true);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <ChevronDown className={cn("h-4 w-4 transition-transform", ketBatchDropdownOpen && "rotate-180")} />
                  </button>
                  {showKetBatchSuggestions && (form.ket_batch.trim().length > 0 || ketBatchDropdownOpen) && filteredKetBatch.length > 0 && (
                    <ul className="absolute left-0 right-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl shadow-emerald-900/5 animate-in fade-in slide-in-from-top-2">
                      {filteredKetBatch.map((b) => (
                        <li
                          key={b.no}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleChange('ket_batch', b.ket_batch);
                            setShowKetBatchSuggestions(false);
                            setKetBatchDropdownOpen(false);
                          }}
                          className="group flex cursor-pointer items-center gap-3 border-b border-slate-50 px-3 py-2.5 last:border-0 hover:bg-emerald-50 transition-colors"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="truncate text-[0.8rem] font-bold text-slate-700 group-hover:text-emerald-700">
                              {b.ket_batch}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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

          <section className={cn(glassCard, 'animate-fade-in-up delay-2 p-5 sm:p-6 flex flex-col h-full min-h-0')}>
            {/* Accent bar top */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-t-2xl" />

            <div className="flex items-center justify-between">
              <div className={sectionTitle}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
                  <Users className="h-4 w-4" />
                </div>
                Operator Batch Terdaftar
              </div>
              <button
                type="button"
                onClick={() => void fetchOpAccess()}
                disabled={loadingOpAccess}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', loadingOpAccess && 'animate-spin')} />
                {loadingOpAccess ? 'Refresh...' : 'Refresh'}
              </button>
            </div>
            <p className="mt-1 mb-5 text-xs text-slate-400 shrink-0">
              GET <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-slate-600">/api/prep/op_access</code>
            </p>

            {/* Error */}
            {opAccessError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 backdrop-blur-sm shrink-0">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm font-medium text-red-700">{opAccessError}</p>
              </div>
            )}

            {/* Table Container - Bulletproof scroll wrapper */}
            <div className="relative flex-1 min-h-0 w-full mt-2">
              <div className="absolute inset-0 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm text-xs font-semibold uppercase text-slate-500 shadow-[0_1px_0_rgba(203,213,225,0.6)]">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap">Operator</th>
                      <th className="px-4 py-3 whitespace-nowrap">Line</th>
                      <th className="px-4 py-3 whitespace-nowrap">Batch</th>
                      <th className="px-4 py-3 whitespace-nowrap">Scan</th>
                      <th className="px-4 py-3 whitespace-nowrap text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingOpAccess && opAccessList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-300" />
                          <p className="mt-2 text-xs text-slate-500">Memuat data...</p>
                        </td>
                      </tr>
                    ) : opAccessList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center">
                          <Users className="mx-auto h-8 w-8 text-slate-300" />
                          <p className="mt-2 text-xs font-medium text-slate-500">Belum ada operator terdaftar</p>
                        </td>
                      </tr>
                    ) : (
                      opAccessList.map((op) => (
                        <tr key={op.id} className="transition-colors hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">{op.operator_name}</div>
                            <div className="text-[0.65rem] text-slate-500 mt-0.5">NIK: {op.nik} • RFID: {op.rfid_user}</div>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">{op.line_no}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-700">{op.batch_no}</div>
                            {op.ket_batch && (
                              <div className="text-[0.65rem] font-medium uppercase text-slate-400 mt-0.5">{op.ket_batch}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider',
                              op.scan_type.toLowerCase() === 'in' ? 'bg-blue-100 text-blue-700' : 
                              op.scan_type.toLowerCase() === 'out' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-700'
                            )}>
                              {op.scan_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold',
                              op.is_active === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            )}>
                              <span className={cn('h-1.5 w-1.5 rounded-full', op.is_active === 1 ? 'bg-emerald-500' : 'bg-red-500')} />
                              {op.is_active === 1 ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          </section>
        </div>
      </div>
    </SewingPageShell>
  );
});

SewingPositioningPage.displayName = 'SewingPositioningPage';

export default SewingPositioningPage;
