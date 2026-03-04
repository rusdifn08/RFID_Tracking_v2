/**
 * Preload script: nonaktifkan debug log dari express/body-parser
 * agar command prompt tidak penuh dengan print request.
 * Hanya error yang akan tetap tampil dari kode aplikasi.
 */
process.env.DEBUG = '';
