# BÁO CÁO ĐỒ ÁN CUỐI KỲ

---

**TRƯỜNG ĐẠI HỌC SÀI GÒN**  
**KHOA CÔNG NGHỆ THÔNG TIN**

---

**BÁO CÁO ĐỒ ÁN CUỐI KỲ**

Học phần: **Các công nghệ lập trình hiện đại**

Đề tài: **Xây dựng hệ thống quản lý phòng trọ tích hợp Blockchain và AI**  
*(RentalContract DApp — Ứng dụng ký hợp đồng thuê phòng trên Blockchain)*

---

**Giảng viên hướng dẫn:** Phùng Thái Thiên Trang

**Các thành viên thực hiện:**

| Họ và tên | Mã số sinh viên |
|---|---|
| [Họ tên thành viên 1] | [MSSV] |
| [Họ tên thành viên 2] | [MSSV] |

**Tháng 5/2026**

---

## MỤC LỤC

- Phần I. Giới thiệu đồ án
- Phần II. Nội dung chính
  - I. Giới thiệu công nghệ lập trình sử dụng
  - II. Mô-đun ứng dụng quản lý
    - 1. Màn hình chính
    - 2. Quản lý phòng trọ
    - 3. Quản lý hợp đồng
    - 4. Quản lý hóa đơn & thanh toán
    - 5. Quản lý tài khoản (Admin)
  - III. Mô-đun AI / Tư vấn
- Phần III. Tổng kết
- Phần IV. Phụ lục

---

## PHẦN I. GIỚI THIỆU ĐỒ ÁN

### 1. Bối cảnh và vấn đề

Thị trường cho thuê phòng trọ tại Việt Nam hiện nay gặp nhiều vấn đề:
- Hợp đồng giấy dễ bị làm giả, chỉnh sửa, mất mát
- Tranh chấp giữa chủ nhà và người thuê do thiếu bằng chứng rõ ràng
- Quản lý thu tiền thủ công, dễ nhầm lẫn, thiếu minh bạch
- Không có hệ thống tập trung để theo dõi tình trạng hợp đồng

### 2. Giải pháp đề xuất

Xây dựng ứng dụng web **RentalContract DApp** — hệ thống quản lý phòng trọ tích hợp:
- **Blockchain (Polygon)**: Lưu hash hợp đồng bất biến, ký số song phương
- **Cloud Database (PostgreSQL/Neon)**: Lưu trữ dữ liệu đầy đủ, truy vấn nhanh
- **AI Chatbot (Google Gemini)**: Tư vấn tìm phòng, hỗ trợ người dùng
- **QR Thanh toán (VietQR)**: Tạo mã QR tự động cho từng hóa đơn

### 3. Mục tiêu

- Đảm bảo tính **bất biến** và **toàn vẹn** của hợp đồng thuê phòng
- Ngăn chặn việc **chỉnh sửa, giả mạo** hợp đồng sau khi ký
- Xây dựng hệ thống quản lý **minh bạch**, dễ sử dụng cho cả 3 vai trò
- Tích hợp **AI** hỗ trợ tư vấn người dùng

### 4. Phạm vi

| Đối tượng | Chức năng |
|---|---|
| **Chủ nhà (Landlord)** | Đăng phòng, tạo hợp đồng, tạo hóa đơn, ký blockchain |
| **Người thuê (Tenant)** | Tìm phòng, ký hợp đồng, thanh toán QR |
| **Quản trị viên (Admin)** | Duyệt phòng, quản lý tài khoản, thống kê doanh thu |

---

## PHẦN II. NỘI DUNG CHÍNH

---

## I. GIỚI THIỆU CÔNG NGHỆ LẬP TRÌNH SỬ DỤNG

### 1. Frontend — Next.js 14

**Next.js 14** là framework React hỗ trợ Server-Side Rendering (SSR) và App Router.

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| Next.js | 14.2 | Framework chính, routing, SSR |
| React | 18.3 | UI components |
| TypeScript | 5.4 | Type safety |
| TailwindCSS | 3.4 | Utility-first CSS styling |
| Framer Motion | 11.0 | Animation, transition |
| Ethers.js | 6.13 | Tương tác blockchain, MetaMask |
| React Hot Toast | 2.4 | Thông báo toast |
| React Icons | 5.0 | Icon library |

**Lý do chọn Next.js**: App Router cho phép tổ chức code theo tính năng, hỗ trợ SSR giúp SEO tốt hơn, tích hợp tốt với TypeScript.

