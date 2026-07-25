# Test Tracking - Hotelify (WDP101)

> Cập nhật gần nhất: 7/18/2026 | Người thực hiện: nghiadt

## Tổng Quan Tiến Độ

| Module | Tổng TC | Đã test | Chưa test | Tiến độ |
|--------|---------|---------|-----------|---------|
| Customer Auth (Backend) | 17 | 17 | 0 | ✅ 100% |
| Customer Auth UI (Frontend) | 3 | 3 | 0 | ✅ 100% |
| Date Utils | 4 | 4 | 0 | ✅ 100% |
| Room Management (Manager) | 12 | 0 | 12 | ⬜ 0% |
| Room Type Management | 8 | 0 | 8 | ⬜ 0% |
| Housekeeping | 10 | 0 | 10 | ⬜ 0% |
| Staff Tasks | 8 | 0 | 8 | ⬜ 0% |
| Room Inventory | 6 | 0 | 6 | ⬜ 0% |
| Customer Feedback | 6 | 0 | 6 | ⬜ 0% |
| Policies | 4 | 0 | 4 | ⬜ 0% |
| Dashboard (Manager) | 4 | 0 | 4 | ⬜ 0% |
| Admin Accounts | 6 | 0 | 6 | ⬜ 0% |
| Admin Roles | 4 | 0 | 4 | ⬜ 0% |
| Admin Dashboard | 3 | 0 | 3 | ⬜ 0% |
| Reservation (Customer) | 8 | 0 | 8 | ⬜ 0% |
| Payment | 6 | 0 | 6 | ⬜ 0% |
| Check-in (Receptionist) | 8 | 0 | 8 | ⬜ 0% |
| Check-out (Receptionist) | 6 | 0 | 6 | ⬜ 0% |
| Profile | 4 | 0 | 4 | ⬜ 0% |
| Upload & Image Security (Mới) | 5 | 0 | 5 | ⬜ 0% |
| Auth Middleware & Guard (Mới) | 4 | 0 | 4 | ⬜ 0% |
| Password Validation Utils (Mới) | 4 | 0 | 4 | ⬜ 0% |
| Homepage / Room List (FE) | 6 | 0 | 6 | ⬜ 0% |
| Booking Page (FE) | 5 | 0 | 5 | ⬜ 0% |
| Manager Pages (FE) | 8 | 0 | 8 | ⬜ 0% |
| Admin Pages (FE) | 4 | 0 | 4 | ⬜ 0% |
| Receptionist Pages (FE) | 6 | 0 | 6 | ⬜ 0% |
| **TỔNG CỘNG** | **165** | **24** | **141** | **14.5%** |

---

## Chi Tiết Từng Module

### ✅ Module 1: Customer Auth Backend (HOÀN THÀNH)
- [x] UT001 - Đăng ký tài khoản mới thành công
- [x] UT002 - Thiếu full_name
- [x] UT003 - Email không đúng định dạng
- [x] UT004 - login_account dưới 4 ký tự
- [x] UT005 - Mật khẩu không đạt yêu cầu bảo mật
- [x] UT006 - Mật khẩu xác nhận không khớp
- [x] UT007 - Chưa tích chọn đồng ý điều khoản
- [x] UT008 - Đăng ký trùng Email đã tồn tại
- [x] UT009 - Đăng nhập thành công
- [x] UT010 - Thiếu tài khoản hoặc mật khẩu
- [x] UT011 - Tài khoản không tồn tại
- [x] UT012 - Nhập sai mật khẩu
- [x] UT013 - Tài khoản bị khóa (inactive)
- [x] UT014 - Yêu cầu gửi mail đặt lại mật khẩu
- [x] UT015 - Reset mật khẩu cho email không tồn tại
- [x] UT016 - Token không hợp lệ / hết hạn
- [x] UT017 - Đặt lại mật khẩu mới thành công

### ✅ Module 2: Customer Auth Frontend (HOÀN THÀNH)
- [x] UT018 - Render form đăng nhập chuẩn
- [x] UT019 - Hiển thị thông báo lỗi khi sai mật khẩu
- [x] UT020 - Lưu token vào localStorage khi đăng nhập thành công

