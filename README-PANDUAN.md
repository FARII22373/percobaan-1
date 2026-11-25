# SIP-Salaman — GitHub Pages + Supabase + GeoServer

Versi statis ini mengubah halaman PHP menjadi HTML/JavaScript agar dapat dipublikasikan melalui GitHub Pages. Login/registrasi menggunakan Supabase Auth. Layer spasial tetap berasal dari GeoServer.

## Isi folder
- `index.html`: dashboard
- `login.html`: login dan registrasi
- `peta.html`: peta interaktif Leaflet + WMS + GetFeatureInfo
- `olah_spasial.html`: alat digitasi/pengolahan spasial di browser
- `config.js`: konfigurasi Supabase dan endpoint GeoServer
- `auth.js`: autentikasi Supabase dan proteksi halaman

## 1. Konfigurasi Supabase
1. Buat project di https://supabase.com/dashboard.
2. Buka **Project Settings → API** (atau API Keys).
3. Salin Project URL.
4. Salin **publishable key** (atau legacy `anon` public key).
5. Buka `config.js`, isi:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
6. Jangan pernah memasukkan `service_role` / secret key ke `config.js` atau repository GitHub.

Contoh:
```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://abcdefghijk.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_....",
  GEOSERVER_WMS_URL: "https://YOUR-TUNNEL.trycloudflare.com/geoserver/wms"
};
```

Autentikasi memakai Supabase Auth; tidak diperlukan tabel akun buatan sendiri. Username disimpan pada `user_metadata.username`. Pendaftaran menggunakan email + kata sandi, dengan username sebagai nama tampilan.

## 2. Pengaturan URL autentikasi Supabase
Di Supabase Dashboard → Authentication → URL Configuration:
- Site URL: URL GitHub Pages, misalnya `https://USERNAME.github.io/SIP-Salaman/`
- Redirect URLs: tambahkan `https://USERNAME.github.io/SIP-Salaman/**`
- Untuk pengujian lokal, boleh tambahkan `http://localhost:5500/**`.

Jika email confirmation aktif, pengguna harus mengklik tautan konfirmasi email sebelum login. Sesuaikan template email bila perlu.

## 3. GeoServer
`config.js` sudah berisi endpoint Quick Tunnel yang dipakai saat pembuatan paket:
`https://tested-dip-underwear-comparable.trycloudflare.com/geoserver/wms`

Alamat Quick Tunnel bersifat sementara. Jika temanmu menghentikan CMD atau membuat tunnel baru, URL dapat berubah. Perbarui `GEOSERVER_WMS_URL` di `config.js` setiap kali URL berubah. Untuk penggunaan berkelanjutan, gunakan named tunnel + domain tetap atau host GeoServer pada server yang selalu aktif.

Layer yang digunakan:
- `tugas_sip:Data_Persil_Borobudur`
- `tugas_sip:Data_Persil_Salaman`
- `tugas_sip:Data_Persil_Tempuran`

### CORS untuk GetFeatureInfo
WMS tile dapat ditampilkan sebagai gambar lintas domain, tetapi `GetFeatureInfo` menggunakan `fetch()` dan memerlukan CORS. Konfigurasikan GeoServer/reverse proxy agar mengizinkan origin GitHub Pages kamu, misalnya:
`https://USERNAME.github.io`
Jangan gunakan wildcard jika layanan juga membuka endpoint administrasi. Pastikan WMS yang boleh diakses anonim hanya layer yang memang dipublikasikan.

## 4. Publikasikan ke GitHub Pages
1. Buat/masuk ke repository GitHub.
2. Upload seluruh isi folder ini ke root repository (bukan folder bertingkat tambahan).
3. Pastikan `index.html` berada di root.
4. Repository → Settings → Pages.
5. Pada Build and deployment pilih **Deploy from a branch**.
6. Pilih branch `main`, folder `/ (root)`, lalu Save.
7. Tunggu deployment, buka URL GitHub Pages.

## 5. Catatan penting
- GitHub Pages hanya meng-host file statis; PHP tidak dijalankan. File PHP asli tidak digunakan oleh paket ini.
- Browser-side Supabase key adalah public/publishable key. Keamanan data harus diatur melalui Supabase Auth dan Row Level Security (RLS) pada tabel jika kelak dibuat.
- Jangan menyimpan password, service role key, atau kredensial administrator GeoServer di repository.
- Saat ini aplikasi mengamankan akses halaman melalui pemeriksaan sesi di browser. Ini cocok untuk tampilan aplikasi statis, tetapi bukan pengganti otorisasi server untuk data sensitif. Jangan menganggap halaman HTML tersembunyi sebagai proteksi data.
- GeoServer temanmu saat ini menggunakan Cloudflare Quick Tunnel. Laptop teman dan proses `cloudflared` serta GeoServer harus tetap hidup agar peta tersedia.
- Halaman dashboard, peta, dan olah spasial tetap memerlukan koneksi internet untuk CDN, basemap, Supabase, dan GeoServer.
