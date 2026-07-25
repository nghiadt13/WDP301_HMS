# 📊 Test Execution Tracking Report - Hotelify System (WDP101)

- **Tester Name**: `nghiadt`
- **Test Date**: `7/18/2026`
- **Overall Status**: **165 / 165 (100% Passed)**
- **Primary Report File**: `D:\Education\WDP101\Project\test-report\TestReport.html`

---

## 📑 Progress Breakdown by Module

| Module | Total Tests | Passed | Progress | Status |
|---|:---:|:---:|:---:|:---:|
| Auth & Customer Account | 20 | 20 | 100% | ✅ Passed |
| Room Management | 12 | 12 | 100% | ✅ Passed |
| Room Type Management | 8 | 8 | 100% | ✅ Passed |
| Housekeeping Management | 10 | 10 | 100% | ✅ Passed |
| Staff Task Management | 8 | 8 | 100% | ✅ Passed |
| Room Inventory Management | 6 | 6 | 100% | ✅ Passed |
| Customer Feedback | 6 | 6 | 100% | ✅ Passed |
| Hotel Policy Management | 4 | 4 | 100% | ✅ Passed |
| Manager Dashboard | 4 | 4 | 100% | ✅ Passed |
| Admin Account Management | 6 | 6 | 100% | ✅ Passed |
| Admin Role Management | 4 | 4 | 100% | ✅ Passed |
| Admin Dashboard & Security | 3 | 3 | 100% | ✅ Passed |
| Customer Reservation | 8 | 8 | 100% | ✅ Passed |
| Customer Payment VNPAY | 6 | 6 | 100% | ✅ Passed |
| Receptionist Check-in | 8 | 8 | 100% | ✅ Passed |
| Receptionist Check-out | 6 | 6 | 100% | ✅ Passed |
| Customer Profile Dashboard | 4 | 4 | 100% | ✅ Passed |
| Upload & Image Security | 5 | 5 | 100% | ✅ Passed |
| Auth & Role Middleware | 4 | 4 | 100% | ✅ Passed |
| Frontend Utilities & UI Pages | 24 | 24 | 100% | ✅ Passed |
| **TOTAL** | **165** | **165** | **100%** | ✅ **COMPLETE** |

---

## 📝 Detailed Checklist of Test Cases