### 2. Backend — Node.js + Express

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| Express | 4.19 | REST API framework |
| TypeScript | 5.4 | Type safety |
| Prisma ORM | 5.14 | Database access, migrations |
| JWT (jsonwebtoken) | 9.0 | Authentication token |
| bcryptjs | 2.4 | Mã hóa mật khẩu |
| Zod | 3.23 | Validation schema |
| PDFKit | 0.15 | Xuất file PDF hợp đồng |
| Ethers.js | 6.13 | Tương tác blockchain từ server |
| @google/generative-ai | 0.24 | Google Gemini AI SDK |

**Lý do chọn Express + Prisma**: Express linh hoạt, Prisma cung cấp type-safe database access và migration tự động.

### 3. Database — PostgreSQL (Neon Cloud)

**PostgreSQL** là hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ, hỗ trợ JSON, array, full-text search.

**Neon**: Dịch vụ PostgreSQL serverless trên cloud, hỗ trợ connection pooling, auto-scaling.

**Prisma ORM**: Tạo type-safe queries, quản lý migration, generate TypeScript types từ schema.

### 4. Blockchain — Solidity + Polygon Amoy

| Công nghệ | Mục đích |
|---|---|
| **Solidity 0.8.24** | Ngôn ngữ viết smart contract |
| **Hardhat 2.22** | Framework phát triển, test, deploy |
| **Polygon Amoy Testnet** | Mạng blockchain (Chain ID: 80002) |
| **Ethers.js 6.13** | SDK tương tác blockchain |
| **MetaMask** | Ví điện tử, ký giao dịch |

**Lý do chọn Polygon**: Chi phí gas thấp hơn Ethereum mainnet ~100 lần, tốc độ xác nhận nhanh (~2 giây), tương thích EVM.

**Kiến trúc Hybrid (Off-chain + On-chain)**:
- **Off-chain (PostgreSQL)**: Lưu toàn bộ dữ liệu hợp đồng (nhanh, rẻ, dễ query)
- **On-chain (Blockchain)**: Chỉ lưu SHA-256 hash (bất biến, minh bạch, không thể giả mạo)

### 5. AI — Google Gemini

**Google Gemini API** cung cấp mô hình ngôn ngữ lớn (LLM) cho chatbot tư vấn.

- Model sử dụng: `gemini-2.5-flash` (ưu tiên), fallback sang `gemini-2.0-flash`, `gemini-1.5-flash`
- Context: Dữ liệu phòng trọ thực từ database được inject vào system prompt
- Chức năng: Tư vấn tìm phòng, giải đáp thắc mắc về hợp đồng, hướng dẫn sử dụng

---

---

## II. MÔ-ĐUN ỨNG DỤNG QUẢN LÝ

### 1. Màn hình chính (Trang chủ)

**Mô tả**: Landing page giới thiệu hệ thống, điều hướng đến các tính năng chính.

**Các thành phần trên màn hình**:
- Header: Logo, menu điều hướng (Trang chủ, Hợp đồng, Phòng trọ, Thanh toán, Giới thiệu), nút Đăng nhập/Dashboard
- Hero section: Tiêu đề, mô tả ngắn, nút CTA "Tìm phòng ngay" và "Tạo hợp đồng"
- Features section: 4 tính năng nổi bật (Blockchain, AI, QR, PDF)
- AI Chatbot: Nút chat nổi góc phải màn hình

**Dữ liệu input**: Không có (trang tĩnh)  
**Dữ liệu output**: Điều hướng đến các trang tương ứng

---

### 2. Quản lý phòng trọ

#### 2.1 Danh sách phòng (Tìm phòng)

**Mô tả**: Hiển thị tất cả phòng đã được admin duyệt (`approvalStatus = APPROVED`), hỗ trợ lọc và tìm kiếm.

**Các thành phần**:
- Thanh tìm kiếm: Nhập từ khóa (tên phòng, địa chỉ, thành phố)
- Bộ lọc: Loại phòng (Phòng trọ / Căn hộ / Nhà nguyên căn / Khách sạn), Khoảng giá, Tình trạng (Còn trống / Đã thuê)
- Grid card: Mỗi card hiển thị ảnh, tên, địa chỉ, giá, loại, tình trạng
- Nút "Xem chi tiết" → trang chi tiết phòng

**Dữ liệu input**:
- Query params: `city`, `type`, `minPrice`, `maxPrice`, `available`

**Dữ liệu output**:
- Danh sách phòng đã lọc, kèm thông tin chủ nhà (tên, SĐT, Facebook, Zalo)

