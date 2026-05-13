# PHẦN II — MÔ-ĐUN ỨNG DỤNG QUẢN LÝ

> Tài liệu mô tả chi tiết từng màn hình/form của hệ thống RentalContract DApp.  
> Mỗi màn hình bao gồm: Mô tả thành phần UI · Dữ liệu Input · Dữ liệu Output · Xử lý dữ liệu.

---

## 1. MÀN HÌNH CHÍNH (TRANG CHỦ)

**Đường dẫn**: `/`  
**Quyền truy cập**: Công khai (không cần đăng nhập)

### Mô tả các thành phần

| Thành phần | Mô tả |
|---|---|
| **Navbar** | Logo "RC RentalContract", menu: Trang chủ · Hợp đồng · Phòng trọ · Thanh toán · Giới thiệu. Góc phải: nút địa chỉ ví MetaMask (nếu đã kết nối) + nút Dashboard |
| **Hero Section** | Tiêu đề lớn, mô tả ngắn về hệ thống, 2 nút CTA: "Tìm phòng ngay" và "Tạo hợp đồng" |
| **Features Section** | 4 card tính năng nổi bật: Blockchain bất biến · AI tư vấn · QR thanh toán · PDF hợp đồng |
| **AI Chatbot** | Nút chat nổi góc phải màn hình (icon bong bóng chat), click để mở cửa sổ chat với RentalBot |
| **Footer** | Thông tin liên hệ, link mạng xã hội, link nhanh đến các trang |

### Dữ liệu Input
Không có (trang tĩnh, không nhận input từ người dùng)

### Dữ liệu Output
- Điều hướng đến `/properties` khi bấm "Tìm phòng ngay"
- Điều hướng đến `/contracts/create` khi bấm "Tạo hợp đồng"
- Mở cửa sổ chat AI khi bấm nút chatbot

### Xử lý dữ liệu
Không có xử lý phức tạp. Trang render tĩnh, animation bằng Framer Motion.

---

## 2. QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG

### 2.1 Màn hình Đăng ký

**Đường dẫn**: `/auth/register`  
**Quyền truy cập**: Công khai

#### Mô tả các thành phần

| Thành phần | Loại | Bắt buộc | Mô tả |
|---|---|---|---|
| **Họ và tên** | Text input | ✅ | Icon người dùng, placeholder "Nguyễn Văn A" |
| **Email** | Email input | ✅ | Icon phong bì, placeholder "email@example.com" |
| **Số điện thoại** | Tel input | ❌ | Icon điện thoại, placeholder "0901234567" |
| **Mật khẩu** | Password input | ✅ | Icon khóa, tối thiểu 6 ký tự, nút hiện/ẩn mật khẩu |
| **Chọn vai trò** | Toggle button | ✅ | 2 lựa chọn: 🏠 Người thuê (mặc định) / 🏢 Chủ nhà |
| **Nút Đăng ký** | Submit button | — | Gradient tím-xanh, disabled khi đang xử lý |
| **Link Đăng nhập** | Hyperlink | — | "Đã có tài khoản? Đăng nhập" |

#### Dữ liệu Input
```json
{
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "phone": "0901234567",
  "password": "password123",
  "role": "TENANT" | "LANDLORD"
}
```

#### Dữ liệu Output
- Thành công: JWT token + thông tin user → lưu vào `localStorage`
- Thất bại: Thông báo lỗi (email đã tồn tại, mật khẩu quá ngắn, ...)

#### Xử lý dữ liệu
```
Bước 1: Validate form (HTML5 required + minLength)
Bước 2: POST /api/auth/register
Bước 3: Backend validate với Zod schema:
  - email: phải đúng định dạng email
  - password: tối thiểu 6 ký tự
  - fullName: tối thiểu 2 ký tự
  - role: chỉ chấp nhận 'LANDLORD' hoặc 'TENANT'
Bước 4: Kiểm tra email chưa tồn tại trong DB
Bước 5: Hash mật khẩu với bcrypt (salt rounds = 10)
Bước 6: Tạo user trong PostgreSQL
Bước 7: Sinh JWT token (payload: userId, email, role; expires: 7 ngày)
Bước 8: Trả về { user, token }
Bước 9: Frontend lưu token + user vào localStorage
Bước 10: Redirect → /dashboard
```

---

### 2.2 Màn hình Đăng nhập

**Đường dẫn**: `/auth/login`  
**Quyền truy cập**: Công khai

#### Mô tả các thành phần

| Thành phần | Loại | Bắt buộc | Mô tả |
|---|---|---|---|
| **Hộp tài khoản demo** | Info box | — | Nền xanh nhạt, hiển thị email/pass demo để test |
| **Email** | Email input | ✅ | Icon phong bì |
| **Mật khẩu** | Password input | ✅ | Icon khóa, nút hiện/ẩn mật khẩu (icon mắt) |
| **Nút Đăng nhập** | Submit button | — | Gradient tím-xanh, hiển thị "Đang đăng nhập..." khi loading |
| **Link Đăng ký** | Hyperlink | — | "Chưa có tài khoản? Đăng ký ngay" |

#### Dữ liệu Input
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Dữ liệu Output
- Thành công: JWT token + thông tin user đầy đủ (id, email, fullName, role, walletAddress, bankAccount, bankName, ...)
- Thất bại: "Email hoặc mật khẩu không đúng" / "Tài khoản đã bị khóa. Lý do: ..."

