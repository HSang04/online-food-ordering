# OnlineFood - Website Đặt Món Ăn Trực Tuyến - Kien Ly 

## 📖 Giới thiệu

**OnlineFood** là website cho phép người dùng đặt món ăn trực tuyến, quản lý giỏ hàng, thanh toán, và theo dõi tình trạng đơn hàng.

Hệ thống cung cấp **trang quản trị** dành cho Admin/Quản lý để quản lý món ăn, người dùng và đơn hàng.

👉 Đây là dự án **cá nhân** nhằm rèn luyện kỹ năng **Fullstack với ReactJS & Spring Boot**.

---

## ✨ Tính năng nổi bật

### 👤 Người dùng
- Đăng ký / Đăng nhập tài khoản
- Xem menu và chi tiết món ăn
- Thêm / chỉnh sửa / xóa món trong giỏ hàng
- Áp dụng voucher giảm giá
- Thanh toán trực tuyến
- Theo dõi trạng thái đơn hàng

### 🔑 Quản trị (Admin/Quản lý)
- Quản lý người dùng
- Quản lý món ăn (thêm/sửa/xóa, upload ảnh lên Cloudinary)
- Quản lý đơn hàng và tình trạng giao hàng
- Quản lý voucher/khuyến mãi

---

## 🛠️ Công nghệ sử dụng

- **Frontend:** ReactJS
- **Backend:** Spring Boot, Spring Security (JWT)
- **Database:** MySQL
- **Khác:** Cloudinary (lưu trữ hình ảnh)

---

## 📂 Cấu trúc dự án

```
OnlineFood/
├── OnlineFood-BackEnd/              # Spring Boot (REST API, Security, MySQL)
│   ├── src/main/java/               # Source code Java
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml                      # Maven build file
│
├── OnlineFood-FrontEnd/             # ReactJS (UI cho người dùng & admin)
│   ├── public/
│   ├── src/
│   └── package.json
│
├── database/                        # File SQL khởi tạo CSDL
│   └── onlinefood_full_data.sql
│
└── README.md                        # Tài liệu dự án
```

---

## 🚀 Hướng dẫn cài đặt

### 🔹 Backend (Spring Boot)

**1. Clone project:**
```bash
git clone https://github.com/HSang04/OnlineFood.git

```

**2. Tạo database trong MySQL:**
```sql
CREATE DATABASE onlinefooddb;
```

**3. Cấu hình MySQL trong `src/main/resources/application.properties`:**
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/onlinefooddb
spring.datasource.username=root
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

**4. Chạy project Spring Boot:**
```bash
mvn spring-boot:run
```

👉 **Server chạy tại:** http://localhost:8080

### 🔹 Frontend (ReactJS)

**1. Vào thư mục frontend:**
```bash
cd ../OnlineFood-FrontEnd
```

**2. Cài đặt dependencies:**
```bash
npm install
```

**3. Chạy ứng dụng React:**
```bash
npm start
```

👉 **Giao diện chạy tại:** http://localhost:3000

---

## 👤 Tài khoản mẫu

Để test các tính năng của hệ thống, bạn có thể sử dụng tài khoản mẫu sau:

### 🔑 Admin
- **Tài khoản:** `admin`
- **Mật khẩu:** `123456`

*Lưu ý: Đây là tài khoản demo, trong môi trường thực tế nên thay đổi mật khẩu mạnh hơn.*

---

## 🎯 Demo

### Giao diện người dùng
- Trang chủ hiển thị menu món ăn
- Giỏ hàng và thanh toán
- Theo dõi đơn hàng

### Giao diện quản trị
- Dashboard quản lý tổng quan
- Quản lý món ăn với upload hình ảnh
- Quản lý đơn hàng và người dùng

---

## 📞 Liên hệ

👨‍💻 **Tác giả:** Huỳnh Sang  
🔗 **GitHub:** https://github.com/HSang04  
📧 **Email:** huynhsang2004a@gmail.com

---

⭐ **Nếu bạn thấy dự án hữu ích, hãy cho một star nhé!** ⭐