**Xử lý**:
```
GET /api/properties?city=...&type=...&available=true
→ Prisma query: WHERE approvalStatus = 'APPROVED' AND ...filters
→ Trả về mảng Property kèm owner info
```

#### 2.2 Chi tiết phòng

**Mô tả**: Xem đầy đủ thông tin phòng, liên hệ chủ nhà.

**Các thành phần**:
- Gallery ảnh phòng
- Thông tin: Tiêu đề, địa chỉ đầy đủ, diện tích, số phòng ngủ/WC
- Giá thuê/tháng, tiền đặt cọc
- Tiện nghi (danh sách)
- Thông tin chủ nhà: Tên, SĐT, Facebook, Zalo
- Nút "Tạo hợp đồng" (chỉ hiện với LANDLORD)

**Dữ liệu input**: `id` từ URL params  
**Dữ liệu output**: Object Property đầy đủ

#### 2.3 Đăng tin phòng (Chủ nhà)

**Mô tả**: Form cho chủ nhà đăng tin phòng mới. Phòng mới tạo có `approvalStatus = PENDING`, cần admin duyệt mới hiển thị công khai.

**Các thành phần form**:
- Tiêu đề phòng (bắt buộc, tối thiểu 5 ký tự)
- Loại phòng: dropdown (Phòng trọ / Căn hộ / Nhà nguyên căn / Khách sạn)
- Địa chỉ: Số nhà + đường, Phường/Xã, Quận/Huyện, Thành phố
- Giá thuê/tháng (VNĐ), Tiền đặt cọc (VNĐ)
- Diện tích (m²), Số phòng ngủ, Số phòng tắm
- Mô tả chi tiết
- Tiện nghi: checkbox (Điều hòa, Nóng lạnh, Tủ lạnh, Máy giặt, ...)
- Upload ảnh

**Dữ liệu input**:
```json
{
  "title": "Phòng trọ sinh viên",
  "type": "ROOM",
  "address": "123 Nguyễn Trãi",
  "city": "TP.HCM", "district": "Quận 1", "ward": "Phường Bến Thành",
  "price": 3500000, "deposit": 7000000,
  "area": 25, "bedrooms": 1, "bathrooms": 1,
  "amenities": ["Điều hòa", "Nóng lạnh"]
}
```

**Dữ liệu output**: Property object với `approvalStatus = "PENDING"`

**Xử lý**:
```
POST /api/properties (yêu cầu role LANDLORD)
→ Validate với Zod schema
→ Kiểm tra role === 'LANDLORD'
→ Tạo Property với approvalStatus = 'PENDING'
→ Admin duyệt → approvalStatus = 'APPROVED' → hiển thị công khai
```

---

### 3. Quản lý hợp đồng

#### 3.1 Danh sách hợp đồng

**Mô tả**: Hiển thị tất cả hợp đồng của user hiện tại (cả vai trò chủ nhà lẫn người thuê).

**Các thành phần**:
- Bộ lọc theo trạng thái: Tất cả / Bản nháp / Chờ ký / Đang hiệu lực / Hết hạn / Đã hủy
- Bảng hợp đồng: Tên phòng, Chủ nhà, Người thuê, Giá thuê, Thời hạn, Trạng thái
- Badge màu theo trạng thái (xám/vàng/xanh/đỏ)
- Nút "Xem chi tiết"

**Trạng thái hợp đồng**:

| Trạng thái | Ý nghĩa |
|---|---|
| `DRAFT` | Vừa tạo, chưa ai ký |
| `PENDING` | Một bên đã ký, chờ bên còn lại |
| `ACTIVE` | Cả 2 đã ký, đang hiệu lực |
| `EXPIRED` | Hết hạn theo ngày kết thúc |
| `TERMINATED` | Đã hủy trước hạn |

#### 3.2 Tạo hợp đồng (Chủ nhà)

**Mô tả**: Chủ nhà tạo hợp đồng cho người thuê cụ thể.

**Các thành phần form**:
- Chọn phòng: dropdown danh sách phòng của chủ nhà
- Email người thuê: nhập email tài khoản đã đăng ký
- Ngày bắt đầu / Ngày kết thúc
- Giá thuê/tháng (tự điền từ phòng, có thể chỉnh)
- Tiền đặt cọc
- Ngày thanh toán hàng tháng (1-31)
- Điều khoản hợp đồng (textarea, có template mặc định)