#### Xử lý dữ liệu
```
Bước 1: POST /api/auth/login
Bước 2: Tìm user theo email trong DB
Bước 3: So sánh mật khẩu với bcrypt.compare()
Bước 4: Kiểm tra status !== 'BANNED'
  → Nếu BANNED: trả về 403 + lý do khóa
Bước 5: Sinh JWT token
Bước 6: Trả về user (không có passwordHash) + token
Bước 7: Frontend lưu vào localStorage
Bước 8: Kiểm tra role:
  → role === 'ADMIN' → redirect /admin
  → role khác → redirect /dashboard
```

---

### 2.3 Màn hình Dashboard (Bảng điều khiển)

**Đường dẫn**: `/dashboard`  
**Quyền truy cập**: Đã đăng nhập

#### Mô tả các thành phần

| Thành phần | Mô tả |
|---|---|
| **Lời chào** | "Xin chào, [Tên người dùng]! 👋" + mô tả vai trò |
| **Card thông tin tài khoản** | Email, vai trò (🏢 Chủ nhà / 🏠 Người thuê), SĐT, địa chỉ ví MetaMask (rút gọn), nút Đăng xuất |
| **3 KPI cards** | Tổng bất động sản (icon nhà xanh) · Tổng hợp đồng (icon file tím) · Hợp đồng đang hoạt động (icon file xanh lá) |
| **Hành động nhanh** | Grid các nút: Đăng tin mới (chỉ LANDLORD) · Tạo hợp đồng (chỉ LANDLORD) · Tìm phòng · Thanh toán |

#### Dữ liệu Input
- JWT token từ localStorage (tự động gửi kèm request)

#### Dữ liệu Output
- Số lượng phòng, hợp đồng, hợp đồng đang hoạt động của user hiện tại

#### Xử lý dữ liệu
```
Bước 1: Đọc token + user từ localStorage
Bước 2: Nếu không có token → redirect /auth/login
Bước 3: Gọi song song 2 API:
  GET /api/properties → đếm số phòng
  GET /api/contracts  → đếm tổng HĐ + HĐ ACTIVE/SIGNED
Bước 4: Hiển thị stats
Bước 5: Render "Hành động nhanh" theo role:
  - LANDLORD: hiện thêm "Đăng tin mới" và "Tạo hợp đồng"
  - TENANT: chỉ hiện "Tìm phòng" và "Thanh toán"
```

---

---

## 3. QUẢN LÝ PHÒNG TRỌ (SẢN PHẨM)

### 3.1 Màn hình Danh sách phòng

**Đường dẫn**: `/properties`  
**Quyền truy cập**: Công khai

#### Mô tả các thành phần

| Thành phần | Mô tả |
|---|---|
| **Tiêu đề trang** | "Danh Sách Phòng Trọ" + mô tả ngắn |
| **Thanh tìm kiếm** | Input text với icon kính lúp, placeholder "Tìm theo tên phòng, địa chỉ, quận..." |
| **Nút Đăng Tin Mới** | Gradient button với icon +, điều hướng đến `/properties/create` |
| **Bộ lọc loại phòng** | 4 nút pill: Tất cả · Phòng trọ · Căn hộ · Nhà nguyên căn. Nút active có gradient xanh-tím |
| **Đếm kết quả** | "Tìm thấy X kết quả" |
| **Grid card phòng** | 3 cột (desktop), 2 cột (tablet), 1 cột (mobile). Mỗi card gồm: |
| — Ảnh phòng | Chiều cao 192px, fallback emoji 🏠 nếu không có ảnh |
| — Badge "Còn trống" | Góc trên phải, màu xanh lá |
| — Tên phòng | Font bold, line-clamp 1 dòng |
| — Địa chỉ | Icon pin đỏ + Quận, Thành phố |
| — Mô tả | 2 dòng, line-clamp |
| — Thông số | Diện tích (m²) · Phòng ngủ · Phòng tắm |
| — Giá thuê | Gradient xanh-tím, đơn vị "/tháng" |
| — Nút "Xem chi tiết" | Nền xanh, điều hướng đến `/properties/:id` |
| **Trạng thái rỗng** | Icon 🔍 + "Không tìm thấy phòng trọ nào" |

#### Dữ liệu Input
- Tìm kiếm: `searchQuery` (string) — lọc client-side
- Bộ lọc: `filter` (ALL / ROOM / APARTMENT / HOUSE) — lọc client-side

#### Dữ liệu Output
Danh sách phòng đã lọc, mỗi phòng gồm:
```json
{
  "id": "uuid",
  "title": "Phòng trọ sinh viên",
  "address": "123 Nguyễn Trãi",
  "district": "Quận 1", "city": "TP.HCM",
  "type": "ROOM",
  "price": 3500000, "deposit": 7000000,
  "area": 25, "bedrooms": 1, "bathrooms": 1,
  "images": ["url1", "url2"],
  "amenities": ["Wifi", "Điều hòa"],
  "available": true,
  "owner": { "fullName": "Nguyễn Văn A", "phone": "0901234567" }
}
```

#### Xử lý dữ liệu
```
Bước 1: GET /api/properties (không cần auth)
Bước 2: Backend query:
  WHERE approvalStatus = 'APPROVED'  ← chỉ phòng đã được admin duyệt
  AND các filter khác (city, type, price, available)
  ORDER BY createdAt DESC
Bước 3: Frontend nhận mảng properties
Bước 4: Lọc client-side theo searchQuery:
  title.includes(query) OR address.includes(query) OR city.includes(query)
Bước 5: Lọc theo type filter (ALL = không lọc)
Bước 6: Render grid với animation stagger (delay 0.1s mỗi card)
```

---

### 3.2 Màn hình Chi tiết phòng

**Đường dẫn**: `/properties/:id`  
**Quyền truy cập**: Công khai

#### Mô tả các thành phần

