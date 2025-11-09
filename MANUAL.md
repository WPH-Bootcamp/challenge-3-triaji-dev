# 📖 MANUAL PENGGUNA - HABIT TRACKER

## Daftar Isi
1. [Pendahuluan](#pendahuluan)
2. [Memulai Aplikasi](#memulai-aplikasi)
3. [Kelola Profil](#kelola-profil)
4. [Kelola Kebiasaan](#kelola-kebiasaan)
5. [Fitur Pengingat](#fitur-pengingat)
6. [Tips & Trik](#tips--trik)

---

## Pendahuluan

**Habit Tracker** adalah aplikasi CLI (Command Line Interface) untuk membantu Anda membangun dan melacak kebiasaan baik. Aplikasi ini mendukung multi-profil, sehingga bisa digunakan oleh beberapa orang.

### Fitur Utama:
- ✅ Multi-profil pengguna
- 📊 Pelacakan progress dengan visualisasi bar
- 🔔 Pengingat otomatis
- 📈 Statistik dan analisis kebiasaan
- 📝 Kategorisasi kebiasaan
- 🏆 Sistem streak (hari berturut-turut)
- 💾 Penyimpanan data otomatis

---

## Memulai Aplikasi

### Instalasi & Menjalankan

1. **Pastikan Node.js sudah terinstal** di komputer Anda
2. **Buka terminal/command prompt**
3. **Navigasi ke folder aplikasi**
4. **Jalankan perintah:**
   ```bash
   node app.js
   ```

### Penggunaan Pertama Kali

Saat pertama kali menjalankan aplikasi, Anda akan diminta:

1. **Memasukkan nama Anda**
   ```
   Bolehkah kami mengetahui nama Anda? John Doe
   ```

2. **Pilihan membuat contoh kebiasaan**
   ```
   Ingin kami buatkan contoh kebiasaan? (y/n): y
   ```
   - Ketik `y` untuk membuat 5 contoh kebiasaan
   - Ketik `n` untuk memulai dengan kebiasaan kosong

### Login (Pengguna Lama)

Jika sudah pernah menggunakan aplikasi, Anda akan melihat **menu login**:

```
PILIH PROFIL
============================================================
1. John Doe (5 kebiasaan)
   Bergabung: 09/11/2025
2. Jane Smith (3 kebiasaan)
   Bergabung: 08/11/2025
3. Buat Profil Baru
------------------------------------------------------------
Pilih profil (1-3): 
```

Pilih nomor profil Anda atau buat profil baru.

---

## Kelola Profil

### Menu Utama → Kelola Profil (Opsi 1)

```
KELOLA PROFIL
============================================================
1. Lihat Profil Saya
2. Ganti Profil
3. Buat Profil Baru
4. Hapus Profil
------------------------------------------------------------
0. Kembali ke Menu Utama
```

### 1. Lihat Profil Saya

Menampilkan informasi lengkap profil Anda:
- Nama pengguna
- Lama bergabung (hari)
- Total kebiasaan
- Kebiasaan selesai minggu ini
- Streak saat ini
- Streak terbaik

**Contoh Output:**
```
PROFIL PENGGUNA
============================================================
Nama             : John Doe
Bergabung        : 15 hari yang lalu
Total Kebiasaan  : 8
Selesai Minggu   : 5
Streak Saat Ini  : 7 hari
Streak Terbaik   : 12 hari
============================================================
```

### 2. Ganti Profil

Untuk beralih ke profil lain:
1. Pilih opsi `2`
2. Akan muncul daftar semua profil
3. Ketik nomor profil yang ingin digunakan
4. Atau ketik `0` untuk membatalkan

**Catatan:** Kebiasaan akan otomatis berganti sesuai profil yang dipilih.

### 3. Buat Profil Baru

Untuk menambah profil pengguna baru:
1. Pilih opsi `3`
2. Masukkan nama profil baru
3. Profil akan langsung aktif dengan kebiasaan kosong

### 4. Hapus Profil

Untuk menghapus profil:
1. Pilih opsi `4`
2. Pilih nomor profil yang akan dihapus
3. Konfirmasi dengan mengetik `y`

**Catatan:** 
- Tidak bisa menghapus profil terakhir
- Data kebiasaan profil yang dihapus akan hilang permanen

---

## Kelola Kebiasaan

### Menu Utama → Kelola Kebiasaan (Opsi 2)

```
KELOLA KEBIASAAN
============================================================
Tampilan:
1. Lihat Semua Kebiasaan
2. Lihat per Kategori
3. Kebiasaan Aktif Saja
4. Kebiasaan Selesai Saja
------------------------------------------------------------
Analisis:
5. Lihat Statistik
6. Lihat Riwayat (7 hari)
------------------------------------------------------------
Aksi:
7. Tambah Kebiasaan Baru
8. Tandai Kebiasaan Selesai
9. Edit Kebiasaan
10. Hapus Kebiasaan
------------------------------------------------------------
0. Kembali ke Menu Utama
```

### Tampilan Kebiasaan

#### 1. Lihat Semua Kebiasaan

Menampilkan semua kebiasaan dengan informasi:
- Status: `[X]` (Selesai) / `[~]` (Selesai hari ini) / `[ ]` (Belum)
- Nama kebiasaan
- Kategori
- Target dan progress mingguan
- **Progress bar visual** (30 karakter)
- Streak hari berturut-turut

**Contoh Output:**
```
SEMUA KEBIASAAN
============================================================

1. [~] Minum Air 8 Gelas (Selesai Hari Ini)
   Kategori: Kesehatan
   Target: 7x/minggu | Progress: 6/7 (86%)
   ██████████████████████████▒▒▒▒ 86%
   Streak: 5 hari berturut-turut

2. [ ] Olahraga 30 Menit
   Kategori: Kesehatan
   Target: 5x/minggu | Progress: 3/5 (60%)
   ██████████████████▒▒▒▒▒▒▒▒▒▒▒▒ 60%
   Streak: 0 hari berturut-turut
============================================================
```

#### 2. Lihat per Kategori

Menampilkan kebiasaan dikelompokkan berdasarkan kategori (Kesehatan, Produktivitas, Hobi, dll).

#### 3. Kebiasaan Aktif Saja

Hanya menampilkan kebiasaan yang **belum selesai** minggu ini.

#### 4. Kebiasaan Selesai Saja

Hanya menampilkan kebiasaan yang **sudah selesai** minggu ini.

### Analisis

#### 5. Lihat Statistik

Menampilkan statistik lengkap:
- Total kebiasaan
- Kebiasaan aktif vs selesai
- Progress rata-rata
- Total penyelesaian minggu ini
- Kebiasaan dengan streak terpanjang

**Contoh:**
```
STATISTIK KEBIASAAN
============================================================
Total Kebiasaan         : 8
Aktif                   : 3
Selesai                 : 5
Progress Rata-rata      : 78.5%
Total Selesai Minggu Ini: 42 kali

Streak Terpanjang:
   "Minum Air 8 Gelas" - 12 hari
============================================================
```

#### 6. Lihat Riwayat (7 hari)

Menampilkan riwayat penyelesaian kebiasaan selama 7 hari terakhir.

**Contoh:**
```
RIWAYAT PENYELESAIAN (7 Hari Terakhir)
============================================================

Sab, 02 Nov:
   [X] Minum Air 8 Gelas
   [X] Meditasi 10 Menit
   [X] Belajar Coding

Min, 03 Nov:
   (Tidak ada penyelesaian)

Sen, 04 Nov:
   [X] Minum Air 8 Gelas
   [X] Olahraga 30 Menit
============================================================
```

### Aksi

#### 7. Tambah Kebiasaan Baru

Langkah-langkah:

1. **Pilih opsi 7**
2. **Masukkan nama kebiasaan:**
   ```
   Nama kebiasaan: Membaca Buku
   ```

3. **Masukkan target per minggu (1-7):**
   ```
   Target per minggu (1-7): 5
   ```

4. **Pilih kategori:**
   ```
   Pilih Kategori:
   K - Kesehatan
   P - Produktivitas
   H - Hobi
   U - Umum
   L - Lainnya (Custom)
   
   Pilihan (K/P/H/U/L): H
   ```
   
   - Atau pilih `L` untuk kategori custom:
   ```
   Pilihan (K/P/H/U/L): L
   Masukkan nama kategori: Spiritual
   ```

5. Kebiasaan baru berhasil ditambahkan! ✅

#### 8. Tandai Kebiasaan Selesai

Untuk menandai kebiasaan yang sudah dilakukan hari ini:

1. **Pilih opsi 8**
2. **Daftar kebiasaan akan ditampilkan**
3. **Ketik nomor kebiasaan yang selesai:**
   ```
   Nomor kebiasaan yang selesai (atau 0 untuk batal): 3
   ```
4. Konfirmasi keberhasilan akan muncul

**Catatan:** 
- Satu kebiasaan hanya bisa diselesaikan sekali per hari
- Jika sudah diselesaikan hari ini, akan muncul pesan informasi

#### 9. Edit Kebiasaan

Untuk mengubah kebiasaan yang sudah ada:

1. **Pilih opsi 9**
2. **Pilih nomor kebiasaan yang akan diedit**
3. **Edit informasi** (kosongkan jika tidak ingin mengubah):
   ```
   Edit "Olahraga 30 Menit"
   (Kosongkan jika tidak ingin mengubah)
   
   Nama baru [Olahraga 30 Menit]: Olahraga 45 Menit
   Target baru [5]: 6
   
   Kategori saat ini: Kesehatan
   Ubah kategori? (y/n): n
   ```

#### 10. Hapus Kebiasaan

Untuk menghapus kebiasaan:

1. **Pilih opsi 10**
2. **Pilih opsi hapus:**
   ```
   Opsi Hapus:
   1. Hapus kebiasaan tertentu
   2. Hapus semua kebiasaan
   0. Batal
   ```

**Opsi 1 - Hapus Tertentu:**
- Pilih nomor kebiasaan
- Konfirmasi dengan `y`

**Opsi 2 - Hapus Semua:**
- Ketik `HAPUS SEMUA` (KAPITAL, persis) untuk konfirmasi
- Semua kebiasaan akan dihapus

---

## Fitur Pengingat

### Mengaktifkan Pengingat

Dari **Menu Utama**, pilih opsi `9`:
```
9. Reminder (NONAKTIF)
```

Setelah diaktifkan, status akan berubah:
```
9. Reminder (AKTIF)
```

### Cara Kerja Pengingat

- Muncul otomatis **setiap 10 detik**
- Hanya muncul jika ada kebiasaan yang belum selesai hari ini
- **Otomatis pause** saat Anda sedang mengetik/input data
- Menampilkan daftar kebiasaan yang belum diselesaikan

**Contoh Tampilan:**
```
------------------------------------------------------------
PENGINGAT KEBIASAAN HARI INI :
1. Olahraga 30 Menit (3/5)
2. Membaca Buku 30 Menit (2/5)
3. Meditasi 10 Menit (5/7)
------------------------------------------------------------
Notifikasi: AKTIF
Pesan ini muncul setiap 10 detik.
Matikan notifikasi melalui menu utama.
```

### Menonaktifkan Pengingat

Pilih opsi `9` lagi dari Menu Utama untuk mematikan.

---

## Tips & Trik

### 🎯 Membangun Kebiasaan Efektif

1. **Mulai dengan target realistis**
   - Jangan langsung 7x/minggu untuk kebiasaan baru
   - Mulai dari 3-4x/minggu, naikkan bertahap

2. **Gunakan kategori dengan bijak**
   - Kelompokkan kebiasaan sejenis
   - Mudah memantau balance hidup Anda

3. **Manfaatkan streak**
   - Streak memotivasi Anda untuk konsisten
   - Jangan putus rantai streak!

4. **Review statistik rutin**
   - Cek progress rata-rata setiap minggu
   - Identifikasi kebiasaan yang perlu ditingkatkan

### 💡 Fitur Shortcut

Dari **Menu Utama**, ada beberapa shortcut cepat:

- **Opsi 3**: Langsung lihat semua kebiasaan
- **Opsi 4**: Langsung tambah kebiasaan baru
- **Opsi 5**: Langsung tandai kebiasaan selesai

Gunakan shortcut untuk akses lebih cepat!

### 📊 Memaksimalkan Progress Bar

Progress bar visual (30 karakter) membantu Anda:
- Melihat sekilas progress tanpa hitung manual
- Memotivasi untuk menyelesaikan target
- Membandingkan progress antar kebiasaan

### 🔄 Multi-Profil

Manfaatkan multi-profil untuk:
- **Keluarga**: Setiap anggota punya profil sendiri
- **Personal vs Professional**: Pisahkan kebiasaan kerja dan pribadi
- **Eksperimen**: Coba strategi berbeda di profil berbeda

### 💾 Backup Data

Data tersimpan di file `habits-data.json`:
- **Backup berkala** file ini untuk keamanan
- Copy ke cloud storage atau USB
- Restore dengan mengganti file jika diperlukan

### ⚡ Navigasi Cepat

- Ketik `0` dari menu manapun untuk kembali
- Tekan `Enter` saja untuk lanjutkan (pada prompt konfirmasi)
- Semua input **case-insensitive** untuk huruf pilihan

### 📅 Reset Mingguan

- Progress mingguan dihitung dari **Minggu-Sabtu**
- Reset otomatis setiap minggu baru
- Streak tetap terjaga selama Anda konsisten harian

---

## Troubleshooting

### Aplikasi tidak bisa dijalankan
- Pastikan Node.js terinstal: `node --version`
- Pastikan berada di folder yang benar
- Cek apakah file `app.js` ada

### Data hilang
- Cek apakah file `habits-data.json` masih ada
- Jangan hapus file tersebut secara manual
- Restore dari backup jika ada

### Pengingat tidak muncul
- Pastikan pengingat sudah diaktifkan (Menu Utama → Opsi 9)
- Pengingat tidak muncul jika semua kebiasaan hari ini sudah selesai
- Pengingat tidak muncul jika belum ada kebiasaan

### Progress tidak akurat
- Progress dihitung per minggu (Minggu-Sabtu)
- Pastikan sudah menandai kebiasaan yang selesai
- Cek tanggal sistem komputer Anda

---

## Penutup

Selamat menggunakan **Habit Tracker**! 🎉

> "Kita adalah apa yang kita lakukan berulang kali. Keunggulan, oleh karena itu, bukanlah tindakan, tetapi kebiasaan." - Aristoteles

**Tetap semangat membangun kebiasaan baik!** 💪

---

**Butuh bantuan lebih lanjut?**  
Hubungi developer atau baca dokumentasi teknis di `README.md`
