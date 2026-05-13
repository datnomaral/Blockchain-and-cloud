# 🏠 RentalContract DApp — Hệ thống quản lý phòng trọ trên Blockchain

> Đồ án tốt nghiệp — Khoa Công nghệ Thông tin  
> Ứng dụng quản lý phòng trọ kết hợp **Blockchain (Polygon)** + **Cloud (PostgreSQL/Neon)** nhằm đảm bảo tính bất biến, minh bạch và toàn vẹn của hợp đồng thuê phòng.

---

## 📌 Tổng quan

| Thành phần | Công nghệ |
|---|---|
| **Frontend** | Next.js 14 · TypeScript · TailwindCSS · Framer Motion · Ethers.js |
| **Backend** | Node.js · Express · TypeScript · Prisma ORM |
| **Database** | PostgreSQL (Neon Cloud) |
| **Blockchain** | Solidity · Hardhat · Polygon Amoy Testnet |
| **Wallet** | MetaMask |
| **AI Chatbot** | Google Gemini API |
| **QR Thanh toán** | VietQR (img.vietqr.io) |

---

## 🎯 Tính năng chính

### 👤 Người dùng (Chủ nhà & Người thuê)
- Đăng ký / Đăng nhập · Phân quyền 3 role: `LANDLORD` / `TENANT` / `ADMIN`
- Kết nối ví MetaMask (Polygon Amoy Testnet)
- **Chủ nhà**: Đăng phòng, tạo hợp đồng, tạo hóa đơn hàng tháng
- **Người thuê**: Tìm phòng, ký hợp đồng, thanh toán qua QR VietQR
- Ký hợp đồng song phương trên blockchain (cả 2 bên đều phải ký)
- Xuất PDF hợp đồng sau khi ký xong
- Xác minh hợp đồng công khai bằng SHA-256 hash

### 🛡️ Admin
- Dashboard thống kê tổng quan + theo từng chủ nhà
- Duyệt / Từ chối phòng đăng tin
- Khóa / Mở khóa tài khoản (có lý do)
- Quản lý hợp đồng: override trạng thái, hủy hợp đồng
- Quản lý hóa đơn: xem tình trạng đóng tiền toàn hệ thống
- Phân cấp chủ nhà → phòng → người thuê

### ⛓️ Blockchain
- Smart contract `RentalContractManager` trên Polygon Amoy
- `createContract` — Chủ nhà khởi tạo hợp đồng on-chain
- `signContract` — Ký hợp đồng (landlord + tenant)
- `verifyContract` — Xác minh công khai (không cần đăng nhập)
- `terminateContract` — Hủy hợp đồng
- `markDepositPaid` / `recordRentPayment` / `markDepositRefunded` — Ghi nhận thanh toán

---

## 📁 Cấu trúc thư mục

```
rental-contract-dapp/
├── frontend/                   # Next.js 14 App
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Trang chủ
│   │   │   ├── auth/           # Đăng nhập / Đăng ký
│   │   │   ├── dashboard/      # Bảng điều khiển user
│   │   │   ├── properties/     # Danh sách & chi tiết phòng
│   │   │   ├── contracts/      # Hợp đồng (tạo, ký, xem)
│   │   │   ├── invoices/       # Thanh toán hóa đơn + QR
│   │   │   └── admin/          # Admin panel
│   │   ├── components/         # Shared components
│   │   └── utils/
│   │       ├── contract.ts     # Blockchain interactions
│   │       └── wallet.ts       # MetaMask connection
│   └── package.json
│
├── backend/                    # Express API Server
│   ├── src/
│   │   ├── controllers/        # Business logic
│   │   │   ├── auth.controller.ts
│   │   │   ├── property.controller.ts
│   │   │   ├── contract.controller.ts
│   │   │   ├── invoice.controller.ts
│   │   │   ├── admin.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── chat.controller.ts
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Auth + Admin middleware
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   └── package.json
│
├── contracts/                  # Solidity Smart Contracts
│   ├── contracts/
│   │   └── RentalContractManager.sol
│   ├── scripts/
│   │   └── deploy.ts
│   ├── test/
│   │   └── RentalContractManager.ts
│   └── hardhat.config.ts
│
└── docs/
    └── ARCHITECTURE.md
```

---

## ⚙️ Yêu cầu hệ thống