| Thành phần | Mô tả |
|---|---|
| **Gallery ảnh** | Ảnh chính full-width, thumbnail nhỏ bên dưới (nếu có nhiều ảnh) |
| **Tiêu đề + Badge** | Tên phòng lớn + badge "Còn trống" / "Đã thuê" |
| **Thông tin cơ bản** | Địa chỉ đầy đủ (số nhà, phường, quận, thành phố) |
| **Thông số phòng** | Grid: Diện tích · Phòng ngủ · Phòng tắm · Loại phòng |
| **Giá thuê** | Số tiền lớn gradient + tiền đặt cọc |
| **Mô tả chi tiết** | Nội dung mô tả đầy đủ |
| **Tiện nghi** | Danh sách chip: Wifi · Điều hòa · Nóng lạnh · ... |
| **Thông tin chủ nhà** | Avatar chữ cái đầu + Tên + SĐT + Facebook + Zalo |
| **Nút liên hệ** | Gọi điện / Nhắn Zalo / Nhắn Facebook |

#### Dữ liệu Input
- `id` từ URL params

#### Dữ liệu Output
Object Property đầy đủ kèm thông tin owner

#### Xử lý dữ liệu
```
GET /api/properties/:id
→ Prisma: findUnique({ where: { id }, include: { owner } })
→ Trả về property + owner (fullName, email, phone, facebook, zalo)
```

---

### 3.3 Màn hình Đăng tin phòng (Chủ nhà)

**Đường dẫn**: `/properties/create`  
**Quyền truy cập**: Đã đăng nhập (role LANDLORD)

#### Mô tả các thành phần

| Thành phần | Loại | Bắt buộc | Mô tả |
|---|---|---|---|
| **Tiêu đề** | Text input | ✅ | Icon nhà, placeholder "Phòng trọ cao cấp gần ĐH..." |
| **Loại phòng** | Toggle button grid | ✅ | 4 lựa chọn: 🏠 Phòng trọ · 🏢 Căn hộ · 🏘️ Nhà nguyên căn · 🏨 Khách sạn |
| **Mô tả** | Textarea | ✅ | 4 dòng, resize-none |
| **Địa chỉ** | Text input | ✅ | Icon pin, "Số nhà, tên đường" |
| **Thành phố** | Select dropdown | ✅ | Hồ Chí Minh · Hà Nội · Đà Nẵng · Cần Thơ |
| **Quận/Huyện** | Text input | ✅ | "Quận 10" |
| **Phường/Xã** | Text input | ❌ | "Phường 14" |
| **Giá thuê** | Number input | ✅ | Icon $, đơn vị VNĐ/tháng |
| **Tiền cọc** | Number input | ✅ | Đơn vị VNĐ |
| **Diện tích** | Number input | ✅ | Icon thước, đơn vị m² |
| **Số phòng ngủ** | Number input | ❌ | Min 0 |
| **Số phòng tắm** | Number input | ❌ | Min 0 |
| **Tiện nghi** | Checkbox grid | ❌ | 10 lựa chọn: Wifi · Điều hòa · Nóng lạnh · Tủ lạnh · Máy giặt · Bếp · Ban công · Thang máy · Bảo vệ · Bãi đậu xe |
| **Nút Hủy** | Button | — | Quay lại trang trước |
| **Nút Đăng Tin** | Submit button | — | Gradient, disabled khi loading |

#### Dữ liệu Input
```json
{
  "title": "Phòng trọ sinh viên Làng Đại học",
  "description": "Phòng sạch sẽ, thoáng mát, gần trường...",
  "address": "506/45 Nguyễn Xiển",
  "city": "Hồ Chí Minh",
  "district": "Quận 9",
  "ward": "Long Thạnh Mỹ",
  "type": "ROOM",
  "price": 4500000,
  "deposit": 9000000,
  "area": 25,
  "bedrooms": 1,
  "bathrooms": 1,
  "amenities": ["Wifi", "Điều hòa", "Nóng lạnh"]
}
```

#### Dữ liệu Output
```json
{
  "id": "uuid",
  "title": "...",
  "approvalStatus": "PENDING",
  "ownerId": "uuid-of-landlord",
  "createdAt": "2026-05-13T..."
}
```

#### Xử lý dữ liệu
```
Bước 1: Validate form (HTML5 required)
Bước 2: Parse số: price, deposit, area → parseFloat(); bedrooms, bathrooms → parseInt()
Bước 3: POST /api/properties với Authorization header
Bước 4: Backend kiểm tra role === 'LANDLORD'
  → Nếu không phải LANDLORD: 403 Forbidden
Bước 5: Validate với Zod schema:
  - title: min 5 ký tự
  - address: min 5 ký tự
  - price, deposit: số dương
  - type: enum ROOM/APARTMENT/HOUSE/HOTEL
Bước 6: Tạo Property trong DB với approvalStatus = 'PENDING'
  → Phòng chưa hiển thị công khai, chờ admin duyệt
Bước 7: Trả về property object
Bước 8: Frontend toast "Đăng tin thành công!" → redirect /properties
```

**Lưu ý quan trọng**: Phòng mới tạo có `approvalStatus = 'PENDING'`. Admin phải duyệt (`approvalStatus = 'APPROVED'`) thì phòng mới xuất hiện trong danh sách công khai.

---

---

## 4. QUẢN LÝ HỢP ĐỒNG (BÁN HÀNG)

### 4.1 Màn hình Danh sách hợp đồng

**Đường dẫn**: `/contracts`  
**Quyền truy cập**: Đã đăng nhập

#### Mô tả các thành phần