**Dữ liệu input**:
```json
{
  "propertyId": "uuid",
  "tenantEmail": "tenant@email.com",
  "startDate": "2026-06-01",
  "endDate": "2027-06-01",
  "monthlyRent": 4500000,
  "deposit": 9000000,
  "paymentDay": 5,
  "terms": "Điều khoản hợp đồng..."
}
```

**Dữ liệu output**: Contract object với `status = "DRAFT"` và `contractHash` (SHA-256)

**Xử lý sinh hash**:
```javascript
SHA-256(propertyId + landlordId + tenantId + startDate + endDate + monthlyRent + terms + timestamp)
→ "03dc3642c0855e0767d63e4c8642e6cc..."
```

Sau khi tạo, nếu người thuê đã có ví MetaMask → tự động gọi `createContract()` trên blockchain.

#### 3.3 Ký hợp đồng (Blockchain)

**Mô tả**: Cả chủ nhà và người thuê đều phải ký bằng MetaMask. Hợp đồng chỉ có hiệu lực khi cả 2 đã ký.

**Luồng ký**:

```
Bước 1: Kết nối MetaMask
  → Chuyển sang mạng Polygon Amoy (Chain ID: 80002)
  → Lấy địa chỉ ví

Bước 2: Ký off-chain (xác nhận danh tính)
  → signMessage("Ký hợp đồng thuê phòng\nID: ...\nPhòng: ...\nGiá: ...")
  → MetaMask hiện popup xác nhận
  → Trả về chữ ký hex (signature)

Bước 3: Ký on-chain (ghi lên blockchain)
  → Kiểm tra hợp đồng đã tồn tại on-chain chưa
  → Nếu chưa (landlord ký đầu tiên): gọi createContract(hash, tenantWallet, deposit, rent)
  → Gọi signContract(hash)
  → Chờ transaction confirm (~2 giây trên Polygon)
  → Lấy txHash

Bước 4: Lưu vào database
  → POST /api/contracts/:id/sign { signature, txHash }
  → Nếu cả 2 đã ký → status = 'ACTIVE'
```

**Gas fee**: Tự động lấy từ network, đảm bảo tối thiểu 30 Gwei (yêu cầu của Polygon Amoy).

**Dữ liệu input**: `{ signature: "0x...", txHash: "0x..." }`  
**Dữ liệu output**: Contract với `status = "ACTIVE"`, `signedAt`, `blockchainTxHash`

#### 3.4 Xác minh hợp đồng (Public)

**Mô tả**: Bất kỳ ai cũng có thể xác minh hợp đồng bằng hash mà không cần đăng nhập.

**Cách xác minh**:
1. Truy cập `GET /api/contracts/verify/{hash}`
2. Hệ thống query blockchain: `verifyContract(hash)`
3. Trả về: tồn tại hay không, địa chỉ landlord/tenant, thời gian ký, trạng thái

**Ý nghĩa**: Chứng minh hợp đồng không bị chỉnh sửa — nếu nội dung thay đổi, hash sẽ khác.

#### 3.5 Xuất PDF hợp đồng

**Mô tả**: Sau khi hợp đồng có trạng thái `ACTIVE`, cả 2 bên có thể tải PDF.

**Nội dung PDF**:
- Tiêu đề "HỢP ĐỒNG THUÊ NHÀ/DỊCH VỤ"
- Mã hợp đồng, trạng thái, contract hash
- Thông tin Bên A (chủ nhà): Họ tên, email, SĐT, địa chỉ ví
- Thông tin Bên B (người thuê): Họ tên, email, SĐT, địa chỉ ví
- Thông tin phòng: Tên, địa chỉ đầy đủ
- Điều khoản hợp đồng
- Thông tin thanh toán: Giá thuê, tiền cọc, ngày thanh toán
- Thời hạn: Ngày bắt đầu, ngày kết thúc
- Trạng thái ký kết, thời gian ký, blockchain tx hash

---

### 4. Quản lý hóa đơn & Thanh toán

#### 4.1 Tạo hóa đơn (Chủ nhà)

**Mô tả**: Chủ nhà tạo hóa đơn hàng tháng cho từng hợp đồng đang hoạt động.

**Các thành phần form**:
- Chọn hợp đồng (dropdown)
- Tháng / Năm
- Số tiền (tự điền từ giá thuê, có thể thêm điện nước)
- Mô tả (VD: "Tiền phòng tháng 5 + điện 150k + nước 50k")
- Ngày hạn chót đóng tiền

