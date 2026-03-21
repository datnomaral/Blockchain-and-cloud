# 🎨 Kiến trúc hệ thống & Quy trình

## 📊 System Architecture

![System Architecture](../artifacts/system_architecture_diagram.png)

### Các thành phần chính:

#### 1️⃣ Frontend Layer (Next.js)
- **Công nghệ**: Next.js 14, React, TypeScript, TailwindCSS
- **Chức năng**:
  - Giao diện người dùng
  - Kết nối MetaMask wallet
  - Tương tác với Backend API
  - Tương tác với Smart Contracts

#### 2️⃣ Backend API Layer (Node.js)
- **Công nghệ**: Express, TypeScript, Prisma ORM
- **Chức năng**:
  - RESTful API
  - Authentication & Authorization (JWT)
  - Business Logic
  - Database management
  - File storage

#### 3️⃣ Database Layer (PostgreSQL)
- **Công nghệ**: PostgreSQL, Prisma
- **Chức năng**:
  - Lưu trữ user data
  - Lưu trữ property listings
  - Lưu trữ contract metadata
  - Transaction logs

#### 4️⃣ Blockchain Layer (Ethereum/Polygon)
- **Công nghệ**: Solidity, Hardhat, Ethers.js
- **Chức năng**:
  - Smart Contract execution
  - Lưu trữ contract hash bất biến
  - Verify contract authenticity
  - Transparent transaction log

---

## 🔄 Contract Signing Flow

![Contract Flow](../artifacts/contract_signing_flow.png)

### Quy trình ký hợp đồng:

#### **01 - Đăng ký** 👤
Người dùng đăng ký tài khoản với email/password và chọn role (Landlord hoặc Tenant).

#### **02 - Kết nối ví** 🦊
Kết nối MetaMask wallet để có thể ký hợp đồng trên blockchain.

#### **03 - Tạo hợp đồng** 📄
- Landlord điền thông tin: phòng trọ, người thuê, giá, thời hạn, điều khoản
- Hệ thống tạo contract trong database với status `DRAFT`

#### **04 - Sinh hash** 🔐
Hệ thống tự động tạo SHA-256 hash từ nội dung hợp đồng:
```javascript
SHA-256(propertyId + landlordId + tenantId + startDate + endDate + terms)
→ "0x3f4a8b..."
```

#### **05 - Ký kết** ✍️
- **Landlord ký**: Sign với MetaMask wallet
- **Tenant ký**: Sign với MetaMask wallet
- Cả 2 phải ký thì hợp đồng mới valid

#### **06 - Lưu blockchain** ⛓️
Smart contract ghi nhận:
- `contractHash`: Hash của hợp đồng
- `landlordAddress`: Địa chỉ ví chủ nhà
- `tenantAddress`: Địa chỉ ví người thuê
- `timestamp`: Thời gian ký kết
- `txHash`: Transaction hash trên blockchain

---

## 🔐 Security Flow

```
User Request → JWT Validation → Role Check → Business Logic → Response
                    ↓                ↓
              401 Unauthorized   403 Forbidden
```

### Authentication Flow:
1. User login → Server generate JWT
2. Client store JWT in localStorage
3. Every API call → Send JWT in Authorization header
4. Server validate JWT → Decode userId, role
5. Check permissions → Execute request

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────┐      ┌──────────────┐
│ MetaMask │      │  Backend API │
│  Wallet  │      │  (REST API)  │
└────┬─────┘      └──────┬───────┘
     │                   │
     │                   ▼
     │            ┌──────────────┐
     │            │  PostgreSQL  │
     │            │   Database   │
     │            └──────────────┘
     │
     ▼
┌──────────────┐
│   Ethereum   │
│  Blockchain  │
│ (Smart Cont) │
└──────────────┘
```

---

## 🗄️ Database Schema Relationships

```
┌────────────┐
│   Users    │
└─────┬──────┘
      │
      ├───── ownedProperties ────┐
      │                          ▼
      │                  ┌──────────────┐
      │                  │  Properties  │
      │                  └──────┬───────┘
      │                         │
      ├─── landlordContracts ───┤
      │                         │
      └─── tenantContracts ─────┤
                                ▼
                        ┌───────────────┐
                        │   Contracts   │
                        └───────────────┘
```

### Relationships:
- **User → Properties**: One-to-Many (1 user có nhiều properties)
- **User → Contracts**: One-to-Many (1 user tham gia nhiều contracts)
- **Property → Contracts**: One-to-Many (1 property có nhiều contracts)

---

## 🔄 API Request Flow

### Example: Sign Contract

```
1. Frontend
   POST /api/contracts/:id/sign
   Headers: { Authorization: "Bearer <JWT>" }
   Body: { signature: "0x...", txHash: "0x..." }