| Thành phần | Mô tả |
|---|---|
| **Tiêu đề** | "Quản Lý Hợp Đồng" + mô tả |
| **Bộ lọc trạng thái** | 6 nút pill: Tất cả · Nháp · Chờ ký · Đã ký · Đang hoạt động · Hết hạn |
| **Danh sách hợp đồng** | Mỗi item là card ngang, click → chi tiết |
| — Tên phòng + Badge trạng thái | Badge màu theo trạng thái (xám/vàng/xanh/đỏ) |
| — Địa chỉ phòng | Icon pin |
| — Chủ nhà + Người thuê | Tên 2 bên |
| — Giá thuê | Gradient xanh-tím, "/tháng" |
| — Thời hạn | Ngày bắt đầu → Ngày kết thúc |
| — Ngày ký | Hiển thị nếu đã ký |
| **Trạng thái rỗng** | Icon hợp đồng xám + "Chưa có hợp đồng nào" |

#### Màu badge theo trạng thái

| Trạng thái | Màu | Ý nghĩa |
|---|---|---|
| DRAFT | Xám | Vừa tạo, chưa ai ký |
| PENDING | Vàng | Một bên đã ký, chờ bên còn lại |
| SIGNED | Xanh dương | Cả 2 đã ký (trạng thái trung gian) |
| ACTIVE | Xanh lá | Đang có hiệu lực |
| EXPIRED | Đỏ | Hết hạn theo ngày kết thúc |
| TERMINATED | Xám đậm | Đã hủy trước hạn |

#### Dữ liệu Input
- JWT token (tự động)
- Query param `status` (tùy chọn)

#### Dữ liệu Output
Danh sách hợp đồng của user hiện tại (cả vai trò chủ nhà lẫn người thuê)

#### Xử lý dữ liệu
```
GET /api/contracts
→ Backend query:
  WHERE (landlordId = userId OR tenantId = userId)
  AND status = filter (nếu có)
  ORDER BY createdAt DESC
→ Include: property (title, address), landlord (fullName), tenant (fullName)
→ Frontend lọc thêm client-side theo filter state
```

---

### 4.2 Màn hình Tạo hợp đồng

**Đường dẫn**: `/contracts/create`  
**Quyền truy cập**: Đã đăng nhập (role LANDLORD)

#### Mô tả các thành phần

| Thành phần | Loại | Bắt buộc | Mô tả |
|---|---|---|---|
| **Chọn phòng trọ** | Select dropdown | ✅ | Danh sách phòng của chủ nhà, hiển thị tên + giá |
| **Email người thuê** | Email input | ✅ | Email tài khoản đã đăng ký trong hệ thống |
| **Ngày bắt đầu** | Date input | ✅ | Icon lịch |
| **Ngày kết thúc** | Date input | ✅ | Icon lịch |
| **Tiền thuê/tháng** | Number input | ✅ | Icon $, tự điền từ giá phòng khi chọn phòng |
| **Tiền đặt cọc** | Number input | ✅ | Tự điền = giá × 2 khi chọn phòng |
| **Ngày thanh toán** | Number input | ✅ | Ngày trong tháng (1-31), mặc định 5 |
| **Điều khoản hợp đồng** | Textarea | ✅ | Tối thiểu 10 ký tự, có template mặc định 8 điều khoản |
| **Hộp thông tin quy trình** | Info box | — | Nền xanh nhạt, mô tả 4 bước tiếp theo |
| **Nút Hủy** | Button | — | Quay lại |
| **Nút Tạo Hợp Đồng** | Submit button | — | Gradient, icon hợp đồng |

**Template điều khoản mặc định** (8 điều khoản):
1. Thanh toán tiền phòng đầy đủ và đúng hạn
2. Tiền điện 3.500 VNĐ/kWh, nước 80.000 VNĐ/m³
3. Không nuôi thú cưng (trừ khi được đồng ý)
4. Giữ gìn vệ sinh chung, không gây ồn ào
5. Không tự ý sửa chữa, cải tạo phòng
6. Thông báo trước 1 tháng nếu muốn chấm dứt
7. Bồi thường thiệt hại nếu làm hư hỏng tài sản
8. Chịu trách nhiệm về an toàn, PCCC

#### Dữ liệu Input
```json
{
  "propertyId": "uuid-of-property",
  "tenantEmail": "tenant@example.com",
  "startDate": "2026-06-01",
  "endDate": "2027-06-01",
  "monthlyRent": 4500000,
  "deposit": 9000000,
  "paymentDay": 5,
  "terms": "Điều khoản hợp đồng thuê phòng:\n1. Thanh toán..."
}
```

#### Dữ liệu Output
```json
{
  "id": "uuid",
  "status": "DRAFT",
  "contractHash": "03dc3642c0855e0767d63e4c8642e6cc7825a6c0...",
  "landlord": { "walletAddress": "0xB6eD69..." },
  "tenant": { "walletAddress": "0x2Bf2F6..." }
}
```

#### Xử lý dữ liệu
```
Bước 1: Validate form (Zod schema phía backend)
Bước 2: POST /api/contracts
Bước 3: Backend xử lý:
  a. Tìm property theo propertyId → kiểm tra tồn tại
  b. Kiểm tra property.ownerId === userId (chỉ chủ nhà của phòng mới tạo được)
  c. Tìm tenant theo tenantEmail → kiểm tra tồn tại
  d. Sinh SHA-256 hash:
     SHA-256(propertyId + landlordId + tenantId + startDate + endDate + monthlyRent + terms + timestamp)
  e. Tạo Contract trong DB với status = 'DRAFT'
Bước 4: Frontend nhận contract response
Bước 5: Kiểm tra tenant.walletAddress có tồn tại không:
  → Có ví: Gọi onChainCreateContract() trên blockchain
    - Kết nối MetaMask
    - Gọi createContract(hash, tenantWallet, deposit, rent)
    - Chờ transaction confirm
    - Toast "Hợp đồng đã được lưu lên Blockchain!"
  → Không có ví: Toast cảnh báo "Chưa có ví người thuê, chưa lưu lên Blockchain"
Bước 6: Redirect → /contracts
```