### ✅ Module 3: Date Utils (HOÀN THÀNH)
- [x] parsePositiveInteger - Parse số nguyên dương hợp lệ
- [x] parsePositiveInteger - Trả về fallback cho input không hợp lệ
- [x] parseDateOnly - Parse YYYY-MM-DD đúng
- [x] addDays - Cộng ngày đúng

---

### ⬜ Module 4: Room Management (Manager) - CHƯA TEST
**Files:** `backend/src/modules/manager/room/room.service.js`, `room.controller.js`, `room.route.js`
**API Endpoints:**
- GET /api/manager/rooms - Lấy danh sách phòng
- GET /api/manager/rooms/:id - Lấy chi tiết phòng
- POST /api/manager/rooms - Tạo phòng mới
- PUT /api/manager/rooms/:id - Cập nhật phòng
- DELETE /api/manager/rooms/:id - Xóa phòng (soft delete)

**Test Cases cần viết:**
- [ ] UT021 - Lấy danh sách phòng thành công (có phân trang)
- [ ] UT022 - Lọc phòng theo roomTypeId
- [ ] UT023 - Lọc phòng theo status
- [ ] UT024 - Lấy chi tiết phòng theo ID
- [ ] UT025 - Lấy phòng không tồn tại (404)
- [ ] UT026 - Tạo phòng mới thành công
- [ ] UT027 - Tạo phòng trùng tên (409)
- [ ] UT028 - Tạo phòng với room_type_id không hợp lệ (400)
- [ ] UT029 - Cập nhật phòng thành công
- [ ] UT030 - Cập nhật phòng không tồn tại (404)
- [ ] UT031 - Xóa mềm phòng thành công
- [ ] UT032 - Xóa phòng không tồn tại (404)

---

### ⬜ Module 5: Room Type Management - CHƯA TEST
**Files:** `backend/src/modules/manager/room-type/room-type.service.js`
**API Endpoints:**
- GET /api/manager/room-types
- POST /api/manager/room-types
- PUT /api/manager/room-types/:id
- DELETE /api/manager/room-types/:id

**Test Cases cần viết:**
- [ ] UT033 - Lấy danh sách loại phòng
- [ ] UT034 - Tạo loại phòng mới thành công
- [ ] UT035 - Tạo loại phòng trùng tên (409)
- [ ] UT036 - Thiếu trường bắt buộc khi tạo (400)
- [ ] UT037 - Cập nhật loại phòng thành công
- [ ] UT038 - Cập nhật loại phòng không tồn tại (404)
- [ ] UT039 - Xóa loại phòng thành công
- [ ] UT040 - Xóa loại phòng đang được sử dụng (409)

---

### ⬜ Module 6: Housekeeping - CHƯA TEST
**Files:** `backend/src/modules/manager/housekeeping/housekeeping.service.js`
**API Endpoints:**
- GET /api/housekeeping/tasks
- POST /api/housekeeping/tasks
- PUT /api/housekeeping/tasks/:id
- GET /api/housekeeping/schedule

**Test Cases cần viết:**
- [ ] UT041 - Lấy danh sách task housekeeping
- [ ] UT042 - Tạo task housekeeping mới
- [ ] UT043 - Cập nhật trạng thái task
- [ ] UT044 - Giao task cho nhân viên
- [ ] UT045 - Lấy lịch làm việc housekeeping
- [ ] UT046 - Filter task theo ngày
- [ ] UT047 - Filter task theo trạng thái
- [ ] UT048 - Housekeeping staff chỉ xem được task của mình
- [ ] UT049 - Manager xem được tất cả task
- [ ] UT050 - Task quá hạn tự động đánh dấu

---

### ⬜ Module 7: Staff Tasks - CHƯA TEST
**Files:** `backend/src/modules/manager/staff-task/staff-task.service.js`

**Test Cases cần viết:**
- [ ] UT051 - Lấy danh sách staff tasks
- [ ] UT052 - Tạo task mới
- [ ] UT053 - Cập nhật task
- [ ] UT054 - Xóa task
- [ ] UT055 - Giao task cho staff
- [ ] UT056 - Filter task theo staff_type
- [ ] UT057 - Filter task theo priority
- [ ] UT058 - Task completed không thể chỉnh sửa

---

