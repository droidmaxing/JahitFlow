# JahitFlow

JahitFlow adalah aplikasi manajemen pesanan dan produksi untuk usaha konveksi.
Admin mengelola pesanan sehari-hari, sementara Owner memantau operasional dan
laporan bisnis. Pelanggan dapat melacak pesanan melalui portal publik.

## Fitur utama

- **Pesanan dan pelanggan:** catat data pelanggan, beberapa produk, ukuran,
  jumlah, harga, diskon, tenggat, dan catatan pesanan.
- **Katalog produk fleksibel:** gunakan template sebagai titik awal atau isi
  produk custom; detail pesanan tetap dapat disesuaikan.
- **Produksi:** pantau dan pindahkan pesanan antar tahap pada papan Kanban.
- **Pembayaran:** catat beberapa pembayaran, status pelunasan, dan sisa tagihan.
- **Nota dan dokumen kerja:** cetak invoice dan surat perintah kerja.
- **Pelacakan pelanggan:** pelanggan dapat melihat progres, riwayat pembayaran,
  dan estimasi selesai menggunakan nomor pesanan serta empat digit terakhir
  nomor WhatsApp.
- **Fitur Owner:** kelola akun Admin/Kasir, atur nomor WhatsApp layanan, dan
  pantau laporan bisnis yang dapat diunduh sebagai Excel.
- **Riwayat terjaga:** pesanan menyimpan snapshot data saat dicatat. Akun dan
  data terkait dinonaktifkan atau dipertahankan, bukan dihapus dari alur biasa.

## Alur penggunaan

1. Owner atau Admin/Kasir masuk ke area admin.
2. Buat pesanan, pilih template produk atau masukkan produk custom, lalu catat
   ukuran, harga, tenggat, dan pembayaran awal jika ada.
3. Pantau dan perbarui tahap produksi pada papan Kanban.
4. Catat pembayaran berikutnya sampai lunas; cetak invoice atau dokumen kerja
   bila diperlukan.
5. Pelanggan melihat progres di halaman **Lacak pesanan** menggunakan nomor
   pesanan dan empat digit terakhir nomor WhatsApp.
6. Owner memantau laporan, mengunduh Excel, mengatur nomor WhatsApp layanan,
   dan mengelola akun Admin/Kasir.

## Menjalankan di komputer lokal

### Prasyarat

- Node.js 20.9 atau lebih baru dan npm.
- MySQL 8.x (Laragon dapat digunakan di Windows).
- Database MySQL untuk aplikasi dan satu database terpisah untuk shadow
  migration; akun MySQL perlu izin akses pada keduanya.

### Instalasi

1. Clone repository dan masuk ke folder proyek:

   ```powershell
   git clone https://github.com/droidmaxing/JahitFlow.git
   cd JahitFlow
   ```

2. Buat database MySQL kosong, misalnya `konveksi_db` dan
   `konveksi_shadow`.
3. Salin konfigurasi contoh dan isi nilai lokal:

   ```powershell
   Copy-Item .env.example .env
   ```

   Atur `DATABASE_URL`, `SHADOW_DATABASE_URL`, `AUTH_SECRET`, kata sandi seed,
   dan `NEXT_PUBLIC_WHATSAPP_NUMBER`. Gunakan kata sandi seed unik minimal 12
   karakter dan `AUTH_SECRET` acak yang kuat. Format nomor WhatsApp sebaiknya
   internasional tanpa tanda `+`, misalnya `6283121893686`. Jangan bagikan atau
   commit file `.env`.
4. Instal dependensi, terapkan migrasi yang sudah tersedia, dan siapkan Prisma:

   ```powershell
   npm ci
   npx prisma migrate deploy
   npm run db:generate
   ```

5. Jalankan server pengembangan:

   ```powershell
   npm run dev
   ```

   Buka `http://localhost:3000`. Halaman masuk admin tersedia di
   `http://localhost:3000/login`.

### Akun dan data demo (opsional)

Untuk mengisi data demo di database lokal, jalankan:

```powershell
npm run db:seed
npm run db:seed:products
```

Seed utama menyiapkan akun `owner@konveksi.local` dan `kasir@konveksi.local`;
kata sandinya mengikuti `SEED_OWNER_PASSWORD` dan `SEED_ADMIN_PASSWORD` di
`.env`. Seed juga dapat membuat contoh pelanggan dan pesanan. Seed produk
menambahkan template contoh yang belum ada. **Jalankan seed hanya pada database
lokal/demo**: seed utama memperbarui data akun demo dan dapat menambahkan data
contoh.

## Perintah berguna

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan |
| `npm run lint` | Memeriksa aturan ESLint |
| `npm run typecheck` | Memeriksa tipe TypeScript |
| `npm run build` | Membuat build produksi |
| `npm run start` | Menjalankan build produksi |
| `npm run db:generate` | Membuat Prisma Client |
| `npm run db:migrate -- --name <nama>` | Membuat dan menerapkan migrasi saat mengubah schema |
| `npm run db:seed` | Menyiapkan akun dan data demo |
| `npm run db:seed:products` | Menambahkan template produk contoh |
| `npm run db:studio` | Membuka Prisma Studio |

Gunakan migrasi Prisma untuk perubahan database; hindari `prisma db push`.