---

### 4.3 Màn hình Chi tiết & Ký hợp đồng

**Đường dẫn**: `/contracts/:id`  
**Quyền truy cập**: Đã đăng nhập (chỉ landlord hoặc tenant của hợp đồng)

#### Mô tả các thành phần

| Thành phần | Mô tả |
|---|---|
| **Header card** | Tên phòng + địa chỉ + badge trạng thái (ĐANG HIỆU LỰC / CHỜ KÝ / BẢN NHÁP) |
| **Card Chủ nhà (Bên A)** | Nền xanh nhạt: Tên + badge "Đã ký xác nhận" (xanh) hoặc "⏳ Chờ ký" (cam) |
| **Card Người thuê (Bên B)** | Nền tím nhạt: Tên + badge trạng thái ký |
| **Điều khoản hợp đồng** | Textarea readonly, font mono, nền xám nhạt |
| **Thông tin Blockchain** | Contract Hash (SHA-256) + nút Copy · Transaction Hash + link Polygonscan |
| **Chi tiết thanh toán** | Giá thuê · Tiền cọc · Ngày thanh toán hàng tháng |
| **Thời hạn** | Ngày bắt đầu · Ngày kết thúc |
| **Nút Kết nối MetaMask** | Chỉ hiện khi chưa kết nối ví |
| **Nút Ký Hợp Đồng Ngay** | Gradient, icon hợp đồng. Hiện khi user chưa ký + HĐ chưa ACTIVE |
| **Nút Đã Hoàn Tất** | Xanh lá, hiện khi status = ACTIVE/SIGNED |
| **Nút Xuất file PDF** | Xanh dương, chỉ hiện khi ACTIVE/SIGNED |
| **Nút Quay lại** | Border, quay về danh sách |

#### Dữ liệu Input
- `id` từ URL params
- JWT token

#### Dữ liệu Output
Contract object đầy đủ kèm property, landlord, tenant

#### Xử lý ký hợp đồng (chi tiết)
```
Bước 1: Kiểm tra ví MetaMask đã kết nối chưa
  → Chưa: Gọi connectWallet() → MetaMask popup yêu cầu kết nối
  → Kiểm tra đúng mạng Polygon Amoy (Chain ID: 80002)
  → Nếu sai mạng: wallet_switchEthereumChain

Bước 2: Ký off-chain (xác nhận danh tính)
  → signMessage("Ký hợp đồng thuê phòng\nID: ...\nPhòng: ...\nGiá: ...")
  → MetaMask hiện popup "Sign Message"
  → Người dùng bấm "Sign"
  → Trả về signature (chuỗi hex 0x...)

Bước 3: Kiểm tra on-chain
  → Gọi verifyContract(hash) trên smart contract
  → Nếu exists = false (chưa tồn tại on-chain):
    - Nếu là landlord + tenant có ví:
      → Gọi createContract(hash, tenantWallet, deposit, rent)
      → MetaMask popup "Confirm Transaction" (có gas fee)
      → Chờ confirm (~2 giây)
    - Nếu là tenant mà chưa có on-chain:
      → Báo lỗi "Vui lòng yêu cầu chủ nhà ký trước"

Bước 4: Ký on-chain
  → Gọi signContract(hash)
  → MetaMask popup "Confirm Transaction"
  → Gas override: maxPriorityFeePerGas = 30 Gwei (tối thiểu Polygon Amoy)
  → Chờ transaction confirm
  → Lấy txHash

Bước 5: Lưu vào database
  → POST /api/contracts/:id/sign { signature, txHash }
  → Backend kiểm tra:
    - Hợp đồng tồn tại
    - User là landlord hoặc tenant
    - Status là DRAFT hoặc PENDING
    - Chưa ký trước đó
  → Cập nhật landlordSignature hoặc tenantSignature
  → Nếu cả 2 đã ký: status = 'ACTIVE', signedAt = now()

Bước 6: Reload trang → hiển thị trạng thái mới
```

---

### 4.4 Màn hình Xác minh hợp đồng (Public)

**Đường dẫn**: `GET /api/contracts/verify/:hash`  
**Quyền truy cập**: Công khai (không cần đăng nhập)

#### Mô tả
Bất kỳ ai cũng có thể xác minh tính xác thực của hợp đồng bằng cách nhập hash SHA-256.

#### Dữ liệu Input
- `hash`: Chuỗi SHA-256 hex (64 ký tự)

#### Dữ liệu Output
```json
{
  "verified": true,
  "contract": {
    "hash": "03dc3642...",
    "status": "ACTIVE",
    "signedAt": "2026-05-13T...",
    "blockchainTx": "0xabc123...",
    "property": { "title": "...", "address": "..." },
    "landlord": { "fullName": "...", "walletAddress": "0x..." },
    "tenant": { "fullName": "...", "walletAddress": "0x..." }
  }
}
```

#### Xử lý dữ liệu
```
Bước 1: Query DB: findUnique({ where: { contractHash: hash } })
Bước 2: Nếu không tìm thấy → 404 "Không tìm thấy hợp đồng với hash này"
Bước 3: Trả về thông tin hợp đồng (không bao gồm dữ liệu nhạy cảm)
Bước 4: Người dùng có thể đối chiếu:
  - Địa chỉ ví landlord/tenant trên blockchain
  - Transaction hash trên Polygonscan
  - Thời gian ký kết
```