### ⬜ Module 8: Room Inventory - CHƯA TEST
**Files:** `backend/src/modules/manager/room-inventory/room-inventory.service.js`

**Test Cases cần viết:**
- [ ] UT059 - Lấy danh sách inventory items
- [ ] UT060 - Tạo inventory item mới
- [ ] UT061 - Cập nhật inventory item
- [ ] UT062 - Xóa inventory item
- [ ] UT063 - Deactivate inventory item
- [ ] UT064 - Item đang dùng trong room không thể xóa

---

### ⬜ Module 9: Customer Feedback - CHƯA TEST
**Files:** `backend/src/modules/customer/feedback/feedback.service.js`, `backend/src/modules/manager/customer-feedback/customer-feedback.service.js`

**Test Cases cần viết:**
- [ ] UT065 - Customer gửi feedback thành công
- [ ] UT066 - Thiếu nội dung feedback (400)
- [ ] UT067 - Manager lấy danh sách feedback
- [ ] UT068 - Manager reply feedback
- [ ] UT069 - Manager thay đổi trạng thái feedback
- [ ] UT070 - Customer chỉ xem được feedback của mình

---

### ⬜ Module 10: Policies - CHƯA TEST
**Files:** `backend/src/modules/manager/policy/policy.service.js`

**Test Cases cần viết:**
- [ ] UT071 - Lấy danh sách policies
- [ ] UT072 - Tạo policy mới
- [ ] UT073 - Cập nhật policy
- [ ] UT074 - Xóa policy

---

### ⬜ Module 11: Dashboard (Manager) - CHƯA TEST
**Files:** `backend/src/modules/manager/dashboard/dashboard.service.js`

**Test Cases cần viết:**
- [ ] UT075 - Lấy thống kê tổng quan
- [ ] UT076 - Lấy dữ liệu doanh thu
- [ ] UT077 - Lấy tỷ lệ lấp đầy phòng
- [ ] UT078 - Dashboard data theo khoảng thời gian

---

### ⬜ Module 12: Admin Accounts - CHƯA TEST
**Files:** `backend/src/modules/admin/account/account.service.js`

**Test Cases cần viết:**
- [ ] UT079 - Admin lấy danh sách accounts
- [ ] UT080 - Admin tạo account mới
- [ ] UT081 - Admin cập nhật account
- [ ] UT082 - Admin deactivate account
- [ ] UT083 - Non-admin không truy cập được (403)
- [ ] UT084 - Admin thay đổi role cho account

---

### ⬜ Module 13: Admin Roles - CHƯA TEST
**Files:** `backend/src/modules/admin/role/role.service.js`

**Test Cases cần viết:**
- [ ] UT085 - Admin lấy danh sách roles
- [ ] UT086 - Admin tạo role mới
- [ ] UT087 - Admin cập nhật role
- [ ] UT088 - Admin xóa role không được sử dụng

---

### ⬜ Module 14: Admin Dashboard - CHƯA TEST
**Files:** `backend/src/modules/admin/dashboard/dashboard.controller.js`

**Test Cases cần viết:**
- [ ] UT089 - Admin lấy thống kê tổng hệ thống
- [ ] UT090 - Admin lấy danh sách users theo role
- [ ] UT091 - Admin lấy log bảo mật

---

### ⬜ Module 15: Reservation (Customer) - CHƯA TEST
**Files:** `backend/src/modules/customer/reservation/reservation.service.js`

**Test Cases cần viết:**
- [ ] UT092 - Customer tạo reservation thành công
- [ ] UT093 - Thiếu thông tin bắt buộc (400)
- [ ] UT094 - Ngày check-in phải trước check-out
- [ ] UT095 - Phòng không available trong khoảng thời gian
- [ ] UT096 - Customer xem danh sách reservation của mình
- [ ] UT097 - Customer hủy reservation
- [ ] UT098 - Customer xem chi tiết reservation
- [ ] UT099 - Reservation quá hạn tự động hủy

---

### ⬜ Module 16: Payment - CHƯA TEST
**Files:** `backend/src/modules/customer/payment/payment.service.js`

