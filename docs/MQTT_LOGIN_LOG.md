# MQTT Login Success – Arsitektur

## Alur data

```
  [Broker MQTT] 10.5.0.106:1883 (TCP)
       ↑
       │ subscribe / publish (topic: line{N}/qc|pqc/{env}, payload: success)
       │
  [server.js]   Node.js – mqtt.connect('mqtt://10.5.0.106:1883')
       │        - Subscribe topic line1/qc/mjl, line1/pqc/mjl, ...
       │        - Simpan event terakhir ke memori
       │
       │        GET /api/mqtt-login-success  (polling tiap ~1,5 detik)
       ↓
  [Dashboard]   Browser – fetch ke proxy (server.js)
                - Event dipakai untuk animasi "QC/PQC Login Successful"
```

## Kenapa browser tidak konek ke MQTT?

- **MQTT** di broker pakai **TCP port 1883**.
- Di **browser**, JavaScript **tidak bisa** buka koneksi TCP sembarangan; yang ada hanya HTTP dan WebSocket.
- Jadi hanya **server (Node.js)** yang bisa `mqtt.connect('mqtt://10.5.0.106:1883')`, subscribe, dan terima pesan.
- **Dashboard** dapat event dengan **polling** ke server: `GET /api/mqtt-login-success`.

Tidak ada koneksi browser ke `ws://10.5.0.106:8083`; semua MQTT hanya lewat server di **10.5.0.106:1883**.

## Log di console (browser)

| Log | Arti |
|-----|------|
| `Polling aktif untuk LINE X → http://.../api/mqtt-login-success` | Polling ke server jalan untuk dashboard LINE X. |
| `Event dari server (MQTT) → animasi` | Server mengembalikan event dari MQTT → animasi tampil. |
| `Animasi ditampilkan: QC/PQC Login Successful, LINE N` | Popup animasi tampil di layar. |

## Log di terminal (server.js)

| Log | Arti |
|-----|------|
| `[MQTT] CONNECTED` | server.js terhubung ke broker 10.5.0.106:1883. |
| `Subscribed: line1/qc/mjl`, ... | Subscribe topic berhasil. |
| `📩 [MQTT] Message received` / `Topic: line1/pqc/mjl` / `Payload: success` | Pesan MQTT diterima; event disimpan dan bisa diambil dashboard lewat polling. |