**Ý nghĩa bảo mật**: Nếu ai đó chỉnh sửa nội dung hợp đồng, hash SHA-256 sẽ thay đổi → không khớp với hash đã lưu trên blockchain → phát hiện giả mạo ngay lập tức.

---

---

## 5. QUẢN LÝ HÓA ĐƠN & THANH TOÁN

### 5.1 Màn hình Thanh toán (Người thuê)

**Đường dẫn**: `/invoices`  
**Quyền truy cập**: Đã đăng nhập

#### Mô tả các thành phần

| Thành phần | Mô tả |
|---|---|
| **Tiêu đề** | "Thanh toán tiền phòng" + mô tả |
| **Banner tổng tiền** | Gradient tím-xanh: Tổng tiền cần đóng + số hóa đơn chưa thanh toán |
| **Section "Chưa thanh toán"** | Dot đỏ + tiêu đề + số lượng |
| **Card hóa đơn chưa đóng** | Nền trắng, border đỏ nếu quá hạn |
| — Icon tháng | Hình vuông tím/đỏ, hiển thị "T" + số tháng |
| — Tên phòng + Chủ nhà | |
| — Hạn đóng | Màu đỏ + icon ⚠️ nếu quá hạn |
| — Số tiền | Font đậm gradient tím |
| — Nút "Thanh toán" | Gradient tím, icon QR |
| **Section "Đã thanh toán"** | Dot xanh + tiêu đề + số lượng |
| **Card hóa đơn đã đóng** | Opacity 70%, badge "Đã đóng" xanh lá |

#### Modal thanh toán (khi bấm nút "Thanh toán")

| Thành phần | Mô tả |
|---|---|
| **Header gradient** | Icon QR + "Thanh toán tiền phòng" + Tháng/Phòng |
| **Số tiền** | Nền tím nhạt, font đậm lớn |
| **QR Code VietQR** | Ảnh QR từ `img.vietqr.io`, kích thước 208×208px |
| — Nếu không load được | Placeholder xám + hướng dẫn chuyển khoản thủ công |
| — Nếu chủ nhà chưa có TK ngân hàng | Cảnh báo vàng "Chủ nhà chưa cập nhật thông tin ngân hàng" |
| **Thông tin chuyển khoản** | Ngân hàng · Số TK (nút copy) · Chủ TK · Số tiền (nút copy) · Nội dung CK (nút copy) |
| **Nút "Tôi đã chuyển khoản xong"** | Gradient xanh lá, icon ✓ |
| **Ghi chú** | "Bấm xác nhận sau khi đã chuyển khoản thành công" |

#### Dữ liệu Input
- JWT token (tự động)
- `tenantId` = userId hiện tại

#### Dữ liệu Output
Danh sách hóa đơn của người thuê, kèm thông tin hợp đồng, phòng, chủ nhà (tên, bankAccount, bankName)

#### Xử lý dữ liệu — Tạo QR VietQR
```
URL format:
https://img.vietqr.io/image/{bankId}-{accountNo}-compact2.png
  ?amount={amount}
  &addInfo={encodedContent}
  &accountName={encodedName}

Ví dụ:
https://img.vietqr.io/image/MB-0123456789-compact2.png
  ?amount=4500000
  &addInfo=Thanh%20toan%20tien%20nha%20T5%2F2026
  &accountName=Vu%20Van%20Kien

→ VietQR tự động tạo QR chuẩn NAPAS, quét được bằng mọi app ngân hàng
```

#### Xử lý dữ liệu — Xác nhận thanh toán
```
Bước 1: Người dùng bấm "Tôi đã chuyển khoản xong"
Bước 2: PUT /api/invoices/:id/status { status: "PAID" }
Bước 3: Backend kiểm tra:
  - Invoice tồn tại
  - userId là landlord HOẶC tenant của hợp đồng liên quan
  → Nếu không: 403 Forbidden
Bước 4: Update invoice: status = 'PAID', paidAt = now()
Bước 5: Toast "Đã xác nhận thanh toán! ✅"
Bước 6: Reload danh sách → hóa đơn chuyển sang section "Đã thanh toán"
Bước 7: Admin/Chủ nhà thấy cập nhật ngay trong trang quản lý
```

---

### 5.2 Màn hình Quản lý Thu/Chi (Admin)

**Đường dẫn**: `/admin/invoices`  
**Quyền truy cập**: Admin

#### Mô tả các thành phần

| Thành phần | Mô tả |
|---|---|
| **Tiêu đề + Tổng số** | "Quản lý Thu / Chi" + "X hóa đơn" |
| **Nút "Đánh dấu quá hạn"** | Tự động đánh dấu OVERDUE tất cả UNPAID đã qua hạn |
| **4 Summary cards** | Tổng hóa đơn · Đã thu · Chưa thu · Quá hạn (màu tím/xanh/đỏ/cam) |
| **Bộ lọc** | Icon filter + Tháng (1-12) + Năm (2024-2026) + Trạng thái |
| **Bảng hóa đơn** | 8 cột: Kỳ thu · Người thuê · Chủ nhà · Phòng · Số tiền · Trạng thái · Ngày đóng · Hành động |
| — Hóa đơn quá hạn | Nền đỏ nhạt, icon ⚠️ trước ngày hạn |
| — Nút "Đã thu" | Xanh lá, chỉ hiện khi chưa PAID |
| — Nút xóa | Đỏ, icon thùng rác |
| **Phân trang** | Nút Trước/Sau + "Trang X/Y" |

#### Dữ liệu Input
- Bộ lọc: `month`, `year`, `status`
- Phân trang: `page`, `limit = 15`