**Test Cases cần viết:**
- [ ] UT100 - Tạo payment link thành công
- [ ] UT101 - Payment với reservation không tồn tại (404)
- [ ] UT102 - Payment đã thanh toán rồi (409)
- [ ] UT103 - Xác nhận payment từ webhook
- [ ] UT104 - Webhook signature không hợp lệ (401)
- [ ] UT105 - Lấy lịch sử payment

---

### ⬜ Module 17: Check-in (Receptionist) - CHƯA TEST
**Files:** `backend/src/modules/receptionist/checkin/checkin.service.js`

**Test Cases cần viết:**
- [ ] UT106 - Check-in thành công
- [ ] UT107 - Check-in reservation không tồn tại (404)
- [ ] UT108 - Check-in reservation đã check-in rồi (409)
- [ ] UT109 - Gán phòng khi check-in
- [ ] UT110 - Thêm thông tin khách ở (Stay Guest)
- [ ] UT111 - Walk-in booking tạo mới
- [ ] UT112 - Receptionist xem danh sách booking
- [ ] UT113 - Receptionist xem chi tiết booking

---

### ⬜ Module 18: Check-out (Receptionist) - CHƯA TEST
**Files:** `backend/src/modules/receptionist/checkout/checkout.service.js`

**Test Cases cần viết:**
- [ ] UT114 - Check-out thành công
- [ ] UT115 - Check-out khi chưa check-in (400)
- [ ] UT116 - Tính toán phụ phí khi check-out
- [ ] UT117 - Tạo invoice khi check-out
- [ ] UT118 - Kiểm tra phòng khi check-out (inspection)
- [ ] UT119 - Check-out tự động cập nhật trạng thái phòng

---

### ⬜ Module 19: Profile - CHƯA TEST
**Files:** `backend/src/services/profile.service.js`, `backend/src/controllers/profile.controller.js`

**Test Cases cần viết:**
- [ ] UT120 - Lấy thông tin profile thành công
- [ ] UT121 - Cập nhật profile thành công
- [ ] UT122 - Đổi mật khẩu thành công
- [ ] UT123 - Đổi mật khẩu sai mật khẩu cũ (401)

---

### ⬜ Module 20: Upload & Image Security (MỚI BỔ SUNG) - CHƯA TEST
**Files:** `backend/src/routes/upload.route.js`, `backend/src/middlewares/upload.middleware.js`

**Test Cases cần viết:**
- [ ] UT124 - Upload ảnh hợp lệ (PNG/JPG/WEBP) thành công
- [ ] UT125 - Chặn file không phải ảnh (PDF/EXE/TXT) (400)
- [ ] UT126 - Kiểm tra Magic Bytes ngăn chặn đổi đuôi file giả mạo (400)
- [ ] UT127 - Chặn upload file vượt quá dung lượng cho phép (400)
- [ ] UT128 - Upload không gửi file (400)

---

### ⬜ Module 21: Auth Middleware & Guard (MỚI BỔ SUNG) - CHƯA TEST
**Files:** `backend/src/middlewares/auth.middleware.js`

**Test Cases cần viết:**
- [ ] UT129 - Truy cập API bảo vệ với Token hợp lệ (200)
- [ ] UT130 - Truy cập API bảo vệ không có Header Authorization (401)
- [ ] UT131 - Truy cập API bảo vệ với Token sai/hết hạn (401)
- [ ] UT132 - Truy cập API vượt quá quyền hạn của Role (403)

---

### ⬜ Module 22: Password Validation Utils (MỚI BỔ SUNG) - CHƯA TEST
**Files:** `frontend/src/utils/passwordValidation.js`

**Test Cases cần viết:**
- [ ] UT133 - Validate mật khẩu mạnh trả về hợp lệ
- [ ] UT134 - Validate mật khẩu ngắn hơn 8 ký tự trả về lỗi
- [ ] UT135 - Validate mật khẩu thiếu chữ hoa/thường/số trả về lỗi
- [ ] UT136 - Validate mật khẩu thiếu ký tự đặc biệt trả về lỗi

---

### ⬜ Module 23: Homepage / Room List (Frontend) - CHƯA TEST
**Files:** `frontend/src/pages/HomePage.jsx`, `frontend/src/pages/RoomListPage.jsx`

