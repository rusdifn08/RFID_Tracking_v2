import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
    PackagePlus,
    ClipboardCheck,
    Warehouse,
    Truck,
    ScanLine,
    User,
    ClipboardList,
    Hash,
    Tag,
    Box,
    Users,
    Palette,
    Ruler,
    Minus,
    Plus,
    CalendarRange,
    Search,
    X,
    Filter,
    Layers,
    Route,
} from 'lucide-react';
import {
    inputRfidCuttingBundle,
    getCuttingScanState,
    filterCuttingScanStateToLocalToday,
    postCuttingStoreScan,
    postCuttingSupplySewingScan,
    getHomeDashboard,
    getHomeDashboardTracking,
    type HomeDashboardItem,
    type HomeDashboardTrackingBuckets,
    type HomeDashboardTrackingItem,
    type CuttingScanStateDoc,
    type CuttingScanHistoryEntry,
} from '../../../config/api';
import { COMINGSOON_SUPPLY_SEWING } from '../../../config/hide';
import { useAuth } from '../../../hooks/useAuth';
import ChartCard from '../ChartCard';
import CuttingScanStationModal, { type CuttingScanSessionRow } from './CuttingScanStationModal';
import QcScanStationHost from './QcScanStationHost';

const QUERY_SCAN = ['cutting-scan-state'] as const;
const QUERY_HOME_DASH_BASE = 'cutting-home-dashboard' as const;
const QUERY_HOME_TRACKING_BASE = 'cutting-home-dashboard-tracking' as const;

function ymdTodayLocal(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatYmdIdLabel(ymd: string): string {
    const [y, mo, da] = ymd.split('-').map((x) => Number(x));
    if (!y || !mo || !da) return ymd;
    const d = new Date(y, mo - 1, da);
    if (Number.isNaN(d.getTime())) return ymd;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isoToLocalYmd(iso: string): string | null {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function isoOnLocalYmdRange(iso: string | undefined, fromYmd: string, toYmd: string): boolean {
    if (iso == null || String(iso).trim() === '') return false;
    const ymd = isoToLocalYmd(String(iso));
    if (!ymd) return false;
    return ymd >= fromYmd && ymd <= toYmd;
}

function homeItemRawTimestamp(item: HomeDashboardItem): string | undefined {
    const candidates = [
        item.tanggal,
        item.createdAt,
        item.created_at,
        item.output_time,
        item.updated_at,
        item.waktu,
        item.at,
    ];
    for (const c of candidates) {
        if (c == null || String(c).trim() === '') continue;
        if (!Number.isNaN(Date.parse(String(c)))) return String(c);
    }
    return undefined;
}

function homeItemInDateRange(item: HomeDashboardItem, fromYmd: string, toYmd: string): boolean {
    const ts = homeItemRawTimestamp(item);
    if (!ts) return true;
    return isoOnLocalYmdRange(ts, fromYmd, toYmd);
}

function formatRowTime(ts: unknown): string {
    if (ts == null || ts === '' || ts === '—') return '—';
    const d = new Date(String(ts));
    if (Number.isNaN(d.getTime())) return String(ts);
    return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function filterCuttingScanStateByDateRange(doc: CuttingScanStateDoc, fromYmd: string, toYmd: string): CuttingScanStateDoc {
    const filterHist = (hist: CuttingScanHistoryEntry[]) =>
        (hist ?? []).filter((h) => isoOnLocalYmdRange(h.at, fromYmd, toYmd));
    const bundleHist = filterHist(doc.bundle.history);
    const qcHist = filterHist(doc.qc.history);
    const storeHist = filterHist(doc.store.history);
    const supplyHist = filterHist(doc.supply.history);
    const goodTotal = qcHist.reduce((s, h) => s + (h.good ?? 0), 0);
    const repairTotal = qcHist.reduce((s, h) => s + (h.repair ?? 0), 0);
    const rejectTotal = qcHist.reduce((s, h) => s + (h.reject ?? 0), 0);
    return {
        bundle: { count: bundleHist.length, history: bundleHist },
        qc: { goodTotal, repairTotal, rejectTotal, history: qcHist },
        store: { count: storeHist.length, history: storeHist },
        supply: { count: supplyHist.length, history: supplyHist },
    };
}

/** Normalisasi `last_status` dari GET `/api/homedashboard` untuk perbandingan. */
function normCuttingLastStatus(s: unknown): string {
    return String(s ?? '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_');
}

/** Urutan "kemajuan" status untuk fallback jika tidak ada petunjuk di baris klik. */
const HOME_STATUS_RANK: Record<string, number> = {
    OUTPUT_BUNDLE: 10,
    GOOD: 20,
    REPAIR: 20,
    REJECT: 20,
    IN_SMARKET: 30,
    OUT_SMARKET: 40,
    IN_SUPERMARKET: 30,
    OUT_SUPERMARKET: 40,
};

function pickLatestHomeDashboardItem(items: HomeDashboardItem[]): HomeDashboardItem {
    return items.reduce((best, cur) => {
        const sb = HOME_STATUS_RANK[normCuttingLastStatus(best.last_status)] ?? 0;
        const sc = HOME_STATUS_RANK[normCuttingLastStatus(cur.last_status)] ?? 0;
        return sc >= sb ? cur : best;
    });
}

/**
 * API bisa mengembalikan banyak baris untuk RFID yang sama (riwayat status).
 * Jangan pakai Map(rfid) — ambil objek yang sama dengan baris tabel (last_status / barcode / id_bundles).
 */
function findHomeDashboardItemForDetail(
    items: HomeDashboardItem[] | undefined,
    row: CuttingTableRow,
): HomeDashboardItem | undefined {
    if (!items?.length) return undefined;
    const rfid = String(row.rfid ?? '').trim();
    if (!rfid) return undefined;

    const same = items.filter((it) => String(it.rfid_bundles ?? '').trim() === rfid);
    if (same.length === 0) return undefined;
    if (same.length === 1) return same[0];

    const rowStatus = normCuttingLastStatus(row.last_status);
    const rowBarcode = String(row.barcode ?? '').trim();
    const rowIdRaw = row.id_bundles;
    const rowIdNum =
        rowIdRaw != null && rowIdRaw !== '' && !Number.isNaN(Number(rowIdRaw)) ? Number(rowIdRaw) : NaN;

    if (rowStatus) {
        const bySt = same.filter((it) => normCuttingLastStatus(it.last_status) === rowStatus);
        if (bySt.length === 1) return bySt[0];
        if (bySt.length > 1) {
            if (rowBarcode) {
                const byBc = bySt.filter((it) => String(it.barcode ?? '').trim() === rowBarcode);
                if (byBc.length >= 1) return byBc[0];
            }
            if (Number.isFinite(rowIdNum)) {
                const byId = bySt.filter((it) => Number(it.id_bundles) === rowIdNum);
                if (byId.length >= 1) return byId[0];
            }
            return bySt[0];
        }
    }

    return pickLatestHomeDashboardItem(same);
}

function mapHomeItemToBundleRow(item: HomeDashboardItem) {
    const qty = Math.max(1, Number(item.qty_batch ?? 1));
    const ts = homeItemRawTimestamp(item);
    return {
        rfid: item.rfid_bundles ?? '—',
        wo: item.wo ?? '—',
        qty,
        style: item.style ?? '—',
        buyer: item.buyer ?? '—',
        item: item.item ?? '—',
        color: item.warna ?? '—',
        size: item.size ?? '—',
        waktu: formatRowTime(ts),
        location: 'bundle',
        timestamp: ts ?? item.barcode ?? '—',
        last_status: item.last_status,
        id_bundles: item.id_bundles,
        barcode: item.barcode,
    };
}

function mapHomeItemToQcRow(item: HomeDashboardItem) {
    const qty = Math.max(1, Number(item.qty_batch ?? 1));
    const st = normCuttingLastStatus(item.last_status);
    let good = 0;
    let repair = 0;
    let reject = 0;
    if (st === 'GOOD') good = qty;
    else if (st === 'REPAIR') repair = qty;
    else if (st === 'REJECT') reject = qty;
    const ts = homeItemRawTimestamp(item);
    return {
        rfid: item.rfid_bundles ?? '—',
        qty,
        good,
        repair,
        reject,
        wo: item.wo ?? '—',
        style: item.style ?? '—',
        buyer: item.buyer ?? '—',
        item: item.item ?? '—',
        color: item.warna ?? '—',
        size: item.size ?? '—',
        waktu: formatRowTime(ts),
        location: 'quality_control',
        timestamp: ts ?? item.barcode ?? '—',
        last_status: item.last_status,
        id_bundles: item.id_bundles,
        barcode: item.barcode,
    };
}

function mapHomeItemToStoreRow(item: HomeDashboardItem) {
    const qty = Math.max(1, Number(item.qty_batch ?? 1));
    const st = normCuttingLastStatus(item.last_status);
    const lokasi =
        st === 'IN_SMARKET' || st === 'IN_SUPERMARKET'
            ? 'Masuk Supermarket'
            : st === 'OUT_SMARKET' || st === 'OUT_SUPERMARKET'
              ? 'Keluar Supermarket'
              : String(item.lokasi ?? item.last_status ?? '—');
    const lineStr =
        item.line != null && String(item.line).trim() !== '' ? String(item.line) : '—';
    const ts = homeItemRawTimestamp(item);
    return {
        rfid: item.rfid_bundles ?? '—',
        wo: item.wo ?? '—',
        qty,
        line: lineStr,
        lokasi,
        style: item.style ?? '—',
        buyer: item.buyer ?? '—',
        item: item.item ?? '—',
        color: item.warna ?? '—',
        size: item.size ?? '—',
        waktu: formatRowTime(ts),
        location: 'supermarket',
        timestamp: ts ?? item.barcode ?? '—',
        last_status: item.last_status,
        id_bundles: item.id_bundles,
        barcode: item.barcode,
    };
}

type TrackingBucketKey = 'bundle' | 'qc' | 'smarket' | 'supply_sewing';

function trackingBucketRawTimestamp(item: HomeDashboardTrackingItem, bucket: TrackingBucketKey): string | undefined {
    const pickLatest = (...ts: (string | null | undefined)[]) => {
        let best: { t: string; ms: number } | null = null;
        for (const raw of ts) {
            if (raw == null || String(raw).trim() === '') continue;
            const ms = Date.parse(String(raw));
            if (Number.isNaN(ms)) continue;
            if (!best || ms > best.ms) best = { t: String(raw), ms };
        }
        return best?.t;
    };
    switch (bucket) {
        case 'bundle':
            return pickLatest(item.last_time_output, item.updated_at);
        case 'qc':
            return pickLatest(item.last_time_good, item.last_time_repair, item.last_time_reject, item.updated_at);
        case 'smarket':
            return pickLatest(item.last_time_smarket_in, item.last_time_smarket_out, item.updated_at);
        case 'supply_sewing':
            return pickLatest(item.last_time_smarket_out, item.last_time_sewing, item.updated_at);
    }
}

function mapTrackingItemToBundleRow(item: HomeDashboardTrackingItem) {
    const qty = Math.max(1, Number(item.qty_output ?? 0) || 1);
    const ts = trackingBucketRawTimestamp(item, 'bundle');
    return {
        rfid: item.rfid_bundles ?? '—',
        wo: item.wo ?? '—',
        qty,
        style: item.style ?? '—',
        buyer: item.buyer ?? '—',
        item: item.item ?? '—',
        color: item.warna ?? '—',
        size: item.size ?? '—',
        waktu: formatRowTime(ts),
        location: 'bundle',
        timestamp: ts ?? '—',
        wip_status: item.wip_status,
        id_bundles: item.id_bundles,
        barcode: item.barcode,
    };
}

function mapTrackingItemToQcRow(item: HomeDashboardTrackingItem) {
    const good = Math.max(0, Number(item.qty_good ?? 0));
    const repair = Math.max(0, Number(item.qty_repair ?? 0));
    const reject = Math.max(0, Number(item.qty_reject ?? 0));
    const qty = good + repair + reject || Math.max(1, Number(item.qty_output ?? 0) || 1);
    const ts = trackingBucketRawTimestamp(item, 'qc');
    return {
        rfid: item.rfid_bundles ?? '—',
        qty,
        good,
        repair,
        reject,
        wo: item.wo ?? '—',
        style: item.style ?? '—',
        buyer: item.buyer ?? '—',
        item: item.item ?? '—',
        color: item.warna ?? '—',
        size: item.size ?? '—',
        waktu: formatRowTime(ts),
        location: 'quality_control',
        timestamp: ts ?? '—',
        wip_status: item.wip_status,
        id_bundles: item.id_bundles,
        barcode: item.barcode,
    };
}

function mapTrackingItemToStoreRow(item: HomeDashboardTrackingItem) {
    const qty = Math.max(1, Number(item.qty_smarket_in ?? item.qty_good ?? item.qty_output ?? 0) || 1);
    const ts = trackingBucketRawTimestamp(item, 'smarket');
    const lineStr = item.line != null && String(item.line).trim() !== '' ? String(item.line) : '—';
    return {
        rfid: item.rfid_bundles ?? '—',
        wo: item.wo ?? '—',
        qty,
        line: lineStr,
        lokasi: 'Supermarket',
        style: item.style ?? '—',
        buyer: item.buyer ?? '—',
        item: item.item ?? '—',
        color: item.warna ?? '—',
        size: item.size ?? '—',
        waktu: formatRowTime(ts),
        location: 'supermarket',
        timestamp: ts ?? '—',
        wip_status: item.wip_status,
        id_bundles: item.id_bundles,
        barcode: item.barcode,
    };
}

function mapTrackingItemToSupplyRow(item: HomeDashboardTrackingItem) {
    const qty = Math.max(1, Number(item.qty_smarket_out ?? item.qty_output ?? 0) || 1);
    const ts = trackingBucketRawTimestamp(item, 'supply_sewing');
    const lineStr = item.line != null && String(item.line).trim() !== '' ? String(item.line) : '—';
    const locRaw = String(item.lokasi ?? '').trim();
    return {
        rfid: item.rfid_bundles ?? '—',
        wo: item.wo ?? '—',
        line: lineStr,
        gm: locRaw || '—',
        qty,
        style: item.style ?? '—',
        buyer: item.buyer ?? '—',
        item: item.item ?? '—',
        color: item.warna ?? '—',
        size: item.size ?? '—',
        waktu: formatRowTime(ts),
        location: 'supply_sewing',
        timestamp: ts ?? '—',
        wip_status: item.wip_status,
        id_bundles: item.id_bundles,
        barcode: item.barcode,
    };
}

function flattenTrackingBuckets(data: HomeDashboardTrackingBuckets | undefined): HomeDashboardTrackingItem[] {
    if (!data) return [];
    return [
        ...(data.bundle ?? []),
        ...(data.qc ?? []),
        ...(data.smarket ?? []),
        ...(data.supply_sewing ?? []),
    ];
}

function findTrackingItemForDetail(
    data: HomeDashboardTrackingBuckets | undefined,
    row: CuttingTableRow,
): HomeDashboardTrackingItem | undefined {
    if (!data) return undefined;
    const rfid = String(row.rfid ?? '').trim();
    if (!rfid) return undefined;
    const same = flattenTrackingBuckets(data).filter((it) => String(it.rfid_bundles ?? '').trim() === rfid);
    if (!same.length) return undefined;
    const rowId = row.id_bundles;
    if (rowId != null && rowId !== '' && !Number.isNaN(Number(rowId))) {
        const byId = same.filter((it) => Number(it.id_bundles) === Number(rowId));
        if (byId.length >= 1) return byId[0];
    }
    const ws = String(row.wip_status ?? '').trim();
    if (ws) {
        const byWs = same.filter((it) => String(it.wip_status ?? '').trim() === ws);
        if (byWs.length >= 1) return byWs[0];
    }
    return same[0];
}

function resolveTrackingSearchParams(search: string): { wo?: string; style?: string } {
    const q = search.trim();
    if (!q) return {};
    if (/^\d+$/.test(q)) return { wo: q };
    return { style: q };
}

/** Field detail modal dari satu baris respons GET `/api/homedashboard/tracking`. */
function trackingItemToFields(
    item: HomeDashboardTrackingItem,
    fmt: (v: unknown) => string,
): { label: string; value: string }[] {
    const order: { key: string; label: string }[] = [
        { key: 'wip_status', label: 'WIP Status' },
        { key: 'rfid_bundles', label: 'RFID Bundle' },
        { key: 'id_bundles', label: 'ID Bundles' },
        { key: 'barcode', label: 'Barcode' },
        { key: 'wo', label: 'WO' },
        { key: 'style', label: 'Style' },
        { key: 'buyer', label: 'Buyer' },
        { key: 'item', label: 'Item' },
        { key: 'warna', label: 'Warna' },
        { key: 'size', label: 'Size' },
        { key: 'qty_output', label: 'Qty Output' },
        { key: 'last_time_output', label: 'Last Time Output' },
        { key: 'qty_good', label: 'Qty Good' },
        { key: 'last_time_good', label: 'Last Time Good' },
        { key: 'qty_repair', label: 'Qty Repair' },
        { key: 'last_time_repair', label: 'Last Time Repair' },
        { key: 'qty_reject', label: 'Qty Reject' },
        { key: 'last_time_reject', label: 'Last Time Reject' },
        { key: 'qty_smarket_in', label: 'Qty Smarket In' },
        { key: 'last_time_smarket_in', label: 'Last Time Smarket In' },
        { key: 'qty_smarket_out', label: 'Qty Smarket Out' },
        { key: 'last_time_smarket_out', label: 'Last Time Smarket Out' },
        { key: 'qty_sewing', label: 'Qty Sewing' },
        { key: 'last_time_sewing', label: 'Last Time Sewing' },
        { key: 'updated_at', label: 'Updated At' },
    ];
    const shown = new Set<string>();
    const out: { label: string; value: string }[] = [];
    for (const { key, label } of order) {
        shown.add(key);
        const v = (item as Record<string, unknown>)[key];
        const s = fmt(v);
        if (s !== '—') out.push({ label, value: s });
    }
    for (const [k, v] of Object.entries(item)) {
        if (shown.has(k)) continue;
        if (typeof v === 'object' && v !== null) continue;
        const s = fmt(v);
        if (s === '—') continue;
        const pretty = k
            .split('_')
            .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : ''))
            .join(' ');
        out.push({ label: pretty || k, value: s });
    }
    return out;
}

/** Field detail modal dari satu baris respons GET `/api/homedashboard`. */
function homeDashboardItemToFields(
    item: HomeDashboardItem,
    fmt: (v: unknown) => string
): { label: string; value: string }[] {
    const order: { key: string; label: string }[] = [
        { key: 'rfid_bundles', label: 'RFID Bundle' },
        { key: 'id_bundles', label: 'ID Bundles' },
        { key: 'barcode', label: 'Barcode' },
        { key: 'last_status', label: 'Last Status' },
        { key: 'wo', label: 'WO' },
        { key: 'style', label: 'Style' },
        { key: 'warna', label: 'Warna' },
        { key: 'size', label: 'Size' },
        { key: 'qty_batch', label: 'Qty Batch' },
        { key: 'line', label: 'Line' },
        { key: 'lokasi', label: 'Lokasi' },
    ];
    const shown = new Set<string>();
    const out: { label: string; value: string }[] = [];
    for (const { key, label } of order) {
        shown.add(key);
        const v = (item as Record<string, unknown>)[key];
        const s = fmt(v);
        if (s !== '—') out.push({ label, value: s });
    }
    for (const [k, v] of Object.entries(item)) {
        if (shown.has(k)) continue;
        if (typeof v === 'object' && v !== null) continue;
        const s = fmt(v);
        if (s === '—') continue;
        const pretty = k
            .split('_')
            .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : ''))
            .join(' ');
        out.push({ label: pretty || k, value: s });
    }
    return out;
}

