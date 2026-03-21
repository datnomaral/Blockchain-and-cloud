-- ====================================
-- SAMPLE DATA FOR TESTING
-- ====================================
-- Run this after migration: psql -U postgres -d rental_contract_db -f sample_data.sql

-- Sample Users
INSERT INTO users (id, email, password_hash, full_name, phone, wallet_address, role, is_verified, created_at, updated_at)
VALUES 
  (
    'user-landlord-001',
    'chuonha@gmail.com',
    '$2a$10$rT8L7gXJU3YWJmxKZ.F5KuN7L8KqJ3dN5fG7hR9tL0mP2qS4vW6xW',  -- password: 123456
    'Nguyễn Văn Chủ',
    '0901234567',
    '0x1234567890123456789012345678901234567890',
    'LANDLORD',
    true,
    NOW(),
    NOW()
  ),
  (
    'user-tenant-001',
    'nguoithue@gmail.com',
    '$2a$10$rT8L7gXJU3YWJmxKZ.F5KuN7L8KqJ3dN5fG7hR9tL0mP2qS4vW6xW',  -- password: 123456
    'Trần Thị Thuê',
    '0987654321',
    '0x0987654321098765432109876543210987654321',
    'TENANT',
    true,
    NOW(),
    NOW()
  ),
  (
    'user-tenant-002',
    'sinhvien@gmail.com',
    '$2a$10$rT8L7gXJU3YWJmxKZ.F5KuN7L8KqJ3dN5fG7hR9tL0mP2qS4vW6xW',  -- password: 123456
    'Lê Văn Sinh Viên',
    '0912345678',
    NULL,
    'TENANT',
    true,
    NOW(),
    NOW()
  );

-- Sample Properties
INSERT INTO properties (id, owner_id, title, description, address, city, district, ward, type, price, deposit, area, bedrooms, bathrooms, images, amenities, available, created_at, updated_at)
VALUES
  (
    'property-001',
    'user-landlord-001',
    'Phòng trọ cao cấp gần ĐH Công Nghệ',
    'Phòng mới xây, đầy đủ tiện nghi, gần trường ĐH Công Nghệ Thông tin, khu vực an ninh tốt',
    '123 Đường Lý Thường Kiệt',
    'Hồ Chí Minh',
    'Quận 10',
    'Phường 14',
    'ROOM',
    3500000,
    7000000,
    25,
    1,
    1,
    ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
    ARRAY['Wifi', 'Điều hòa', 'Nóng lạnh', 'Ban công', 'Giường tủ'],
    true,
    NOW(),
    NOW()
  ),
  (
    'property-002',
    'user-landlord-001',
    'Căn hộ mini 2 phòng ngủ',
    'Căn hộ mini hiện đại, view đẹp, đầy đủ nội thất, gần chợ và siêu thị',
    '456 Đường Nguyễn Văn Cừ',
    'Hồ Chí Minh',
    'Quận 5',
    'Phường 3',
    'APARTMENT',
    8000000,
    16000000,
    45,
    2,
    1,
    ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'],
    ARRAY['Wifi', 'Điều hòa', 'Tủ lạnh', 'Máy giặt', 'Bếp', 'Thang máy'],
    true,
    NOW(),
    NOW()
  ),
  (
    'property-003',
    'user-landlord-001',
    'Phòng trọ sinh viên giá rẻ',
    'Phòng trọ cho sinh viên, giá cả phải chăng, gần trạm xe buýt',
    '789 Đường Lê Hồng Phong',
    'Hồ Chí Minh',
    'Quận 10',
    'Phường 1',
    'ROOM',
    2000000,
    2000000,
    15,
    1,
    0,
    ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'],
    ARRAY['Wifi', 'Giường', 'Tủ đồ'],
    true,
    NOW(),
    NOW()
  );

-- Sample Contracts
INSERT INTO contracts (
  id, property_id, landlord_id, tenant_id, 
  start_date, end_date, monthly_rent, deposit, payment_day,
  terms, contract_pdf, contract_hash,
  blockchain_tx_hash, landlord_signature, tenant_signature,
  signed_at, status, created_at, updated_at
)
VALUES
  (
    'contract-001',
    'property-001',
    'user-landlord-001',
    'user-tenant-001',
    '2026-02-01',
    '2026-08-01',
    3500000,
    7000000,
    5,
    'Điều khoản hợp đồng:
1. Người thuê phải thanh toán tiền phòng trước ngày 5 hàng tháng
2. Tiền điện, nước tính theo đồng hồ
3. Không được nuôi thú cưng
4. Giữ gìn vệ sinh chung
5. Báo trước 1 tháng nếu muốn chấm dứt hợp đồng',
    NULL,
    '0x3f4a8b2c1d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a',
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    '0x1111111111111111111111111111111111111111111111111111111111111111',
    '0x2222222222222222222222222222222222222222222222222222222222222222',
    '2026-01-20 10:30:00',
    'SIGNED',
    NOW(),
    NOW()
  ),
  (
    'contract-002',
    'property-002',
    'user-landlord-001',
    'user-tenant-002',
    '2026-03-01',
    '2027-03-01',
    8000000,
    16000000,
    1,
    'Điều khoản hợp đồng:
1. Thanh toán tiền thuê vào đầu tháng
2. Điện nước: 3.500đ/kWh, 80.000đ/m3
3. Được nuôi mèo (không quá 1 con)
4. Không ở quá 4 người
5. Báo trước 2 tháng nếu muốn gia hạn',
    NULL,
    '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
    NULL,
    '0x3333333333333333333333333333333333333333333333333333333333333333',
    NULL,
    NULL,
    'PENDING',
    NOW(),
    NOW()
  );

-- Sample Blockchain Transactions
INSERT INTO blockchain_transactions (id, tx_hash, contract_hash, from_address, to_address, block_number, gas_used, status, created_at, confirmed_at)
VALUES
  (
    'tx-001',
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    '0x3f4a8b2c1d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a',
    '0x1234567890123456789012345678901234567890',
    '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    12345678,
    '84523',
    'confirmed',
    NOW(),
    NOW()
  );

-- Display results
SELECT 'Sample data inserted successfully!' AS message;

SELECT 'Users created:' AS info, COUNT(*) AS count FROM users;
SELECT 'Properties created:' AS info, COUNT(*) AS count FROM properties;
SELECT 'Contracts created:' AS info, COUNT(*) AS count FROM contracts;
SELECT 'Blockchain Txs created:' AS info, COUNT(*) AS count FROM blockchain_transactions;
