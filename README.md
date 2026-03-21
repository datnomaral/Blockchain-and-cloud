# 🏠 Rental Contract DApp - Hệ thống ký hợp đồng thuê phòng trên Blockchain

## 📌 Giới thiệu

Web Application ký hợp đồng thuê phòng sử dụng **Blockchain** và **Cloud Computing** nhằm đảm bảo tính bảo mật và toàn vẹn dữ liệu.

### 🎯 Mục tiêu

- ✅ Đảm bảo **tính bất biến** và **toàn vẹn** của hợp đồng
- ✅ Ngăn chặn việc **chỉnh sửa, giả mạo** hoặc **chối bỏ** hợp đồng
- ✅ Đảm bảo **tính xác thực** và **minh bạch** trong quá trình ký kết
- ✅ Xây dựng hệ thống có khả năng **mở rộng**, phù hợp phát triển thành NCKH/bài báo

## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| **Frontend** | Next.js 14 + TypeScript + TailwindCSS |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Blockchain** | Ethereum / Polygon |
| **Smart Contract** | Solidity + Hardhat |
| **Hash** | SHA-256 |
| **Wallet** | MetaMask |
| **Storage** | Cloud Storage / IPFS |
| **Deployment** | Vercel (Frontend) + Railway (Backend) |

## 📁 Cấu trúc Project

```
rental-contract-dapp/
├── frontend/              # Next.js Application
│   ├── src/
│   │   ├── app/          # App Router
│   │   ├── components/   # React Components
│   │   ├── lib/          # Utilities & Web3
│   │   └── types/        # TypeScript Types
│   └── package.json
│
├── backend/              # Express API Server
│   ├── src/
│   │   ├── controllers/  # API Controllers
│   │   ├── routes/       # API Routes
│   │   ├── services/     # Business Logic
│   │   ├── middleware/   # Auth, Validation
│   │   └── prisma/       # Database Schema
│   └── package.json
│
├── contracts/            # Smart Contracts
│   ├── contracts/        # Solidity Files
│   ├── scripts/          # Deploy Scripts
│   ├── test/            # Contract Tests
│   └── hardhat.config.ts
│
└── docs/                 # Documentation
    ├── architecture/     # System Design
    ├── api/             # API Documentation
    └── deployment/      # Deploy Guides
```

## ⚙️ Prerequisites

- Node.js >= 18
- MetaMask browser extension
- Git
- PostgreSQL đã cài sẵn
- Tài khoản Alchemy hoặc Infura (để lấy RPC URL)

## 🚀 Hướng dẫn Setup

### 1️⃣ Clone & Install Dependencies

```bash
# Clone repository
git clone https://github.com/your-username/rental-contract-dapp.git
cd rental-contract-dapp

# Install Frontend
cd frontend
npm install

# Install Backend
cd ../backend
npm install

# Install Smart Contracts
cd ../contracts
npm install
```

### 2️⃣ Cấu hình Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CHAIN_ID=80002
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
```

#### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/rental_contract_db"
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
CLOUD_STORAGE_BUCKET=your-bucket-name
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology/
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=your_deployed_contract_address
```

### 3️⃣ Setup Database

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 4️⃣ Deploy Smart Contract

```bash
cd contracts
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network amoy
```

### 5️⃣ Run Development Servers

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

## 🎨 Tính năng chính

### ✨ Cho người dùng
- 📝 Đăng ký/Đăng nhập với email + MetaMask wallet
- 🏠 Tạo và quản lý hợp đồng thuê phòng
- ✍️ Ký hợp đồng bằng ví blockchain
- 🔍 Xác minh hợp đồng dựa trên hash
- 📊 Xem lịch sử hợp đồng đã ký
- 📄 Tải xuống hợp đồng PDF

### 🔐 Bảo mật
- 🔒 JWT Authentication
- 🦊 MetaMask Wallet Integration
- 🔗 Smart Contract trên Blockchain
- 🔐 SHA-256 Hash của hợp đồng
- ⛓️ Tính bất biến của dữ liệu

## 📊 Database Schema

### Users
- `id`, `email`, `password_hash`, `wallet_address`, `role`, `created_at`

### Contracts
- `id`, `landlord_id`, `tenant_id`, `property_details`, `contract_hash`, `blockchain_tx_hash`, `ipfs_hash`, `status`, `signed_at`, `expired_at`, `created_at`

### Properties
- `id`, `owner_id`, `address`, `type`, `price`, `available`

## 🔗 Smart Contract

### RentalContractManager.sol
- `signContract(bytes32 contractHash)` - Ký hợp đồng
- `verifyContract(bytes32 contractHash)` - Xác minh hợp đồng
- `getContractDetails(bytes32 contractHash)` - Lấy thông tin hợp đồng

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/connect-wallet` - Kết nối ví

### Contracts
- `POST /api/contracts/create` - Tạo hợp đồng
- `POST /api/contracts/sign` - Ký hợp đồng
- `GET /api/contracts/verify/:hash` - Xác minh
- `GET /api/contracts/history` - Lịch sử

### Properties
- `GET /api/properties` - Danh sách phòng
- `GET /api/properties/:id` - Chi tiết phòng
- `POST /api/properties` - Thêm phòng mới
- `PUT /api/properties/:id` - Cập nhật phòng
- `DELETE /api/properties/:id` - Xóa phòng

## 🎓 Ý nghĩa khoa học & thực tiễn

### Khoa học
- ✅ Nghiên cứu mô hình kết hợp Blockchain + Cloud
- ✅ Đánh giá hiệu quả lưu trữ hash trên blockchain
- ✅ Cơ sở phát triển bài báo khoa học

### Thực tiễn
- ✅ Giảm rủi ro tranh chấp hợp đồng
- ✅ Tăng độ tin cậy trong giao dịch thuê phòng
- ✅ Triển khai cho nhà trọ, khách sạn, căn hộ

## 🚀 Hướng phát triển

- 🔮 So sánh với hệ thống truyền thống
- 📊 Đánh giá chi phí và hiệu năng
- 🌐 Tích hợp IPFS cho lưu trữ phi tập trung
- 🎨 NFT hóa hợp đồng
- 💰 Thanh toán đặt cọc bằng crypto

## 👥 Tác giả

**Đồ án tốt nghiệp** - Khoa Công nghệ Thông tin

## 📄 License

MIT License - Free for educational purposes

---

💡 **Note**: Đây là đồ án học thuật có thể phát triển thành NCKH/bài báo khoa học.
# Blockchain-and-cloud