#### Dữ liệu Output
Tất cả hóa đơn toàn hệ thống (không lọc theo landlord/tenant)

#### Xử lý dữ liệu
```
GET /api/invoices?month=5&year=2026&status=UNPAID&page=1&limit=15
→ Backend query không có landlordId/tenantId filter
  → Lấy TẤT CẢ hóa đơn trong hệ thống
→ Include: contract.property (title, city), contract.tenant (fullName, phone), contract.landlord (fullName)
→ Tính summary từ danh sách hiện tại:
  totalExpected = sum(amount)
  totalCollected = sum(amount WHERE status = 'PAID')
  totalUnpaid = sum(amount WHERE status != 'PAID')
  totalOverdue = sum(amount WHERE status = 'OVERDUE')
```

---

## 6. QUẢN LÝ KHÁCH HÀNG (ADMIN)

### 6.1 Màn hình Quản lý Chủ nhà & Người thuê

**Đường dẫn**: `/admin/customers`  
**Quyền truy cập**: Admin

#### Mô tả các thành phần

| Thành phần | Mô tả |
|---|---|
| **Tiêu đề** | "Quản lý tài khoản" + tổng số người dùng |
| **2 Tab** | 🏢 Chủ nhà · 🏠 Người thuê (active tab có gradient tím) |
| **Thanh tìm kiếm** | Tìm theo tên, email |
| **Bộ lọc trạng thái** | Tất cả · Đang hoạt động · Bị khóa |

**Tab Chủ nhà** — Bảng dạng cây phân cấp:

| Thành phần | Mô tả |
|---|---|
| **Nút expand** | Icon ▶/▼, click để xem danh sách phòng |
| **Avatar** | Gradient xanh-cyan, chữ cái đầu tên |
| **Tên + Email** | |
| **Badge trạng thái** | ✓ Hoạt động (xanh) / 🔒 Bị khóa (đỏ) |
| **SĐT** | |
| **Số phòng** | Badge xanh |
| **Ngày tham gia** | |
| **Nút Khóa/Mở khóa** | Đỏ/Xanh |
| **Dòng lý do khóa** | Nền đỏ nhạt, hiện khi bị BANNED |
| **Dòng phòng (expand)** | Nền xám nhạt, thụt lề: Tên phòng · Địa chỉ · Badge duyệt · Badge tình trạng · Người thuê hiện tại |

**Tab Người thuê** — Bảng đơn giản:

| Thành phần | Mô tả |
|---|---|
| **Avatar** | Gradient tím-hồng |
| **Tên + Email** | |
| **Badge trạng thái** | |
| **SĐT** | |
| **Đang thuê** | Tên phòng + thành phố + giá/tháng (nếu có hợp đồng ACTIVE) |
| **Ngày tham gia** | |
| **Nút Khóa/Mở khóa** | |

#### Modal Khóa tài khoản

| Thành phần | Mô tả |
|---|---|
| **Tiêu đề** | "Khóa tài khoản: [Tên người dùng]" |
| **Mô tả** | Giải thích hậu quả (không thể đăng nhập) |
| **Textarea lý do** | Placeholder "VD: Vi phạm điều khoản sử dụng..." |
| **Nút Hủy** | Border xám |
| **Nút Khóa tài khoản** | Đỏ, icon 🔒 |

#### Dữ liệu Input — Khóa tài khoản
```json
{ "reason": "Đăng tin sai sự thật, lừa đảo người thuê" }
```

#### Dữ liệu Output — Khóa tài khoản
```json
{
  "id": "uuid",
  "fullName": "Nguyễn Văn A",
  "status": "BANNED",
  "banReason": "Đăng tin sai sự thật, lừa đảo người thuê"
}
```

#### Xử lý dữ liệu
```
POST /api/admin/users/:id/ban { reason }
→ Kiểm tra id !== requesterId (không tự khóa mình)
→ Kiểm tra role !== 'ADMIN' (không khóa admin khác)
→ Kiểm tra status !== 'BANNED' (chưa bị khóa)
→ Update: status = 'BANNED', banReason = reason

POST /api/admin/users/:id/unban
→ Kiểm tra status === 'BANNED'
→ Update: status = 'ACTIVE', banReason = null

Hiệu lực ngay lập tức:
→ Lần đăng nhập tiếp theo của user bị BANNED:
  POST /api/auth/login
  → Backend kiểm tra status === 'BANNED'
  → Trả về 403: "Tài khoản đã bị khóa. Lý do: [banReason]"
```

---

## 7. QUẢN LÝ PHÒNG (ADMIN — DUYỆT TIN)

**Đường dẫn**: `/admin/properties`  
**Quyền truy cập**: Admin

#### Mô tả các thành phần

| Thành phần | Mô tả |
|---|---|
| **Tiêu đề + Tổng số** | "Danh sách phòng" + "X phòng tổng cộng" |
| **Nút Thêm phòng** | Gradient tím, icon + |
| **Bộ lọc** | Tìm kiếm · Loại phòng · Tình trạng |
| **Grid card 3 cột** | Mỗi card có: |
| — Dải màu trên | Xanh lá (còn trống) / Xám (đã thuê) |
| — Badge tình trạng | "● Còn trống" / "● Đã thuê" |
| — Badge loại phòng | Phòng trọ / Căn hộ / ... |
| — **Badge duyệt** | ⏳ Chờ duyệt (vàng) / ✗ Từ chối (đỏ) — chỉ hiện khi chưa APPROVED |
| — **Nút Duyệt** | Xanh lá nhỏ, icon ✓ — hiện khi PENDING hoặc REJECTED |
| — **Nút Từ chối** | Đỏ nhỏ, icon 🔒 — hiện khi PENDING |
| — Tên phòng | |
| — Địa chỉ | |
| — Thông số | Diện tích · Phòng ngủ · WC |
| — Giá + Số hợp đồng | |
| — 3 nút action | Xem · Sửa · Xóa |

