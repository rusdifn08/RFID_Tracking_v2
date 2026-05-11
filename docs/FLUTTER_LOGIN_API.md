# Dokumentasi API Login — untuk integrasi Flutter (prompt AI)

Dokumen ini menjelaskan **base URL, port, endpoint, header, dan alur verifikasi password** yang dipakai aplikasi web RFID Tracking, agar bisa direplikasi di **Flutter** atau dijadikan **prompt untuk asisten AI**.

---

## 1. Arsitektur singkat

```
[App Flutter]  →  HTTP  →   [Backend API]

```

- **Backend API** (data user, hash password): biasanya `http://<BACKEND_IP>:7000`.

**Flutter boleh:**

- memanggil **backend langsung** hanya jika tim infra mengizinkan dan CORS/firewall sudah diset: `http://<BACKEND_IP>:7000`.

---

## 2. IP & port (referensi dari `server.js`)

| Lingkungan | BACKEND_IP (default)   | Port proxy `server.js` | Port backend API |
|------------|------------------------|------------------------|------------------|
| CLN        | `10.8.0.104`           | `8000`                 | `7000`           |
| MJL        | `10.5.0.106`           | `8000`                 | `7000`           |
| MJL2       | `10.5.0.99`            | `8001`                 | `7000`           |
| GCC        | `10.5.0.106` (default) | `8002`                 | `7000`           |

Nilai bisa di-override dengan environment variable, misalnya:

- `BACKEND_IP`, `BACKEND_API_URL`, `PORT`, `BACKEND_ENV`, atau argumen CLI `node server.js mjl|mjl2|cln|gcc`.

**Contoh base URL proxy untuk Flutter (ganti IP dengan mesin yang menjalankan `server.js`):**

- MJL / CLN: `http://10.5.0.2:8000`
- MJL2: `http://10.5.0.2:8001`
- GCC: `http://10.5.0.2:8002`

**Contoh backend langsung (hanya jika dipakai):**

- `http://10.5.0.106:7000` (MJL — sesuaikan dengan environment aktif)

---

## 3. Header wajib (sama seperti web)

Semua request ke proxy atau backend yang dilindungi harus menyertakan:

| Header         | Nilai                                                                                                                                                                                                 |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `X-Api-Key`    | Sama dengan konfigurasi server — lihat `server.js` (`API_KEY`) dan `src/config/api.ts` (`MJL_API_KEY`). **Jangan hardcode di repo publik**; pakai `--dart-define`, file env lokal, atau secret store. |
| `Content-Type` | `application/json` (untuk POST JSON)                                                                                                                                                                  |
| `Accept`       | `application/json` (disarankan)                                                                                                                                                                       |

Di web, helper `getDefaultHeaders()` menambahkan `X-Api-Key` + JSON headers.

---

## 4. Alur login yang dipakai aplikasi web (utama)

Web **tidak** mengirim password plain ke endpoint `/user`. Alurnya:

1. **GET** data user berdasarkan NIK lewat proxy.
2. Di **client**, hash password input dengan **MD5** (lowercase hex).
3. Bandingkan dengan hash dari response: `password_hash` **atau** `user.pwd_md5` **atau** `user.password_hash` (case-insensitive compare).

Library referensi di web: `crypto-js` → `MD5(password).toString()`.

### 4.1 Endpoint: ambil user + hash (disarankan)

**Lewat proxy Node:**

```http
GET {BASE_PROXY}/user?nik={NIK}
X-Api-Key: <sama dengan server>
Accept: application/json
```

Proxy meneruskan ke backend:

```http
GET {BACKEND_API_URL}/user?nik={NIK}
```

**Response sukses (struktur umum, disesuaikan backend):**

```json
{
  "success": true,
  "password_hash": "<md5_hex_optional>",
  "user": {
    "nik": "...",
    "nama": "...",
    "bagian": "...",
    "line": "...",
    "pwd_md5": "<md5_hex>",
    "rfid_user": "...",
    "telegram": "...",
    "no_hp": "..."
  }
}
```

**Logika Flutter (pseudo):**

```dart
// 1. GET /user?nik=...
// 2. md5Input = md5(utf8.encode(password)).toLowerCase()  // hex string
// 3. dbHash = response['password_hash'] ?? user['pwd_md5'] ?? user['password_hash'] ?? ''
// 4. if (md5Input.toLowerCase() == dbHash.toLowerCase()) → login OK
```

