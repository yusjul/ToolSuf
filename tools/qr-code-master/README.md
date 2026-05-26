# QR Code Master - Dokumentasi & Rencana Desain

QR Code Master adalah alat produktivitas kustom premium bergaya Apple yang dirancang khusus untuk ToolSuf. Alat ini berfungsi sebagai generator dan pemindai QR Code berkinerja tinggi, beroperasi sepenuhnya offline (*local-first*) di dalam browser untuk melindungi privasi pengguna.

---

## 1. Spesifikasi Fitur Utama

### A. Generator QR Code (Pembuat QR)
Mengonversi input data teks menjadi QR Code dengan berbagai tipe data khusus:
*   **Tautan/URL:** Mengonversi website, link pembayaran, portofolio, dll.
*   **Konfigurasi Wi-Fi:** Menghasilkan QR Code yang berisi SSID, kata sandi, dan jenis enkripsi jaringan (WPA/WEP). Pemindaian menggunakan kamera HP akan secara otomatis menghubungkan perangkat ke jaringan tersebut tanpa input manual.
*   **Kartu Nama Digital (vCard):** Menghasilkan QR Code berisi informasi kontak (Nama, No. Telepon, Email, Alamat, Website). Pemindaian akan langsung memicu HP untuk menyimpan kontak baru.
*   **Teks Bebas:** Mengonversi pesan teks biasa atau catatan instruksi.

#### Kustomisasi Premium (Estetika Apple):
*   **Jenis Piksel (Dots Styling):** Opsi untuk mengubah blok piksel kotak kaku standar menjadi bulat (*rounded dots*) atau piksel cair (*smooth pixels*).
*   **Skema Warna:** Pilihan warna solid, atau gradasi warna mewah (*gradient background/foreground*).
*   **Penyisipan Logo:** Kemampuan mengunggah logo kustom (format PNG/JPG) atau memilih logo media sosial bawaan (WhatsApp, Instagram, LinkedIn, Youtube) untuk ditempatkan tepat di tengah QR Code dengan penyesuaian tingkat koreksi kesalahan (*error correction level*) otomatis.

---

### B. Pemindai QR Code (Scanner)
Mengekstrak teks atau link dari QR Code secara cepat melalui dua metode:
*   **Live Webcam Scanner:** Akses kamera bawaan perangkat untuk memindai QR Code fisik secara real-time.
*   **File Decoder (Upload Gambar):** Seret & lepas (*drag-and-drop*) gambar tangkapan layar (*screenshot*) QR Code untuk langsung didecode dan dibaca isinya secara instan tanpa perlu kamera HP kedua.

---

## 2. Rencana Antarmuka (UI/UX)
Mengikuti pedoman **Apple Human Interface Guidelines (HIG)**:
*   **Dua Tab Utama:** Navigasi di bagian atas untuk berpindah antara tab **BUAT QR** (Generate) dan **PINDAI QR** (Scan).
*   **Form Kontrol Kustom:** Menggunakan elemen dropdown kustom bergaya Apple (dengan ikon centang aktif dan pop-up mengambang *glassmorphism*).
*   **Drag-and-Drop Dropzone:** Area dropzone file gambar yang bersih dengan animasi berpendar lembut saat disorot.
*   **Frame Slider:** Penggeser ukuran QR Code dan ukuran margin menggunakan penggeser ramping dengan tombol bulat elastis.

---

## 3. Arsitektur & Dependensi Frontend (100% Offline)
*   **QR Code Generator:** Menggunakan library JavaScript `qrcode` (lokal).
*   **QR Code Scanner:** Menggunakan library `html5-qrcode` (lokal) untuk deteksi kamera real-time yang cepat dan decoding gambar statis yang efisien.
*   **Keamanan Data:** Pemrosesan data sepenuhnya berjalan secara internal di memori browser pengguna (*client-side*). Tidak ada data Wi-Fi, kontak, atau URL yang dikirim ke server luar.
