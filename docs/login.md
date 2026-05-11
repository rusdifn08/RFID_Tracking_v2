# Login — ringkas

## Alur (aplikasi)

1. Client memanggil **`GET /user?nik={NIK}`** lewat base URL proxy (`API_BASE_URL` di `src/config/api.ts`), dengan header default (`Content-Type`, `Accept`, **`X-Api-Key`**).
2. Password input di-hash **MD5** lalu dibandingkan dengan hash dari backend (lihat field di bawah).
3. Jika cocok → `success: true` + data user; jika tidak → pesan error sesuai kasus.

**Pengecualian lokal:** NIK `12345` + password `admin` → login admin tanpa hit API (untuk dev/uji).

---

## API

| Method | Endpoint | Query |
|--------|----------|--------|
| `GET` | `/user` | `nik` (wajib, URL-encoded) |

**Contoh:** `GET {API_BASE_URL}/user?nik=92400689`

- **Request body:** tidak ada.
- **Header:** `Content-Type: application/json`, `Accept: application/json`, `X-Api-Key: <key>` (sama seperti request lain ke proxy).

---

## Respons backend (yang diharapkan)

Struktur inti (setelah `apiGet` mem-parse JSON; field bisa sedikit berbeda antar environment):

```json
{
  "user": {
    "nik": "92400689",
    "nama": "Nama User",
    "bagian": "...",
    "line": "...",
    "no_hp": "...",
    "pwd_md5": "<md5_password_di_database>",
    "rfid_user": "...",
    "telegram": "..."
  },
  "password_hash": "<opsional, mis. environment GCC>"
}
```

**Verifikasi password di client:** bandingkan `MD5(password_input)` dengan salah satu (urutan cek di kode):

- `password_hash` (root respons), atau  
- `user.pwd_md5`, atau  
- `user.password_hash`

---

## Respons ke pemanggil (`login()` → `ApiResponse<LoginResponse>`)

| Kondisi | `success` | `status` | `error` / `data` |
|---------|-----------|----------|-------------------|
| Password cocok | `true` | `200` | `data`: objek login + `success: true` |
| Password kosong | `false` | `400` | `error`: `Password harus diisi` |
| Password salah | `false` | `401` | `error`: `NIK atau Password salah` |
| NIK tidak ada / tidak valid | `false` | `404` (atau status API) | `error`: `NIK tidak ada` / pesan dari API |
| Gagal jaringan / lainnya | `false` | `500` / `0` | `error`: pesan exception / koneksi |

**Fungsi terkait:** `login(nik, password)`, `loginWithPassword({ nik, password })` — keduanya memakai **`GET /user?nik=...`** + MD5 seperti di atas.

**Referensi kode:** `src/config/api.ts` (`login`, `LoginResponse`, `getDefaultHeaders`).
