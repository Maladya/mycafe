# API Docs - Kasir Pengantaran Pesanan

Dokumentasi ini menjelaskan request dari frontend kasir untuk mengubah pesanan dari tab **Siap Diantar** menjadi **Sudah Diantar**.

## Endpoint

- **Method**: `PATCH`
- **URL**: `/api/orders/kasir/:id/status`
- **Auth**: Bearer token kasir/admin

Contoh:

`PATCH /api/orders/kasir/ORD-MNR2H6IR-51SY/status`

## Body Request (JSON)

Frontend mengirim payload berikut saat tombol **Tandai Selesai** diklik di tab *Siap Diantar*:

```json
{
  "delivery_status": "diantar",
  "status_pengantaran": "diantar",
  "is_delivered": true
}
```

## Tujuan Perubahan

- Order tetap dianggap **selesai** (status pesanan utama sudah selesai).
- Flag pengantaran diset supaya order berpindah dari tab:
  - **Siap Diantar** -> **Sudah Diantar**

## Response Sukses (contoh)

Status: `200 OK`

```json
{
  "status": 200,
  "message": "Status pesanan berhasil diperbarui",
  "data": {
    "id": "ORD-MNR2H6IR-51SY",
    "delivery_status": "diantar",
    "status_pengantaran": "diantar",
    "is_delivered": true
  },
  "success": true
}
```

## Response Gagal (contoh)

### 401 Unauthorized

```json
{
  "status": 401,
  "message": "Unauthorized",
  "data": null,
  "success": false
}
```

### 404 Not Found

```json
{
  "status": 404,
  "message": "Pesanan tidak ditemukan",
  "data": null,
  "success": false
}
```

### 500 Internal Server Error

```json
{
  "status": 500,
  "message": "Gagal memperbarui status pengantaran",
  "data": null,
  "success": false
}
```

## Catatan Implementasi Backend

1. Backend menerima field pengantaran di endpoint kasir status:
   - `delivery_status`
   - `status_pengantaran`
   - `is_delivered`
2. Jika backend sudah punya field canonical sendiri, backend boleh mapping field di atas ke field internal.
3. Agar kompatibel dengan frontend saat ini, simpan minimal salah satu indikator:
   - `is_delivered = true`, atau
   - `delivery_status/status_pengantaran` bernilai `diantar`.