Jika user tidak ada / gagal: response `success: false` atau HTTP 4xx — tampilkan pesan dari `message` / `error` jika ada.

### 4.2 Endpoint alternatif: POST login (kompatibilitas)

Proxy menyediakan **POST** yang memanggil backend dengan query `nik` + `password` (validasi di backend).

```http
POST {BASE_PROXY}/api/auth/login
Content-Type: application/json
X-Api-Key: <sama dengan server>

{"nik":"123456","password":"plain_password"}
```

Proxy memanggil backend:

```http
GET {BACKEND_API_URL}/login?nik=...&password=...
```

Response dari proxy jika berhasil (contoh disederhanakan):

```json
{
  "success": true,
  "data": {
    "token": "token-{nik}",
    "user": {
      "nik": "...",
      "name": "...",
      "jabatan": "...",
      "role": "user"
    }
  },
  "message": "Login berhasil"
}
```

**Catatan:** Alur utama di **web TypeScript** saat ini memakai **GET `/user` + MD5 di client**, bukan POST ini. Untuk konsistensi dengan web, utamakan **GET `/user` + MD5**.

---

## 5. Kasus khusus di web (tidak otomatis di server)

Di `src/config/api.ts` ada **login admin lokal** (hardcoded): NIK `12345` + password `admin` mengembalikan user admin **tanpa** memanggil API. Jika Flutter harus sama, implementasikan opsional di app; **ini bukan** perilaku server.

---

## 6. Session & logout (referensi web)

- Web menyimpan `user`, `isLoggedIn`, `sessionValidUntil` di `localStorage`.
- Ada pemanggilan `GET /api/auth/session?nik=...` dan `POST /api/auth/logout` (lihat `api.ts`) untuk skenario session server — sesuaikan kebutuhan Flutter (mis. `SharedPreferences` / `flutter_secure_storage`).

---

## 7. Checklist implementasi Flutter

- [ ] Tentukan `BASE_URL` proxy (`http://IP:8000` / `8001` / `8002`) sesuai environment.
- [ ] Simpan `X-Api-Key` lewat config aman (bukan commit publik).
- [ ] Implementasi **MD5** password (hex lowercase) dan bandingkan dengan field hash dari GET `/user`.
- [ ] Handle error jaringan, timeout, dan JSON tidak valid.
- [ ] (Opsional) Izinkan override IP/port lewat settings / flavor dev & prod.

---

## 8. Blok prompt untuk AI (salin-tempel)

Gunakan teks di bawah sebagai **system/user prompt** untuk generator kode Flutter:

```text
Implementasikan layar login Flutter untuk backend RFID Tracking.

Base URL: http://<PROXY_HOST>:<PORT> — PORT 8000 (MJL/CLN), 8001 (MJL2), 8002 (GCC), atau sesuai server.js.

Login flow (sama seperti web):
1) GET /user?nik=<NIK> dengan header X-Api-Key (nilai dari env, jangan hardcode di repo).
2) Parse JSON; jika success dan user ada, ambil hash dari password_hash ATAU user.pwd_md5 ATAU user.password_hash.
3) Hash input password dengan MD5 (hex string, bandingkan case-insensitive dengan hash dari server).
4) Jika cocok, simpan data user (nik, nama, bagian, line, rfid_user, dll.) ke secure storage; navigasi ke home.

Gunakan package http atau dio, timeout jelas, dan model JSON yang nullable. Tampilkan pesan error dalam Bahasa Indonesia jika NIK tidak ditemukan atau password salah.

Alternatif opsional: POST /api/auth/login dengan body JSON {"nik","password"} ke proxy yang sama — hanya jika tim memilih validasi di backend; default utamakan GET /user + MD5 client.
```

---

## 9. File referensi di repo

- `server.js` — `BACKEND_API_URL`, `GET /user`, `POST /api/auth/login`, header `X-Api-Key`.
- `src/config/api.ts` — `login()`, `getDefaultHeaders()`, `MJL_API_KEY`, tipe `LoginResponse`.

---

*Dokumen ini dibuat untuk konsistensi integrasi mobile; sesuaikan IP/port dan API Key dengan environment deployment aktual.*