- **Node.js** >= 18
- **MetaMask** extension trên trình duyệt
- **POL token** trên Polygon Amoy Testnet (faucet: https://faucet.polygon.technology/)
- Tài khoản **Neon** (PostgreSQL cloud) hoặc PostgreSQL local

---

## 🚀 Hướng dẫn cài đặt

### 1. Clone & cài dependencies

```bash
git clone <repo-url>
cd rental-contract-dapp

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# Smart Contracts
cd ../contracts && npm install
```

### 2. Cấu hình biến môi trường

#### `backend/.env`
```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
PORT=5000
GEMINI_API_KEY=your-gemini-api-key
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology/
CONTRACT_ADDRESS=0x9ca6b55b70b5b4e968D5785D21364De4E7BE1C8B
```

#### `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CHAIN_ID=80002
NEXT_PUBLIC_CONTRACT_ADDRESS=0x9ca6b55b70b5b4e968D5785D21364De4E7BE1C8B
```

#### `contracts/.env`
```env
PRIVATE_KEY=your-wallet-private-key
AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
```

### 3. Khởi tạo database

```bash
cd backend

# Chạy migration (tạo bảng)
npx prisma db push

# Hoặc nếu dùng migration files
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Tạo tài khoản admin
node -e "
const {PrismaClient}=require('@prisma/client');
const bcrypt=require('bcryptjs');
const p=new PrismaClient();
bcrypt.hash('Admin@123',10).then(h=>p.user.create({data:{email:'admin@rental.com',passwordHash:h,fullName:'Admin',role:'ADMIN',isVerified:true}})).then(u=>console.log('Admin created:',u.email)).finally(()=>p.\$disconnect());
"
```

### 4. Deploy Smart Contract (tuỳ chọn — đã deploy sẵn)

```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.ts --network amoy
# Copy địa chỉ contract vào .env
```

### 5. Chạy development

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# → http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev
# → http://localhost:3000
```

---

## 🔑 Tài khoản demo

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@rental.com | Admin@123 |
| **Chủ nhà** | chunha@demo.com | 123456 |
| **Người thuê** | nguoithue@demo.com | 123456 |

> **Lưu ý**: Để ký hợp đồng cần MetaMask với POL trên Polygon Amoy Testnet.  
> Faucet: https://faucet.polygon.technology/

---

## 📡 API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/register` | Đăng ký tài khoản |
| POST | `/login` | Đăng nhập |
| GET | `/profile` | Lấy thông tin cá nhân |
| POST | `/connect-wallet` | Kết nối ví MetaMask |
| POST | `/disconnect-wallet` | Ngắt kết nối ví |

### Properties — `/api/properties`
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/` | Danh sách phòng (đã duyệt) |
| GET | `/search` | Tìm kiếm phòng |
| GET | `/:id` | Chi tiết phòng |
| POST | `/` | Đăng tin phòng (LANDLORD) |
| PUT | `/:id` | Cập nhật phòng |
| DELETE | `/:id` | Xóa phòng |

### Contracts — `/api/contracts`
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/` | Tạo hợp đồng |
| GET | `/` | Danh sách hợp đồng của user |
| GET | `/verify/:hash` | Xác minh hợp đồng (public) |
| GET | `/:id` | Chi tiết hợp đồng |
| POST | `/:id/sign` | Ký hợp đồng (blockchain) |
| GET | `/:id/pdf` | Xuất PDF hợp đồng |

### Invoices — `/api/invoices`
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/` | Danh sách hóa đơn |
| POST | `/` | Tạo hóa đơn (LANDLORD) |
| PUT | `/:id/status` | Cập nhật trạng thái |
| DELETE | `/:id` | Xóa hóa đơn |
| GET | `/stats` | Thống kê doanh thu chủ nhà |
| GET | `/admin-stats` | Thống kê toàn hệ thống (ADMIN) |

### Admin — `/api/admin` *(yêu cầu role ADMIN)*
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/stats` | Thống kê tổng quan |
| GET/POST/PUT/DELETE | `/properties/:id` | Quản lý phòng |
| POST | `/properties/:id/approve` | Duyệt phòng |
| POST | `/properties/:id/reject` | Từ chối phòng |
| GET/PUT/DELETE | `/users/:id` | Quản lý user |
| POST | `/users/:id/ban` | Khóa tài khoản |
| POST | `/users/:id/unban` | Mở khóa tài khoản |
| GET | `/landlords` | Danh sách chủ nhà + phòng + người thuê |
| GET | `/tenants` | Danh sách người thuê |
| GET/PUT/DELETE | `/contracts/:id` | Quản lý hợp đồng |
| POST | `/contracts/:id/terminate` | Hủy hợp đồng |

---

## 🗄️ Database Schema

```
User ──────────────────────────────────────────────────────────
  id, email, passwordHash, fullName, phone, facebook, zalo
  walletAddress (unique), role (LANDLORD/TENANT/ADMIN)
  status (ACTIVE/BANNED), banReason
  bankAccount, bankName  ← dùng cho QR thanh toán
  
Property ──────────────────────────────────────────────────────
  id, ownerId → User
  title, description, address, city, district, ward
  type (ROOM/APARTMENT/HOUSE/HOTEL)
  price, deposit, area, bedrooms, bathrooms
  images[], amenities[], available
  approvalStatus (PENDING/APPROVED/REJECTED), rejectionReason

Contract ──────────────────────────────────────────────────────
  id, propertyId → Property, landlordId → User, tenantId → User
  startDate, endDate, monthlyRent, deposit, paymentDay
  terms, contractPdf
  contractHash (SHA-256, unique)
  blockchainTxHash, landlordSignature, tenantSignature, signedAt
  terminateReason, terminatedAt
  status (DRAFT/PENDING/SIGNED/ACTIVE/EXPIRED/TERMINATED)

Invoice ───────────────────────────────────────────────────────
  id, contractId → Contract
  amount, description, month, year, dueDate
  status (UNPAID/PAID/OVERDUE), paidAt
```

---

## 🔄 Luồng nghiệp vụ chính

### Luồng ký hợp đồng
```
Chủ nhà tạo hợp đồng (DRAFT)
    ↓
Hệ thống sinh SHA-256 hash từ nội dung
    ↓
Chủ nhà ký MetaMask → createContract on-chain + signContract
    ↓  (status: PENDING)
Người thuê ký MetaMask → signContract on-chain
    ↓  (status: ACTIVE)
Hợp đồng có hiệu lực — hash bất biến trên blockchain
```

### Luồng thanh toán hóa đơn
```
Chủ nhà tạo hóa đơn hàng tháng (UNPAID)
    ↓
Người thuê vào trang Thanh toán
    ↓
Quét QR VietQR (tự động điền số tiền + nội dung)
    ↓
Bấm "Tôi đã chuyển khoản" → status: PAID
    ↓
Admin/Chủ nhà thấy cập nhật ngay lập tức
```

---

## 🔐 Bảo mật

- **JWT** với expiry 7 ngày — lưu trong `localStorage`
- **bcrypt** (salt rounds = 10) cho mật khẩu
- **Zod** validation cho tất cả input API
- **Phân quyền** 3 cấp: TENANT / LANDLORD / ADMIN
- **Khóa tài khoản**: user bị BANNED không thể đăng nhập
- **Phòng chưa duyệt** không hiển thị công khai
- **Hóa đơn**: chỉ chủ nhà/người thuê của hợp đồng mới được thao tác
- **Sửa/xóa phòng**: bị block nếu đang có hợp đồng ACTIVE

---

## ⛓️ Smart Contract

**Địa chỉ đã deploy**: `0x9ca6b55b70b5b4e968D5785D21364De4E7BE1C8B`  
**Network**: Polygon Amoy Testnet (Chain ID: 80002)  
**Explorer**: https://amoy.polygonscan.com/address/0x9ca6b55b70b5b4e968D5785D21364De4E7BE1C8B

```solidity
// Các function chính
createContract(bytes32 hash, address tenant, uint256 deposit, uint256 rent)
signContract(bytes32 hash)
verifyContract(bytes32 hash) view returns (exists, isActive, landlord, tenant, ...)
terminateContract(bytes32 hash)
markDepositPaid(bytes32 hash, uint256 amount)
recordRentPayment(bytes32 hash, uint256 amount)
markDepositRefunded(bytes32 hash, uint256 amount)
```

---

## 🤖 AI Chatbot

Tích hợp **Google Gemini** — hỗ trợ tư vấn về phòng trọ, hợp đồng, pháp lý thuê nhà.  
Endpoint: `POST /api/chat`

---

## 📊 Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER                          │
│  Next.js 14 + TailwindCSS + Framer Motion           │
│  Ethers.js ←→ MetaMask                              │
└──────────────┬──────────────────────────────────────┘
               │ REST API (JWT)
               ▼
┌─────────────────────────────────────────────────────┐
│              BACKEND (Express + TypeScript)         │
│  Auth · Properties · Contracts · Invoices · Admin   │
│  Prisma ORM · Zod Validation · JWT Middleware       │
└──────────────┬──────────────────┬───────────────────┘
               │                  │
               ▼                  ▼
┌──────────────────┐   ┌──────────────────────────────┐
│  PostgreSQL      │   │  Polygon Amoy Blockchain      │
│  (Neon Cloud)    │   │  RentalContractManager.sol    │
│                  │   │  Hash bất biến · Dual sign    │
└──────────────────┘   └──────────────────────────────┘
```

---

## 🎓 Ý nghĩa khoa học & thực tiễn

**Khoa học**: Nghiên cứu mô hình Hybrid (Off-chain + On-chain) — lưu dữ liệu đầy đủ trong PostgreSQL, chỉ lưu hash trên blockchain → tối ưu chi phí gas, đảm bảo tính bất biến.

**Thực tiễn**: Giảm tranh chấp hợp đồng, tăng minh bạch, áp dụng được cho nhà trọ sinh viên, căn hộ dịch vụ, khách sạn mini.

---

## 👥 Tác giả

**Đồ án tốt nghiệp** — Khoa Công nghệ Thông tin  
Nhóm Q+T

---

## 📄 License

MIT License — Free for educational purposes