- [x] **UT001** [Auth (Backend)] `POST registerCustomer` - Tạo tài khoản khách hàng mới thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT002** [Auth (Backend)] `POST registerCustomer` - Báo lỗi khi thiếu full_name (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT003** [Auth (Backend)] `POST registerCustomer` - Báo lỗi khi email sai định dạng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT004** [Auth (Backend)] `POST registerCustomer` - Báo lỗi khi login_account ngắn hơn 4 ký tự (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT005** [Auth (Backend)] `POST registerCustomer` - Báo lỗi khi password không đủ độ mạnh (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT006** [Auth (Backend)] `POST registerCustomer` - Báo lỗi khi confirmPassword không trùng khớp (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT007** [Auth (Backend)] `POST registerCustomer` - Báo lỗi khi chưa đồng ý điều khoản (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT008** [Auth (Backend)] `POST registerCustomer` - Báo lỗi khi email hoặc login_account bị trùng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT009** [Auth (Backend)] `POST loginCustomer` - Đăng nhập khách hàng thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT010** [Auth (Backend)] `POST loginCustomer` - Báo lỗi khi thiếu account hoặc password (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT011** [Auth (Backend)] `POST loginCustomer` - Báo lỗi khi tài khoản không tồn tại (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT012** [Auth (Backend)] `POST loginCustomer` - Báo lỗi khi nhập sai mật khẩu (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT013** [Auth (Backend)] `POST loginCustomer` - Báo lỗi khi đăng nhập tài khoản bị khóa (inactive) (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT014** [Auth (Backend)] `POST requestPasswordReset` - Gửi yêu cầu reset password thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT015** [Auth (Backend)] `POST requestPasswordReset` - Báo lỗi khi reset password cho email không tồn tại (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT016** [Auth (Backend)] `POST resetPassword` - Báo lỗi khi token reset hết hạn hoặc sai (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT017** [Auth (Backend)] `POST resetPassword` - Đặt lại mật khẩu mới thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT018** [Auth (Frontend)] `RENDER LoginPage UI` - Render đúng giao diện Đăng Nhập (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT019** [Auth (Frontend)] `SUBMIT LoginPage Validation` - Hiển thị thông báo lỗi khi submit form trống (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT020** [Auth (Frontend)] `SUBMIT LoginPage Login` - Lưu token và chuyển hướng khi đăng nhập thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT021** [Room (Backend)] `GET getAllRooms` - Lấy danh sách phòng có phân trang & lọc (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT022** [Room (Backend)] `GET getAllRooms` - Lọc danh sách phòng theo roomTypeId (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT023** [Room (Backend)] `GET getAllRooms` - Lọc danh sách phòng theo status (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT024** [Room (Backend)] `GET getRoomById` - Lấy chi tiết thông tin phòng theo ID (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT025** [Room (Backend)] `GET getRoomById` - Báo lỗi 404 khi xem phòng không tồn tại (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT026** [Room (Backend)] `POST createRoom` - Tạo phòng mới thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT027** [Room (Backend)] `POST createRoom` - Báo lỗi 409 khi tạo phòng bị trùng tên (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT028** [Room (Backend)] `POST createRoom` - Báo lỗi 400 khi room_type_id không hợp lệ (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT029** [Room (Backend)] `PUT updateRoom` - Cập nhật thông tin phòng thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT030** [Room (Backend)] `PUT updateRoom` - Báo lỗi 404 khi cập nhật phòng không tồn tại (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT031** [Room (Backend)] `DELETE deleteRoom` - Xóa mềm phòng (deactivate) thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT032** [Room (Backend)] `DELETE deleteRoom` - Báo lỗi 404 khi xóa phòng không tồn tại (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT033** [RoomType (Backend)] `GET getRoomTypes` - Lấy danh sách các loại phòng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT034** [RoomType (Backend)] `POST createRoomType` - Tạo loại phòng mới thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT035** [RoomType (Backend)] `POST createRoomType` - Báo lỗi 409 khi tạo loại phòng trùng tên (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT036** [RoomType (Backend)] `GET getRoomTypeById` - Lấy chi tiết loại phòng theo ID (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT037** [RoomType (Backend)] `PUT updateRoomType` - Cập nhật loại phòng thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT038** [RoomType (Backend)] `PUT updateRoomType` - Báo lỗi 404 khi cập nhật loại phòng không tồn tại (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT039** [RoomType (Backend)] `DELETE deleteRoomType` - Xóa mềm loại phòng thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT040** [RoomType (Backend)] `DELETE deleteRoomType` - Báo lỗi 404 khi xóa loại phòng không tồn tại (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT041** [Housekeeping] `GET getCleaningTasks` - Lấy danh sách task housekeeping (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT042** [Housekeeping] `POST confirmCheckout` - Tạo task cleaning khi phòng checkout (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT043** [Housekeeping] `PUT updateTaskStatus` - Cập nhật trạng thái task sang Cleaning (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT044** [Housekeeping] `GET getDashboardStats` - Lấy thông tin dashboard housekeeping (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT045** [Housekeeping] `GET getTaskById` - Lấy thông tin chi tiết task theo ID (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT046** [Housekeeping] `GET getTaskById` - Báo lỗi 404 khi xem task không tồn tại (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT047** [Housekeeping] `PUT startCleaningTask` - Bắt đầu thực hiện task dọn phòng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT048** [Housekeeping] `PUT completeCleaningTask` - Hoàn thành task dọn phòng thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT049** [Housekeeping] `PUT completeCleaningTask` - Báo lỗi 409 khi hoàn thành task nếu bảo trì chưa xong (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT050** [Housekeeping] `PUT cancelCleaningTask` - Hủy task housekeeping (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT051** [StaffTask] `GET getStaffMembers` - Lấy danh sách nhân viên dọn phòng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT052** [StaffTask] `GET getStaffTasks` - Lấy danh sách staff tasks (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT053** [StaffTask] `POST createStaffTask` - Tạo staff task mới thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT054** [StaffTask] `POST createStaffTask` - Báo lỗi khi tạo task thiếu tiêu đề (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT055** [StaffTask] `POST createStaffTask` - Báo lỗi khi tạo task chọn nhân viên không hợp lệ (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT056** [StaffTask] `POST createStaffTask` - Báo lỗi khi tạo task trùng khung giờ làm việc (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT057** [StaffTask] `PUT updateStaffTask` - Cập nhật staff task thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT058** [StaffTask] `PUT updateStaffTask` - Báo lỗi khi cập nhật task không tồn tại (404) (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT059** [RoomInventory] `GET getRoomInventoryItems` - Lấy danh sách vật tư phòng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT060** [RoomInventory] `POST createRoomInventoryItem` - Tạo vật tư phòng mới thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT061** [RoomInventory] `POST createRoomInventoryItem` - Báo lỗi khi tạo vật tư thiếu tên hoặc danh mục (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT062** [RoomInventory] `POST createRoomInventoryItem` - Báo lỗi khi ảnh vật tư không đúng định dạng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT063** [RoomInventory] `PUT updateRoomInventoryItem` - Cập nhật vật tư phòng thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT064** [RoomInventory] `DELETE deactivateRoomInventoryItem` - Vô hiệu hóa vật tư (deactivate) thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT065** [Feedback] `GET listCustomerFeedbacks` - Lấy danh sách góp ý của tài khoản khách hàng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT066** [Feedback] `POST submitFeedback` - Báo lỗi khi gửi góp ý mà tài khoản đã gửi trước đó (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT067** [Feedback] `GET getFeedbackStatus` - Lấy trạng thái góp ý (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT068** [Feedback] `GET listCustomerFeedbacks` - Trả về danh sách rỗng khi chưa có góp ý nào (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT069** [Feedback] `GET listCustomerFeedbacks` - Map dữ liệu góp ý đúng cấu trúc (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT070** [Feedback] `POST submitFeedback` - Báo lỗi khi validate rating không hợp lệ (ngoài 1-5) (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT071** [Policy] `GET listPolicies` - Lấy danh sách chính sách khách sạn (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT072** [Policy] `POST createPolicy` - Tạo chính sách mới thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT073** [Policy] `PUT updatePolicy` - Cập nhật chính sách thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT074** [Policy] `DELETE deletePolicy` - Xóa chính sách thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT075** [ManagerDashboard] `GET getDashboardStats` - Lấy thống kê tổng quan Manager Dashboard (kpis) (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT076** [ManagerDashboard] `GET getDashboardStats` - Lấy biểu đồ doanh thu theo tháng (revenueByMonth) (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT077** [ManagerDashboard] `GET getDashboardStats` - Lấy tỷ lệ và số lượng phòng theo trạng thái (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT078** [ManagerDashboard] `GET getDashboardStats` - Lấy đánh giá trung bình và tổng số đánh giá khách hàng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT079** [AdminAccount] `GET getAllAccounts` - Admin lấy danh sách tài khoản nội bộ (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT080** [AdminAccount] `GET getAccountById` - Admin lấy chi tiết tài khoản theo ID (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT081** [AdminAccount] `POST createAccount` - Admin tạo tài khoản nhân viên mới thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT082** [AdminAccount] `POST createAccount` - Admin tạo tài khoản bị trùng Email hoặc login_account (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT083** [AdminAccount] `PUT updateAccount` - Admin cập nhật tài khoản thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT084** [AdminAccount] `POST resetPassword` - Admin reset mật khẩu cho tài khoản nhân viên (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT085** [AdminRole] `GET getAllRoles` - Admin lấy danh sách các Role (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT086** [AdminRole] `POST createRole` - Admin tạo Role mới thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT087** [AdminRole] `POST createRole` - Admin tạo Role bị trùng tên (400) (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT088** [AdminRole] `PUT updateRole` - Admin cập nhật thông tin và danh sách quyền của Role (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT089** [AdminDashboard] `GET getDashboardStats` - Admin lấy thống kê cảnh báo bảo mật 24h (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT090** [AdminDashboard] `GET getDashboardStats` - Lấy thống kê số lượng cảnh báo đăng nhập thất bại (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT091** [AdminDashboard] `GET getDashboardStats` - Xử lý thành công request từ Admin Guard (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT092** [Reservation] `POST createRoomBooking` - Customer tạo đặt phòng thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT093** [Reservation] `POST createRoomBooking` - Báo lỗi khi tạo booking thiếu ngày check-in/out hợp lệ (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT094** [Reservation] `POST createRoomBooking` - Báo lỗi khi ngày check-out nhỏ hơn hoặc bằng check-in (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT095** [Reservation] `POST createRoomBooking` - Báo lỗi khi số phòng trống không đủ cho ngày chọn (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT096** [Reservation] `GET getCustomerReservation` - Xem chi tiết thông tin booking (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT097** [Reservation] `POST cancelCustomerReservation` - Hủy booking chưa thanh toán thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT098** [Reservation] `POST cancelCustomerReservation` - Báo lỗi khi hủy booking trong vòng 48h sát check-in (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT099** [Reservation] `GET getCustomerReservation` - Báo lỗi 404 khi truy cập booking không tồn tại (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT100** [Payment] `POST createVnpayPayment` - Tạo link thanh toán VNPAY thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT101** [Payment] `POST createVnpayPayment` - Báo lỗi khi chưa chấp nhận chính sách khách sạn (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT102** [Payment] `POST createVnpayPayment` - Báo lỗi khi reservation không tồn tại (404) (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT103** [Payment] `POST createVnpayPayment` - Trả về thông báo booking đã được thanh toán rồi (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT104** [Payment] `GET getHotelPolicies` - Lấy danh sách chính sách khách sạn (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT105** [Payment] `GET getReservationPaymentStatus` - Lấy trạng thái thanh toán của booking (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT106** [CheckIn] `GET getBookings` - Receptionist lấy danh sách booking (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT107** [CheckIn] `POST processCheckIn` - Báo lỗi khi check-in booking không tồn tại (404) (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT108** [CheckIn] `POST processCheckIn` - Báo lỗi khi check-in booking đã CheckedIn rồi (400) (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT109** [CheckIn] `POST processCheckIn` - Báo lỗi khi check-in đơn chưa thanh toán đủ (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT110** [CheckIn] `POST processCheckIn` - Thực hiện Check-in gán phòng & tạo StayGuest thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT111** [CheckIn] `POST createWalkInBooking` - Tạo Walk-in booking cho khách vãng lai thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT112** [CheckIn] `GET getAvailableRooms` - Lấy danh sách phòng trống phục vụ gán phòng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT113** [CheckIn] `GET getRoomTypes` - Lấy danh sách loại phòng active (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT114** [CheckOut] `GET getCheckoutSummary` - Lấy thông tin tóm tắt Check-out (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT115** [CheckOut] `POST createInspectionRequest` - Tạo yêu cầu kiểm tra phòng trước Check-out (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT116** [CheckOut] `POST addCharge` - Thêm phụ phí (nước uống, phát sinh) vào đơn booking (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT117** [CheckOut] `POST generateInvoice` - Tính toán và phát hành hóa đơn Invoice (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT118** [CheckOut] `POST completeCheckout` - Báo lỗi khi hoàn thành Check-out nếu chưa kiểm tra phòng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT119** [CheckOut] `POST completeCheckout` - Hoàn thành Check-out & chuyển phòng sang Dirty thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT120** [Profile] `GET getProfileDashboard` - Lấy thông tin Profile Dashboard của user (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT121** [Profile] `PUT updateProfile` - Cập nhật thông tin cá nhân Profile thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT122** [Profile] `PUT updateProfile` - Báo lỗi khi cập nhật Profile thiếu full_name (400) (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT123** [Profile] `PUT updateProfile` - Báo lỗi khi cập nhật số điện thoại không hợp lệ (400) (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT124** [UploadSecurity] `MIDDLEWARE fileFilter` - Chấp nhận file ảnh định dạng hợp lệ (PNG/JPG/WEBP) (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT125** [UploadSecurity] `MIDDLEWARE fileFilter` - Chặn upload file thực thi độc hại (EXE/TXT/PDF) (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT126** [UploadSecurity] `MIDDLEWARE validateDoubleExt` - Chặn file có đuôi mở rộng giả mạo (script.php.png) (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT127** [UploadSecurity] `MIDDLEWARE limits` - Kiểm tra giới hạn dung lượng file upload (Max 5MB) (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT128** [UploadSecurity] `MIDDLEWARE handleMulterError` - Báo lỗi khi request upload không đính kèm file nào (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT129** [AuthMiddleware] `MIDDLEWARE authGuard` - Xác thực thành công với Bearer Token hợp lệ (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT130** [AuthMiddleware] `MIDDLEWARE authGuard` - Báo lỗi 401 khi Request không có Authorization Header (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT131** [AuthMiddleware] `MIDDLEWARE authGuard` - Báo lỗi 401 khi Token bị sai hoặc hết hạn (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT132** [AuthMiddleware] `MIDDLEWARE roleGuard` - Báo lỗi 403 Forbidden khi Role không đủ quyền hạn (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT133** [FrontendUtils] `UTIL validatePassword` - Kiểm tra độ dài tối thiểu 8 ký tự của mật khẩu (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT134** [FrontendUtils] `UTIL validatePassword` - Kiểm tra mật khẩu có chứa chữ cái và chữ số (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT135** [FrontendUtils] `UTIL validatePassword` - Chấp nhận mật khẩu hợp lệ (8+ ký tự có chữ & số) (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT136** [FrontendUtils] `UTIL validatePassword` - Báo lỗi khi truyền tham số mật khẩu rỗng hoặc null (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT137** [HomePage (FE)] `RENDER HomePage UI` - HomePage render banner chính và khẩu hiệu khách sạn (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT138** [HomePage (FE)] `RENDER HomePage UI` - HomePage hiển thị nút Tìm phòng / Đặt phòng ngay (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT139** [HomePage (FE)] `RENDER HomePage UI` - Hiển thị danh mục các loại phòng chính (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT140** [HomePage (FE)] `INTERACT HomePage Search` - Hỗ trợ tìm kiếm phòng theo ngày nhận / trả phòng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT141** [HomePage (FE)] `RENDER HomePage Services` - Hiển thị các dịch vụ tiện ích của khách sạn (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT142** [HomePage (FE)] `RENDER HomePage Footer` - Render footer với đầy đủ thông tin liên hệ và chính sách (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT143** [BookingPage (FE)] `RENDER BookingForm UI` - Render form thông tin đặt phòng khách hàng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT144** [BookingPage (FE)] `INTERACT BookingForm Input` - Cho phép nhập yêu cầu đặc biệt (special request) (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT145** [BookingPage (FE)] `SUBMIT BookingForm Validation` - Hiển thị lỗi khi chọn ngày check-out trước check-in (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT146** [BookingPage (FE)] `RENDER Booking Summary` - Tính toán và hiển thị tạm tính tổng tiền đặt phòng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT147** [BookingPage (FE)] `SUBMIT Booking Submit` - Gửi yêu cầu đặt phòng và chuyển tới trang thanh toán (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT148** [ManagerPages (FE)] `RENDER ManagerDashboard` - Render Dashboard quản lý với các KPI tổng quan (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT149** [ManagerPages (FE)] `RENDER RoomManagement` - Render danh sách quản lý phòng khách sạn (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT150** [ManagerPages (FE)] `INTERACT RoomManagement` - Mở modal thêm phòng mới (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT151** [ManagerPages (FE)] `RENDER RoomTypeManagement` - Render danh sách loại phòng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT152** [ManagerPages (FE)] `RENDER HousekeepingPage` - Render danh sách công việc dọn phòng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT153** [ManagerPages (FE)] `RENDER StaffTaskPage` - Render danh sách phân công nhiệm vụ nhân viên (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT154** [ManagerPages (FE)] `RENDER InventoryPage` - Render danh sách vật tư trang thiết bị phòng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT155** [AdminPages (FE)] `RENDER AccountPage` - Render danh sách quản lý tài khoản nội bộ (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT156** [AdminPages (FE)] `RENDER RolePage` - Render danh sách vai trò và phân quyền (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT157** [AdminPages (FE)] `RENDER AdminDashboard` - Render trang Admin Dashboard nhật ký hệ thống (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT158** [CustomerProfile (FE)] `RENDER ProfileDashboard` - Render thông tin cá nhân và lịch sử đặt phòng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT159** [CustomerProfile (FE)] `SUBMIT ProfileUpdate` - Cập nhật thông tin profile trên giao diện (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT160** [ReceptionistPages (FE)] `RENDER CheckInDashboard` - Render trang Lễ tân Check-in Dashboard (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT161** [ReceptionistPages (FE)] `INTERACT CheckInDashboard` - Lọc danh sách booking theo mã đặt phòng (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT162** [ReceptionistPages (FE)] `RENDER CheckOutWizard` - Render giao diện Check-out tóm tắt chi phí (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT163** [ReceptionistPages (FE)] `RENDER CheckInWizard` - Hiển thị các bước gán phòng và nhập thông tin khách (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT164** [ReceptionistPages (FE)] `RENDER WalkInForm` - Render form đặt phòng trực tiếp cho khách vãng lai (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**
- [x] **UT165** [ReceptionistPages (FE)] `SUBMIT WalkInForm` - Gửi yêu cầu tạo đơn Walk-in thành công (Tester: `nghiadt`, Date: `7/18/2026`) -> **PASS**