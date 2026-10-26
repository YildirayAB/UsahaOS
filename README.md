# UsahaOS - Sistem Kasir Cerdas untuk UMKM

**UsahaOS** adalah sistem Point of Sale (POS) berbasis web yang dirancang untuk membantu UMKM, khususnya usaha kafe, dalam mengelola transaksi penjualan, produk, stok, dan laporan bisnis secara lebih praktis. UsahaOS juga menghadirkan fitur asisten AI untuk membantu pengguna memperoleh informasi dan dukungan dalam menjalankan usaha.

## Fitur Utama

- **Manajemen Transaksi:** Mendukung pencatatan dan pengelolaan transaksi penjualan.
- **Manajemen Produk dan Stok:** Membantu pengelolaan data produk dan persediaan.
- **Laporan Penjualan:** Menyediakan informasi transaksi dan ringkasan penjualan.
- **Manajemen Pengguna:** Mendukung pemisahan akses sesuai peran pengguna, seperti admin dan kasir.
- **Asisten AI:** Membantu pengguna mendapatkan informasi terkait operasional usaha.
- **Antarmuka Web:** Dapat diakses melalui browser tanpa perlu memasang aplikasi desktop.

## Tech Stack

| Komponen | Teknologi |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| CSS Framework | Tailwind CSS |
| Ikon | Font Awesome |
| Visualisasi Data | Chart.js |
| Backend | Google Apps Script |
| Penyimpanan Data | Google Spreadsheet |
| Frontend Hosting | Vercel |
| AI Development Tool | Google Antigravity |

## Arsitektur Sistem

UsahaOS menggunakan arsitektur frontend dan backend yang dikelola secara terpisah.

1. **Frontend:** Dibangun menggunakan HTML, CSS, dan JavaScript, kemudian di-host melalui Vercel.
2. **Backend:** Menggunakan Google Apps Script untuk menangani permintaan dari frontend dan menjalankan logika aplikasi.
3. **Penyimpanan Data:** Google Spreadsheet digunakan untuk menyimpan dan mengelola data aplikasi.
4. **Integrasi AI:** Fitur asisten AI diintegrasikan melalui backend sesuai konfigurasi layanan AI yang digunakan.

Frontend berkomunikasi dengan backend melalui HTTP request. Backend kemudian memproses permintaan dan berinteraksi dengan penyimpanan data sesuai kebutuhan aplikasi.

## Struktur Repository

```text
UsahaOS/
├── index.html
├── vercel.json
├── .gitignore
├── backend/
│   └── Code.gs
└── README.md
```

**Catatan:** File `Code.gs` merupakan source code backend Google Apps Script. Backend dikelola dan dideploy secara terpisah dari frontend yang dihost di Vercel.

## Demo Aplikasi

- **Live Demo:** https://usahaos-xi.vercel.app/
- **Demo Account:** 
  <details>
  <summary>Username & Password</summary>

  ```
  username = demo password = usahaos_demo
  ```
</details>

Gunakan akun demo yang disediakan untuk mencoba aplikasi. Jangan menggunakan atau membagikan kredensial akun pribadi.

## Keamanan

- Kredensial dan API key tidak dicantumkan dalam repository publik.
- Informasi rahasia dikelola melalui konfigurasi server yang sesuai.
- Akses terhadap fitur dan data sensitif perlu divalidasi oleh backend.

## Pengembangan

Repository ini berisi source code frontend dan dokumentasi proyek. Backend Google Apps Script dikelola secara terpisah dan dapat ditemukan pada folder `backend/`.

## Tujuan Proyek

UsahaOS dikembangkan untuk membantu UMKM menjalankan operasional usaha dengan lebih terorganisasi melalui integrasi pencatatan penjualan, pengelolaan produk, laporan bisnis, dan dukungan AI dalam satu sistem.

