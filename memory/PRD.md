# PRD — simpanteks

## Original Problem Statement
Aplikasi PWA plain text manager (client-only) sesuai AGENTS.md pengguna: ultra-minimalis, mobile-first, IndexedDB, integrasi OpenRouter (API key lokal), banyak fitur AI, dan Support Card khusus di paling atas dengan alamat Base `zrcxvs.base.eth`.

## User Persona
- Developer/user pemula yang butuh **penyimpan teks polos** cepat di perangkat seluler, dengan struktur folder mendalam, pencarian isi, dan bantuan AI untuk menghasilkan / mengolah banyak file sekaligus.
- Komunikasi & UI: **Bahasa Indonesia**, sederhana dan langsung ke fungsi.

## Core Requirements (Static)
1. **Naming**: nama proyek 10 huruf lowercase → **`simpanteks`** (singkatan "simpan teks", mencerminkan fungsi inti). Dipakai konsisten: title, manifest, DB, metadata, backend, API header. Migrasi otomatis dari nama lama `plaintxtai` (IndexedDB & localStorage).
2. **UI/UX**: ultra-minimalis, mobile-first, warna solid flat (hitam-putih-neutral, aksen indigo tipis), tanpa gradient/glow/neon, spacing p-2/p-3 gap-1.5/2, semua dialog **top-anchored** (bukan bottom sheet), keyboard-aware via `100dvh`.
3. **Struktur data**: folder tanpa batas, subfolder tanpa batas, file plain text (tanpa markdown/rich/attachment).
4. **CRUD**: tambah, ubah nama folder/file, edit isi, hapus, salin, duplikat, pindah; drag & drop; breadcrumb; search (nama + isi).
5. **Multi-select**: short press = salin isi file ke clipboard; long press (~450ms) = masuk mode pilih; Select All + Clear Selection; operasi massal Move/Copy/Delete.
6. **Editor**: textarea fullscreen, autofocus, tanpa formatting; tombol back save otomatis; tombol hapus.
7. **Storage**: IndexedDB (`plaintxtai` DB → store `items`).
8. **Import/Export**: JSON lossless (menyimpan seluruh tree beserta order & timestamp).
9. **AI (OpenRouter)**: API key + model disimpan di localStorage; pilih model bebas; 8 mode — Generate, Rewrite, Ringkas, Terjemahkan, Gabungkan, Pecah, Perbaiki Tata Bahasa, Variasi Prompt. Output JSON `[{title, content}]`. Preview file + checkbox sebelum simpan; folder tujuan dipilih via FolderPicker.
10. **Support Card**: di paling atas halaman, QR (dapat diperbesar), Salin alamat, Kirim USDC/ETH → basescan, Reddit; tombol X sembunyikan 1 hari (localStorage timestamp).

## Architecture
- **Frontend (utama)**: Vite + React 19 + TypeScript + Tailwind v4, `idb` untuk IndexedDB, `qrcode.react`, `lucide-react`. Berjalan di port 3000 melalui supervisor `frontend` yang men-delegasi ke `/app` via shim `/app/frontend/package.json`.
- **Backend**: FastAPI minimal (`/api/health`) di port 8001. Aplikasi murni client-side; backend hanya untuk supervisor & health probe.
- **AI**: dipanggil langsung dari browser ke `https://openrouter.ai/api/v1/chat/completions` dengan header `HTTP-Referer` + `X-Title: plaintxtai`.

## What's Been Implemented (2026-01)
- ✅ Struktur & rename ke `plaintxtai`, manifest PWA, icon SVG, meta viewport keyboard-aware.
- ✅ Support Card + QR modal + copy + basescan + reddit + dismiss 1 hari.
- ✅ File tree IndexedDB (createItem, updateContent, renameItem, deleteMany rekursif, moveMany + validasi anti-cycle, copyMany deep, duplicateItem, reorderInParent).
- ✅ FileBrowser dengan short/long press, drag & drop (drop di folder = pindah masuk; drop antar item = reorder), menu titik-tiga.
- ✅ Multi-select bar: Select All, Move, Copy, Delete, Clear.
- ✅ Editor fullscreen autofocus + back + delete.
- ✅ FolderPicker (bisa navigasi + create folder baru + disabled anti-cycle).
- ✅ Search global (nama + isi) dengan label path.
- ✅ Import/Export JSON (replace atau merge dengan remap ID).
- ✅ AI Helper dengan 8 mode + settings API Key/model + preview checkbox + folder tujuan + error handling.
- ✅ Toast, keyboard-aware modals (top-anchored), tanpa gradient/glow.
- ✅ Testing subagent: 39/39 smoke checks passed.

## Prioritized Backlog (P0 / P1 / P2)
- **P1** — Reorder end-to-end drag pada mobile touch (uji lanjutan di device fisik).
- **P1** — PWA offline (service worker + precache aset Vite build) — saat ini manifest saja.
- **P2** — Fitur "salin banyak file → 1 clipboard gabungan" di selection bar.
- **P2** — Filter search hanya-nama vs hanya-isi + kasus terakhir dibuka (recent).
- **P2** — Tombol "Ekspor folder terpilih saja" (bukan semua).
- **P2** — Riwayat AI (log input/output terakhir) di localStorage.

## Next Tasks (setelah user review)
1. Uji fitur di device fisik (long-press, drag di iOS/Android).
2. Konfirmasi user apakah backup format cukup JSON, atau perlu ZIP-of-txt tambahan.
3. Iterasi visual (warna aksen, dark mode opsional).
4. Tambah PWA service worker jika user ingin offline penuh.
