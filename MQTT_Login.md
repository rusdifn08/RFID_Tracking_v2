# MQTT Login & Status Online — Dokumentasi Ringkas

Dokumentasi fitur MQTT untuk **login di dashboard** (indikator LED + animasi), **status online** alat RFID, dan **informasi garment** (animasi alur OUTPUT → QC → PQC).

---

## 1. Broker MQTT (IP, Port, dan konfigurasi)

| Item | Nilai |
|------|--------|
| **URL** | `mqtt://10.5.0.106:1883` (default) |
| **IP** | `10.5.0.106` |
| **Port** | `1883` (TCP) |
| **Protocol** | MQTT |
| **Override** | Env `MQTT_BROKER_URL` — jika di-set, URL ini yang dipakai (contoh: `mqtt://192.168.1.100:1883`) |

**Opsi koneksi server (server.js):**

| Opsi | Nilai | Keterangan |
|------|--------|------------|
| `connectTimeout` | 10000 ms | Timeout saat connect |
| `keepalive` | 60 s | Ping keepalive |
| `clean` | true | Clean session |
| `reconnectPeriod` | 4000 ms | Interval reconnect jika putus |
| `clientId` | `server_{env}_{random}` | ID unik per koneksi (env = mjl/mjl2/cln) |

- **Arah pesan:** Microcontroller/alat **publish** ke broker; server (proxy) **subscribe** dan meneruskan ke dashboard lewat API (polling).
- **Environment:** `mjl` | `mjl2` | `cln`. **Line:** 1–16.

---

## 2. Spesifikasi Umum

| Item | Keterangan |
|------|------------|
| **Subscribe** | Hanya server yang subscribe; dashboard tidak konek langsung ke broker |
| **Environment** | `mjl` \| `mjl2` \| `cln` (sesuai lokasi/line) |
| **Line** | Nomor line 1–16 (sesuai kebutuhan) |

---

## 3. Topic Login (Success / Unsuccess / Login)

Digunakan untuk **event login** dan **indikator LED** di kartu Good QC / Good PQC di dashboard.

### Formula topic

```
line{N}/{role}/{env}
```

| Bagian | Nilai | Contoh |
|--------|--------|--------|
| `{N}` | Nomor line (1–16) | `1` |
| `{role}` | `qc` atau `pqc` | `qc`, `pqc` |
| `{env}` | Environment | `mjl`, `mjl2`, `cln` |

### Contoh topic

- `line1/qc/mjl` — Login QC, line 1, environment MJL  
- `line1/pqc/mjl` — Login PQC, line 1, environment MJL  
- `line2/qc/cln` — Login QC, line 2, environment CLN  

### Payload (case-insensitive)

| Payload | Arti | Dampak di dashboard |
|---------|------|----------------------|
| `success` | Login berhasil | Animasi “Login Successful”, LED hijau |
| `unsuccess` | Login gagal | Animasi “Login Gagal” (1x), LED merah |
| `login` | Alat baru menyala / indikator standby | LED abu (tanpa animasi) |

---

## 4. Topic Status Online

Digunakan untuk **cek apakah alat RFID sedang online** (terhubung ke MQTT).

### Formula topic

```
status/line{N}/{role}/{env}
```

| Bagian | Nilai | Contoh |
|--------|--------|--------|
| `{N}` | Nomor line (1–16) | `1` |
| `{role}` | `qc`, `pqc`, atau `output` | `qc`, `pqc`, `output` |
| `{env}` | Environment | `mjl`, `mjl2`, `cln` |

### Contoh topic

- `status/line1/qc/mjl`  
- `status/line1/pqc/mjl`  
- `status/line1/output/mjl`  

### Payload

- **`online`** — Artinya alat RFID terhubung ke MQTT dan mengirim status online.  
- Server menganggap alat **online** jika pernah menerima `online` dalam **2 menit** terakhir.

---

## 5. Topic Info (Informasi Garment) — Automation Alur

Digunakan untuk **informasi posisi garment**; teks animasi **otomatis** mengikuti alur ideal: **OUTPUT → QC → PQC**.

### Topic yang digunakan

```
info/line{N}/{role}/{env}
```

| Bagian | Nilai | Contoh |
|--------|--------|--------|
| `{N}` | Nomor line (1–16) | `8` |
| `{role}` | `qc` atau `pqc` (stasiun yang mengirim) | `qc`, `pqc` |
| `{env}` | Environment | `mjl`, `mjl2`, `cln` |

**Contoh:** `info/line8/pqc/mjl` = stasiun PQC line 8 env mjl melaporkan posisi garment.

### Payload (posisi garment saat ini)

| Payload | Arti |
|---------|------|
| `OUTPUT` | Garment berada di Output |
| `QC` | Garment berada di QC |
| `PQC` | Garment berada di PQC |

### Logic teks animasi (otomatis)