**Dữ liệu input**:
```json
{
  "contractId": "uuid",
  "amount": 4800000,
  "description": "Tiền phòng T5 + điện 150k + nước 150k",
  "month": 5, "year": 2026,
  "dueDate": "2026-05-05"
}
```

**Xử lý**:
- Kiểm tra `landlordId === userId` (chỉ chủ nhà của hợp đồng mới tạo được)
- Kiểm tra không trùng tháng/năm cho cùng hợp đồng
- Tạo Invoice với `status = "UNPAID"`

#### 4.2 Thanh toán hóa đơn (Người thuê)

**Mô tả**: Người thuê xem danh sách hóa đơn và thanh toán qua QR VietQR.

**Màn hình danh sách**:
- Banner tổng tiền cần đóng
- Phân chia: "Chưa thanh toán" (đỏ) / "Đã thanh toán" (xanh)
- Mỗi hóa đơn: Tháng, tên phòng, chủ nhà, số tiền, hạn đóng
- Hóa đơn quá hạn: Highlight màu đỏ, icon cảnh báo

**Modal thanh toán**:
- Header gradient tím với thông tin hóa đơn
- Số tiền nổi bật
- **QR Code VietQR**: Tự động tạo từ `img.vietqr.io` với:
  - Ngân hàng chủ nhà (VD: MB Bank)
  - Số tài khoản chủ nhà
  - Số tiền chính xác
  - Nội dung: "Thanh toan tien nha T5/2026 [Tên phòng]"
- Thông tin chuyển khoản (có nút copy từng trường)
- Nút **"Tôi đã chuyển khoản xong"** → cập nhật `status = "PAID"` ngay lập tức

**Dữ liệu input**: Invoice ID  
**Dữ liệu output**: Invoice với `status = "PAID"`, `paidAt = now()`

**Xử lý**:
```
PUT /api/invoices/:id/status { status: "PAID" }
→ Kiểm tra userId là landlord hoặc tenant của hợp đồng
→ Update status + paidAt
→ Admin/Chủ nhà thấy cập nhật ngay
```

**Trạng thái hóa đơn**:

| Trạng thái | Ý nghĩa | Màu |
|---|---|---|
| `UNPAID` | Chưa đóng | Đỏ |
| `PAID` | Đã đóng | Xanh lá |
| `OVERDUE` | Quá hạn, chưa đóng | Cam |

---

### 5. Quản lý tài khoản (Admin Panel)

#### 5.1 Dashboard thống kê

**Mô tả**: Trang tổng quan cho admin với 2 tab.

**Tab "Tổng quan"**:
- 4 KPI cards: Tổng phòng, Người dùng, Hợp đồng, Doanh thu/tháng
- 3 Revenue cards: Dự kiến thu / Đã thu / Chưa thu (theo năm)
- Biểu đồ bar: Hợp đồng theo 6 tháng gần nhất
- Biểu đồ phân bố loại phòng
- Biểu đồ thu chi từng tháng (xanh = đã thu, đỏ = chưa thu)

**Tab "Theo chủ nhà"**:
- Danh sách chủ nhà dạng card, mỗi card có:
  - Tên, email
  - Dự kiến / Đã thu / Còn nợ
  - Progress bar màu theo tỷ lệ thu (xanh ≥80%, vàng ≥50%, đỏ <50%)
- Bấm vào 1 chủ nhà → xem chi tiết từng tháng:
  - 4 KPI: Dự kiến / Đã thu / Còn nợ / Tỷ lệ %
  - Biểu đồ bar từng tháng với % đã thu
  - Tổng số hóa đơn đã thu / còn nợ

**Dữ liệu input**: `year` (năm cần xem)  
**Dữ liệu output**: Thống kê tổng hợp từ bảng Invoice

#### 5.2 Duyệt phòng

**Mô tả**: Admin xem và duyệt/từ chối các phòng chủ nhà đăng.

**Các thành phần**:
- Grid card phòng với badge trạng thái duyệt
- Phòng `PENDING`: Hiển thị nút "Duyệt" (xanh) và "Từ chối" (đỏ)
- Phòng `REJECTED`: Hiển thị nút "Duyệt lại"
- Modal từ chối: Nhập lý do từ chối

**Xử lý**:
```
POST /api/admin/properties/:id/approve → approvalStatus = 'APPROVED'
POST /api/admin/properties/:id/reject  → approvalStatus = 'REJECTED', rejectionReason = ...
```

#### 5.3 Quản lý tài khoản (Chủ nhà & Người thuê)

**Mô tả**: Admin quản lý tài khoản với 2 tab riêng biệt.

