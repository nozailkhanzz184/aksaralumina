# Dokumen Persyaratan Produk (PRD)

## Nama Proyek
AksaraLumina

## 1. Ringkasan
AksaraLumina adalah aplikasi manajemen file dan catatan serbaguna yang mengutamakan offline (offline-first). Aplikasi ini menyediakan antarmuka sistem file yang komprehensif bagi pengguna, memungkinkan pembuatan, pengaturan, dan manipulasi file dan folder langsung di dalam browser. Terintegrasi dengan Appwrite untuk sinkronisasi cloud dan AI untuk pembuatan konten otomatis. Selain itu, aplikasi ini menawarkan model langganan PRO yang divalidasi secara manual melalui bukti transaksi mata uang kripto.

## 2. Fitur & Kemampuan Utama

### 2.1. Manajemen Sistem File
- **Hierarki & Navigasi:** Pengguna dapat membuat struktur folder bersarang (nested), menavigasi menggunakan breadcrumb, dan melihat jalur saat ini.
- **Operasi File:** Dukungan untuk membuat file dan folder baru, mengubah nama, memindahkan, menyalin, menghapus, dan menyusun ulang item di dalam folder.
- **Operasi Massal:** Mode multi-pilihan memungkinkan pengguna memindahkan, menyalin, menyusun ulang, atau menghapus beberapa item secara bersamaan.
- **Pencarian:** Fitur pencarian real-time di seluruh hierarki sistem file.
- **Seret dan Lepas (Drag and Drop):** Pengguna dapat memindahkan item ke dalam folder dan menyusun ulangnya melalui interaksi seret dan lepas.

### 2.2. Mengutamakan Offline & Sinkronisasi
- **Penyimpanan Lokal:** Data disimpan secara lokal (melalui IndexedDB), memastikan aplikasi berfungsi sempurna secara offline.
- **Sinkronisasi Cloud:** Integrasi dengan Appwrite memungkinkan pengguna masuk, mendaftar, dan menyinkronkan data lokal mereka ke cloud. Pengguna dapat memilih untuk menggabungkan atau menimpa data selama sinkronisasi.
- **Ekspor/Impor:** Pengguna dapat mengekspor seluruh ruang kerja mereka sebagai file JSON dan mengimpornya kembali, menawarkan metode pencadangan dan transfer alternatif (dengan batas 5MB).

### 2.3. Asisten AI
- **AI Generatif:** Pengguna dapat memilih file atau folder dan menginstruksikan AI untuk membuat konten baru atau melakukan operasi berdasarkan konteks yang dipilih.
- **Simpan Otomatis:** Konten yang dihasilkan dapat disimpan secara otomatis sebagai file baru di folder target yang ditentukan.

### 2.4. Model Langganan PRO
- **Tingkat Langganan:** Tingkat premium ("PRO Aktif") yang menawarkan manfaat seperti penyimpanan cloud tanpa batas, akses model AI premium (misalnya, GPT-4, Claude 3), dan sinkronisasi prioritas seharga Rp 5.000 / minggu.
- **Integrasi Pembayaran Kripto:** Pengguna berlangganan dengan mentransfer dana (USDT/USDC/ETH di jaringan EVM) ke alamat dompet yang ditentukan.
- **Pengiriman Bukti URL:** Pengguna memvalidasi pembayaran mereka dengan memberikan URL explorer blockchain dari transaksi mereka. Dilengkapi dengan tombol tempel dari papan klip (clipboard) 1-klik, pratinjau tautan validasi untuk memeriksa ulang URL, dan modal konfirmasi sebelum pengiriman akhir.

### 2.5. Internasionalisasi (i18n)
- **Dukungan Multi-bahasa:** Aplikasi ini mencakup pengubah bahasa yang mendukung Bahasa Indonesia, English, 简体中文, Français, 日本語, Tiếng Việt, dan 繁體中文.

## 3. Arsitektur Teknis

- **Framework Frontend:** React 19 dengan Vite.
- **Gaya (Styling):** Tailwind CSS (v4) untuk gaya berbasis utilitas (utility-first).
- **Ikon:** `lucide-react` untuk set ikon yang konsisten dan modern.
- **Database & Autentikasi:** Appwrite SDK untuk backend-as-a-service (BaaS) yang menangani autentikasi dan sinkronisasi data cloud. Data lokal bergantung pada `idb`.
- **Seret & Lepas:** Library/polyfill `mobile-drag-drop` untuk dukungan seret dan lepas yang tangguh di berbagai perangkat.
- **Manajemen State:** React hooks kustom (`useFileSystem`, `useAppwriteSync`, `useDialog`) mengelola state lokal dan jarak jauh yang kompleks. Lazy loading digunakan untuk komponen yang lebih berat seperti Editor dan AI Helper.

## 4. Desain UI/UX

- **Tata Letak:** Antarmuka yang bersih dan modern yang menampilkan bilah navigasi atas (sticky) untuk pengaturan, bahasa, dan notifikasi, di samping breadcrumb dan bilah alat operasi file.
- **Modal & Dialog:** Implementasi kustom untuk peringatan, prompt, konfirmasi, pengaturan, dan bukti pembayaran (`DialogContext`).
- **Responsif:** Dirancang dengan prinsip mengutamakan seluler (mobile-first) agar berfungsi lancar di lingkungan seluler dan desktop.
- **Notifikasi:** Notifikasi toast bawaan (melalui `sonner`) untuk umpan balik pengguna yang tidak mengganggu.

## 5. Keamanan & Privasi Data
- Desain mengutamakan offline berarti data pengguna pada dasarnya berada di perangkat pengguna kecuali disinkronkan secara eksplisit ke cloud.
- Autentikasi bergantung pada pengelolaan email/kata sandi dan sesi Appwrite yang aman.
- Mekanisme bukti pembayaran bergantung pada URL explorer publik yang disediakan pengguna, menghindari koneksi langsung ke dompet yang meminimalkan risiko pengguna.