2. Middleware
   → authMiddleware: Verify JWT
   → Extract userId, role from token

3. Controller
   → Validate input (signature, txHash)
   → Check user permission (is landlord or tenant?)
   → Update contract in database
   → Return updated contract

4. Frontend
   ← Receive response
   ← Update UI
   ← Show success toast
```

---

## ⛓️ Smart Contract Interaction Flow

```
Frontend
   ↓
ethers.js
   ↓
MetaMask (User signs transaction)
   ↓
Ethereum Network
   ↓
Smart Contract Execution
   ↓
Event Emitted: ContractSigned
   ↓
Transaction Confirmed
   ↓
Backend receives txHash
   ↓
Update database
```

---

## 🎯 Key Design Decisions

### 1. Hybrid Architecture (Off-chain + On-chain)
**Rationale**: 
- Store full contract data in PostgreSQL (fast, cheap)
- Store only hash on blockchain (secure, immutable)
- Best of both worlds: Performance + Security

### 2. SHA-256 for Hashing
**Rationale**:
- Industry standard
- Collision-resistant
- Small hash size (32 bytes)
- Compatible with Solidity `bytes32`

### 3. Dual Signature Requirement
**Rationale**:
- Both parties must agree
- Cannot be signed unilaterally
- Follows legal contract principles

### 4. JWT + Wallet Authentication
**Rationale**:
- JWT for traditional API access
- Wallet signature for blockchain transactions
- Flexible authentication strategy

---

## 📈 Scalability Considerations

### Horizontal Scaling:
- **Frontend**: Deploy on CDN (Vercel)
- **Backend**: Multiple instances behind load balancer
- **Database**: Read replicas for queries
- **Blockchain**: Use layer-2 (Polygon) for lower fees

### Caching Strategy:
- **Redis**: Cache frequent queries (properties list)
- **Client-side**: React Query for data caching
- **CDN**: Static assets caching

---

## 🔍 Verification Process

```
Anyone can verify contract by hash:

1. User inputs contract hash
   ↓
2. Frontend queries blockchain
   SmartContract.verifyContract(hash)
   ↓
3. Smart contract returns:
   - Landlord address
   - Tenant address
   - Timestamp
   - Is Active?
   ↓
4. Frontend displays verification result
```

---

## 📱 User Journeys

### Landlord Journey:
1. Register → Login
2. Connect MetaMask
3. Create Property Listing
4. Create Contract with Tenant
5. Sign Contract
6. Wait for Tenant signature
7. Contract Active ✅

### Tenant Journey:
1. Register → Login
2. Connect MetaMask
3. Browse Properties
4. Get invited to Contract
5. Review Contract
6. Sign Contract
7. Contract Active ✅

---

## 🎨 UI/UX Flow

```
Homepage
   ↓
   ├─ Login/Register
   │     ↓
   │  Dashboard
   │     ↓
   │     ├─ Properties (View/Create)
   │     ├─ Contracts (View/Create/Sign)
   │     └─ Profile Settings
   │
   └─ Public Pages
         ├─ Property Listings
         ├─ About
         └─ Contact
```

---

## 🚀 Deployment Architecture

```
┌──────────────────┐
│   Vercel CDN     │  ← Frontend (Next.js static)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Railway/Heroku │  ← Backend API (Node.js)
└────────┬─────────┘
         │
         ├─────────────┐
         ▼             ▼
┌──────────────┐  ┌──────────────┐
│  Supabase/   │  │   Polygon    │
│  PostgreSQL  │  │  Blockchain  │
└──────────────┘  └──────────────┘
```

---

## 📚 Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 | SSR, Routing, SEO |
| | React 18 | UI Components |
| | TypeScript | Type Safety |
| | TailwindCSS | Styling |
| | Framer Motion | Animations |
| | Ethers.js | Web3 Integration |
| **Backend** | Node.js | Runtime |
| | Express | REST API Framework |
| | TypeScript | Type Safety |
| | Prisma | ORM |
| | JWT | Authentication |
| | Bcrypt | Password Hashing |
| **Database** | PostgreSQL | Relational DB |
| **Blockchain** | Solidity | Smart Contracts |
| | Hardhat | Development Framework |
| | Ethers.js | Blockchain SDK |
| | Polygon | Layer-2 Network |

---

## ✅ Compliance & Security

### Data Privacy:
- Password hashing with bcrypt
- JWT with expiration
- CORS configuration
- Input validation with Zod

### Blockchain Security:
- Access control in smart contracts
- Reentrancy protection
- Integer overflow checks
- Gas optimization

### Best Practices:
- Environment variables for secrets
- HTTPS only in production
- Rate limiting on API
- SQL injection prevention (Prisma ORM)

---

**🎉 Architecture hoàn chỉnh và sẵn sàng scale!**
