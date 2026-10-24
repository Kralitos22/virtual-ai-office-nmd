# Panduan Build & Test Lokal — Virtual AI Office NMD
Berisi tahapan menjalankan proyek dari nol, uji, dan deploy.

## 1. Prasyarat
- Node.js 18+ (disarankan 20 LTS), npm 9+.
- RAM minimal 1.5 GB bebas (transform Vite besar). Di VPS 1.9 GB, perlu swapfile 2 GB:
```
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab   # agar permanen (opsional)
```
Tanpa swap, `npm run build` bisa OOM-kill (exit 137).

## 2. Install dependency
```
cd virtual-ai-office-nmd
npm install
npm install-scripts approve esbuild   # hanya jika npm warn install-scripts
```

## 3. Jalankan dev server (hot reload)
```
npm run dev
# buka http://localhost:3000
```

## 4. Build produksi
```
npm run build
# hasil di dist/
# catatan: NODE_OPTIONS="--max-old-space-size=1200" npm run build  jika RAM kecil
```

## 5. Preview build (tes seperti produksi)
```
npm exec serve dist -l 4173
# buka http://localhost:4173  — verifikasi:
#  - hover agent → ID card
#  - klik agent di 3D → panel komisaris (approve/reject/pause/resume/inject)
#  - tombol kanban pojok kanan-bawah
#  - badge approval global
```

## 6. Tes otomatis (headless, opsional)
```python
pip install playwright
```
yang sudah terpasang: gunakan `python3` langsung (playwright sudah importable).

## 7. Deploy ke live
Dist folder siap deploy ke Vercel/Netlify/layanan static hosting:
- Vercel: `vercel --prod`
- Netlify: `netlify deploy` (publish dir `dist/`)
- Atau arsip `dist/` di server own.

## 8. Koneksi WebSocket real (menggantikan demo mode)
Set env `VITE_SOCKET_URL` ke URL server orkestrator (contoh `wss://office.nebula.example/socket`). Tanpa itu, app jalan demo mode (setTimeout simulasi).

```bash
VITE_SOCKET_URL=wss://office.nebula.example/sock npm run build
```

Event yang didukung frontend (backend kirim ini):
- `AGENT_STATUS_UPDATE` — update state agent
- `TASK_HANDOFF` — beam antar meja + notifikasi
- `COMMISSIONER_INJECT` — instruksi dari komisaris

Contoh payload WebSocket sesuai PRD Bab 10C:
```json
{ "event": "AGENT_STATUS_UPDATE", "agent_id": "NMD-SMM-002", "status": "WORKING", "task": "Menulis Caption IG", "requires_approval": false }
```
Jika `requires_approval: true` → frontend otomatis set status WAITING_APPROVAL + notif global.

## 9. Uji fitur (dengan browser headless)
- Buka `http://localhost:4173`
- Restart kali ini semua agent aktif koordinatnya ada di store

## 10. Troubleshooting
- Build OOM → tambah swap, kurangi heap.
- Layar hitam → pastikan WebGL dukung browser / GPU.
- Hover HTML overlay intercept klik HUD → client handling (sudah di-set `pointer-events-none`).

Selesai — ready live.