const STORE_FORM_FS = 'clamp(0.65rem, 0.52rem + 0.38vmin, 0.82rem)' as const;
const STORE_FORM_LABEL_FS = 'clamp(0.58rem, 0.48rem + 0.28vmin, 0.72rem)' as const;

const successSoundPath = '/assets/succes.mp3';
const errorSoundPath = '/assets/error.mp3';

function newCuttingScanRowId(): string {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `cut-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readCuttingOperator(): { name: string; nik: string } {
    try {
        const raw = localStorage.getItem('user');
        if (!raw) return { name: '—', nik: '—' };
        const u = JSON.parse(raw) as { name?: string; nama?: string; nik?: string; NIK?: string };
        const name = u.name ?? u.nama ?? '—';
        const nik = String(u.nik ?? u.NIK ?? '—');
        return { name, nik };
    } catch {
        return { name: '—', nik: '—' };
    }
}

const CUTTING_TABLE_HEADER_FS = 'clamp(0.62rem, 0.5rem + 0.35vmin, 0.78rem)' as const;
const CUTTING_TABLE_BODY_FS = 'clamp(0.68rem, 0.55rem + 0.4vmin, 0.85rem)' as const;

/** Judul kartu — ukuran lebih besar agar mudah dibaca management. */
function CuttingStageTitle({ children }: { children: string }) {
    return (
        <h2
            className="font-extrabold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors min-w-0 truncate uppercase"
            style={{ fontSize: 'clamp(0.95rem, 0.75rem + 0.65vmin, 1.2rem)', letterSpacing: '0.06em' }}
        >
            {children}
        </h2>
    );
}

function CuttingStageHeader({
    title,
    action,
    count,
    countClassName = 'bg-slate-900',
}: {
    title: string;
    action: ReactNode;
    count?: number;
    countClassName?: string;
}) {
    const countFs = 'clamp(0.95rem, 0.75rem + 0.65vmin, 1.2rem)';
    return (
        <div className="flex w-full min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
                <CuttingStageTitle>{title}</CuttingStageTitle>
                {count != null ? (
                    <span
                        className={`inline-flex min-h-[1.85rem] min-w-[2.5rem] shrink-0 items-center justify-center rounded px-3 font-extrabold text-white tabular-nums leading-none shadow-sm ${countClassName}`}
                        style={{ fontSize: countFs }}
                        title="Jumlah data"
                    >
                        {count}
                    </span>
                ) : null}
            </div>
            <div className="flex shrink-0 items-center self-center">{action}</div>
        </div>
    );
}

const CUTTING_STAGE_CHART_CARD_CLASS =
    'min-h-0 h-full flex flex-col py-2 bg-gradient-to-b from-white via-white to-slate-50/50 shadow-[0_10px_24px_rgba(15,23,42,0.07)] hover:shadow-[0_14px_30px_rgba(15,23,42,0.11)] transition-all duration-300 border-2 max-lg:h-auto max-lg:min-h-[14rem] max-lg:flex-none';

type ScanningModalId = 'bundle' | 'qc' | 'store' | 'supply';
type StageFilterId = ScanningModalId;

function uniqueStylesFromRows(rows: CuttingTableRow[]): string[] {
    const set = new Set<string>();
    for (const r of rows) {
        const s = String(r.style ?? '').trim();
        if (s && s !== '—') set.add(s);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'id'));
}

function cuttingTableEmptyText(
    searchQuery: string,
    stageStyleFilter: string,
    trackingLoadFailed?: boolean,
): string {
    if (trackingLoadFailed) return 'Gagal memuat data tracking';
    if (searchQuery.trim() || stageStyleFilter.trim()) return 'Tidak ada data cocok';
    return 'Belum ada data';
}

function filterRowsByStyle(rows: CuttingTableRow[], styleFilter: string): CuttingTableRow[] {
    const sf = styleFilter.trim();
    if (!sf) return rows;
    return rows.filter((r) => String(r.style ?? '').trim() === sf);
}

function applyStageTableFilters(rows: CuttingTableRow[], styleFilter: string, search: string): CuttingTableRow[] {
    return sortTableRowsNewestFirst(filterRowsBySearch(filterRowsByStyle(rows, styleFilter), search));
}

function StyleFilterButton({
    accent,
    value,
    options,
    onChange,
}: {
    accent: 'emerald' | 'sky' | 'amber' | 'violet';
    value: string;
    options: string[];
    onChange: (next: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const active = value.trim() !== '';

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            const el = ref.current;
            if (el && !el.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    const cls =
        accent === 'emerald'
            ? active
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100'
            : accent === 'sky'
              ? active
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-sky-50 text-sky-800 border-sky-200/90 hover:bg-sky-100'
              : accent === 'amber'
                ? active
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-amber-50 text-amber-900 border-amber-200/90 hover:bg-amber-100'
                : active
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-violet-50 text-violet-900 border-violet-200/90 hover:bg-violet-100';

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((v) => !v);
                }}
                className={`inline-flex items-center gap-1 font-bold tracking-wide px-2 py-1.5 rounded border shadow-sm shrink-0 transition-all ${cls}`}
                style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: 'clamp(0.65rem, 0.75vw + 0.32rem, 0.78rem)',
                }}
                title={active ? `Filter Style: ${value}` : 'Filter Style'}
            >
                <Filter className="w-3 h-3 shrink-0" strokeWidth={2.4} />
                <span className="whitespace-nowrap">Style</span>
            </button>
            {open ? (
                <div
                    className="absolute right-0 top-full z-[70] mt-1 w-[min(100vw-2rem,11rem)] max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10"
                    role="listbox"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        className={`block w-full px-2.5 py-1.5 text-left text-xs font-semibold hover:bg-slate-50 ${!active ? 'text-sky-700 bg-sky-50/80' : 'text-slate-600'}`}
                        onClick={() => {
                            onChange('');
                            setOpen(false);
                        }}
                    >
                        Semua Style
                    </button>
                    {options.length === 0 ? (
                        <p className="px-2.5 py-2 text-[0.65rem] text-slate-400">Belum ada style</p>
                    ) : (
                        options.map((opt) => (
                            <button
                                key={opt}
                                type="button"
                                className={`block w-full px-2.5 py-1.5 text-left text-xs font-semibold truncate hover:bg-slate-50 ${value === opt ? 'text-sky-700 bg-sky-50/80' : 'text-slate-700'}`}
                                title={opt}
                                onClick={() => {
                                    onChange(opt);
                                    setOpen(false);
                                }}
                            >
                                {opt}
                            </button>
                        ))
                    )}
                </div>
            ) : null}
        </div>
    );
}

function StageCardActions({
    accent,
    styleValue,
    styleOptions,
    onStyleChange,
    scanButton,
}: {
    accent: 'emerald' | 'sky' | 'amber' | 'violet';
    styleValue: string;
    styleOptions: string[];
    onStyleChange: (v: string) => void;
    scanButton: ReactNode;
}) {
    return (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <StyleFilterButton accent={accent} value={styleValue} options={styleOptions} onChange={onStyleChange} />
            {scanButton}
        </div>
    );
}

function ScanningButton({
    accent,
    onClick,
}: {
    accent: 'emerald' | 'sky' | 'amber' | 'violet';
    onClick: () => void;
}) {
    const cls =
        accent === 'emerald'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100'
            : accent === 'sky'
              ? 'bg-sky-50 text-sky-800 border-sky-200/90 hover:bg-sky-100'
              : accent === 'amber'
                ? 'bg-amber-50 text-amber-900 border-amber-200/90 hover:bg-amber-100'
                : 'bg-violet-50 text-violet-900 border-violet-200/90 hover:bg-violet-100';
    return (
        <button
            type="button"
            onClick={(e) => {
                // Mencegah klik tombol Scan memicu onClick kartu parent (navigasi dashboard QC).
                e.stopPropagation();
                onClick();
            }}
            className={`inline-flex items-center gap-1.5 font-bold tracking-wide px-3 py-1.5 rounded-lg border shadow-sm shrink-0 transition-all duration-300 hover:-translate-y-[1px] ${cls}`}
            style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 'clamp(0.72rem, 0.85vw + 0.38rem, 0.88rem)',
            }}
        >
            <ScanLine className="w-3.5 h-3.5" strokeWidth={2.4} />
            <span>Scan</span>
        </button>
    );
}

type CuttingTableRow = Record<string, string | number | null | undefined>;

function rowMatchesWoStyleSearch(row: CuttingTableRow, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const wo = String(row.wo ?? '').toLowerCase();
    const style = String(row.style ?? '').toLowerCase();
    return wo.includes(q) || style.includes(q);
}

function filterRowsBySearch(rows: CuttingTableRow[], query: string): CuttingTableRow[] {
    if (!query.trim()) return rows;
    return rows.filter((r) => rowMatchesWoStyleSearch(r, query));
}

function topFieldByCount(rows: CuttingTableRow[], key: 'style' | 'wo'): string {
    const counts = new Map<string, number>();
    for (const r of rows) {
        const v = String(r[key] ?? '').trim();
        if (!v || v === '—') continue;
        counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    let best = '—';
    let bestN = 0;
    for (const [k, n] of counts) {
        if (n > bestN) {
            best = k;
            bestN = n;
        }
    }
    return best;
}

const TOOLBAR_CTRL_H = 'h-10' as const;

type CuttingDataViewMode = 'rekap' | 'flow';

function DataViewSwitch({
    value,
    onChange,
}: {
    value: CuttingDataViewMode;
    onChange: (mode: CuttingDataViewMode) => void;
}) {
    const baseBtn =
        'inline-flex h-full items-center justify-center gap-1.5 rounded-md px-2.5 sm:px-3 text-[0.62rem] sm:text-[0.65rem] font-extrabold uppercase tracking-[0.08em] whitespace-nowrap transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1';
    return (
        <div
            className={`inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-gradient-to-b from-slate-100 to-slate-200/80 p-0.5 ring-1 ring-slate-200/90 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] ${TOOLBAR_CTRL_H}`}
            role="group"
            aria-label="Mode tampilan data bundle"
        >
            <button
                type="button"
                onClick={() => onChange('rekap')}
                className={`${baseBtn} ${
                    value === 'rekap'
                        ? 'bg-gradient-to-b from-white to-sky-50 text-sky-800 shadow-[0_2px_6px_rgba(2,132,199,0.18)] ring-1 ring-sky-200/80'
                        : 'text-slate-500 hover:bg-white/40 hover:text-slate-700'
                }`}
                title="Rekap bundle — GET /api/homedashboard"
                aria-pressed={value === 'rekap'}
            >
                <Layers className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
                <span>Recap Bundle</span>
            </button>
            <button
                type="button"
                onClick={() => onChange('flow')}
                className={`${baseBtn} ${
                    value === 'flow'
                        ? 'bg-gradient-to-b from-white to-violet-50 text-violet-800 shadow-[0_2px_6px_rgba(109,40,217,0.16)] ring-1 ring-violet-200/80'
                        : 'text-slate-500 hover:bg-white/40 hover:text-slate-700'
                }`}
                title="Tracking bundle — GET /api/homedashboard/tracking"
                aria-pressed={value === 'flow'}
            >
                <Route className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
                <span>Tracking Bundle</span>
            </button>
        </div>
    );
}

function ToolbarMiniCard({
    label,
    value,
    valueClassName = 'text-slate-900',
    title,
}: {
    label: string;
    value: string | number;
    valueClassName?: string;
    title?: string;
}) {
    return (
        <div
            className={`inline-flex items-center gap-2 rounded-lg border border-slate-200/90 bg-white px-3 shadow-sm ${TOOLBAR_CTRL_H} min-w-0`}
            title={title}
        >
            <span className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{label}</span>
            <span className={`text-sm font-extrabold tabular-nums truncate max-w-[7.5rem] sm:max-w-[9rem] ${valueClassName}`}>
                {value}
            </span>
        </div>
    );
}

type WireTableColumn = {
    key: string;
    label: string;
    className?: string;
    /** Kolom penting — bold / highlight agar mudah dipindai management. */
    emphasis?: 'primary' | 'metric' | 'good' | 'repair' | 'reject' | 'accent';
};

/** Kolom garment tambahan setelah Style. */
const GARMENT_TAIL_COLUMNS: WireTableColumn[] = [
    { key: 'buyer', label: 'Buyer' },
    { key: 'item', label: 'Item' },
    { key: 'color', label: 'Color' },
    { key: 'size', label: 'Size', emphasis: 'accent' },
];

const COL_WAKTU_SCAN: WireTableColumn = { key: 'waktu', label: 'Waktu Scan' };
const COL_RFID: WireTableColumn = { key: 'rfid', label: 'RFID Bundle', emphasis: 'primary' };
const COL_WO: WireTableColumn = { key: 'wo', label: 'Work Order', emphasis: 'accent' };
const COL_STYLE: WireTableColumn = { key: 'style', label: 'Style', emphasis: 'accent' };
const COL_QTY: WireTableColumn = { key: 'qty', label: 'QTY', emphasis: 'metric', className: 'text-right' };

function wireCellClass(emphasis?: WireTableColumn['emphasis']): string {
    switch (emphasis) {
        case 'primary':
            return 'font-mono font-extrabold text-slate-900';
        case 'metric':
            return 'font-extrabold tabular-nums text-sky-800 bg-sky-50/80 text-right';
        case 'good':
            return 'font-extrabold tabular-nums text-emerald-800 bg-emerald-50 text-right';
        case 'repair':
            return 'font-extrabold tabular-nums text-amber-800 bg-amber-50 text-right';
        case 'reject':
            return 'font-extrabold tabular-nums text-rose-800 bg-rose-50 text-right';
        case 'accent':
            return 'font-bold text-slate-800';
        default:
            return 'text-slate-700';
    }
}

function parseTableRowTime(ts: unknown): number {
    if (ts == null || ts === '' || ts === '—') return 0;
    const d = new Date(String(ts));
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

/** Data terbaru di atas: urut timestamp `at` / kolom timestamp, lalu id_bundles. */
function sortTableRowsNewestFirst(rows: CuttingTableRow[]): CuttingTableRow[] {
    return [...rows].sort((a, b) => {
        const tb = parseTableRowTime(b.timestamp);
        const ta = parseTableRowTime(a.timestamp);
        if (tb !== ta) return tb - ta;
        const idB = Number(b.id_bundles) || 0;
        const idA = Number(a.id_bundles) || 0;
        return idB - idA;
    });
}

function WireTable({
    columns,
    rows,
    emptyText,
    onRowClick,
    showRowNo = true,
}: {
    columns: WireTableColumn[];
    rows: CuttingTableRow[];
    emptyText: string;
    onRowClick?: (row: CuttingTableRow) => void;
    showRowNo?: boolean;
}) {
    const colSpan = columns.length + (showRowNo ? 1 : 0);
    return (
        <div
            className="flex-1 min-h-0 max-lg:min-h-[10rem] overflow-x-auto overflow-y-auto rounded-b-xl touch-pan-x touch-pan-y border border-slate-100/80 bg-white"
            onClick={(e) => {
                const target = e.target as HTMLElement | null;
                if (target?.closest('table, thead, tbody, tr, th, td')) {
                    e.stopPropagation();
                }
            }}
        >
            <table className="w-max min-w-full text-left border-collapse bg-white" style={{ fontSize: CUTTING_TABLE_BODY_FS }}>
                <thead className="bg-slate-100/90 sticky top-0 z-[1] backdrop-blur-sm">
                    <tr className="border-b-2 border-slate-200">
                        {showRowNo && (
                            <th
                                className="px-2 py-2 w-9 min-w-[2.25rem] font-bold text-slate-600 uppercase tracking-wide text-center"
                                style={{ fontSize: CUTTING_TABLE_HEADER_FS }}
                            >
                                No
                            </th>
                        )}
                        {columns.map((c) => (
                            <th
                                key={c.key}
                                className={`px-2 py-2 font-bold text-slate-600 uppercase tracking-wide ${c.className ?? ''}`}
                                style={{ fontSize: CUTTING_TABLE_HEADER_FS }}
                            >
                                {c.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={colSpan} className="px-3 py-8 text-center text-slate-400 font-medium">
                                {emptyText}
                            </td>
                        </tr>
                    ) : (
                        rows.map((row, i) => (
                            <tr
                                key={i}
                                className={`border-b border-slate-100 transition-colors ${
                                    i === 0 ? 'bg-sky-50/70' : i % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                                } hover:bg-sky-100/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                                onClick={
                                    onRowClick
                                        ? (e) => {
                                              e.stopPropagation();
                                              onRowClick(row);
                                          }
                                        : undefined
                                }
                                title={onRowClick ? 'Klik untuk lihat detail data' : undefined}
                            >
                                {showRowNo && (
                                    <td className="px-2 py-2 text-center text-slate-500 font-bold tabular-nums w-9 min-w-[2.25rem]">
                                        {rows.length - i}
                                    </td>
                                )}
                                {columns.map((c) => (
                                    <td
                                        key={c.key}
                                        className={`px-2 py-2 whitespace-nowrap ${wireCellClass(c.emphasis)} ${c.className ?? ''}`}
                                        title={String(row[c.key] ?? '')}
                                    >
                                        {row[c.key] ?? '—'}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

function LeftDetailRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
    return (
        <div className="flex items-start gap-2 py-1.5 border-b border-slate-100/90 last:border-0">
            <Icon className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" strokeWidth={2.2} />
            <div className="min-w-0 flex-1">
                <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
                <div className="text-[11px] font-bold text-slate-800 truncate" title={value}>
                    {value}
                </div>
            </div>
        </div>
    );
}

const CuttingProcessSection = memo(function CuttingProcessSection({
    onBundleMetrics,
    filterTablesToToday = false,
    homeDashboardApi = false,
    onHomeDashboardCounts,
}: {
    /** Untuk grafik distribusi: jumlah baris bundle tersimpan */
    onBundleMetrics?: (bundleTableRows: number) => void;
    /** Jika true (dashboard cutting), tabel hanya menampilkan entri yang `at`-nya hari ini (lokal) — diabaikan jika `homeDashboardApi`. */
    filterTablesToToday?: boolean;
    /** Data tabel dari GET `/api/homedashboard` (command center cutting). */
    homeDashboardApi?: boolean;
    /** Untuk donut chart induk: hitungan bundle / QC / supermarket dari API yang sama. */
    onHomeDashboardCounts?: (c: { bundle: number; qc: number; store: number }) => void;
}) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === 'admin';
    const isSupplySewingEnabled = !COMINGSOON_SUPPLY_SEWING || isAdmin;
    const queryClient = useQueryClient();
    const successAudioRef = useRef<HTMLAudioElement | null>(null);
    const errorAudioRef = useRef<HTMLAudioElement | null>(null);
    const filterPanelRef = useRef<HTMLDivElement>(null);

    const [dateFrom, setDateFrom] = useState(ymdTodayLocal);
    const [dateTo, setDateTo] = useState(ymdTodayLocal);
    const [draftFrom, setDraftFrom] = useState(ymdTodayLocal);
    const [draftTo, setDraftTo] = useState(ymdTodayLocal);
    const [filterOpen, setFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [stageStyleFilters, setStageStyleFilters] = useState<Record<StageFilterId, string>>({
        bundle: '',
        qc: '',
        store: '',
        supply: '',
    });

    const setStageStyleFilter = useCallback((stage: StageFilterId, value: string) => {
        setStageStyleFilters((prev) => ({ ...prev, [stage]: value }));
    }, []);

    const [dataViewMode, setDataViewMode] = useState<CuttingDataViewMode>('rekap');
    /** Rekap = GET /api/homedashboard. Tracking = GET /api/homedashboard/tracking. */
    const useRekapData = homeDashboardApi && dataViewMode === 'rekap';
    const useTrackingData = homeDashboardApi && dataViewMode === 'flow';

    const trackingSearchParams = useMemo(() => resolveTrackingSearchParams(searchQuery), [searchQuery]);

    useEffect(() => {
        if (!filterOpen) return;
        const onDoc = (e: MouseEvent) => {
            const el = filterPanelRef.current;
            if (el && !el.contains(e.target as Node)) setFilterOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [filterOpen]);

    const openFilterPanel = () => {
        setDraftFrom(dateFrom);
        setDraftTo(dateTo);
        setFilterOpen(true);
    };

    const applyDateFilter = () => {
        let a = draftFrom;
        let b = draftTo;
        if (a > b) [a, b] = [b, a];
        setDateFrom(a);
        setDateTo(b);
        setFilterOpen(false);
    };

    const resetDateFilterToday = () => {
        const t = ymdTodayLocal();
        setDraftFrom(t);
        setDraftTo(t);
        setDateFrom(t);
        setDateTo(t);
        setFilterOpen(false);
    };

    const dateFilterLabel =
        dateFrom === dateTo ? formatYmdIdLabel(dateFrom) : `${formatYmdIdLabel(dateFrom)} – ${formatYmdIdLabel(dateTo)}`;

    const filterActive =
        searchQuery.trim() !== '' || dateFrom !== ymdTodayLocal() || dateTo !== ymdTodayLocal();

    const scanQuery = useQuery({
        queryKey: QUERY_SCAN,
        queryFn: async () => {
            const r = await getCuttingScanState();
            if (!r.success || !r.data) throw new Error(r.error || 'Gagal state');
            return r.data;
        },
        refetchInterval: 12_000,
    });
    const homeDashQuery = useQuery({
        queryKey: [QUERY_HOME_DASH_BASE, dateFrom, dateTo] as const,
        queryFn: async () => {
            const r = await getHomeDashboard({ tanggalfrom: dateFrom, tanggalto: dateTo });
            if (!r.success || !r.data) throw new Error(r.error || 'Gagal memuat home dashboard');
            return r.data;
        },
        enabled: useRekapData,
        refetchInterval: 12_000,
        placeholderData: (prev) => prev,
    });
    const homeTrackingQuery = useQuery({
        queryKey: [QUERY_HOME_TRACKING_BASE, trackingSearchParams.wo, trackingSearchParams.style] as const,
        queryFn: async () => {
            const r = await getHomeDashboardTracking(trackingSearchParams);
            if (!r.success || !r.data) throw new Error(r.error || 'Gagal memuat home dashboard tracking');
            return r.data;
        },
        enabled: useTrackingData,
        refetchInterval: 12_000,
        placeholderData: (prev) => prev,
    });
    const trackingBuckets = homeTrackingQuery.data?.data;
    const trackingLoadFailed = useTrackingData && homeTrackingQuery.isError;
    const doc = scanQuery.data;
    const displayDoc = useMemo(() => {
        if (!doc) return undefined;
        if (homeDashboardApi) {
            return filterCuttingScanStateByDateRange(doc, dateFrom, dateTo);
        }
        if (filterTablesToToday && dateFrom === ymdTodayLocal() && dateTo === ymdTodayLocal()) {
            return filterCuttingScanStateToLocalToday(doc);
        }
        return filterCuttingScanStateByDateRange(doc, dateFrom, dateTo);
    }, [doc, filterTablesToToday, homeDashboardApi, dateFrom, dateTo]);

    const homeItemsFiltered = useMemo(() => {
        const items = homeDashQuery.data ?? [];
        return items.filter((it) => homeItemInDateRange(it, dateFrom, dateTo));
    }, [homeDashQuery.data, dateFrom, dateTo]);

    useEffect(() => {
        if (!useRekapData || !onHomeDashboardCounts || !homeDashQuery.data) return;
        const items = homeDashQuery.data;
        const qcStatuses = new Set(['GOOD', 'REPAIR', 'REJECT']);
        const storeStatuses = new Set(['IN_SMARKET', 'OUT_SMARKET', 'IN_SUPERMARKET', 'OUT_SUPERMARKET']);
        let bundle = 0;
        let qc = 0;
        let store = 0;
        for (const it of items) {
            const s = normCuttingLastStatus(it.last_status);
            if (s === 'OUTPUT_BUNDLE') bundle += 1;
            else if (qcStatuses.has(s)) qc += 1;
            else if (storeStatuses.has(s)) store += 1;
        }
        onHomeDashboardCounts({ bundle, qc, store });
    }, [useRekapData, homeDashQuery.data, onHomeDashboardCounts]);

    useEffect(() => {
        successAudioRef.current = new Audio(successSoundPath);
        errorAudioRef.current = new Audio(errorSoundPath);
        if (successAudioRef.current) successAudioRef.current.volume = 0.7;
        if (errorAudioRef.current) errorAudioRef.current.volume = 0.7;
        return () => {
            if (successAudioRef.current) {
                successAudioRef.current.pause();
                successAudioRef.current = null;
            }
            if (errorAudioRef.current) {
                errorAudioRef.current.pause();
                errorAudioRef.current = null;
            }
        };
    }, []);

    const playSound = useCallback((type: 'success' | 'error') => {
        try {
            if (type === 'success' && successAudioRef.current) {
                successAudioRef.current.currentTime = 0;
                void successAudioRef.current.play().catch(() => undefined);
            } else if (type === 'error' && errorAudioRef.current) {
                errorAudioRef.current.currentTime = 0;
                void errorAudioRef.current.play().catch(() => undefined);
            }
        } catch {
            // no-op: audio blocked by browser policy
        }
    }, []);

    const [form] = useState({
        workOrder: '',
        style: '',
        buyer: '',
        item: '',
        color: '',
        size: '',
    });
    const [qtyNext] = useState<string>('1');
    const [busyB, setBusyB] = useState(false);

    const [scanningModal, setScanningModal] = useState<ScanningModalId | null>(null);
    const [modalBundleRfid, setModalBundleRfid] = useState('');
    const [modalBundleScanningQty, setModalBundleScanningQty] = useState('1');
    const [modalStoreRfid, setModalStoreRfid] = useState('');
    const [modalStoreMode, setModalStoreMode] = useState<'checkin' | 'checkout' | 'urgent'>('checkin');
    const [modalStoreUrgentLine, setModalStoreUrgentLine] = useState(1);
    const [modalStoreUrgentLocation, setModalStoreUrgentLocation] = useState<'GM 1' | 'GM 2'>('GM 1');
    const [modalSupplyRfid, setModalSupplyRfid] = useState('');
    const [modalSupplyLineNum, setModalSupplyLineNum] = useState(1);
    const [modalSupplyQty, setModalSupplyQty] = useState('1');
    const [modalSupplyLocation, setModalSupplyLocation] = useState<'GM 1' | 'GM 2'>('GM 1');
    const [tableDetail, setTableDetail] = useState<{
        open: boolean;
        title: string;
        subtitle?: string;
        fields: { label: string; value: string }[];
    }>({
        open: false,
        title: '',
        fields: [],
    });

    const operator = useMemo(() => readCuttingOperator(), []);
    const [bundleSessionLog, setBundleSessionLog] = useState<CuttingScanSessionRow[]>([]);
    const [storeSessionLog, setStoreSessionLog] = useState<CuttingScanSessionRow[]>([]);
    const [supplySessionLog, setSupplySessionLog] = useState<CuttingScanSessionRow[]>([]);

    const formatFieldValue = useCallback((v: unknown): string => {
        if (v == null) return '—';
        if (typeof v === 'number' && Number.isFinite(v)) return String(v);
        const s = String(v).trim();
        return s === '' ? '—' : s;
    }, []);

    const openDetailFromRow = useCallback(
        (stage: string, row: CuttingTableRow) => {
            const rfidKey = String(row.rfid ?? '').trim();
            if (useTrackingData && rfidKey) {
                const trackingItem = findTrackingItemForDetail(trackingBuckets, row);
                if (trackingItem) {
                    setTableDetail({
                        open: true,
                        title: `Detail Data — ${stage}`,
                        subtitle: 'Data dari API Home Dashboard Tracking (/api/homedashboard/tracking)',
                        fields: trackingItemToFields(trackingItem, formatFieldValue),
                    });
                    return;
                }
            }
            if (useRekapData && rfidKey) {
                const homeItem = findHomeDashboardItemForDetail(homeDashQuery.data, row);
                if (homeItem) {
                    const fields = homeDashboardItemToFields(homeItem, formatFieldValue);
                    setTableDetail({
                        open: true,
                        title: `Detail Data — ${stage}`,
                        subtitle: 'Data dari API Home Dashboard (/api/homedashboard)',
                        fields,
                    });
                    return;
                }
            }
            const rawTimestamp = formatFieldValue(row.timestamp);
            const timestampDisplay =
                rawTimestamp !== '—' && !Number.isNaN(Date.parse(rawTimestamp))
                    ? new Date(rawTimestamp).toLocaleString('id-ID')
                    : rawTimestamp;
            const fields: { label: string; value: string }[] = [
                { label: 'RFID', value: formatFieldValue(row.rfid) },
                { label: 'WO', value: formatFieldValue(row.wo) },
                { label: 'Style', value: formatFieldValue(row.style) },
                { label: 'Buyer', value: formatFieldValue(row.buyer) },
                { label: 'Item', value: formatFieldValue(row.item) },
                { label: 'Color', value: formatFieldValue(row.color) },
                { label: 'Size', value: formatFieldValue(row.size) },
                { label: 'Qty', value: formatFieldValue(row.qty) },
                { label: 'Good', value: formatFieldValue(row.good) },
                { label: 'Repair', value: formatFieldValue(row.repair) },
                { label: 'Reject', value: formatFieldValue(row.reject) },
                { label: 'Line', value: formatFieldValue(row.line) },
                { label: 'Location (GM)', value: formatFieldValue(row.gm) },
                { label: 'Lokasi', value: formatFieldValue(row.location) },
                { label: 'Scanning At', value: timestampDisplay },
            ].filter((f) => f.value !== '—');
            setTableDetail({
                open: true,
                title: `Detail Data — ${stage}`,
                subtitle: undefined,
                fields,
            });
        },
        [formatFieldValue, useRekapData, useTrackingData, homeDashQuery.data, trackingBuckets]
    );

    useEffect(() => {
        if (scanningModal === 'bundle') setBundleSessionLog([]);
        else if (scanningModal === 'store') {
            setStoreSessionLog([]);
            setModalStoreUrgentLine(1);
            setModalStoreUrgentLocation('GM 1');
            setModalStoreMode('checkin');
        } else if (scanningModal === 'supply') {
            setSupplySessionLog([]);
            setModalSupplyLineNum(1);
            setModalSupplyLocation('GM 1');
        }
    }, [scanningModal]);

    const submitBundle = useCallback(
        async (
            rfid: string,
            qtyArg?: number
        ): Promise<{ ok: true; qty: number; wo: string } | { ok: false; error: string }> => {
            const q =
                qtyArg != null
                    ? Math.max(1, qtyArg)
                    : Math.max(1, parseInt(String(qtyNext).replace(/\D/g, ''), 10) || 1);
            setBusyB(true);
            try {
                const nikOperator = operator.nik && operator.nik !== '—' ? operator.nik : '';
                const res = await inputRfidCuttingBundle({
                    rfid_garment: rfid,
                    rfid_bundles: rfid,
                    nik: nikOperator,
                    wo: form.workOrder || '-',
                    style: form.style || '-',
                    buyer: form.buyer || '-',
                    item: form.item || '-',
                    color: form.color || '-',
                    size: form.size || '-',
                    qty: q,
                });
                if (res.success) {
                    const outputData = (res.data as { data?: Record<string, unknown> } | undefined)?.data;
                    const qtyFromOutputRaw = outputData?.qty_bundles ?? outputData?.qty_output;
                    const qtyFromOutput =
                        qtyFromOutputRaw != null && !Number.isNaN(Number(qtyFromOutputRaw))
                            ? Number(qtyFromOutputRaw)
                            : q;
                    const woFromOutput =
                        outputData?.wo != null && String(outputData.wo).trim() !== ''
                            ? String(outputData.wo).trim()
                            : form.workOrder || '-';
                    void queryClient.invalidateQueries({ queryKey: QUERY_SCAN });
                    return { ok: true, qty: qtyFromOutput, wo: woFromOutput };
                }
                return { ok: false, error: (res as { error?: string }).error || 'Gagal' };
            } catch (e) {
                return { ok: false, error: e instanceof Error ? e.message : 'Gagal' };
            } finally {
                setBusyB(false);
            }
        },
        [form, qtyNext, queryClient, operator.nik]
    );

    const runBundleSubmit = useCallback(async () => {
        const rfid = modalBundleRfid.trim();
        if (!rfid) {
            alert('Scan atau ketik RFID bundle lalu tekan Enter.');
            return;
        }
        const q = Math.max(1, parseInt(String(modalBundleScanningQty).replace(/\D/g, ''), 10) || 1);
        const res = await submitBundle(rfid, q);
        const id = newCuttingScanRowId();
        if (res.ok) {
            playSound('success');
            setBundleSessionLog((prev) => [
                {
                    id,
                    rfid,
                    time: new Date(),
                    ok: true,
                    message: `Qty ${res.qty} Â· WO ${res.wo}`,
                },
                ...prev,
            ]);
        } else {
            playSound('error');
            setBundleSessionLog((prev) => [
                {
                    id,
                    rfid,
                    time: new Date(),
                    ok: false,
                    message: res.error,
                },
                ...prev,
            ]);
        }
        setModalBundleRfid('');
    }, [modalBundleRfid, modalBundleScanningQty, submitBundle, playSound]);

    const [busySt, setBusySt] = useState(false);
    const submitStore = useCallback(
        async (
            rfid: string,
            mode: 'checkin' | 'checkout' | 'urgent',
            meta?: { line: number; location: 'GM 1' | 'GM 2' }
        ): Promise<{ ok: true } | { ok: false; error: string }> => {
            setBusySt(true);
            try {
                const body: Parameters<typeof postCuttingStoreScan>[0] = { rfid_garment: rfid, mode };
                if ((mode === 'urgent' || mode === 'checkout') && meta) {
                    body.line = meta.line;
                    body.location = meta.location;
                }
                const res = await postCuttingStoreScan(body);
                if (!res.success) return { ok: false, error: res.error || 'Gagal' };
                void queryClient.invalidateQueries({ queryKey: QUERY_SCAN });
                return { ok: true };
            } catch (e) {
                return { ok: false, error: e instanceof Error ? e.message : 'Gagal' };
            } finally {
                setBusySt(false);
            }
        },
        [queryClient]
    );

    const runStoreSubmit = useCallback(async () => {
        const v = modalStoreRfid.trim();
        if (!v) {
            alert('Scan atau ketik RFID lalu tekan Enter.');
            return;
        }
        let res: { ok: true } | { ok: false; error: string };
        let modeLabel: string;
        if (modalStoreMode === 'urgent' || modalStoreMode === 'checkout') {
            const loc = modalStoreUrgentLocation;
            if (loc !== 'GM 1' && loc !== 'GM 2') {
                alert('Pilih Location GM 1 atau GM 2.');
                return;
            }
            const lineNum = Math.max(1, Math.min(999, Math.floor(Number(modalStoreUrgentLine))));
            if (!Number.isFinite(lineNum) || lineNum < 1) {
                alert('Line minimal 1.');
                return;
            }
            const meta = { line: lineNum, location: loc };
            if (modalStoreMode === 'urgent') {
                modeLabel = `Supply Urgent Â· Line ${lineNum} Â· ${loc}`;
                res = await submitStore(v, 'urgent', meta);
            } else {
                modeLabel = `Check Out Â· Line ${lineNum} Â· ${loc}`;
                res = await submitStore(v, 'checkout', meta);
            }
        } else {
            modeLabel = 'Check In';
            res = await submitStore(v, 'checkin');
        }
        const id = newCuttingScanRowId();
        if (res.ok) {
            playSound('success');
            setStoreSessionLog((prev) => [{ id, rfid: v, time: new Date(), ok: true, message: modeLabel }, ...prev]);
        } else {
            playSound('error');
            setStoreSessionLog((prev) => [
                {
                    id,
                    rfid: v,
                    time: new Date(),
                    ok: false,
                    message: res.error,
                },
                ...prev,
            ]);
        }
        setModalStoreRfid('');
    }, [modalStoreRfid, modalStoreMode, modalStoreUrgentLine, modalStoreUrgentLocation, submitStore, playSound]);

    const [busySu, setBusySu] = useState(false);
    const submitSupply = useCallback(
        async (
            rfid: string,
            lineNum: number,
            qty: number,
            location: 'GM 1' | 'GM 2',
            nik: string
        ): Promise<{ ok: true; message?: string } | { ok: false; error: string }> => {
            setBusySu(true);
            try {
                const res = await postCuttingSupplySewingScan({
                    rfid_bundles: rfid,
                    nik,
                    line: lineNum,
                    location,
                    qty_receive: String(qty),
                });
                if (!res.success) return { ok: false, error: res.error || 'Gagal proses supply sewing' };
                void queryClient.invalidateQueries({ queryKey: QUERY_SCAN });
                if (homeDashboardApi) void queryClient.invalidateQueries({ queryKey: QUERY_HOME_DASH_BASE });
                return { ok: true, message: res.data?.message };
            } catch (e) {
                return { ok: false, error: e instanceof Error ? e.message : 'Gagal' };
            } finally {
                setBusySu(false);
            }
        },
        [queryClient, homeDashboardApi]
    );

    const runSupplySubmit = useCallback(async () => {
        const v = modalSupplyRfid.trim();
        if (!v) {
            alert('Scan atau ketik RFID lalu tekan Enter.');
            return;
        }
        const loc = modalSupplyLocation;
        if (loc !== 'GM 1' && loc !== 'GM 2') {
            alert('Pilih Location GM 1 atau GM 2.');
            return;
        }
        const lineNum = Math.max(1, Math.min(999, Math.floor(Number(modalSupplyLineNum))));
        if (!Number.isFinite(lineNum) || lineNum < 1) {
            alert('Line minimal 1.');
            return;
        }
        const qtyRaw = modalSupplyQty.trim();
        if (!qtyRaw) {
            alert('Isi Quantity terlebih dahulu.');
            return;
        }
        const qtyNum = Math.floor(Number(qtyRaw));
        if (!Number.isFinite(qtyNum) || qtyNum < 1 || qtyNum > 9999) {
            alert('Quantity harus angka 1–9999.');
            return;
        }
        const nik = operator.nik && operator.nik !== '—' ? operator.nik.trim() : '';
        if (!nik) {
            alert('NIK operator tidak ditemukan. Silakan login ulang.');
            return;
        }
        const lineStr = `L${String(lineNum).padStart(2, '0')}`;
        const branchStr = loc.replace(/\s+/g, '');
        const res = await submitSupply(v, lineNum, qtyNum, loc, nik);
        const id = newCuttingScanRowId();
        if (res.ok) {
            playSound('success');
            setSupplySessionLog((prev) => [
                {
                    id,
                    rfid: v,
                    time: new Date(),
                    ok: true,
                    message: res.message || `${lineStr} · ${branchStr} · Qty ${qtyNum}`,
                },
                ...prev,
            ]);
        } else {
            playSound('error');
            setSupplySessionLog((prev) => [
                {
                    id,
                    rfid: v,
                    time: new Date(),
                    ok: false,
                    message: res.error,
                },
                ...prev,
            ]);
        }
        setModalSupplyRfid('');
    }, [modalSupplyRfid, modalSupplyLineNum, modalSupplyQty, modalSupplyLocation, operator.nik, submitSupply, playSound]);

    const qcRows = useMemo(() => {
        if (homeDashboardApi && useTrackingData) {
            const items = trackingBuckets?.qc ?? [];
            return items.map(mapTrackingItemToQcRow);
        }
        if (homeDashboardApi) {
            if (useRekapData) {
                if (!homeItemsFiltered.length) return [];
                const qcStatuses = new Set(['GOOD', 'REPAIR', 'REJECT']);
                return homeItemsFiltered
                    .filter((it) => qcStatuses.has(normCuttingLastStatus(it.last_status)))
                    .map(mapHomeItemToQcRow);
            }
            return [];
        }
        return (displayDoc?.qc.history ?? []).map((h) => ({
            rfid: h.rfid_garment,
            qty: (h.good ?? 0) + (h.repair ?? 0) + (h.reject ?? 0),
            good: h.good ?? 0,
            repair: h.repair ?? 0,
            reject: h.reject ?? 0,
            wo: h.wo ?? '—',
            style: h.style ?? '—',
            buyer: h.buyer ?? '—',
            item: h.item ?? '—',
            color: h.color ?? '—',
            size: h.size ?? '—',
            waktu: formatRowTime(h.at),
            location: h.location ?? 'quality_control',
            timestamp: h.at ?? '—',
        }));
    }, [homeDashboardApi, useTrackingData, useRekapData, trackingBuckets, homeItemsFiltered, displayDoc, dateFrom, dateTo]);

    const filteredQcRows = useMemo(
        () =>
            applyStageTableFilters(
                qcRows.map((r) => ({
                    ...r,
                    qty: String(r.qty),
                    good: String(r.good),
                    repair: String(r.repair),
                    reject: String(r.reject),
                })),
                stageStyleFilters.qc,
                searchQuery,
            ),
        [qcRows, searchQuery, stageStyleFilters.qc],
    );

    const totalQcServerCount = useMemo(
        () =>
            useTrackingData
                ? (homeTrackingQuery.data?.count?.qc ?? qcRows.length)
                : useRekapData
                  ? qcRows.length
                  : (displayDoc?.qc.history?.length ?? qcRows.length),
        [useTrackingData, useRekapData, homeTrackingQuery.data?.count?.qc, qcRows.length, displayDoc?.qc.history?.length],
    );

    const bundleRows = useMemo(() => {
        if (homeDashboardApi && useTrackingData) {
            const items = trackingBuckets?.bundle ?? [];
            return items.map(mapTrackingItemToBundleRow);
        }
        if (homeDashboardApi) {
            if (!useRekapData) return [];
            if (!homeItemsFiltered.length) return [];
            return homeItemsFiltered
                .filter((it) => normCuttingLastStatus(it.last_status) === 'OUTPUT_BUNDLE')
                .map(mapHomeItemToBundleRow);
        }
        return (displayDoc?.bundle?.history ?? []).map((h) => ({
            rfid: h.rfid_garment,
            wo: h.wo ?? '—',
            qty: Math.max(1, Number(h.qty ?? 1)),
            style: h.style ?? '—',
            buyer: h.buyer ?? '—',
            item: h.item ?? '—',
            color: h.color ?? '—',
            size: h.size ?? '—',
            waktu: formatRowTime(h.at),
            location: h.location ?? 'bundle',
            timestamp: h.at ?? '—',
        }));
    }, [homeDashboardApi, useTrackingData, useRekapData, trackingBuckets, homeItemsFiltered, displayDoc, dateFrom, dateTo]);

    const filteredBundleRows = useMemo(
        () => applyStageTableFilters(bundleRows.map((r) => ({ ...r, qty: String(r.qty) })), stageStyleFilters.bundle, searchQuery),
        [bundleRows, searchQuery, stageStyleFilters.bundle],
    );

    useEffect(() => {
        onBundleMetrics?.(bundleRows.length);
    }, [bundleRows.length, onBundleMetrics]);

    const storeRows = useMemo(() => {
        if (homeDashboardApi && useTrackingData) {
            const items = trackingBuckets?.smarket ?? [];
            return items.map(mapTrackingItemToStoreRow);
        }
        if (homeDashboardApi) {
            if (!useRekapData) return [];
            if (!homeItemsFiltered.length) return [];
            const storeStatuses = new Set(['IN_SMARKET', 'OUT_SMARKET', 'IN_SUPERMARKET', 'OUT_SUPERMARKET']);
            return homeItemsFiltered
                .filter((it) => storeStatuses.has(normCuttingLastStatus(it.last_status)))
                .map(mapHomeItemToStoreRow);
        }
        return (displayDoc?.store.history ?? []).map((h) => {
            const locRaw = (h.location ?? '').trim();
            const isCheckout = h.checkout === true || locRaw === 'checkout';
            const lokasi = isCheckout
                ? locRaw === 'checkout' || !locRaw
                    ? 'Check-out'
                    : `Check-out · ${locRaw}`
                : locRaw === 'supermarket' || locRaw === ''
                  ? 'Supermarket'
                  : locRaw;
            const lineStr = h.line != null && String(h.line).trim() !== '' ? String(h.line) : '—';
            return {
                rfid: h.rfid_garment,
                wo: h.wo ?? '—',
                qty: Math.max(1, Number(h.qty ?? 1)),
                line: lineStr,
                lokasi,
                style: h.style ?? '—',
                buyer: h.buyer ?? '—',
                item: h.item ?? '—',
                color: h.color ?? '—',
                size: h.size ?? '—',
                waktu: formatRowTime(h.at),
                location: h.location ?? 'supermarket',
                timestamp: h.at ?? '—',
            };
        });
    }, [homeDashboardApi, useTrackingData, useRekapData, trackingBuckets, homeItemsFiltered, displayDoc, dateFrom, dateTo]);

    const filteredStoreRows = useMemo(
        () => applyStageTableFilters(storeRows.map((r) => ({ ...r, qty: String(r.qty) })), stageStyleFilters.store, searchQuery),
        [storeRows, searchQuery, stageStyleFilters.store],
    );

    const supplyRows = useMemo(() => {
        if (homeDashboardApi && useTrackingData) {
            const items = trackingBuckets?.supply_sewing ?? [];
            return items.map(mapTrackingItemToSupplyRow);
        }
        if (homeDashboardApi && !useRekapData) return [];
        return (displayDoc?.supply.history ?? []).map((h) => ({
            rfid: h.rfid_garment,
            wo: h.wo ?? '—',
            line: h.line ?? '—',
            gm: h.gm ?? '—',
            qty: Math.max(1, Number(h.qty ?? 1)),
            style: h.style ?? '—',
            buyer: h.buyer ?? '—',
            item: h.item ?? '—',
            color: h.color ?? '—',
            size: h.size ?? '—',
            waktu: formatRowTime(h.at),
            location: h.location ?? 'supply_sewing',
            timestamp: h.at ?? '—',
        }));
    }, [displayDoc, homeDashboardApi, useTrackingData, useRekapData, trackingBuckets, dateFrom, dateTo]);

    const filteredSupplyRows = useMemo(
        () => applyStageTableFilters(supplyRows.map((r) => ({ ...r, qty: String(r.qty) })), stageStyleFilters.supply, searchQuery),
        [supplyRows, searchQuery, stageStyleFilters.supply],
    );

    const bundleStyleOptions = useMemo(() => uniqueStylesFromRows(bundleRows.map((r) => ({ ...r, qty: String(r.qty) }))), [bundleRows]);
    const qcStyleOptions = useMemo(() => uniqueStylesFromRows(qcRows), [qcRows]);
    const storeStyleOptions = useMemo(() => uniqueStylesFromRows(storeRows.map((r) => ({ ...r, qty: String(r.qty) }))), [storeRows]);
    const supplyStyleOptions = useMemo(() => uniqueStylesFromRows(supplyRows), [supplyRows]);

    const toolbarSummary = useMemo(() => {
        const totalBundleAll =
            filteredBundleRows.length +
            filteredQcRows.length +
            filteredStoreRows.length +
            filteredSupplyRows.length;
        const allRows: CuttingTableRow[] = [
            ...filteredBundleRows,
            ...filteredQcRows,
            ...filteredStoreRows,
            ...filteredSupplyRows,
        ];
        return {
            totalBundleAll,
            topStyle: topFieldByCount(allRows, 'style'),
            topWo: topFieldByCount(allRows, 'wo'),
        };
    }, [filteredBundleRows, filteredQcRows, filteredStoreRows, filteredSupplyRows]);

    const invalidate = useCallback(() => {
        void queryClient.invalidateQueries({ queryKey: QUERY_SCAN });
        if (homeDashboardApi) {
            void queryClient.invalidateQueries({ queryKey: [QUERY_HOME_DASH_BASE] });
            void queryClient.invalidateQueries({ queryKey: [QUERY_HOME_TRACKING_BASE] });
        }
    }, [queryClient, homeDashboardApi]);

    const bundleLeftColumn = useMemo(() => {
        const lastOk = bundleSessionLog.find((s) => s.ok);
        const latestBundleRow = bundleRows[0];
        const rfidShow = lastOk?.rfid ?? bundleRows[0]?.rfid ?? '—';
        const ridB = lastOk?.rfid ?? bundleRows[0]?.rfid ?? '';
        const bundleRowForWo = bundleRows.find((r) => r.rfid === ridB) ?? bundleRows[0];
        const woShow =
            bundleRowForWo?.wo != null && String(bundleRowForWo.wo).trim() !== '' ? String(bundleRowForWo.wo) : '—';
        const styleShow = latestBundleRow?.style ?? '—';
        const itemShow = latestBundleRow?.item ?? '—';
        const buyerShow = latestBundleRow?.buyer ?? '—';
        const colorShow = latestBundleRow?.color ?? '—';
        const sizeShow = latestBundleRow?.size ?? '—';
        const rowTimestamp =
            latestBundleRow?.timestamp && !Number.isNaN(Date.parse(String(latestBundleRow.timestamp)))
                ? new Date(String(latestBundleRow.timestamp))
                : null;
        const t = bundleSessionLog.find((s) => s.ok)?.time ?? bundleSessionLog[0]?.time ?? rowTimestamp;
        const timeStr = t
            ? t.toLocaleString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
              })
            : '—';
        return (
            <>
                <div className="rounded-xl border-2 border-emerald-200/90 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 text-emerald-700">
                            <User className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Operator</span>
                        </div>
                        <span className="text-[9px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full shrink-0">
                            Check In
                        </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 leading-tight break-words">{operator.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">NIK: {operator.nik}</div>
                </div>

                <div className="rounded-xl border-2 border-sky-200 bg-gradient-to-br from-sky-50/90 to-white p-3 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-sky-600 mb-1">Ringkasan</div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none tabular-nums">{bundleRows.length}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Total {bundleRows.length} bundle tersimpan</div>
                    <div className="text-[11px] font-bold text-sky-700 mt-2 truncate" title={woShow || undefined}>
                        WO: {woShow}
                    </div>
                </div>

                <div className="rounded-xl border border-sky-200 overflow-hidden bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-2 px-2.5 py-2 bg-gradient-to-r from-sky-600 to-sky-500 text-white">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <ClipboardList className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
                            <span className="text-[10px] font-bold truncate">Detail Data Terakhir</span>
                        </div>
                        <span className="text-[9px] font-mono shrink-0 opacity-95">{timeStr}</span>
                    </div>
                    <div className="p-2.5">
                        <LeftDetailRow icon={Hash} label="# RFID" value={rfidShow} />
                        <LeftDetailRow icon={Tag} label="WO" value={woShow} />
                        <LeftDetailRow icon={Box} label="STYLE" value={styleShow} />
                        <LeftDetailRow icon={PackagePlus} label="ITEM" value={itemShow} />
                        <LeftDetailRow icon={Users} label="BUYER" value={buyerShow} />
                        <LeftDetailRow icon={Palette} label="COLOR" value={colorShow} />
                        <LeftDetailRow icon={Ruler} label="SIZE" value={sizeShow} />
                    </div>
                </div>
            </>
        );
    }, [operator, bundleRows, bundleSessionLog]);

    const storeLeftColumn = useMemo(() => {
        const lastOk = storeSessionLog.find((s) => s.ok);
        const rfidShow = lastOk?.rfid ?? storeRows[0]?.rfid ?? '—';
        const ridSt = lastOk?.rfid ?? storeRows[0]?.rfid ?? '';
        const storeRowForDetail = storeRows.find((r) => r.rfid === ridSt) ?? storeRows[0];
        const woShowSt =
            storeRowForDetail?.wo != null && String(storeRowForDetail.wo).trim() !== '' ? String(storeRowForDetail.wo) : '—';
        const t = storeSessionLog.find((s) => s.ok)?.time ?? storeSessionLog[0]?.time;
        const timeStr = t
            ? t.toLocaleString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
              })
            : '—';
        const totalSt = useRekapData ? storeRows.length : (displayDoc?.store.history?.length ?? storeRows.length);
        return (
            <>
                <div className="rounded-xl border-2 border-amber-200/90 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 text-amber-800">
                            <User className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Operator</span>
                        </div>
                        <span className="text-[9px] font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full shrink-0">Supermarket</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 leading-tight break-words">{operator.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">NIK: {operator.nik}</div>
                </div>

                <div className="rounded-xl border-2 border-sky-200 bg-gradient-to-br from-sky-50/90 to-white p-3 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-sky-600 mb-1">Ringkasan</div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none tabular-nums">{totalSt}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Total {totalSt} scan supermarket (server)</div>
                </div>

                <div className="rounded-xl border border-sky-200 overflow-hidden bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-2 px-2.5 py-2 bg-gradient-to-r from-sky-600 to-sky-500 text-white">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <ClipboardList className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
                            <span className="text-[10px] font-bold truncate">Detail Data Terakhir</span>
                        </div>
                        <span className="text-[9px] font-mono shrink-0 opacity-95">{timeStr}</span>
                    </div>
                    <div className="p-2.5">
                        <LeftDetailRow icon={Hash} label="# RFID" value={rfidShow} />
                        <LeftDetailRow icon={Tag} label="WO" value={woShowSt} />
                        <LeftDetailRow icon={Warehouse} label="STATUS" value="Check-in Supermarket" />
                    </div>
                </div>
            </>
        );
    }, [operator, storeSessionLog, storeRows, displayDoc?.store.history?.length, useRekapData]);

    const supplyLeftColumn = useMemo(() => {
        const lastOk = supplySessionLog.find((s) => s.ok);
        const rfidShow = lastOk?.rfid ?? supplyRows[0]?.rfid ?? '—';
        const ridSu = lastOk?.rfid ?? supplyRows[0]?.rfid ?? '';
        const supplyRowForDetail = supplyRows.find((r) => r.rfid === ridSu) ?? supplyRows[0];
        const woShowSu =
            supplyRowForDetail?.wo != null && String(supplyRowForDetail.wo).trim() !== ''
                ? String(supplyRowForDetail.wo)
                : '—';
        const lineShow =
            supplyRowForDetail?.line != null && String(supplyRowForDetail.line).trim() !== ''
                ? String(supplyRowForDetail.line)
                : '—';
        const gmShow =
            supplyRowForDetail?.gm != null && String(supplyRowForDetail.gm).trim() !== '' ? String(supplyRowForDetail.gm) : '—';
        const t = supplySessionLog.find((s) => s.ok)?.time ?? supplySessionLog[0]?.time;
        const timeStr = t
            ? t.toLocaleString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
              })
            : '—';
        const totalSu = displayDoc?.supply.history?.length ?? supplyRows.length;
        return (
            <>
                <div className="rounded-xl border-2 border-violet-200/90 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 text-violet-800">
                            <User className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Operator</span>
                        </div>
                        <span className="text-[9px] font-bold text-white bg-violet-500 px-2 py-0.5 rounded-full shrink-0">Terima Sewing</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 leading-tight break-words">{operator.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">NIK: {operator.nik}</div>
                </div>

                <div className="rounded-xl border-2 border-sky-200 bg-gradient-to-br from-sky-50/90 to-white p-3 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-sky-600 mb-1">Ringkasan</div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none tabular-nums">{totalSu}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Total {totalSu} scan supply sewing (server)</div>
                </div>

                <div className="rounded-xl border border-sky-200 overflow-hidden bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-2 px-2.5 py-2 bg-gradient-to-r from-sky-600 to-sky-500 text-white">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <ClipboardList className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
                            <span className="text-[10px] font-bold truncate">Detail Data Terakhir</span>
                        </div>
                        <span className="text-[9px] font-mono shrink-0 opacity-95">{timeStr}</span>
                    </div>
                    <div className="p-2.5">
                        <LeftDetailRow icon={Hash} label="# RFID" value={rfidShow} />
                        <LeftDetailRow icon={Tag} label="WO" value={woShowSu} />
                        <LeftDetailRow icon={Truck} label="LINE (REF)" value={lineShow} />
                        <LeftDetailRow icon={Warehouse} label="LOCATION" value={gmShow} />
                    </div>
                </div>
            </>
        );
    }, [operator, supplySessionLog, supplyRows, displayDoc?.supply.history?.length]);

    // Form metadata Bundle disembunyikan sesuai permintaan UI.


    const supplyFormSection = (
        <div
            className="rounded-lg border border-violet-200 bg-violet-50/60 px-2.5 py-2 space-y-2.5 min-w-0"
            style={{ fontSize: STORE_FORM_FS }}
        >
            <div className="font-semibold text-violet-900" style={{ fontSize: STORE_FORM_LABEL_FS }}>
                Terima Sewing — isi sebelum scan
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 min-w-0">
                <div className="min-w-0">
                    <span className="block font-semibold text-slate-700 mb-1" style={{ fontSize: STORE_FORM_LABEL_FS }}>
                        Location
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {(['GM 1', 'GM 2'] as const).map((opt) => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => setModalSupplyLocation(opt)}
                                className={`flex-1 min-w-[5.5rem] rounded-lg border px-2 py-1.5 font-semibold transition-colors ${
                                    modalSupplyLocation === opt
                                        ? 'border-violet-500 bg-violet-200 text-violet-950'
                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="min-w-0">
                    <span className="block font-semibold text-slate-700 mb-1" style={{ fontSize: STORE_FORM_LABEL_FS }}>
                        Line
                    </span>
                    <div className="flex items-center justify-center gap-1.5 max-w-[14rem]">
                        <button
                            type="button"
                            aria-label="Kurangi line"
                            onClick={() => setModalSupplyLineNum((n) => Math.max(1, n - 1))}
                            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg border-2 border-violet-300 bg-white text-violet-900 hover:bg-violet-100 disabled:opacity-50"
                            disabled={modalSupplyLineNum <= 1}
                        >
                            <Minus className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                        <div
                            className="min-w-[3rem] flex-1 text-center tabular-nums font-extrabold text-slate-900 rounded-lg border border-violet-200 bg-white py-1.5 px-2"
                            style={{ fontSize: 'clamp(1rem, 0.85rem + 0.55vmin, 1.35rem)' }}
                        >
                            {modalSupplyLineNum}
                        </div>
                        <button
                            type="button"
                            aria-label="Tambah line"
                            onClick={() => setModalSupplyLineNum((n) => Math.min(999, n + 1))}
                            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg border-2 border-violet-300 bg-white text-violet-900 hover:bg-violet-100 disabled:opacity-50"
                            disabled={modalSupplyLineNum >= 999}
                        >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
                <div className="min-w-0">
                    <span className="block font-semibold text-slate-700 mb-1" style={{ fontSize: STORE_FORM_LABEL_FS }}>
                        Quantity
                    </span>
                    <input
                        type="number"
                        min={1}
                        max={9999}
                        inputMode="numeric"
                        value={modalSupplyQty}
                        onChange={(e) => setModalSupplyQty(e.target.value)}
                        placeholder="24"
                        className="w-full max-w-[14rem] rounded-lg border border-violet-200 bg-white px-2.5 py-2 tabular-nums font-bold text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                        style={{ fontSize: 'clamp(1rem, 0.85rem + 0.55vmin, 1.35rem)' }}
                    />
                </div>
            </div>
        </div>
    );

    const storeFormSection = (
        <div className="space-y-2 min-w-0" style={{ fontSize: STORE_FORM_FS }}>
            <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-1.5 min-w-0">
                <button
                    type="button"
                    onClick={() => setModalStoreMode('checkin')}
                    className={`rounded-lg border px-2 py-1.5 font-semibold transition-colors min-w-0 ${
                        modalStoreMode === 'checkin'
                            ? 'border-amber-400 bg-amber-100 text-amber-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    Check In
                </button>
                <button
                    type="button"
                    onClick={() => setModalStoreMode('checkout')}
                    className={`rounded-lg border px-2 py-1.5 font-semibold transition-colors min-w-0 ${
                        modalStoreMode === 'checkout'
                            ? 'border-amber-400 bg-amber-100 text-amber-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    Check Out
                </button>
                <button
                    type="button"
                    onClick={() => setModalStoreMode('urgent')}
                    className={`rounded-lg border px-2 py-1.5 font-semibold transition-colors min-w-0 ${
                        modalStoreMode === 'urgent'
                            ? 'border-amber-400 bg-amber-100 text-amber-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    Supply Urgent
                </button>
            </div>

            {modalStoreMode === 'urgent' || modalStoreMode === 'checkout' ? (
                <div
                    className="rounded-lg border border-amber-200 bg-amber-50/60 px-2.5 py-2 space-y-2.5 min-w-0"
                    style={{ fontSize: STORE_FORM_FS }}
                >
                    <div className="font-semibold text-amber-900" style={{ fontSize: STORE_FORM_LABEL_FS }}>
                        {modalStoreMode === 'checkout' ? 'Check Out — isi sebelum scan' : 'Supply Urgent — isi sebelum scan'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                        <div className="min-w-0">
                            <span className="block font-semibold text-slate-700 mb-1" style={{ fontSize: STORE_FORM_LABEL_FS }}>
                                Location
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {(['GM 1', 'GM 2'] as const).map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setModalStoreUrgentLocation(opt)}
                                        className={`flex-1 min-w-[5.5rem] rounded-lg border px-2 py-1.5 font-semibold transition-colors ${
                                            modalStoreUrgentLocation === opt
                                                ? 'border-amber-500 bg-amber-200 text-amber-950'
                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="min-w-0">
                            <span className="block font-semibold text-slate-700 mb-1" style={{ fontSize: STORE_FORM_LABEL_FS }}>
                                Line
                            </span>
                            <div className="flex items-center justify-center gap-1.5 max-w-[14rem]">
                                <button
                                    type="button"
                                    aria-label="Kurangi line"
                                    onClick={() => setModalStoreUrgentLine((n) => Math.max(1, n - 1))}
                                    className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg border-2 border-amber-300 bg-white text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                                    disabled={modalStoreUrgentLine <= 1}
                                >
                                    <Minus className="h-4 w-4" strokeWidth={2.5} />
                                </button>
                                <div
                                    className="min-w-[3rem] flex-1 text-center tabular-nums font-extrabold text-slate-900 rounded-lg border border-amber-200 bg-white py-1.5 px-2"
                                    style={{ fontSize: 'clamp(1rem, 0.85rem + 0.55vmin, 1.35rem)' }}
                                >
                                    {modalStoreUrgentLine}
                                </div>
                                <button
                                    type="button"
                                    aria-label="Tambah line"
                                    onClick={() => setModalStoreUrgentLine((n) => Math.min(999, n + 1))}
                                    className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg border-2 border-amber-300 bg-white text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                                    disabled={modalStoreUrgentLine >= 999}
                                >
                                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );

    return (
        <div className="flex flex-col flex-1 min-h-0 min-w-0 h-full gap-2">
            <div className="shrink-0 flex flex-nowrap items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-gradient-to-r from-slate-50 to-white px-2.5 py-2 shadow-sm overflow-x-auto">
                <div className="flex flex-nowrap items-center gap-2 min-w-0 shrink-0">
                    <ToolbarMiniCard
                        label="Total All Bundle"
                        value={toolbarSummary.totalBundleAll}
                        valueClassName="text-violet-700"
                        title="Jumlah total baris Bundle + QC + Supermarket + Terima Sewing"
                    />
                    <ToolbarMiniCard
                        label="Style Terbanyak"
                        value={toolbarSummary.topStyle}
                        valueClassName="text-sky-700"
                        title="Style dengan jumlah kemunculan terbanyak"
                    />
                    <ToolbarMiniCard
                        label="WO Terbanyak"
                        value={toolbarSummary.topWo}
                        valueClassName="text-emerald-700"
                        title="Work Order dengan jumlah kemunculan terbanyak"
                    />
                </div>

                <div className="flex flex-nowrap items-center gap-2 ml-auto shrink-0 justify-end">
                    {homeDashboardApi ? (
                        <DataViewSwitch value={dataViewMode} onChange={setDataViewMode} />
                    ) : null}
                    <div className={`relative w-[9.5rem] sm:w-[10.5rem] ${TOOLBAR_CTRL_H}`}>
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari WO / Style"
                            className={`w-full rounded-md border bg-white pl-7 pr-7 text-xs font-medium text-slate-800 shadow-inner placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 ${TOOLBAR_CTRL_H} ${
                                searchQuery.trim() ? 'border-sky-400 ring-1 ring-sky-200/70' : 'border-slate-200'
                            }`}
                        />
                        {searchQuery ? (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Hapus pencarian"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        ) : null}
                    </div>

                    <div className="relative" ref={filterPanelRef}>
                        <button
                            type="button"
                            onClick={() => (filterOpen ? setFilterOpen(false) : openFilterPanel())}
                            className={`relative inline-flex items-center gap-1.5 rounded-md border bg-white px-2.5 text-[0.7rem] font-bold shadow-sm ring-1 transition hover:bg-sky-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${TOOLBAR_CTRL_H} ${
                                filterActive
                                    ? 'border-sky-400 text-sky-900 ring-sky-200/80'
                                    : 'border-sky-200/90 text-sky-800 ring-slate-900/5 hover:border-sky-400'
                            }`}
                            title={filterActive ? 'Filter aktif — klik untuk ubah tanggal' : 'Filter rentang tanggal semua data dashboard'}
                            aria-label={filterActive ? 'Filter aktif' : 'Filter tanggal'}
                        >
                            {filterActive ? (
                                <span
                                    className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white"
                                    aria-hidden
                                />
                            ) : null}
                            <CalendarRange className="h-4 w-4 text-sky-600 shrink-0" aria-hidden />
                            <span className="whitespace-nowrap">{dateFilterLabel}</span>
                        </button>
                    {filterOpen ? (
                        <div
                            className="absolute right-0 top-full z-[60] mt-1.5 w-[min(100vw-1.5rem,17.5rem)] rounded-xl border border-slate-200/90 bg-white p-3 shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5"
                            role="dialog"
                            aria-label="Filter tanggal dashboard cutting"
                        >
                            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-2">Rentang tanggal</p>
                            <div className="space-y-2">
                                <label className="block">
                                    <span className="text-[0.7rem] font-medium text-slate-600">Dari</span>
                                    <input
                                        type="date"
                                        value={draftFrom}
                                        onChange={(e) => setDraftFrom(e.target.value)}
                                        className="mt-0.5 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1.5 text-sm text-slate-800 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[0.7rem] font-medium text-slate-600">Sampai</span>
                                    <input
                                        type="date"
                                        value={draftTo}
                                        onChange={(e) => setDraftTo(e.target.value)}
                                        className="mt-0.5 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1.5 text-sm text-slate-800 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                </label>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={applyDateFilter}
                                    className="flex-1 min-w-[5rem] rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
                                >
                                    Terapkan
                                </button>
                                <button
                                    type="button"
                                    onClick={resetDateFilterToday}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                >
                                    Hari ini
                                </button>
                            </div>
                        </div>
                    ) : null}
                    </div>
                </div>
            </div>

            <div
                className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 flex-1 min-h-0 min-w-0 max-lg:auto-rows-min"
                style={{ gap: 'clamp(0.5rem, 0.8vw + 0.25rem, 0.875rem)' }}
            >
            <ChartCard
                title={
                    <CuttingStageHeader
                        title="Bundle"
                        count={filteredBundleRows.length}
                        countClassName="bg-emerald-600"
                        action={
                            <StageCardActions
                                accent="emerald"
                                styleValue={stageStyleFilters.bundle}
                                styleOptions={bundleStyleOptions}
                                onStyleChange={(v) => setStageStyleFilter('bundle', v)}
                                scanButton={
                                    <ScanningButton
                                        accent="emerald"
                                        onClick={() => {
                                            setModalBundleScanningQty(qtyNext);
                                            setScanningModal('bundle');
                                        }}
                                    />
                                }
                            />
                        }
                    />
                }
                icon={PackagePlus}
                iconColor="#047857"
                iconBgColor="#d1fae5"
                onClick={() => navigate('/dashboard-bundle-cutting')}
                className={`${CUTTING_STAGE_CHART_CARD_CLASS} !border-emerald-200/90`}
            >
                <WireTable
                    columns={[
                        COL_WAKTU_SCAN,
                        COL_RFID,
                        COL_WO,
                        COL_STYLE,
                        ...GARMENT_TAIL_COLUMNS,
                        COL_QTY,
                    ]}
                    rows={filteredBundleRows}
                    emptyText={cuttingTableEmptyText(searchQuery, stageStyleFilters.bundle, trackingLoadFailed)}
                    onRowClick={(row) => openDetailFromRow('Bundle', row)}
                />
            </ChartCard>

            <ChartCard
                title={
                    <CuttingStageHeader
                        title="Quality Control"
                        count={filteredQcRows.length}
                        countClassName="bg-sky-600"
                        action={
                            <StageCardActions
                                accent="sky"
                                styleValue={stageStyleFilters.qc}
                                styleOptions={qcStyleOptions}
                                onStyleChange={(v) => setStageStyleFilter('qc', v)}
                                scanButton={<ScanningButton accent="sky" onClick={() => setScanningModal('qc')} />}
                            />
                        }
                    />
                }
                icon={ClipboardCheck}
                iconColor="#0369a1"
                iconBgColor="#e0f2fe"
                onClick={() => navigate('/dashboard-qc-cutting')}
                className={`${CUTTING_STAGE_CHART_CARD_CLASS} !border-sky-200/90`}
            >
                <WireTable
                    columns={[
                        COL_WAKTU_SCAN,
                        COL_RFID,
                        COL_WO,
                        COL_STYLE,
                        COL_QTY,
                        { key: 'good', label: 'Good', emphasis: 'good', className: 'text-right' },
                        { key: 'repair', label: 'Repair', emphasis: 'repair', className: 'text-right' },
                        { key: 'reject', label: 'Reject', emphasis: 'reject', className: 'text-right' },
                        ...GARMENT_TAIL_COLUMNS,
                    ]}
                    rows={filteredQcRows}
                    emptyText={cuttingTableEmptyText(searchQuery, stageStyleFilters.qc, trackingLoadFailed)}
                    onRowClick={(row) => openDetailFromRow('Quality Control', row)}
                />
            </ChartCard>

            <ChartCard
                title={
                    <CuttingStageHeader
                        title="Supermarket"
                        count={filteredStoreRows.length}
                        countClassName="bg-amber-600"
                        action={
                            <StageCardActions
                                accent="amber"
                                styleValue={stageStyleFilters.store}
                                styleOptions={storeStyleOptions}
                                onStyleChange={(v) => setStageStyleFilter('store', v)}
                                scanButton={<ScanningButton accent="amber" onClick={() => setScanningModal('store')} />}
                            />
                        }
                    />
                }
                icon={Warehouse}
                iconColor="#b45309"
                iconBgColor="#fef3c7"
                onClick={() => navigate('/dashboard-supermarket-cutting')}
                className={`${CUTTING_STAGE_CHART_CARD_CLASS} !border-amber-200/90`}
            >
                <WireTable
                    columns={[
                        COL_WAKTU_SCAN,
                        COL_RFID,
                        COL_WO,
                        COL_STYLE,
                        { key: 'lokasi', label: 'Lokasi', emphasis: 'accent' },
                        ...GARMENT_TAIL_COLUMNS,
                        COL_QTY,
                        { key: 'line', label: 'Line', emphasis: 'accent' },
                    ]}
                    rows={filteredStoreRows}
                    emptyText={cuttingTableEmptyText(searchQuery, stageStyleFilters.store, trackingLoadFailed)}
                    onRowClick={(row) => openDetailFromRow('Supermarket', row)}
                />
            </ChartCard>

            <ChartCard
                title={
                    <CuttingStageHeader
                        title="Terima Sewing"
                        count={filteredSupplyRows.length}
                        countClassName="bg-violet-600"
                        action={
                            isSupplySewingEnabled ? (
                                <StageCardActions
                                    accent="violet"
                                    styleValue={stageStyleFilters.supply}
                                    styleOptions={supplyStyleOptions}
                                    onStyleChange={(v) => setStageStyleFilter('supply', v)}
                                    scanButton={<ScanningButton accent="violet" onClick={() => setScanningModal('supply')} />}
                                />
                            ) : (
                                <span className="text-[9px] px-2 py-1 rounded-md border border-slate-300 text-slate-500 bg-slate-100/90 font-semibold">
                                    Soon
                                </span>
                            )
                        }
                    />
                }
                icon={Truck}
                iconColor="#5b21b6"
                iconBgColor="#ede9fe"
                onClick={isSupplySewingEnabled ? () => navigate('/dashboard-supply-sewing-cutting') : undefined}
                className={`${CUTTING_STAGE_CHART_CARD_CLASS} relative group ${isSupplySewingEnabled ? '!border-violet-200/90' : 'grayscale saturate-0 !border-slate-300 !from-slate-100 !via-slate-100 !to-slate-200/60 shadow-[0_8px_18px_rgba(15,23,42,0.06)]'}`}
            >
                {!isSupplySewingEnabled && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/40 backdrop-blur-[1px] cursor-not-allowed">
                        <span className="bg-slate-800 text-white text-[11px] px-3 py-1.5 rounded shadow-lg">
                            comingsoon sedang di kerjakan sabar ya
                        </span>
                    </div>
                )}
                <WireTable
                    columns={[
                        COL_WAKTU_SCAN,
                        COL_RFID,
                        COL_WO,
                        COL_STYLE,
                        COL_QTY,
                        { key: 'line', label: 'Line', emphasis: 'accent' },
                        { key: 'gm', label: 'Location', emphasis: 'accent' },
                    ]}
                    rows={filteredSupplyRows}
                    emptyText={cuttingTableEmptyText(searchQuery, stageStyleFilters.supply, trackingLoadFailed)}
                    onRowClick={isSupplySewingEnabled ? (row) => openDetailFromRow('Terima Sewing', row) : undefined}
                />
                <div className="px-1.5 py-0.5 border-t border-gray-50 shrink-0 flex justify-end bg-white/90">
                    <button
                        type="button"
                        onClick={() => {
                            void scanQuery.refetch();
                            invalidate();
                        }}
                        className="text-[9px] text-slate-500 hover:text-violet-700 shrink-0 px-1.5 py-0.5 rounded-md hover:bg-violet-50 transition-colors"
                        title="Refresh data"
                    >
                        ↻ Refresh
                    </button>
                </div>
            </ChartCard>
            </div>

            {tableDetail.open ? (
                <div className="fixed inset-0 z-[1250] flex items-center justify-center bg-slate-900/45 backdrop-blur-[1px] p-3">
                    <div className="w-full max-w-2xl rounded-2xl border border-sky-200/80 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.28)] overflow-hidden">
                        <div className="bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-3 flex items-center justify-between gap-2">
                            <div>
                                <h3 className="text-sm sm:text-base font-extrabold text-white">{tableDetail.title}</h3>
                                <p className="text-[10px] sm:text-xs text-cyan-50/90">
                                    {tableDetail.subtitle ?? 'Informasi tracking hasil scan'}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="rounded-md border border-white/35 bg-white/10 px-2.5 py-1 text-xs text-white hover:bg-white/20"
                                onClick={() => setTableDetail({ open: false, title: '', fields: [], subtitle: undefined })}
                            >
                                Tutup
                            </button>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[62vh] overflow-y-auto">
                            {tableDetail.fields.map((f) => (
                                <div key={f.label} className="rounded-lg border border-sky-100 bg-gradient-to-b from-white to-slate-50 px-2.5 py-2 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{f.label}</div>
                                    <div className="text-[11px] sm:text-xs font-bold text-slate-800 break-words mt-0.5">{f.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}


            <CuttingScanStationModal
                isOpen={scanningModal === 'bundle'}
                onClose={() => setScanningModal(null)}
                title="Station Bundle"
                subtitle="Scan RFID"
                accent="emerald"
                stageBadge="Bundle"
                busy={busyB}
                leftColumn={bundleLeftColumn}
                rfidValue={modalBundleRfid}
                onRfidChange={setModalBundleRfid}
                onRfidSubmit={() => void runBundleSubmit()}
                sessionItems={bundleSessionLog}
            />

            <QcScanStationHost
                isOpen={scanningModal === 'qc'}
                onClose={() => setScanningModal(null)}
                accent="sky"
                serverScanTotal={totalQcServerCount}
            />

            <CuttingScanStationModal
                isOpen={scanningModal === 'store'}
                onClose={() => setScanningModal(null)}
                title="Scanning Station Supermarket"
                subtitle="Scan RFID untuk Supermarket (Cutting)"
                accent="amber"
                stageBadge="Supermarket"
                busy={busySt}
                leftColumn={storeLeftColumn}
                formSection={storeFormSection}
                rfidValue={modalStoreRfid}
                onRfidChange={setModalStoreRfid}
                onRfidSubmit={() => void runStoreSubmit()}
                sessionItems={storeSessionLog}
            />

            <CuttingScanStationModal
                isOpen={scanningModal === 'supply'}
                onClose={() => setScanningModal(null)}
                title="Station Terima Sewing"
                subtitle="Scan RFID"
                accent="violet"
                stageBadge="Terima Sewing"
                busy={busySu}
                leftColumn={supplyLeftColumn}
                formSection={supplyFormSection}
                rfidValue={modalSupplyRfid}
                onRfidChange={setModalSupplyRfid}
                onRfidSubmit={() => void runSupplySubmit()}
                sessionItems={supplySessionLog}
            />
        </div>
    );
});

export default CuttingProcessSection;
