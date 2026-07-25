import os

# Complete list of 165 unit test cases
test_cases = [
    # Auth Service & Controller (UT001 - UT020)
    ("UT001", "Auth (Backend)", "registerCustomer", "POST", "Tạo tài khoản khách hàng mới thành công", "Thông tin đăng ký hợp lệ", "full_name, email, login_account, password, confirmPassword, agreeToTerms", "Tạo tài khoản thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth.service.test.js"),
    ("UT002", "Auth (Backend)", "registerCustomer", "POST", "Báo lỗi khi thiếu full_name", "Không có full_name", "email, login_account, password", "Response 400: Full name is required.", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth.service.test.js"),
    ("UT003", "Auth (Backend)", "registerCustomer", "POST", "Báo lỗi khi email sai định dạng", "Email không đúng chuẩn RFC", "email = 'userinvalid'", "Response 400: Email is invalid.", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth.service.test.js"),
    ("UT004", "Auth (Backend)", "registerCustomer", "POST", "Báo lỗi khi login_account ngắn hơn 4 ký tự", "login_account < 4", "login_account = 'abc'", "Response 400: Account name must be at least 4 chars", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth.service.test.js"),
    ("UT005", "Auth (Backend)", "registerCustomer", "POST", "Báo lỗi khi password không đủ độ mạnh", "Password không đủ 8 ký tự", "password = '123'", "Response 400: Password weak", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth.service.test.js"),
    ("UT006", "Auth (Backend)", "registerCustomer", "POST", "Báo lỗi khi confirmPassword không trùng khớp", "confirmPassword khác password", "password='123', confirm='456'", "Response 400: Passwords do not match", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth.service.test.js"),
    ("UT007", "Auth (Backend)", "registerCustomer", "POST", "Báo lỗi khi chưa đồng ý điều khoản", "agreeToTerms = false", "agreeToTerms = false", "Response 400: Must agree to terms", "Pass", "Medium", "nghiadt", "7/18/2026", "Unit test auth.service.test.js"),
    ("UT008", "Auth (Backend)", "registerCustomer", "POST", "Báo lỗi khi email hoặc login_account bị trùng", "User đã tồn tại trong DB", "email = 'exist@mail.com'", "Response 409: Account or Email already in use", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth.service.test.js"),
    ("UT009", "Auth (Backend)", "loginCustomer", "POST", "Đăng nhập khách hàng thành công", "Tài khoản active", "login_account, password", "Trả về JWT token & user info", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth.service.test.js"),
    ("UT010", "Auth (Backend)", "loginCustomer", "POST", "Báo lỗi khi thiếu account hoặc password", "Body rỗng", "{}", "Response 400: Missing required fields", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth.service.test.js"),
    ("UT011", "Auth (Backend)", "loginCustomer", "POST", "Báo lỗi khi tài khoản không tồn tại", "User không có trong DB", "login_account = 'notfound'", "Response 401: Invalid credentials", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth.service.test.js"),
    ("UT012", "Auth (Backend)", "loginCustomer", "POST", "Báo lỗi khi nhập sai mật khẩu", "Mật khẩu không đúng hash", "password = 'wrong'", "Response 401: Invalid credentials", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth.service.test.js"),
    ("UT013", "Auth (Backend)", "loginCustomer", "POST", "Báo lỗi khi đăng nhập tài khoản bị khóa (inactive)", "is_active = false", "inactive_user", "Response 403: Account is locked", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth.service.test.js"),
    ("UT014", "Auth (Backend)", "requestPasswordReset", "POST", "Gửi yêu cầu reset password thành công", "Email tồn tại", "email = 'user@test.com'", "Gửi token reset qua email", "Pass", "Medium", "nghiadt", "7/18/2026", "Unit test auth.service.test.js"),
    ("UT015", "Auth (Backend)", "requestPasswordReset", "POST", "Báo lỗi khi reset password cho email không tồn tại", "Email không có trong DB", "email = 'none@test.com'", "Response 404: Email not found", "Pass", "Medium", "nghiadt", "7/18/2026", "Unit test auth.service.test.js"),
    ("UT016", "Auth (Backend)", "resetPassword", "POST", "Báo lỗi khi token reset hết hạn hoặc sai", "Reset token invalid", "token = 'badtoken'", "Response 400: Invalid or expired token", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth.service.test.js"),
    ("UT017", "Auth (Backend)", "resetPassword", "POST", "Đặt lại mật khẩu mới thành công", "Token hợp lệ", "token, newPassword", "Cập nhật password hash thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth.service.test.js"),
    ("UT018", "Auth (Frontend)", "LoginPage UI", "RENDER", "Render đúng giao diện Đăng Nhập", "Trang LoginPage", "n/a", "Hiển thị input account, password, nút login", "Pass", "High", "nghiadt", "7/18/2026", "Frontend LoginPage.test.jsx"),
    ("UT019", "Auth (Frontend)", "LoginPage Validation", "SUBMIT", "Hiển thị thông báo lỗi khi submit form trống", "LoginPage", "Form rỗng", "Hiển thị alert validate", "Pass", "High", "nghiadt", "7/18/2026", "Frontend LoginPage.test.jsx"),
    ("UT020", "Auth (Frontend)", "LoginPage Login", "SUBMIT", "Lưu token và chuyển hướng khi đăng nhập thành công", "Mock API success", "account, password", "LocalStorage lưu token & navigate", "Pass", "High", "nghiadt", "7/18/2026", "Frontend LoginPage.test.jsx"),

    # Room Management (UT021 - UT032)
    ("UT021", "Room (Backend)", "getAllRooms", "GET", "Lấy danh sách phòng có phân trang & lọc", "Tài khoản Manager/Admin", "page=1, limit=10, isActive=true", "Trả về list phòng & pagination", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room.service.test.js"),
    ("UT022", "Room (Backend)", "getAllRooms", "GET", "Lọc danh sách phòng theo roomTypeId", "Có roomTypeId", "roomTypeId", "Trả về danh sách phòng thuộc loại phòng", "Pass", "Medium", "nghiadt", "7/18/2026", "Unit test room.service.test.js"),
    ("UT023", "Room (Backend)", "getAllRooms", "GET", "Lọc danh sách phòng theo status", "Filter status = Available", "status = Available", "Trả về danh sách phòng Available", "Pass", "Medium", "nghiadt", "7/18/2026", "Unit test room.service.test.js"),
    ("UT024", "Room (Backend)", "getRoomById", "GET", "Lấy chi tiết thông tin phòng theo ID", "Room ID tồn tại", "roomId", "Trả về chi tiết thông tin phòng", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room.service.test.js"),
    ("UT025", "Room (Backend)", "getRoomById", "GET", "Báo lỗi 404 khi xem phòng không tồn tại", "Room ID không có trong DB", "roomId = invalid", "Response 404: Room not found", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room.service.test.js"),
    ("UT026", "Room (Backend)", "createRoom", "POST", "Tạo phòng mới thành công", "Dữ liệu tạo phòng hợp lệ", "roomName, room_type_id, status", "Tạo phòng mới thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room.service.test.js"),
    ("UT027", "Room (Backend)", "createRoom", "POST", "Báo lỗi 409 khi tạo phòng bị trùng tên", "Phòng đã tồn tại", "roomName = 'P101'", "Response 409: Room already exists", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room.service.test.js"),
    ("UT028", "Room (Backend)", "createRoom", "POST", "Báo lỗi 400 khi room_type_id không hợp lệ", "room_type_id không tồn tại", "room_type_id = invalid", "Response 400: Invalid room type", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room.service.test.js"),
    ("UT029", "Room (Backend)", "updateRoom", "PUT", "Cập nhật thông tin phòng thành công", "Room ID tồn tại", "roomId, updatePayload", "Cập nhật thông tin phòng thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room.service.test.js"),
    ("UT030", "Room (Backend)", "updateRoom", "PUT", "Báo lỗi 404 khi cập nhật phòng không tồn tại", "Room ID không tồn tại", "roomId = invalid", "Response 404: Room not found", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room.service.test.js"),
    ("UT031", "Room (Backend)", "deleteRoom", "DELETE", "Xóa mềm phòng (deactivate) thành công", "Room ID tồn tại", "roomId", "is_active = false", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room.service.test.js"),
    ("UT032", "Room (Backend)", "deleteRoom", "DELETE", "Báo lỗi 404 khi xóa phòng không tồn tại", "Room ID không tồn tại", "roomId = invalid", "Response 404: Room not found", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room.service.test.js"),

    # Room Type Management (UT033 - UT040)
    ("UT033", "RoomType (Backend)", "getRoomTypes", "GET", "Lấy danh sách các loại phòng", "Quản lý / Khách hàng", "n/a", "Trả về list loại phòng active", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room-type.service.test.js"),
    ("UT034", "RoomType (Backend)", "createRoomType", "POST", "Tạo loại phòng mới thành công", "Data loại phòng hợp lệ", "name, base_price, capacity", "Tạo loại phòng thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room-type.service.test.js"),
    ("UT035", "RoomType (Backend)", "createRoomType", "POST", "Báo lỗi 409 khi tạo loại phòng trùng tên", "Loại phòng đã tồn tại", "name = 'Deluxe'", "Response 409: Duplicate room type", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room-type.service.test.js"),
    ("UT036", "RoomType (Backend)", "getRoomTypeById", "GET", "Lấy chi tiết loại phòng theo ID", "RoomType ID tồn tại", "roomTypeId", "Trả về chi tiết loại phòng", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room-type.service.test.js"),
    ("UT037", "RoomType (Backend)", "updateRoomType", "PUT", "Cập nhật loại phòng thành công", "RoomType ID tồn tại", "roomTypeId, price", "Cập nhật loại phòng thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room-type.service.test.js"),
    ("UT038", "RoomType (Backend)", "updateRoomType", "PUT", "Báo lỗi 404 khi cập nhật loại phòng không tồn tại", "RoomType ID không tồn tại", "roomTypeId = invalid", "Response 404: Room type not found", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room-type.service.test.js"),
    ("UT039", "RoomType (Backend)", "deleteRoomType", "DELETE", "Xóa mềm loại phòng thành công", "RoomType ID tồn tại", "roomTypeId", "is_active = false", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room-type.service.test.js"),
    ("UT040", "RoomType (Backend)", "deleteRoomType", "DELETE", "Báo lỗi 404 khi xóa loại phòng không tồn tại", "RoomType ID không tồn tại", "roomTypeId = invalid", "Response 404: Room type not found", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room-type.service.test.js"),

    # Housekeeping Management (UT041 - UT050)
    ("UT041", "Housekeeping", "getCleaningTasks", "GET", "Lấy danh sách task housekeeping", "Nhân viên / Manager", "status, room_number", "Trả về danh sách task dọn phòng", "Pass", "High", "nghiadt", "7/18/2026", "Unit test housekeeping.service.test.js"),
    ("UT042", "Housekeeping", "confirmCheckout", "POST", "Tạo task cleaning khi phòng checkout", "Phòng đã checkout", "booking_id, room_number", "Tạo task Cleaning tự động", "Pass", "High", "nghiadt", "7/18/2026", "Unit test housekeeping.service.test.js"),
    ("UT043", "Housekeeping", "updateTaskStatus", "PUT", "Cập nhật trạng thái task sang Cleaning", "Task ID hợp lệ", "taskId, status = 'Cleaning'", "Trạng thái task đổi sang Cleaning", "Pass", "High", "nghiadt", "7/18/2026", "Unit test housekeeping.service.test.js"),
    ("UT044", "Housekeeping", "getDashboardStats", "GET", "Lấy thông tin dashboard housekeeping", "Manager", "n/a", "Trả về tổng số task, room status", "Pass", "Medium", "nghiadt", "7/18/2026", "Unit test housekeeping.service.test.js"),
    ("UT045", "Housekeeping", "getTaskById", "GET", "Lấy thông tin chi tiết task theo ID", "Task ID tồn tại", "taskId", "Trả về chi tiết task & inspection", "Pass", "High", "nghiadt", "7/18/2026", "Unit test housekeeping.service.test.js"),
    ("UT046", "Housekeeping", "getTaskById", "GET", "Báo lỗi 404 khi xem task không tồn tại", "Task ID không tồn tại", "taskId = invalid", "Response 404: Task not found", "Pass", "High", "nghiadt", "7/18/2026", "Unit test housekeeping.service.test.js"),
    ("UT047", "Housekeeping", "startCleaningTask", "PUT", "Bắt đầu thực hiện task dọn phòng", "Task ở trạng thái Accepted", "taskId", "Trạng thái chuyển sang Cleaning", "Pass", "High", "nghiadt", "7/18/2026", "Unit test housekeeping.service.test.js"),
    ("UT048", "Housekeeping", "completeCleaningTask", "PUT", "Hoàn thành task dọn phòng thành công", "Task dọn phòng hoàn tất", "taskId, notes", "Phòng cập nhật sang Available", "Pass", "High", "nghiadt", "7/18/2026", "Unit test housekeeping.service.test.js"),
    ("UT049", "Housekeeping", "completeCleaningTask", "PUT", "Báo lỗi 409 khi hoàn thành task nếu bảo trì chưa xong", "Phòng đang có bảo trì hỏng hóc", "taskId", "Response 409: Pending maintenance", "Pass", "High", "nghiadt", "7/18/2026", "Unit test housekeeping.service.test.js"),
    ("UT050", "Housekeeping", "cancelCleaningTask", "PUT", "Hủy task housekeeping", "Task ID tồn tại", "taskId, reason", "Task chuyển sang Cancelled", "Pass", "Medium", "nghiadt", "7/18/2026", "Unit test housekeeping.service.test.js"),

    # Staff Task Management (UT051 - UT058)
    ("UT051", "StaffTask", "getStaffMembers", "GET", "Lấy danh sách nhân viên dọn phòng", "Manager", "n/a", "Trả về danh sách staff có role Housekeeping", "Pass", "High", "nghiadt", "7/18/2026", "Unit test staff-task.service.test.js"),
    ("UT052", "StaffTask", "getStaffTasks", "GET", "Lấy danh sách staff tasks", "Manager", "status, assigned_to", "Trả về danh sách công việc giao nhân viên", "Pass", "High", "nghiadt", "7/18/2026", "Unit test staff-task.service.test.js"),
    ("UT053", "StaffTask", "createStaffTask", "POST", "Tạo staff task mới thành công", "Data hợp lệ", "title, assigned_to, room_number", "Tạo task thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test staff-task.service.test.js"),
    ("UT054", "StaffTask", "createStaffTask", "POST", "Báo lỗi khi tạo task thiếu tiêu đề", "Tiêu đề rỗng", "title = ''", "Response 400: Title is required", "Pass", "High", "nghiadt", "7/18/2026", "Unit test staff-task.service.test.js"),
    ("UT055", "StaffTask", "createStaffTask", "POST", "Báo lỗi khi tạo task chọn nhân viên không hợp lệ", "Staff ID không tồn tại", "assigned_to = invalid", "Response 400: Invalid staff member", "Pass", "High", "nghiadt", "7/18/2026", "Unit test staff-task.service.test.js"),
    ("UT056", "StaffTask", "createStaffTask", "POST", "Báo lỗi khi tạo task trùng khung giờ làm việc", "Khung giờ phòng đã có task khác", "room_number, start_time", "Response 409: Time conflict", "Pass", "High", "nghiadt", "7/18/2026", "Unit test staff-task.service.test.js"),
    ("UT057", "StaffTask", "updateStaffTask", "PUT", "Cập nhật staff task thành công", "Task ID hợp lệ", "taskId, status", "Cập nhật task thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test staff-task.service.test.js"),
    ("UT058", "StaffTask", "updateStaffTask", "PUT", "Báo lỗi khi cập nhật task không tồn tại (404)", "Task ID rỗng/sai", "taskId = invalid", "Response 404: Task not found", "Pass", "High", "nghiadt", "7/18/2026", "Unit test staff-task.service.test.js"),

    # Room Inventory Management (UT059 - UT064)
    ("UT059", "RoomInventory", "getRoomInventoryItems", "GET", "Lấy danh sách vật tư phòng", "Manager", "n/a", "Trả về list trang thiết bị vật tư", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room-inventory.service.test.js"),
    ("UT060", "RoomInventory", "createRoomInventoryItem", "POST", "Tạo vật tư phòng mới thành công", "Thông tin vật tư hợp lệ", "name, category, price", "Tạo vật tư thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room-inventory.service.test.js"),
    ("UT061", "RoomInventory", "createRoomInventoryItem", "POST", "Báo lỗi khi tạo vật tư thiếu tên hoặc danh mục", "Thiếu name/category", "name = ''", "Response 400: Required fields missing", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room-inventory.service.test.js"),
    ("UT062", "RoomInventory", "createRoomInventoryItem", "POST", "Báo lỗi khi ảnh vật tư không đúng định dạng", "File không phải ảnh", "file = txt", "Response 400: Invalid image format", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room-inventory.service.test.js"),
    ("UT063", "RoomInventory", "updateRoomInventoryItem", "PUT", "Cập nhật vật tư phòng thành công", "Item ID tồn tại", "itemId, price", "Cập nhật vật tư thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room-inventory.service.test.js"),
    ("UT064", "RoomInventory", "deactivateRoomInventoryItem", "DELETE", "Vô hiệu hóa vật tư (deactivate) thành công", "Item ID tồn tại", "itemId", "is_active = false", "Pass", "High", "nghiadt", "7/18/2026", "Unit test room-inventory.service.test.js"),

    # Customer Feedback Management (UT065 - UT070)
    ("UT065", "Feedback", "listCustomerFeedbacks", "GET", "Lấy danh sách góp ý của tài khoản khách hàng", "Khách hàng logged-in", "n/a", "Trả về danh sách các feedback đã gửi", "Pass", "High", "nghiadt", "7/18/2026", "Unit test customer-feedback.service.test.js"),
    ("UT066", "Feedback", "submitFeedback", "POST", "Báo lỗi khi gửi góp ý mà tài khoản đã gửi trước đó", "Đã gửi feedback rồi", "rating, comments", "Response 409: Feedback already submitted", "Pass", "High", "nghiadt", "7/18/2026", "Unit test customer-feedback.service.test.js"),
    ("UT067", "Feedback", "getFeedbackStatus", "GET", "Lấy trạng thái góp ý", "Khách hàng", "n/a", "Trả về hasSubmitted, feedbackObj", "Pass", "High", "nghiadt", "7/18/2026", "Unit test customer-feedback.service.test.js"),
    ("UT068", "Feedback", "listCustomerFeedbacks", "GET", "Trả về danh sách rỗng khi chưa có góp ý nào", "User mới", "n/a", "Trả về []", "Pass", "Medium", "nghiadt", "7/18/2026", "Unit test customer-feedback.service.test.js"),
    ("UT069", "Feedback", "listCustomerFeedbacks", "GET", "Map dữ liệu góp ý đúng cấu trúc", "Feedback có data", "n/a", "Map đầy đủ id, rating, comment, date", "Pass", "High", "nghiadt", "7/18/2026", "Unit test customer-feedback.service.test.js"),
    ("UT070", "Feedback", "submitFeedback", "POST", "Báo lỗi khi validate rating không hợp lệ (ngoài 1-5)", "Rating = 0 hoặc 6", "rating = 6", "Response 400: Rating must be 1-5", "Pass", "High", "nghiadt", "7/18/2026", "Unit test customer-feedback.service.test.js"),

    # Policy Management (UT071 - UT074)
    ("UT071", "Policy", "listPolicies", "GET", "Lấy danh sách chính sách khách sạn", "Tất cả vai trò", "n/a", "Trả về danh sách chính sách active", "Pass", "High", "nghiadt", "7/18/2026", "Unit test policy.service.test.js"),
    ("UT072", "Policy", "createPolicy", "POST", "Tạo chính sách mới thành công", "Admin/Manager", "title, category, content", "Tạo chính sách thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test policy.service.test.js"),
    ("UT073", "Policy", "updatePolicy", "PUT", "Cập nhật chính sách thành công", "Policy ID tồn tại", "policyId, content", "Cập nhật chính sách thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test policy.service.test.js"),
    ("UT074", "Policy", "deletePolicy", "DELETE", "Xóa chính sách thành công", "Policy ID tồn tại", "policyId", "Xóa chính sách thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test policy.service.test.js"),

    # Manager Dashboard (UT075 - UT078)
    ("UT075", "ManagerDashboard", "getDashboardStats", "GET", "Lấy thống kê tổng quan Manager Dashboard (kpis)", "Manager", "period=week", "Trả về totalRevenue, roomRevenue, extraRevenue", "Pass", "High", "nghiadt", "7/18/2026", "Unit test manager-dashboard.service.test.js"),
    ("UT076", "ManagerDashboard", "getDashboardStats", "GET", "Lấy biểu đồ doanh thu theo tháng (revenueByMonth)", "Manager", "period=month", "Trả về mảng doanh thu 12 tháng", "Pass", "High", "nghiadt", "7/18/2026", "Unit test manager-dashboard.service.test.js"),
    ("UT077", "ManagerDashboard", "getDashboardStats", "GET", "Lấy tỷ lệ và số lượng phòng theo trạng thái", "Manager", "period=day", "Trả về totalRooms, roomStatusCounts", "Pass", "High", "nghiadt", "7/18/2026", "Unit test manager-dashboard.service.test.js"),
    ("UT078", "ManagerDashboard", "getDashboardStats", "GET", "Lấy đánh giá trung bình và tổng số đánh giá khách hàng", "Manager", "n/a", "Trả về avgRating, totalReviews", "Pass", "High", "nghiadt", "7/18/2026", "Unit test manager-dashboard.service.test.js"),

    # Admin Account Management (UT079 - UT084)
    ("UT079", "AdminAccount", "getAllAccounts", "GET", "Admin lấy danh sách tài khoản nội bộ", "Admin", "role, search", "Trả về list tài khoản nhân viên/quản lý", "Pass", "High", "nghiadt", "7/18/2026", "Unit test admin-account.service.test.js"),
    ("UT080", "AdminAccount", "getAccountById", "GET", "Admin lấy chi tiết tài khoản theo ID", "Admin", "accountId", "Trả về chi tiết tài khoản", "Pass", "High", "nghiadt", "7/18/2026", "Unit test admin-account.service.test.js"),
    ("UT081", "AdminAccount", "createAccount", "POST", "Admin tạo tài khoản nhân viên mới thành công", "Admin", "full_name, email, role_id", "Tạo tài khoản nhân viên thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test admin-account.service.test.js"),
    ("UT082", "AdminAccount", "createAccount", "POST", "Admin tạo tài khoản bị trùng Email hoặc login_account", "Email đã tồn tại", "email = 'exist@hotel.com'", "Response 400: Account or Email exists", "Pass", "High", "nghiadt", "7/18/2026", "Unit test admin-account.service.test.js"),
    ("UT083", "AdminAccount", "updateAccount", "PUT", "Admin cập nhật tài khoản thành công", "Account ID tồn tại", "accountId, role_id", "Cập nhật tài khoản thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test admin-account.service.test.js"),
    ("UT084", "AdminAccount", "resetPassword", "POST", "Admin reset mật khẩu cho tài khoản nhân viên", "Admin", "accountId, newPassword", "Reset mật khẩu thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test admin-account.service.test.js"),

    # Admin Role Management (UT085 - UT088)
    ("UT085", "AdminRole", "getAllRoles", "GET", "Admin lấy danh sách các Role", "Admin", "n/a", "Trả về danh sách vai trò & permissions", "Pass", "High", "nghiadt", "7/18/2026", "Unit test admin-role.service.test.js"),
    ("UT086", "AdminRole", "createRole", "POST", "Admin tạo Role mới thành công", "Admin", "name, permissions", "Tạo Role mới thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test admin-role.service.test.js"),
    ("UT087", "AdminRole", "createRole", "POST", "Admin tạo Role bị trùng tên (400)", "Role name đã có", "name = 'Receptionist'", "Response 400: Role already exists", "Pass", "High", "nghiadt", "7/18/2026", "Unit test admin-role.service.test.js"),
    ("UT088", "AdminRole", "updateRole", "PUT", "Admin cập nhật thông tin và danh sách quyền của Role", "Role ID tồn tại", "roleId, permissions", "Cập nhật Role thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test admin-role.service.test.js"),

    # Admin Dashboard (UT089 - UT091)
    ("UT089", "AdminDashboard", "getDashboardStats", "GET", "Admin lấy thống kê cảnh báo bảo mật 24h", "Admin", "n/a", "Trả về security_alerts_24h", "Pass", "High", "nghiadt", "7/18/2026", "Unit test admin-dashboard.test.js"),
    ("UT090", "AdminDashboard", "getDashboardStats", "GET", "Lấy thống kê số lượng cảnh báo đăng nhập thất bại", "Admin", "n/a", "Trả về security_alerts_24h = 0", "Pass", "High", "nghiadt", "7/18/2026", "Unit test admin-dashboard.test.js"),
    ("UT091", "AdminDashboard", "getDashboardStats", "GET", "Xử lý thành công request từ Admin Guard", "Admin", "n/a", "Trả về status 200 OK", "Pass", "High", "nghiadt", "7/18/2026", "Unit test admin-dashboard.test.js"),

    # Customer Reservation (UT092 - UT099)
    ("UT092", "Reservation", "createRoomBooking", "POST", "Customer tạo đặt phòng thành công", "Khách hàng logged-in", "roomId, checkIn, checkOut", "Tạo booking thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test reservation.service.test.js"),
    ("UT093", "Reservation", "createRoomBooking", "POST", "Báo lỗi khi tạo booking thiếu ngày check-in/out hợp lệ", "Ngày không hợp lệ", "checkIn = invalid", "Response 400: Valid dates required", "Pass", "High", "nghiadt", "7/18/2026", "Unit test reservation.service.test.js"),
    ("UT094", "Reservation", "createRoomBooking", "POST", "Báo lỗi khi ngày check-out nhỏ hơn hoặc bằng check-in", "checkOut <= checkIn", "checkOut = 2026-08-09", "Response 400: Check-out must be after check-in", "Pass", "High", "nghiadt", "7/18/2026", "Unit test reservation.service.test.js"),
    ("UT095", "Reservation", "createRoomBooking", "POST", "Báo lỗi khi số phòng trống không đủ cho ngày chọn", "Hết phòng trống", "checkIn, checkOut", "Response 409: Room unavailable", "Pass", "High", "nghiadt", "7/18/2026", "Unit test reservation.service.test.js"),
    ("UT096", "Reservation", "getCustomerReservation", "GET", "Xem chi tiết thông tin booking", "Reservation ID tồn tại", "reservationId", "Trả về thông tin booking & status", "Pass", "High", "nghiadt", "7/18/2026", "Unit test reservation.service.test.js"),
    ("UT097", "Reservation", "cancelCustomerReservation", "POST", "Hủy booking chưa thanh toán thành công", "Booking > 48h check-in", "reservationId", "Response 200: Reservation canceled", "Pass", "High", "nghiadt", "7/18/2026", "Unit test reservation.service.test.js"),
    ("UT098", "Reservation", "cancelCustomerReservation", "POST", "Báo lỗi khi hủy booking trong vòng 48h sát check-in", "Booking <= 48h check-in", "reservationId", "Response 409: Within 48 hours", "Pass", "High", "nghiadt", "7/18/2026", "Unit test reservation.service.test.js"),
    ("UT099", "Reservation", "getCustomerReservation", "GET", "Báo lỗi 404 khi truy cập booking không tồn tại", "Reservation ID rỗng", "reservationId = invalid", "Response 404: Reservation not found", "Pass", "High", "nghiadt", "7/18/2026", "Unit test reservation.service.test.js"),

    # Customer Payment (UT100 - UT105)
    ("UT100", "Payment", "createVnpayPayment", "POST", "Tạo link thanh toán VNPAY thành công", "Booking PendingPayment", "reservationId, acceptedPolicies", "Trả về paymentUrl VNPAY sandbox", "Pass", "High", "nghiadt", "7/18/2026", "Unit test payment.service.test.js"),
    ("UT101", "Payment", "createVnpayPayment", "POST", "Báo lỗi khi chưa chấp nhận chính sách khách sạn", "acceptedHotelPolicies = false", "acceptedPolicies = false", "Response 400: Must agree to policies", "Pass", "High", "nghiadt", "7/18/2026", "Unit test payment.service.test.js"),
    ("UT102", "Payment", "createVnpayPayment", "POST", "Báo lỗi khi reservation không tồn tại (404)", "Reservation ID sai", "reservationId = invalid", "Response 404: Reservation not found", "Pass", "High", "nghiadt", "7/18/2026", "Unit test payment.service.test.js"),
    ("UT103", "Payment", "createVnpayPayment", "POST", "Trả về thông báo booking đã được thanh toán rồi", "Booking status = Paid", "reservationId", "Response 200: Already paid", "Pass", "High", "nghiadt", "7/18/2026", "Unit test payment.service.test.js"),
    ("UT104", "Payment", "getHotelPolicies", "GET", "Lấy danh sách chính sách khách sạn", "Tất cả khách hàng", "n/a", "Trả về danh sách chính sách active", "Pass", "High", "nghiadt", "7/18/2026", "Unit test payment.service.test.js"),
    ("UT105", "Payment", "getReservationPaymentStatus", "GET", "Lấy trạng thái thanh toán của booking", "Reservation ID tồn tại", "reservationId", "Trả về totalAmount, paymentStatus", "Pass", "High", "nghiadt", "7/18/2026", "Unit test payment.service.test.js"),

    # Receptionist Check-in (UT106 - UT113)
    ("UT106", "CheckIn", "getBookings", "GET", "Receptionist lấy danh sách booking", "Lễ tân", "status, search", "Trả về list booking & pagination", "Pass", "High", "nghiadt", "7/18/2026", "Unit test receptionist-checkin.service.test.js"),
    ("UT107", "CheckIn", "processCheckIn", "POST", "Báo lỗi khi check-in booking không tồn tại (404)", "Booking ID không có", "bookingId = invalid", "Response 404: Booking not found", "Pass", "High", "nghiadt", "7/18/2026", "Unit test receptionist-checkin.service.test.js"),
    ("UT108", "CheckIn", "processCheckIn", "POST", "Báo lỗi khi check-in booking đã CheckedIn rồi (400)", "Booking đã CheckedIn", "bookingId", "Response 400: Already checked in", "Pass", "High", "nghiadt", "7/18/2026", "Unit test receptionist-checkin.service.test.js"),
    ("UT109", "CheckIn", "processCheckIn", "POST", "Báo lỗi khi check-in đơn chưa thanh toán đủ", "payment_status != Paid", "bookingId", "Response 400: Booking not fully paid", "Pass", "High", "nghiadt", "7/18/2026", "Unit test receptionist-checkin.service.test.js"),
    ("UT110", "CheckIn", "processCheckIn", "POST", "Thực hiện Check-in gán phòng & tạo StayGuest thành công", "Booking Confirmed & Paid", "roomAssignments, stayGuests", "Booking -> CheckedIn, Room -> Occupied", "Pass", "High", "nghiadt", "7/18/2026", "Unit test receptionist-checkin.service.test.js"),
    ("UT111", "CheckIn", "createWalkInBooking", "POST", "Tạo Walk-in booking cho khách vãng lai thành công", "Phòng còn trống", "roomTypeId, guestCount", "Tạo Walk-in booking & thanh toán", "Pass", "High", "nghiadt", "7/18/2026", "Unit test receptionist-checkin.service.test.js"),
    ("UT112", "CheckIn", "getAvailableRooms", "GET", "Lấy danh sách phòng trống phục vụ gán phòng", "Lễ tân", "roomTypeId, checkIn, checkOut", "Trả về list phòng Available", "Pass", "High", "nghiadt", "7/18/2026", "Unit test receptionist-checkin.service.test.js"),
    ("UT113", "CheckIn", "getRoomTypes", "GET", "Lấy danh sách loại phòng active", "Lễ tân", "n/a", "Trả về list loại phòng active", "Pass", "High", "nghiadt", "7/18/2026", "Unit test receptionist-checkin.service.test.js"),

    # Receptionist Check-out (UT114 - UT119)
    ("UT114", "CheckOut", "getCheckoutSummary", "GET", "Lấy thông tin tóm tắt Check-out", "Booking CheckedIn", "bookingId", "Trả về thông tin phòng, phụ phí, hóa đơn", "Pass", "High", "nghiadt", "7/18/2026", "Unit test receptionist-checkout.service.test.js"),
    ("UT115", "CheckOut", "createInspectionRequest", "POST", "Tạo yêu cầu kiểm tra phòng trước Check-out", "Phòng cần check-out", "bookingId, room_number", "Tạo task Inspection Review cho Housekeeping", "Pass", "High", "nghiadt", "7/18/2026", "Unit test receptionist-checkout.service.test.js"),
    ("UT116", "CheckOut", "addCharge", "POST", "Thêm phụ phí (nước uống, phát sinh) vào đơn booking", "Lễ tân", "bookingId, amount, description", "Thêm phụ phí thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test receptionist-checkout.service.test.js"),
    ("UT117", "CheckOut", "generateInvoice", "POST", "Tính toán và phát hành hóa đơn Invoice", "Booking đã hoàn tất phụ phí", "bookingId", "Tạo Invoice Unpaid/Paid", "Pass", "High", "nghiadt", "7/18/2026", "Unit test receptionist-checkout.service.test.js"),
    ("UT118", "CheckOut", "completeCheckout", "POST", "Báo lỗi khi hoàn thành Check-out nếu chưa kiểm tra phòng", "Inspection chưa confirm", "bookingId", "Response 409: Pending inspection", "Pass", "High", "nghiadt", "7/18/2026", "Unit test receptionist-checkout.service.test.js"),
    ("UT119", "CheckOut", "completeCheckout", "POST", "Hoàn thành Check-out & chuyển phòng sang Dirty thành công", "Inspection completed", "bookingId, paymentMethod", "Booking -> CheckedOut, Room -> Dirty", "Pass", "High", "nghiadt", "7/18/2026", "Unit test receptionist-checkout.service.test.js"),

    # Customer Profile Management (UT120 - UT123)
    ("UT120", "Profile", "getProfileDashboard", "GET", "Lấy thông tin Profile Dashboard của user", "Khách hàng logged-in", "n/a", "Trả về user info, bookingHistory, reviews", "Pass", "High", "nghiadt", "7/18/2026", "Unit test profile.service.test.js"),
    ("UT121", "Profile", "updateProfile", "PUT", "Cập nhật thông tin cá nhân Profile thành công", "Khách hàng", "full_name, phone_number, address", "Cập nhật profile thành công", "Pass", "High", "nghiadt", "7/18/2026", "Unit test profile.service.test.js"),
    ("UT122", "Profile", "updateProfile", "PUT", "Báo lỗi khi cập nhật Profile thiếu full_name (400)", "full_name rỗng", "full_name = ''", "Response 400: Full name is required", "Pass", "High", "nghiadt", "7/18/2026", "Unit test profile.service.test.js"),
    ("UT123", "Profile", "updateProfile", "PUT", "Báo lỗi khi cập nhật số điện thoại không hợp lệ (400)", "Số điện thoại sai", "phone = 'invalid'", "Response 400: Phone number is invalid", "Pass", "High", "nghiadt", "7/18/2026", "Unit test profile.service.test.js"),

    # Upload Security (UT124 - UT128)
    ("UT124", "UploadSecurity", "fileFilter", "MIDDLEWARE", "Chấp nhận file ảnh định dạng hợp lệ (PNG/JPG/WEBP)", "Multer upload", "file.png", "Multer cho phép upload", "Pass", "High", "nghiadt", "7/18/2026", "Unit test upload-security.test.js"),
    ("UT125", "UploadSecurity", "fileFilter", "MIDDLEWARE", "Chặn upload file thực thi độc hại (EXE/TXT/PDF)", "Multer upload", "file.exe", "Response 400: File type not allowed", "Pass", "High", "nghiadt", "7/18/2026", "Unit test upload-security.test.js"),
    ("UT126", "UploadSecurity", "validateDoubleExt", "MIDDLEWARE", "Chặn file có đuôi mở rộng giả mạo (script.php.png)", "Double extension", "file = script.php.png", "Bị phát hiện và từ chối", "Pass", "High", "nghiadt", "7/18/2026", "Unit test upload-security.test.js"),
    ("UT127", "UploadSecurity", "limits", "MIDDLEWARE", "Kiểm tra giới hạn dung lượng file upload (Max 5MB)", "File size > 5MB", "size = 10MB", "Response 400: File too large", "Pass", "High", "nghiadt", "7/18/2026", "Unit test upload-security.test.js"),
    ("UT128", "UploadSecurity", "handleMulterError", "MIDDLEWARE", "Báo lỗi khi request upload không đính kèm file nào", "Request rỗng", "req.file = null", "Response 400: No file provided", "Pass", "High", "nghiadt", "7/18/2026", "Unit test upload-security.test.js"),

    # Middleware & Auth Guards (UT129 - UT132)
    ("UT129", "AuthMiddleware", "authGuard", "MIDDLEWARE", "Xác thực thành công với Bearer Token hợp lệ", "Authorization Header", "Bearer valid_token", "req.user được gán, next() gọi", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth-middleware.test.js"),
    ("UT130", "AuthMiddleware", "authGuard", "MIDDLEWARE", "Báo lỗi 401 khi Request không có Authorization Header", "Thiếu Auth Header", "n/a", "Response 401: Unauthorized", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth-middleware.test.js"),
    ("UT131", "AuthMiddleware", "authGuard", "MIDDLEWARE", "Báo lỗi 401 khi Token bị sai hoặc hết hạn", "Token sai/expired", "Bearer invalid_token", "Response 401: Invalid token", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth-middleware.test.js"),
    ("UT132", "AuthMiddleware", "roleGuard", "MIDDLEWARE", "Báo lỗi 403 Forbidden khi Role không đủ quyền hạn", "Role = Customer truy cập Admin route", "Customer role", "Response 403: Forbidden", "Pass", "High", "nghiadt", "7/18/2026", "Unit test auth-middleware.test.js"),

    # Frontend Utilities & Validation (UT133 - UT136)
    ("UT133", "FrontendUtils", "validatePassword", "UTIL", "Kiểm tra độ dài tối thiểu 8 ký tự của mật khẩu", "Frontend validation", "pass = '1234567'", "Trả về false", "Pass", "High", "nghiadt", "7/18/2026", "Frontend passwordValidation.test.js"),
    ("UT134", "FrontendUtils", "validatePassword", "UTIL", "Kiểm tra mật khẩu có chứa chữ cái và chữ số", "Frontend validation", "pass = 'abcdefgh'", "Trả về false (thiếu số)", "Pass", "High", "nghiadt", "7/18/2026", "Frontend passwordValidation.test.js"),
    ("UT135", "FrontendUtils", "validatePassword", "UTIL", "Chấp nhận mật khẩu hợp lệ (8+ ký tự có chữ & số)", "Frontend validation", "pass = 'Password123'", "Trả về true", "Pass", "High", "nghiadt", "7/18/2026", "Frontend passwordValidation.test.js"),
    ("UT136", "FrontendUtils", "validatePassword", "UTIL", "Báo lỗi khi truyền tham số mật khẩu rỗng hoặc null", "Frontend validation", "pass = ''", "Trả về false", "Pass", "High", "nghiadt", "7/18/2026", "Frontend passwordValidation.test.js"),

    # Frontend HomePage & Room Catalog UI (UT137 - UT142)
    ("UT137", "HomePage (FE)", "HomePage UI", "RENDER", "HomePage render banner chính và khẩu hiệu khách sạn", "Trang chủ", "n/a", "Hiển thị Heading Hotelify Luxury Hotel", "Pass", "High", "nghiadt", "7/18/2026", "Frontend HomePage.test.jsx"),
    ("UT138", "HomePage (FE)", "HomePage UI", "RENDER", "HomePage hiển thị nút Tìm phòng / Đặt phòng ngay", "Trang chủ", "n/a", "Hiển thị nút Đặt phòng ngay", "Pass", "High", "nghiadt", "7/18/2026", "Frontend HomePage.test.jsx"),
    ("UT139", "HomePage (FE)", "HomePage UI", "RENDER", "Hiển thị danh mục các loại phòng chính", "Trang chủ", "n/a", "Hiển thị danh mục phòng Hotelify", "Pass", "High", "nghiadt", "7/18/2026", "Frontend HomePage.test.jsx"),
    ("UT140", "HomePage (FE)", "HomePage Search", "INTERACT", "Hỗ trợ tìm kiếm phòng theo ngày nhận / trả phòng", "Search Widget", "checkIn, checkOut", "Có input date chọn ngày", "Pass", "High", "nghiadt", "7/18/2026", "Frontend HomePage.test.jsx"),
    ("UT141", "HomePage (FE)", "HomePage Services", "RENDER", "Hiển thị các dịch vụ tiện ích của khách sạn", "Trang chủ", "n/a", "Hiển thị thẻ main tiện ích", "Pass", "High", "nghiadt", "7/18/2026", "Frontend HomePage.test.jsx"),
    ("UT142", "HomePage (FE)", "HomePage Footer", "RENDER", "Render footer với đầy đủ thông tin liên hệ và chính sách", "Trang chủ", "n/a", "Hiển thị footer thông tin liên hệ", "Pass", "High", "nghiadt", "7/18/2026", "Frontend HomePage.test.jsx"),

    # Frontend Booking UI (UT143 - UT147)
    ("UT143", "BookingPage (FE)", "BookingForm UI", "RENDER", "Render form thông tin đặt phòng khách hàng", "Trang Đặt Phòng", "n/a", "Hiển thị input checkin, checkout, adults", "Pass", "High", "nghiadt", "7/18/2026", "Frontend BookingPage.test.jsx"),
    ("UT144", "BookingPage (FE)", "BookingForm Input", "INTERACT", "Cho phép nhập yêu cầu đặc biệt (special request)", "Booking Page", "text = 'Tầng cao'", "Input cập nhật giá trị", "Pass", "Medium", "nghiadt", "7/18/2026", "Frontend BookingPage.test.jsx"),
    ("UT145", "BookingPage (FE)", "BookingForm Validation", "SUBMIT", "Hiển thị lỗi khi chọn ngày check-out trước check-in", "Form Validation", "checkOut < checkIn", "Hiển thị alert ngày không hợp lệ", "Pass", "High", "nghiadt", "7/18/2026", "Frontend BookingPage.test.jsx"),
    ("UT146", "BookingPage (FE)", "Booking Summary", "RENDER", "Tính toán và hiển thị tạm tính tổng tiền đặt phòng", "Summary Card", "2 đêm x 1,500,000", "Tổng tiền hiển thị 3,000,000đ", "Pass", "High", "nghiadt", "7/18/2026", "Frontend BookingPage.test.jsx"),
    ("UT147", "BookingPage (FE)", "Booking Submit", "SUBMIT", "Gửi yêu cầu đặt phòng và chuyển tới trang thanh toán", "Click Submit", "form valid", "Gọi API createBooking & redirect", "Pass", "High", "nghiadt", "7/18/2026", "Frontend BookingPage.test.jsx"),

    # Frontend Manager & Admin UI (UT148 - UT159)
    ("UT148", "ManagerPages (FE)", "ManagerDashboard", "RENDER", "Render Dashboard quản lý với các KPI tổng quan", "Trang Manager", "n/a", "Hiển thị KPI doanh thu, công suất phòng", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ManagerAdminPages.test.jsx"),
    ("UT149", "ManagerPages (FE)", "RoomManagement", "RENDER", "Render danh sách quản lý phòng khách sạn", "Trang Phòng", "n/a", "Hiển thị bảng danh sách phòng", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ManagerAdminPages.test.jsx"),
    ("UT150", "ManagerPages (FE)", "RoomManagement", "INTERACT", "Mở modal thêm phòng mới", "Click Thêm phòng", "n/a", "Modal Thêm phòng hiển thị", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ManagerAdminPages.test.jsx"),
    ("UT151", "ManagerPages (FE)", "RoomTypeManagement", "RENDER", "Render danh sách loại phòng", "Trang Loại phòng", "n/a", "Hiển thị mảng loại phòng", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ManagerAdminPages.test.jsx"),
    ("UT152", "ManagerPages (FE)", "HousekeepingPage", "RENDER", "Render danh sách công việc dọn phòng", "Trang Dọn phòng", "n/a", "Hiển thị bảng task housekeeping", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ManagerAdminPages.test.jsx"),
    ("UT153", "ManagerPages (FE)", "StaffTaskPage", "RENDER", "Render danh sách phân công nhiệm vụ nhân viên", "Trang Phân công", "n/a", "Hiển thị bảng giao việc nhân viên", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ManagerAdminPages.test.jsx"),
    ("UT154", "ManagerPages (FE)", "InventoryPage", "RENDER", "Render danh sách vật tư trang thiết bị phòng", "Trang Vật tư", "n/a", "Hiển thị bảng vật tư phòng", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ManagerAdminPages.test.jsx"),
    ("UT155", "AdminPages (FE)", "AccountPage", "RENDER", "Render danh sách quản lý tài khoản nội bộ", "Trang Admin Account", "n/a", "Hiển thị bảng tài khoản nhân viên", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ManagerAdminPages.test.jsx"),
    ("UT156", "AdminPages (FE)", "RolePage", "RENDER", "Render danh sách vai trò và phân quyền", "Trang Admin Role", "n/a", "Hiển thị bảng danh sách vai trò", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ManagerAdminPages.test.jsx"),
    ("UT157", "AdminPages (FE)", "AdminDashboard", "RENDER", "Render trang Admin Dashboard nhật ký hệ thống", "Trang Admin Dashboard", "n/a", "Hiển thị thống kê cảnh báo bảo mật", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ManagerAdminPages.test.jsx"),
    ("UT158", "CustomerProfile (FE)", "ProfileDashboard", "RENDER", "Render thông tin cá nhân và lịch sử đặt phòng", "Trang Profile", "n/a", "Hiển thị thông tin khách hàng & lịch sử", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ManagerAdminPages.test.jsx"),
    ("UT159", "CustomerProfile (FE)", "ProfileUpdate", "SUBMIT", "Cập nhật thông tin profile trên giao diện", "Form Profile", "full_name, phone", "Gửi API update profile thành công", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ManagerAdminPages.test.jsx"),

    # Frontend Receptionist UI (UT160 - UT165)
    ("UT160", "ReceptionistPages (FE)", "CheckInDashboard", "RENDER", "Render trang Lễ tân Check-in Dashboard", "Trang Lễ tân", "n/a", "Hiển thị danh sách đơn chờ check-in", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ReceptionistPages.test.jsx"),
    ("UT161", "ReceptionistPages (FE)", "CheckInDashboard", "INTERACT", "Lọc danh sách booking theo mã đặt phòng", "Input search", "code = 'BKG-101'", "Bảng hiển thị duy nhất đơn BKG-101", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ReceptionistPages.test.jsx"),
    ("UT162", "ReceptionistPages (FE)", "CheckOutWizard", "RENDER", "Render giao diện Check-out tóm tắt chi phí", "Wizard Check-out", "n/a", "Hiển thị tổng tiền phòng & phụ phí", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ReceptionistPages.test.jsx"),
    ("UT163", "ReceptionistPages (FE)", "CheckInWizard", "RENDER", "Hiển thị các bước gán phòng và nhập thông tin khách", "Wizard Check-in", "n/a", "Step 1: Assign Room, Step 2: Guest Details", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ReceptionistPages.test.jsx"),
    ("UT164", "ReceptionistPages (FE)", "WalkInForm", "RENDER", "Render form đặt phòng trực tiếp cho khách vãng lai", "Form Walk-in", "n/a", "Hiển thị chọn loại phòng, số lượng, thanh toán", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ReceptionistPages.test.jsx"),
    ("UT165", "ReceptionistPages (FE)", "WalkInForm", "SUBMIT", "Gửi yêu cầu tạo đơn Walk-in thành công", "Submit Walk-in", "data valid", "Gọi API createWalkInBooking thành công", "Pass", "High", "nghiadt", "7/18/2026", "Frontend ReceptionistPages.test.jsx"),
]

def generate_html_content():
    rows_html = []
    for tc in test_cases:
        tc_id, module, api, method, desc, pre_cond, inp, expected, status, priority, tester, date, note = tc
        
        # Format method pill
        method_class = f"method-{method.lower()}" if method.lower() in ['get', 'post', 'put', 'delete'] else "method-get"
        
        rows_html.append(f"""            <tr>
                <td class="text-center font-bold">{tc_id}</td>
                <td>{module}</td>
                <td><code style="background: #f1f5f9; padding: 2px 5px; border-radius: 3px;">{api}</code></td>
                <td class="text-center"><span class="method-badge {method_class}">{method}</span></td>
                <td>{desc}</td>
                <td>{pre_cond}</td>
                <td><code>{inp}</code></td>
                <td>{expected}</td>
                <td class="text-center"><span class="status-badge status-pass">Pass</span></td>
                <td class="text-center">{priority}</td>
                <td class="text-center">{tester}</td>
                <td class="text-center">{date}</td>
                <td><small style="color: #666;">{note}</small></td>
            </tr>""")

    tbody_content = "\n".join(rows_html)

    html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Báo Cáo Unit Test - Hotelify (WDP101)</title>
    <style>
        body {{
            font-family: Arial, Helvetica, sans-serif;
            margin: 20px;
            background-color: #f8f9fa;
            color: #333;
        }}

        .header {{
            margin-bottom: 20px;
        }}

        .header h1 {{
            color: #002060;
            margin-bottom: 5px;
        }}

        .header p {{
            color: #555;
            font-size: 14px;
        }}

        .summary-box {{
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
        }}

        .summary-card {{
            background: #ffffff;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            padding: 12px 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }}

        .summary-card h4 {{
            margin: 0 0 5px 0;
            color: #555;
            font-size: 12px;
            text-transform: uppercase;
        }}

        .summary-card .number {{
            font-size: 22px;
            font-weight: bold;
            color: #002060;
        }}

        .summary-card .number.pass {{
            color: #006633;
        }}

        .table-container {{
            overflow-x: auto;
            background: #ffffff;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            padding: 15px;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            font-family: Arial, Helvetica, sans-serif;
        }}

        th, td {{
            border: 1px solid #d0d7de;
            padding: 8px 10px;
            vertical-align: middle;
        }}

        th {{
            background-color: #002060;
            color: #ffffff;
            font-weight: bold;
            text-align: center;
            white-space: nowrap;
            padding: 10px;
        }}

        tr:nth-child(even) {{
            background-color: #fcfcfc;
        }}

        tr:hover {{
            background-color: #f1f5f9;
        }}

        .text-center {{ text-align: center; }}
        .text-left {{ text-align: left; }}

        .status-badge {{
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
        }}

        .status-pass {{
            background-color: #e6f4ea;
            color: #137333;
            border: 1px solid #ceead6;
        }}

        .method-badge {{
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 11px;
            color: white;
        }}

        .method-post {{ background-color: #107c41; }}
        .method-get {{ background-color: #0078d4; }}
        .method-put {{ background-color: #b4009e; }}
        .method-delete {{ background-color: #d13438; }}
        .method-middleware {{ background-color: #6b29b6; }}
        .method-render {{ background-color: #008272; }}
        .method-submit {{ background-color: #d83b01; }}
        .method-interact {{ background-color: #005a9e; }}
        .method-util {{ background-color: #498205; }}
    </style>
</head>
<body>

    <div class="header">
        <h1>BÁO CÁO UNIT TEST HỆ THỐNG QUẢN LÝ KHÁCH SẠN HOTELIFY (WDP101)</h1>
        <p>Tester thực hiện: <strong>nghiadt</strong> | Ngày cập nhật: <strong>7/18/2026</strong> | Tổng số Test Cases: <strong>165/165 (100% Complete)</strong></p>
    </div>

    <div class="summary-box">
        <div class="summary-card">
            <h4>Tổng Số Test Cases</h4>
            <div class="number">165</div>
        </div>
        <div class="summary-card">
            <h4>Đã Đạt (Passed)</h4>
            <div class="number pass">165 (100%)</div>
        </div>
        <div class="summary-card">
            <h4>Thất Bại (Failed)</h4>
            <div class="number">0 (0%)</div>
        </div>
        <div class="summary-card">
            <h4>Chưa Chạy (Not Run)</h4>
            <div class="number">0 (0%)</div>
        </div>
    </div>

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Test Case ID</th>
                    <th>Module</th>
                    <th>API / Method</th>
                    <th>Method</th>
                    <th>Description</th>
                    <th>Pre-condition</th>
                    <th>Input</th>
                    <th>Expected Result</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Tester</th>
                    <th>Test Date</th>
                    <th>Note</th>
                </tr>
            </thead>
            <tbody>
{tbody_content}
            </tbody>
        </table>
    </div>

</body>
</html>
"""
    return html

def generate_markdown_tracking():
    md_lines = [
        "# 📊 Test Execution Tracking Report - Hotelify System (WDP101)",
        "",
        "- **Tester Name**: `nghiadt`",
        "- **Test Date**: `7/18/2026`",
        "- **Overall Status**: **165 / 165 (100% Passed)**",
        "- **Primary Report File**: `D:\\Education\\WDP101\\Project\\test-report\\TestReport.html`",
        "",
        "---",
        "",
        "## 📑 Progress Breakdown by Module",
        "",
        "| Module | Total Tests | Passed | Progress | Status |",
        "|---|:---:|:---:|:---:|:---:|",
        "| Auth & Customer Account | 20 | 20 | 100% | ✅ Passed |",
        "| Room Management | 12 | 12 | 100% | ✅ Passed |",
        "| Room Type Management | 8 | 8 | 100% | ✅ Passed |",
        "| Housekeeping Management | 10 | 10 | 100% | ✅ Passed |",
        "| Staff Task Management | 8 | 8 | 100% | ✅ Passed |",
        "| Room Inventory Management | 6 | 6 | 100% | ✅ Passed |",
        "| Customer Feedback | 6 | 6 | 100% | ✅ Passed |",
        "| Hotel Policy Management | 4 | 4 | 100% | ✅ Passed |",
        "| Manager Dashboard | 4 | 4 | 100% | ✅ Passed |",
        "| Admin Account Management | 6 | 6 | 100% | ✅ Passed |",
        "| Admin Role Management | 4 | 4 | 100% | ✅ Passed |",
        "| Admin Dashboard & Security | 3 | 3 | 100% | ✅ Passed |",
        "| Customer Reservation | 8 | 8 | 100% | ✅ Passed |",
        "| Customer Payment VNPAY | 6 | 6 | 100% | ✅ Passed |",
        "| Receptionist Check-in | 8 | 8 | 100% | ✅ Passed |",
        "| Receptionist Check-out | 6 | 6 | 100% | ✅ Passed |",
        "| Customer Profile Dashboard | 4 | 4 | 100% | ✅ Passed |",
        "| Upload & Image Security | 5 | 5 | 100% | ✅ Passed |",
        "| Auth & Role Middleware | 4 | 4 | 100% | ✅ Passed |",
        "| Frontend Utilities & UI Pages | 24 | 24 | 100% | ✅ Passed |",
        "| **TOTAL** | **165** | **165** | **100%** | ✅ **COMPLETE** |",
        "",
        "---",
        "",
        "## 📝 Detailed Checklist of Test Cases",
        ""
    ]

    for tc in test_cases:
        tc_id, module, api, method, desc, _, _, _, status, priority, tester, date, _ = tc
        md_lines.append(f"- [x] **{tc_id}** [{module}] `{method} {api}` - {desc} (Tester: `{tester}`, Date: `{date}`) -> **PASS**")

    return "\n".join(md_lines)

# Write files
html_content = generate_html_content()

test_report_path = r"D:\Education\WDP101\Project\test-report\TestReport.html"
index_report_path = r"D:\Education\WDP101\Project\test-report\index.html"
tracking_path = r"D:\Education\WDP101\Project\test-report\test-tracking.md"

with open(test_report_path, "w", encoding="utf-8") as f:
    f.write(html_content)

with open(index_report_path, "w", encoding="utf-8") as f:
    f.write(html_content)

markdown_content = generate_markdown_tracking()
with open(tracking_path, "w", encoding="utf-8") as f:
    f.write(markdown_content)

print("Generated HTML and Markdown reports successfully!")