**Test Cases cần viết:**
- [ ] UT137 - HomePage render đúng heading
- [ ] UT138 - RoomListPage hiển thị danh sách phòng
- [ ] UT139 - RoomListPage filter theo loại phòng
- [ ] UT140 - RoomListPage search theo tên
- [ ] UT141 - RoomDetailPage hiển thị thông tin chi tiết
- [ ] UT142 - RoomSearchResultsPage hiển thị kết quả

---

### ⬜ Module 24: Booking Page (Frontend) - CHƯA TEST
**Files:** `frontend/src/pages/BookingPage.jsx`, `frontend/src/pages/PaymentPage.jsx`

**Test Cases cần viết:**
- [ ] UT143 - BookingPage render form đặt phòng
- [ ] UT144 - BookingPage validation ngày check-in/out
- [ ] UT145 - BookingPage submit thành công
- [ ] UT146 - PaymentPage hiển thị thông tin thanh toán
- [ ] UT147 - PaymentPage xử lý thanh toán thành công

---

### ⬜ Module 25: Manager Pages (Frontend) - CHƯA TEST
**Files:** `frontend/src/features/manager/pages/*.jsx`

**Test Cases cần viết:**
- [ ] UT148 - ManagerDashboardPage render thống kê
- [ ] UT149 - RoomManagePage hiển thị danh sách phòng
- [ ] UT150 - AddRoomPage render form thêm phòng
- [ ] UT151 - EditRoomPage load dữ liệu phòng
- [ ] UT152 - HousekeepingTasksPage hiển thị task list
- [ ] UT153 - HousekeepingSchedulePage hiển thị lịch
- [ ] UT154 - ManagerStaffTasksPage hiển thị staff tasks
- [ ] UT155 - ManagerCustomerFeedbackPage hiển thị feedback

---

### ⬜ Module 26: Admin Pages (Frontend) - CHƯA TEST
**Files:** `frontend/src/features/admin/pages/*.jsx`

**Test Cases cần viết:**
- [ ] UT156 - AdminDashboardPage render thống kê
- [ ] UT157 - AdminAccountsPage hiển thị danh sách accounts
- [ ] UT158 - AdminRolesPage hiển thị danh sách roles
- [ ] UT159 - AdminProfilePage hiển thị thông tin admin

---

### ⬜ Module 27: Receptionist Pages (Frontend) - CHƯA TEST
**Files:** `frontend/src/features/receptionist/pages/*.jsx`, `components/*.jsx`

**Test Cases cần viết:**
- [ ] UT160 - ReceptionistDashboardPage render
- [ ] UT161 - ReceptionistBookingListPage hiển thị bookings
- [ ] UT162 - ReceptionistBookingDetailPage hiển thị chi tiết
- [ ] UT163 - CheckinWizard render các bước
- [ ] UT164 - CheckoutWizard render các bước
- [ ] UT165 - WalkinBookingForm render form

---

## Thứ Tự Ưu Tiên Test (Priority Roadmap)

### 🔴 Priority 1 (Critical) - Thực hiện trước
1. **Room Management (Backend)** - Quản lý phòng
2. **Reservation (Customer)** - Luồng đặt phòng
3. **Check-in / Check-out (Receptionist)** - Nghiệp vụ lễ tân
4. **Payment** - Thanh toán
5. **Auth Middleware & Guard** - Bảo mật phân quyền API

### 🟡 Priority 2 (High) - Thực hiện tiếp theo
6. **Room Type Management**
7. **Housekeeping**
8. **Staff Tasks**
9. **Upload & Image Security**
10. **Profile & Password Validation**
11. **Customer Feedback**

### 🟢 Priority 3 (Medium) - Thực hiện sau cùng
12. **Admin Accounts / Roles / Dashboard**
13. **Policies & Room Inventory**
14. **Frontend UI Integration Pages**

---

## File Test Hiện Có

| File | Module | Số TC | Trạng thái |
|------|--------|-------|------------|
| `backend/tests/unit/auth.service.test.js` | Customer Auth | 17 | ✅ Pass |
| `backend/tests/unit/date.utils.test.js` | Date Utils | 4 | ✅ Pass |
| `frontend/src/pages/__tests__/LoginPage.test.jsx` | Login UI | 3 | ✅ Pass |
| `frontend/src/components/__tests__/AppHeader.test.jsx` | AppHeader | 1 | ✅ Pass |