#### Modal Từ chối phòng

| Thành phần | Mô tả |
|---|---|
| **Tiêu đề** | "Từ chối phòng: [Tên phòng]" |
| **Mô tả** | "Nhập lý do để chủ nhà biết cần chỉnh sửa gì" |
| **Textarea lý do** | Placeholder "VD: Thông tin không đầy đủ, hình ảnh không rõ ràng..." |
| **Nút Hủy + Nút Từ chối** | |

#### Xử lý dữ liệu
```
POST /api/admin/properties/:id/approve
→ Update: approvalStatus = 'APPROVED', rejectionReason = null
→ Phòng xuất hiện trong danh sách công khai ngay lập tức

POST /api/admin/properties/:id/reject { reason }
→ Update: approvalStatus = 'REJECTED', rejectionReason = reason, available = false
→ Phòng bị ẩn khỏi danh sách công khai
```

---

## 8. THỐNG KÊ HỆ THỐNG (ADMIN DASHBOARD)

**Đường dẫn**: `/admin`  
**Quyền truy cập**: Admin

### 8.1 Tab Tổng quan

#### Mô tả các thành phần

| Thành phần | Mô tả |
|---|---|
| **Selector năm** | Dropdown chọn năm (2024/2025/2026) |
| **2 Tab** | 📊 Tổng quan · 🏢 Theo chủ nhà |
| **4 KPI cards** | Tổng phòng (xanh) · Người dùng (tím) · Hợp đồng (xanh lá) · Doanh thu/tháng (cam) |
| **3 Revenue cards** | Dự kiến thu năm X · Đã thu được · Chưa thu/Nợ |
| **Biểu đồ bar HĐ theo tháng** | 6 tháng gần nhất, bar gradient tím-xanh, animation từ 0 |
| **Biểu đồ loại phòng** | Progress bar cho từng loại (ROOM/APARTMENT/HOUSE/HOTEL) |
| **2 bubble cards** | Người dùng mới tháng này · Hợp đồng mới tháng này |
| **Biểu đồ thu chi theo tháng** | Bar kép: xanh lá (đã thu) + đỏ (chưa thu), chỉ hiện tháng có dữ liệu |

#### Dữ liệu Input
- `year`: năm cần xem

#### Dữ liệu Output
```json
{
  "properties": { "total": 5, "available": 3, "rented": 2 },
  "users": { "total": 6, "landlords": 2, "tenants": 3, "newThisMonth": 1 },
  "contracts": { "total": 3, "active": 1, "draft": 1, "newThisMonth": 0 },
  "revenue": { "monthlyTotal": 7500000, "annualEstimate": 90000000 },
  "charts": {
    "propertyTypes": [{ "type": "ROOM", "count": 3 }, ...],
    "contractsByMonth": [{ "month": "T12/2025", "count": 1 }, ...]
  }
}
```

#### Xử lý dữ liệu
```
GET /api/admin/stats → Thống kê từ DB (Promise.all 9 queries song song)
GET /api/invoices/admin-stats?year=2026 → Thống kê thu chi từ bảng Invoice
→ Tổng hợp overall: totalExpected, totalCollected, totalUnpaid, monthlyData[12]
→ Tổng hợp byLandlord: mỗi chủ nhà có monthlyData[12] riêng
```

### 8.2 Tab Theo chủ nhà

#### Màn hình danh sách chủ nhà

| Thành phần | Mô tả |
|---|---|
| **Mô tả** | "X chủ nhà · Bấm vào để xem chi tiết từng tháng" |
| **Card chủ nhà** | Click → vào màn hình chi tiết |
| — Avatar | Gradient xanh-cyan |
| — Tên + Email | Hover: tên đổi màu tím |
| — Dự kiến / Đã thu / Còn nợ | 3 cột số liệu |
| — Badge tỷ lệ % | Xanh ≥80% / Vàng ≥50% / Đỏ <50% |
| — Progress bar | Màu theo tỷ lệ, animation từ 0 |
| — Số hóa đơn | "X đã thu · Y còn nợ" |
| — Icon › | Xám → tím khi hover |

#### Màn hình chi tiết 1 chủ nhà (sau khi bấm vào)

| Thành phần | Mô tả |
|---|---|
| **Nút ← Quay lại** | Border, quay về danh sách |
| **Header chủ nhà** | Avatar + Tên + Email |
| **4 KPI cards** | Dự kiến năm X · Đã thu · Còn nợ · Tỷ lệ % |
| **Biểu đồ bar từng tháng** | Chỉ hiện tháng có dữ liệu, bar kép xanh/đỏ |
| — Mỗi tháng | Label "Tháng X" + bar + số tiền + "Y% đã thu" |
| **Footer thống kê** | Tổng HĐ · Đã thu · Còn nợ + Link "Xem hóa đơn →" |

#### Xử lý dữ liệu
```
Dữ liệu đã có sẵn từ GET /api/invoices/admin-stats
→ byLandlord[i].monthlyData[12] chứa dữ liệu từng tháng
→ Không cần gọi API thêm khi bấm vào từng chủ nhà
→ Chỉ cần setState(selected = item) để render màn hình chi tiết
```

---

*Tài liệu này mô tả đầy đủ 8 mô-đun chính của hệ thống RentalContract DApp.*  
*Mỗi màn hình đều có: Thành phần UI · Input · Output · Xử lý dữ liệu chi tiết.*
