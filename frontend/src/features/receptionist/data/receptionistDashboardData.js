export const menuItems = [
  ['Bảng điều khiển', 'dashboard'],
  ['Danh sách đặt phòng', 'booking'],
  ['Đặt phòng trực tiếp', 'plus'],
  ['Sơ đồ trạng thái phòng', 'bed'],
  ['Yêu cầu dịch vụ', 'message'],
  ['Hồ sơ khách hàng', 'user'],
];

export const kpis = [
  ['Khách đến hôm nay', '18', '+4 khách so với hôm qua', 'booking', 'primary'],
  ['Đã nhận phòng', '12', 'Hoàn thành 67%', 'check', 'success'],
  ['Chờ trả phòng', '7', '2 phòng cần kiểm tra', 'arrow', 'warning'],
  ['Yêu cầu đang mở', '9', '5 dọn phòng, 4 kỹ thuật', 'message', 'soft'],
];

export const bookings = [
  ['#BK-2041', 'Nguyễn Minh Anh', 'Deluxe King', '305', '27 Th06 - 29 Th06', 'Đã đặt cọc', 'Sắp đến'],
  ['#BK-2042', 'Trần Quang Huy', 'Superior Twin', '210', '27 Th06 - 28 Th06', 'Chưa thanh toán', 'Chờ xử lý'],
  ['#BK-2043', 'Lê Hoàng Nam', 'Family Suite', '402', '26 Th06 - 30 Th06', 'Đã thanh toán', 'Đã nhận phòng'],
  ['#BK-2044', 'Phạm Thu Hà', 'Standard Room', '118', '25 Th06 - 27 Th06', 'Đã thanh toán', 'Đã trả phòng'],
  ['#BK-2045', 'Khách vãng lai', 'Standard Room', '126', '27 Th06 - 28 Th06', 'Đặt cọc tại quầy', 'Khách vãng lai'],
];

export const roomStatus = [
  ['Sẵn sàng (Trống)', 42, 'available'],
  ['Đang sử dụng', 68, 'occupied'],
  ['Đã đặt trước', 21, 'reserved'],
  ['Chưa dọn dẹp', 8, 'dirty'],
  ['Đang bảo trì', 4, 'maintenance'],
];

export const quickActions = [
  ['Tạo đặt phòng trực tiếp', 'Tạo nhanh đặt phòng cho khách đến trực tiếp tại quầy lễ tân.', 'plus'],
  ['Ghi nhận tiền cọc', 'Ghi nhận giao dịch đặt cọc bằng tiền mặt hoặc chuyển khoản tại quầy.', 'wallet'],
  ['Xếp phòng cho khách', 'Phân bổ số phòng trống sạch sẽ tương ứng cho khách chuẩn bị check-in.', 'bed'],
  ['Xuất hóa đơn thanh toán', 'Chuẩn bị và in hóa đơn thanh toán sau khi hoàn tất kiểm tra phòng trả.', 'file'],
];

export const serviceRequests = [
  ['Yêu cầu thêm khăn tắm', 'Phòng 305', 'Bộ phận Dọn phòng'],
  ['Điều hòa không mát', 'Phòng 210', 'Bộ phận Kỹ thuật'],
  ['Yêu cầu trả phòng muộn', 'Phòng 118', 'Lễ tân'],
];