**Tab "Chủ nhà"** — Hiển thị dạng cây phân cấp:
- Mỗi chủ nhà có nút expand → xem danh sách phòng
- Mỗi phòng hiển thị: Tên, địa chỉ, trạng thái duyệt, người thuê hiện tại
- Badge trạng thái tài khoản: "Hoạt động" (xanh) / "Bị khóa" (đỏ)
- Nút "Khóa" / "Mở khóa"

**Tab "Người thuê"**:
- Danh sách người thuê với thông tin phòng đang thuê
- Nút "Khóa" / "Mở khóa"

**Modal khóa tài khoản**: Nhập lý do khóa  
**Xử lý**:
```
POST /api/admin/users/:id/ban   → status = 'BANNED', banReason = ...
POST /api/admin/users/:id/unban → status = 'ACTIVE', banReason = null
```
Tài khoản bị BANNED không thể đăng nhập (kiểm tra trong login API).

#### 5.4 Quản lý hợp đồng (Admin)

**Mô tả**: Admin xem và can thiệp vào hợp đồng.

**Các thao tác**:
- Xem chi tiết hợp đồng (tất cả thông tin)
- Override trạng thái (chuyển sang bất kỳ trạng thái nào)
- Hủy hợp đồng với lý do (`status = TERMINATED`)
- Xóa hợp đồng (xóa cứng khỏi DB)

#### 5.5 Quản lý hóa đơn (Admin)

**Mô tả**: Admin xem tất cả hóa đơn toàn hệ thống.

**Các thành phần**:
- 4 summary cards: Tổng / Đã thu / Chưa thu / Quá hạn
- Bộ lọc: Tháng, Năm, Trạng thái
- Bảng hóa đơn: Kỳ thu, Người thuê, Chủ nhà, Phòng, Số tiền, Trạng thái, Ngày đóng
- Hóa đơn quá hạn: Highlight nền đỏ nhạt
- Nút "Đã thu" → cập nhật PAID
- Nút "Đánh dấu quá hạn" → tự động đánh dấu OVERDUE tất cả hóa đơn UNPAID đã qua hạn

---

---

## III. MÔ-ĐUN AI / TƯ VẤN

### 1. Các chức năng AI thực hiện

**RentalBot** — Chatbot tư vấn tích hợp trên trang web, hiển thị dưới dạng nút chat nổi góc phải màn hình.

| Chức năng | Mô tả |
|---|---|
| **Tư vấn tìm phòng** | Gợi ý phòng phù hợp theo khu vực, giá, loại phòng |
| **Hướng dẫn sử dụng** | Giải thích cách đăng tin, tạo hợp đồng, thanh toán |
| **Giải đáp thắc mắc** | Trả lời câu hỏi về hợp đồng, điều khoản, pháp lý |
| **Hỗ trợ blockchain** | Giải thích về ký số, MetaMask, Polygon |

### 2. Dataset / Dữ liệu đầu vào

AI không dùng dataset tĩnh mà sử dụng **dữ liệu thực từ database** được inject vào system prompt mỗi lần chat:

```
DANH SÁCH PHÒNG HIỆN CÓ:
1. [CÒN TRỐNG] Phòng trọ sinh viên | 3.000.000 VND/tháng | 
   123 Nguyễn Trãi, Quận 1, TP.HCM | LH: Nguyễn Văn A (0901234567) | ROOM
2. [ĐÃ THUÊ] Căn hộ mini Quận 7 | 5.500.000 VND/tháng | ...
```

Lấy tối đa 10 phòng mới nhất từ `prisma.property.findMany({ take: 10 })`.

### 3. Cài đặt mô hình AI

**Mô hình**: Google Gemini (Large Language Model)

**Cơ chế fallback** — Thử lần lượt các model:
```
gemini-2.5-flash → gemini-2.0-flash-lite → gemini-2.0-flash → gemini-1.5-flash
```
Nếu gặp lỗi 429 (rate limit) → chờ 2 giây rồi thử model tiếp theo.

**System Prompt Engineering**:
- Định nghĩa vai trò: "RentalBot — trợ lý AI của hệ thống quản lý phòng trọ"
- Quy tắc trả lời: Ngắn gọn, dùng emoji, mỗi ý xuống dòng riêng
- Inject dữ liệu phòng thực từ DB
- Mô tả các tính năng hệ thống
- Ví dụ cách trả lời mẫu (few-shot prompting)

**Chat history**: Lưu lịch sử hội thoại phía client, gửi kèm mỗi request để AI có context.

