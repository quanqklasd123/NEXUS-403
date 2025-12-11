# 🚀 Hướng dẫn Setup Dự án NEXUS-403

Hướng dẫn chi tiết để setup và chạy dự án sau khi clone từ GitHub.

## 📋 Yêu cầu hệ thống

### Backend (TodoApi)
- **.NET SDK 9.0** hoặc cao hơn
- **MongoDB** (MongoDB Atlas hoặc MongoDB local)
- **Google Cloud Console** (để lấy Google OAuth Client ID)

### Frontend (todo-frontend)
- **Node.js** 18.x hoặc cao hơn
- **npm** hoặc **yarn**

## 🔧 Bước 1: Clone Repository

```bash
git clone <repository-url>
cd NEXUS-403
```

## 🔧 Bước 2: Setup Backend (TodoApi)

### 2.1. Cài đặt .NET SDK

Kiểm tra phiên bản .NET:
```bash
dotnet --version
```

Nếu chưa có, tải về từ: https://dotnet.microsoft.com/download

### 2.2. Cấu hình appsettings.json

1. Vào thư mục `TodoApi`:
```bash
cd TodoApi
```

2. Sao chép file template:
```bash
copy appsettings.json.example appsettings.json
```

Hoặc trên Linux/Mac:
```bash
cp appsettings.json.example appsettings.json
```

3. Mở file `appsettings.json` và điền các thông tin sau:

#### a) JWT Secret
```json
"Secret": "YOUR_JWT_SECRET_KEY_HERE"
```
- Thay bằng một chuỗi bí mật ngẫu nhiên, dài ít nhất 32 ký tự
- Có thể tạo bằng: `openssl rand -base64 32`
- Hoặc tạo online tại: https://www.random.org/strings/

#### b) MongoDB Connection String
```json
"MongoDbConnection": "YOUR_MONGODB_CONNECTION_STRING_HERE"
```
- Lấy từ MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Hoặc nếu dùng MongoDB local: `mongodb://localhost:27017`
- Format: `mongodb+srv://username:password@cluster.mongodb.net/...`

#### c) Google OAuth Client ID
```json
"ClientId": "YOUR_GOOGLE_CLIENT_ID_HERE"
```
- Lấy từ Google Cloud Console: https://console.cloud.google.com/
- Vào: **APIs & Services** > **Credentials** > **OAuth 2.0 Client IDs**
- Tạo mới hoặc sử dụng Client ID có sẵn

### 2.3. Restore và Build

```bash
dotnet restore
dotnet build
```

### 2.4. Chạy Backend

```bash
dotnet run
```

Backend sẽ chạy tại: `http://localhost:5205`

## 🔧 Bước 3: Setup Frontend (todo-frontend)

### 3.1. Cài đặt Dependencies

Mở terminal mới, vào thư mục frontend:
```bash
cd todo-frontend
npm install
```

### 3.2. Cấu hình Google OAuth Client ID (nếu cần)

Mở file `src/main.jsx` và cập nhật Google Client ID:
```javascript
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID_HERE";
```

**Lưu ý**: Client ID này phải giống với Client ID trong `appsettings.json` của backend.

### 3.3. Chạy Frontend

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## ✅ Bước 4: Kiểm tra

1. Mở browser và truy cập: `http://localhost:5173`
2. Đăng ký tài khoản mới hoặc đăng nhập
3. Kiểm tra các chức năng cơ bản

## 🔍 Troubleshooting

### Lỗi: "Cannot connect to MongoDB"

**Nguyên nhân**: Connection string không đúng hoặc MongoDB chưa được cấu hình.

**Giải pháp**:
- Kiểm tra lại MongoDB connection string trong `appsettings.json`
- Đảm bảo MongoDB Atlas đã whitelist IP của bạn (hoặc cho phép tất cả IP: `0.0.0.0/0`)
- Kiểm tra username và password

### Lỗi: "JWT token invalid"

**Nguyên nhân**: JWT Secret không đúng hoặc đã thay đổi.

**Giải pháp**:
- Đảm bảo JWT Secret trong `appsettings.json` đủ dài (ít nhất 32 ký tự)
- Xóa token cũ trong localStorage và đăng nhập lại

### Lỗi: "Google OAuth 403"

**Nguyên nhân**: Origin chưa được thêm vào Google Cloud Console.

**Giải pháp**:
1. Vào Google Cloud Console
2. **APIs & Services** > **Credentials**
3. Chọn OAuth 2.0 Client ID
4. Thêm vào **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - `http://localhost:5174`
   - `http://127.0.0.1:5173`
5. Save và đợi 1-2 phút
6. Refresh trang frontend

### Lỗi: "Port already in use"

**Nguyên nhân**: Port đã được sử dụng bởi ứng dụng khác.

**Giải pháp**:
- Backend: Thay đổi port trong `Properties/launchSettings.json`
- Frontend: Thay đổi port trong `vite.config.js` hoặc dùng `npm run dev -- --port 5174`

### Lỗi: "dotnet command not found"

**Nguyên nhân**: .NET SDK chưa được cài đặt hoặc chưa được thêm vào PATH.

**Giải pháp**:
- Cài đặt .NET SDK từ: https://dotnet.microsoft.com/download
- Restart terminal sau khi cài đặt

## 📁 Cấu trúc Dự án

```
NEXUS-403/
├── TodoApi/              # Backend API (.NET 9.0)
│   ├── appsettings.json.example  # Template config
│   ├── appsettings.json          # Config file (KHÔNG commit)
│   └── ...
├── todo-frontend/         # Frontend (React + Vite)
│   ├── src/
│   └── ...
└── docs/                 # Tài liệu
```

## 🔐 Lưu ý Bảo mật

⚠️ **QUAN TRỌNG**: 
- File `appsettings.json` chứa thông tin nhạy cảm, **KHÔNG BAO GIỜ** commit vào git
- File này đã được thêm vào `.gitignore`
- Chỉ commit `appsettings.json.example`

## 📚 Tài liệu tham khảo

- [.NET Documentation](https://docs.microsoft.com/dotnet/)
- [React Documentation](https://react.dev/)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)

## 🆘 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra lại các bước setup
2. Xem phần Troubleshooting
3. Tạo issue trên GitHub repository

---

**Chúc bạn setup thành công! 🎉**

