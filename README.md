# Kelas Guru

**Kelas Guru** adalah aplikasi web manajemen kelas dan pembelajaran (LMS ringan) untuk lingkungan sekolah: guru mengelola kelas, materi, penilaian, dan aktivitas siswa; siswa mengakses tugas, kursus, ujian, dan progres mereka dari satu tempat.

Proyek ini adalah monorepo **Next.js 15** (App Router) dengan TypeScript, UI **Tailwind + shadcn/ui**, animasi **Framer Motion**, state URL dengan **nuqs**, dan palet peran **Guru** (UI bersih, “pure” shadcn) vs **Siswa** (gaya neo-brutalist Gen-Z).

---

## Apa yang bisa dilakukan aplikasi?

| Area | Ringkasan |
|------|-----------|
| **Kelas & anggota** | Buat kelas, undang siswa, atur peran guru/siswa. |
| **Presensi** | Catat kehadiran dan lihat rekap. |
| **Tugas & nilai** | Buat tugas, kumpulkan jawaban, beri nilai dan umpan balik. |
| **LMS / kursus** | Susun kursus (modul, pelajaran), konten rich text (TipTap), assign ke kelas, pelacakan progres siswa. |
| **CBT / ujian** | Bank soal, sesi ujian, pengaturan waktu dan pengumpulan. |
| **Gamifikasi & jurnal** | XP, level, streak; jurnal refleksi siswa. |
| **Analitik (guru)** | Ringkasan engagement dan aktivitas pembelajaran. |

Alur utama: **autentikasi** → **dashboard** sesuai peran → **kelas / kursus / ujian** sesuai izin.

---

## Stack teknis (inti)

| Lapisan | Teknologi |
|---------|-----------|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Data | **PostgreSQL** via **Supabase**, **Prisma ORM** (`prisma/`, skema di `schema.prisma`) |
| Auth | Supabase Auth (klien di aplikasi; detail variabel di `README-SUPABASE.md`) |
| UI | Tailwind CSS, shadcn/ui, Radix, ikon Lucide |
| Konten LMS | TipTap (editor rich text) |
| Lainnya | TanStack Table, nuqs, kbar, Vitest (tes) |

> **Setup backend lengkap** (URL database, service role, bucket Storage): ikuti **[README-SUPABASE.md](./README-SUPABASE.md)**.

---

## Menjalankan proyek secara lokal

```bash
npm install
```

Salin `.env.example` ke `.env` lalu isi variabel (detail di **[README-SUPABASE.md](./README-SUPABASE.md)**):

- `DATABASE_URL`, `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

`postinstall` menjalankan `prisma generate` dan `prisma db push` — pastikan koneksi database valid.

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Perintah lain:

```bash
npm run build   # build produksi
npm run lint    # ESLint
npm test        # Vitest
```

---

## Struktur folder (ringkas)

```
src/
  app/           # route App Router (guru, siswa, auth, API)
  actions/       # server actions (bisnis + integrasi Supabase/Prisma)
  components/    # UI bersama & per peran
  lib/           # utilitas, klien DB, helpers
prisma/          # skema Prisma
public/          # aset statis
```

Dokumentasi tambahan untuk kontributor/AI ada di **AGENTS.md** dan subfolder **AGENTS.md** di `src/actions`, `src/components`, `src/app`.

---

## Lisensi & sumber

Proyek ini dikembangkan sebagai **template/source code** Kelas Guru (lihat juga paket distribusi / dokumentasi penjual jika Anda membeli lisensi).

---

*README ini menjelaskan gambaran produk dan stack saat ini. Untuk detail deploy (mis. Vercel) dan troubleshooting koneksi DB, rujuk **README-SUPABASE.md**.*