### 4. Kết quả

**Ví dụ tương tác**:

> **User**: Tôi muốn tìm phòng ở Quận 1, giá dưới 4 triệu
>
> **RentalBot**: Tôi tìm thấy 1 phòng phù hợp:
> 
> 🏠 Phòng trọ sinh viên Làng Đại học  
> 💰 3.000.000 VND/tháng  
> 📍 123 Nguyễn Trãi, Quận 1, TP.HCM  
> 📞 Anh Nguyễn Văn Chủ: 0901234567  
> 
> Bạn muốn xem thêm thông tin không? 😊

**Điểm mạnh**:
- Dữ liệu phòng luôn cập nhật theo thời gian thực
- Không cần training, chỉ cần cấu hình API key
- Fallback tự động khi model bị rate limit

**Hạn chế**:
- Phụ thuộc vào Gemini API (cần internet, có thể bị rate limit)
- Không có memory dài hạn (mỗi session là độc lập)

---

---

## PHẦN III. TỔNG KẾT

### 1. Kết quả đạt được

#### Về kỹ thuật

| Tính năng | Trạng thái |
|---|---|
| Đăng ký / Đăng nhập / Phân quyền 3 role | ✅ Hoàn thành |
| Đăng phòng, tìm kiếm, lọc phòng | ✅ Hoàn thành |
| Tạo hợp đồng + sinh SHA-256 hash | ✅ Hoàn thành |
| Ký hợp đồng song phương trên blockchain | ✅ Hoàn thành |
| Xác minh hợp đồng công khai bằng hash | ✅ Hoàn thành |
| Xuất PDF hợp đồng | ✅ Hoàn thành |
| Tạo hóa đơn hàng tháng | ✅ Hoàn thành |
| Thanh toán QR VietQR tự động | ✅ Hoàn thành |
| Admin: Duyệt phòng, ban/unban user | ✅ Hoàn thành |
| Admin: Thống kê doanh thu theo chủ nhà | ✅ Hoàn thành |
| AI Chatbot tư vấn (Google Gemini) | ✅ Hoàn thành |
| Khóa tài khoản bị ban | ✅ Hoàn thành |
| Block sửa phòng khi có hợp đồng ACTIVE | ✅ Hoàn thành |

#### Về nghiệp vụ

Hệ thống đã mô phỏng đầy đủ quy trình quản lý phòng trọ thực tế:
- Chủ nhà đăng phòng → Admin duyệt → Người thuê tìm phòng
- Tạo hợp đồng → Ký blockchain → Hợp đồng có hiệu lực
- Tạo hóa đơn hàng tháng → Người thuê thanh toán QR → Admin theo dõi

#### Điểm nổi bật

**Tích hợp Blockchain thực sự** (không phải giả lập):
- Smart contract đã deploy trên Polygon Amoy Testnet
- Địa chỉ: `0x9ca6b55b70b5b4e968D5785D21364De4E7BE1C8B`
- Có thể xem trên: https://amoy.polygonscan.com

**Kiến trúc Hybrid Off-chain + On-chain**:
- Lưu dữ liệu đầy đủ trong PostgreSQL (nhanh, rẻ)
- Chỉ lưu hash trên blockchain (bất biến, minh bạch)
- Tối ưu chi phí gas, không cần lưu toàn bộ hợp đồng on-chain

### 2. Ưu điểm — Khuyết điểm

#### Ưu điểm

- **Bảo mật cao**: Hợp đồng được hash và lưu blockchain, không thể giả mạo
- **Minh bạch**: Bất kỳ ai cũng có thể xác minh hợp đồng bằng hash
- **Đầy đủ nghiệp vụ**: Từ đăng phòng đến thanh toán, quản lý admin
- **UX tốt**: Giao diện hiện đại, responsive, animation mượt
- **AI hỗ trợ**: Chatbot tư vấn với dữ liệu thực từ DB
- **QR thanh toán**: Tích hợp VietQR, tự động điền số tiền

#### Khuyết điểm

- **Chưa có cron job**: Hóa đơn phải tạo thủ công, không tự động theo tháng
- **Chưa có email notification**: Không gửi email khi hợp đồng tạo/hóa đơn đến hạn
- **Chưa có trang profile**: User chưa có UI để cập nhật thông tin ngân hàng
- **Phụ thuộc MetaMask**: Cần cài extension, có thể khó với người dùng không quen blockchain
- **Testnet**: Đang dùng Polygon Amoy Testnet, chưa deploy mainnet