- **Topic** = stasiun yang baca (qc atau pqc). **Payload** = posisi garment (OUTPUT / QC / PQC).
- Alur urutan: OUTPUT (sebelum) → QC → PQC (sesudah).
- Jika payload = **proses sebelumnya** (posisi < stasiun) → **"Garment Masih Berada di [Output/QC/PQC]"**.
- Jika payload = **proses sama atau lebih** (posisi ≥ stasiun) → **"Garment Sudah Berada di [Output/QC/PQC]"**.

**Contoh (topic `info/line8/pqc/mjl`):**

| Payload | Teks animasi |
|---------|------------------|
| `OUTPUT` | Garment Masih Berada di Output |
| `QC` | Garment Masih Berada di QC |
| `PQC` | Garment Sudah Berada di PQC |

**Contoh (topic `info/line8/qc/mjl`):**

| Payload | Teks animasi |
|---------|------------------|
| `OUTPUT` | Garment Masih Berada di Output |
| `QC` | Garment Sudah Berada di QC |
| `PQC` | Garment Sudah Berada di PQC |

---

## 6. Alur di Microcontroller

### 6.1 Saat terhubung ke MQTT

1. Microcontroller connect ke broker MQTT.
2. **Langsung publish** satu kali (atau periodik) ke **topic login** dengan payload **`login`**:
   - QC: `line{N}/qc/{env}` → payload `login`
   - PQC: `line{N}/pqc/{env}` → payload `login`
3. (Opsional) Publish ke **topic status online** dengan payload **`online`**:
   - `status/line{N}/qc/{env}` → payload `online`
   - `status/line{N}/pqc/{env}` → payload `online`
   - `status/line{N}/output/{env}` → payload `online` (jika ada device output)

### 6.2 Saat tap RFID (ID Card) — proses login

1. User tap ID Card di reader RFID.
2. Microcontroller memproses login (validasi ke backend/local).
3. Sesuai hasil:
   - **Login berhasil** → publish ke **topic login** (`line{N}/qc/{env}` atau `line{N}/pqc/{env}`) dengan payload **`success`**.
   - **Login gagal** → publish ke **topic login** yang sama dengan payload **`unsuccess`**.

Ringkas:

- Connect MQTT → kirim **`login`** ke topic login (dan boleh **`online`** ke topic status).
- Tap RFID → proses login → kirim **`success`** atau **`unsuccess`** ke topic login.

---

## 7. API untuk Dashboard

Dashboard tidak subscribe MQTT langsung; server (proxy) yang subscribe dan menyediakan API.

### 7.1 Event login & LED

- **Endpoint:** `GET /api/mqtt-login-success?line={N}`  
- **Response:** `event` (success), `eventFail` (unsuccess), `ledStatus` (qc/pqc: success \| unsuccess \| login).  
- Dashboard polling (mis. 1,5 detik) untuk menampilkan animasi dan LED.

### 7.2 Status online

- **Endpoint:** `GET /api/mqtt-status-online?line={N}`  
- **Response:** `status.qc`, `status.pqc`, `status.output` masing-masing `{ online: true/false, at?: number }`.  
- Alat dianggap online jika dalam 2 menit terakhir pernah mengirim payload `online` ke topic status yang sesuai.

### 7.3 Event info (informasi garment)

- **Endpoint:** `GET /api/mqtt-info?line={N}`  
- **Response:** `event: { line, role, payload, at } | null` (payload: `OUTPUT`, `QC`, `PQC`).  
- Teks animasi dihitung otomatis dari role + payload (alur OUTPUT → QC → PQC). Event dikirim 1x lalu di-clear.

---

## 8. Daftar Topic & Payload (ringkasan)

Semua topic dan payload yang dipakai di sistem MQTT:

| No | Kegunaan | Topic | Payload | Keterangan |
|----|----------|--------|---------|------------|
| 1 | Login + LED | `line{N}/qc/{env}` | `success` \| `unsuccess` \| `login` | QC login / indikator |
| 2 | Login + LED | `line{N}/pqc/{env}` | `success` \| `unsuccess` \| `login` | PQC login / indikator |
| 3 | Status online | `status/line{N}/qc/{env}` | `online` | QC online |
| 4 | Status online | `status/line{N}/pqc/{env}` | `online` | PQC online |
| 5 | Status online | `status/line{N}/output/{env}` | `online` | Output online |
| 6 | Info garment | `info/line{N}/qc/{env}` | `OUTPUT` \| `QC` \| `PQC` | Posisi garment (alur §5) |
| 7 | Info garment | `info/line{N}/pqc/{env}` | `OUTPUT` \| `QC` \| `PQC` | Posisi garment (alur §5) |

**Parameter:**  
- **`{N}`** = nomor line 1–16  
- **`{env}`** = `mjl` \| `mjl2` \| `cln`

**Payload per kegunaan:**

- **Login:** `success` (berhasil), `unsuccess` (gagal), `login` (alat nyala/standby)
- **Status online:** `online`
- **Info garment:** `OUTPUT`, `QC`, `PQC` (posisi garment; teks animasi otomatis menurut alur OUTPUT → QC → PQC)
