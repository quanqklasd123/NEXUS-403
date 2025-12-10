# MongoDB Atlas Connection Troubleshooting

## Lỗi: TLS Authentication Failed

### Nguyên nhân:
1. **IP Address chưa được whitelist** trong MongoDB Atlas
2. **Password có ký tự đặc biệt** cần URL encode
3. **Connection string thiếu TLS options**

## Cách khắc phục:

### Bước 1: Kiểm tra Network Access trong MongoDB Atlas
1. Vào MongoDB Atlas: https://cloud.mongodb.com/
2. Chọn cluster của bạn
3. Vào **Network Access** (hoặc **IP Access List**)
4. Click **Add IP Address**
5. Chọn **Allow Access from Anywhere** (0.0.0.0/0) - chỉ cho development
   - Hoặc thêm IP cụ thể của bạn
6. Click **Confirm**

### Bước 2: Kiểm tra Database User
1. Vào **Database Access**
2. Kiểm tra user `tvquan2004_db_user` có tồn tại không
3. Kiểm tra password có đúng không
4. Đảm bảo user có quyền **Read and write to any database**

### Bước 3: Kiểm tra Connection String
Connection string đúng format:
```
mongodb+srv://username:password@cluster.mongodb.net/database?tls=true&retryWrites=true&w=majority
```

### Bước 4: URL Encode Password (nếu cần)
Nếu password có ký tự đặc biệt như `@`, `#`, `%`, cần URL encode:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`

Ví dụ: Password `p@ss#word` → `p%40ss%23word`

### Bước 5: Test Connection
Sau khi sửa, restart backend và test lại:
```
http://localhost:5205/api/health
```

## Lưu ý:
- **Allow Access from Anywhere (0.0.0.0/0)** chỉ nên dùng cho development
- Production nên whitelist IP cụ thể
- Đợi 1-2 phút sau khi thay đổi Network Access để có hiệu lực