### 3. Các vấn đề cần cải tiến / phát triển

| Tính năng | Mức độ ưu tiên |
|---|---|
| Cron job tự động tạo hóa đơn hàng tháng | Cao |
| Cron job tự động ACTIVE → EXPIRED khi hết hạn | Cao |
| Trang profile: cập nhật thông tin ngân hàng | Trung bình |
| Email notification (hóa đơn đến hạn, hợp đồng mới) | Trung bình |
| Tính năng gia hạn hợp đồng | Trung bình |
| Đánh giá / Review phòng và chủ nhà | Thấp |
| Upload ảnh phòng lên cloud (Cloudinary/S3) | Thấp |
| Deploy lên mainnet (Polygon) | Thấp |
| Mobile app (React Native) | Thấp |

---

## PHẦN IV. PHỤ LỤC

### 1. Hướng dẫn cài đặt

#### Yêu cầu

- Node.js >= 18
- MetaMask browser extension
- Tài khoản Neon (PostgreSQL cloud) hoặc PostgreSQL local
- POL token trên Polygon Amoy (faucet: https://faucet.polygon.technology/)

#### Các bước cài đặt

```bash
# 1. Clone repository
git clone <repo-url>
cd rental-contract-dapp

# 2. Cài dependencies
cd backend  && npm install
cd ../frontend && npm install
cd ../contracts && npm install

# 3. Cấu hình backend/.env
DATABASE_URL="postgresql://..."
JWT_SECRET=your-secret-key
PORT=5000
GEMINI_API_KEY=your-gemini-key
CONTRACT_ADDRESS=0x9ca6b55b70b5b4e968D5785D21364De4E7BE1C8B

# 4. Cấu hình frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CHAIN_ID=80002
NEXT_PUBLIC_CONTRACT_ADDRESS=0x9ca6b55b70b5b4e968D5785D21364De4E7BE1C8B

# 5. Khởi tạo database
cd backend
npx prisma db push
npx prisma generate

# 6. Tạo tài khoản admin
node -e "require('./create-admin')"  # hoặc chạy script tạo admin

# 7. Chạy development
# Terminal 1:
cd backend && npm run dev   # → http://localhost:5000

# Terminal 2:
cd frontend && npm run dev  # → http://localhost:3000
```

#### Tài khoản demo

| Role | Email | Password |
|---|---|---|
| Admin | admin@rental.com | Admin@123 |
| Chủ nhà | chunha@demo.com | 123456 |
| Người thuê | nguoithue@demo.com | 123456 |

### 2. Địa chỉ trang web đồ án

- **GitHub**: [Điền link GitHub repository]
- **Google Drive**: [Điền link Google Drive báo cáo]
- **Smart Contract**: https://amoy.polygonscan.com/address/0x9ca6b55b70b5b4e968D5785D21364De4E7BE1C8B

### 3. Cảm nhận sau khi làm đồ án

#### Kiến thức thu được

**Về công nghệ**:
- Hiểu sâu về kiến trúc Full-stack (Next.js + Express + PostgreSQL)
- Nắm vững cách tích hợp Blockchain vào ứng dụng web thực tế
- Học được cách viết Smart Contract Solidity và deploy lên testnet
- Hiểu về Hybrid Architecture (Off-chain + On-chain) và lý do tại sao không nên lưu tất cả lên blockchain
- Thực hành với Prisma ORM, JWT authentication, Zod validation
- Tích hợp AI (Google Gemini) vào ứng dụng thực tế với prompt engineering

**Về nghiệp vụ**:
- Hiểu quy trình quản lý phòng trọ thực tế
- Biết cách phân tích yêu cầu và thiết kế database schema
- Học được cách phân quyền hệ thống (RBAC)

#### Kỹ năng phát triển

- Làm việc nhóm, phân chia công việc
- Debug và xử lý lỗi trong môi trường phức tạp (blockchain + backend + frontend)
- Đọc và áp dụng documentation của các thư viện mới
- Tư duy bảo mật: phân quyền, validate input, hash password

#### Thái độ

- Kiên nhẫn khi gặp lỗi blockchain (gas fee, network issues)
- Chủ động tìm hiểu công nghệ mới (Solidity, Hardhat, Ethers.js)
- Tinh thần cầu tiến, không ngại thử nghiệm và sửa lỗi

---

*Báo cáo được hoàn thành tháng 5/2026*  
*Nhóm Q+T — Khoa Công nghệ Thông tin, Trường Đại học Sài Gòn*
