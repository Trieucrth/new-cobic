/**
 * Hướng dẫn tạo hình ảnh splash screen tùy chỉnh
 * 
 * Vì native splash screen chỉ hỗ trợ một hình ảnh duy nhất, để có thể hiển thị logo và 
 * văn bản "Cobic App" và "Hệ thống quản lý chuỗi cà phê", chúng ta cần tạo một hình ảnh
 * kết hợp cả ba thành phần này.
 * 
 * Hướng dẫn:
 * 
 * 1. Sử dụng một công cụ thiết kế như Figma, Adobe Photoshop, hay thậm chí canva.com:
 *    - Tạo một canvas có kích thước 1200x1200px (hoặc lớn hơn) với nền màu #8B5CF6
 *    - Đặt logo-cobic.png ở trung tâm (kích thước khoảng 300-400px)
 *    - Thêm dòng chữ "Cobic App" phía dưới logo với font chữ lớn, đậm, màu trắng
 *    - Thêm dòng chữ "Hệ thống quản lý chuỗi cà phê" bên dưới với font nhỏ hơn, màu trắng
 *    - Xuất ra file PNG có độ phân giải cao
 * 
 * 2. Đặt file này vào thư mục assets/images với tên là "splash-combined.png"
 * 
 * 3. Cập nhật app.json để sử dụng hình ảnh mới này:
 *    "splash": {
 *      "image": "./assets/images/splash-combined.png",
 *      "resizeMode": "contain",
 *      "backgroundColor": "#8B5CF6"
 *    }
 * 
 * Nếu bạn muốn tiếp tục sử dụng logo hiện tại, bạn có thể bỏ qua hướng dẫn này
 * và chỉ sử dụng cấu hình hiện tại trong app.json.
 */ 