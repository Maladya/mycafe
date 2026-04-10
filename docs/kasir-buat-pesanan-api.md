# API Docs - Kasir Buat Pesanan

Dokumentasi ini untuk kebutuhan fitur kasir membuat pesanan langsung dari halaman kasir.

## Endpoint

- **Method**: `POST`
- **URL**: `/api/orders/kasir`
- **Auth**: Bearer token kasir/admin

Contoh:

`POST /api/orders/kasir`

## Body Request (JSON)

```json
{
  "table_number": "12",
  "customer_name": "Budi",
  "note": "Tanpa es",
  "items": [
    {
      "menu_id": 101,
      "qty": 2,
      "note": "Pedas level 2",
      "variants": [
        { "variant_id": 9001, "qty": 2 }
      ]
    }
  ],
  "payment_method": "kasir"
}
```

## Validasi Minimum (Backend)

- `table_number` wajib.
- `items` wajib, minimal 1 item.
- Tiap item wajib punya `menu_id` dan `qty >= 1`.
- Jika `variants` dikirim, `variant_id` harus valid untuk `menu_id` terkait.

## Response Sukses (contoh)

Status: `201 Created`

```json
{
  "success": true,
  "message": "Pesanan berhasil dibuat",
  "data": {
    "id": "ORD-KSR001",
    "status": "selesai",
    "delivery_status": "siap",
    "is_delivered": false,
    "table_number": "12",
    "customer_name": "Budi",
    "total": 46000,
    "items": [
      { "menu_id": 101, "name": "Ayam Geprek", "qty": 2, "price": 23000 }
    ]
  }
}
```

## Response Gagal (contoh)

### 400 Bad Request

```json
{
  "success": false,
  "message": "items minimal 1"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 422 Unprocessable Entity

```json
{
  "success": false,
  "message": "menu_id tidak valid"
}
```

## Catatan Integrasi FE

1. Setelah `POST` sukses, FE kasir perlu refetch list `GET /api/orders/admin` agar order baru langsung muncul.
2. Untuk tab pengantaran kasir saat ini, order yang baru dibuat idealnya memiliki:
   - `status = selesai`
   - `delivery_status = siap`
   - `is_delivered = false`
3. Jika backend memakai nama field lain (misalnya `meja`, `nama_pelanggan`, `order_items`), FE bisa menyesuaikan mapping saat integrasi final.
