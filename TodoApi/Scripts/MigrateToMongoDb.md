# Hướng dẫn Migrate dữ liệu từ SQL Server sang MongoDB

## Bước 1: Kiểm tra dữ liệu hiện tại
- Kiểm tra xem có bao nhiêu projects trong SQL Server
- Kiểm tra xem MongoDB đã có dữ liệu chưa

## Bước 2: Tạo script migration (nếu cần)
- Script sẽ đọc dữ liệu từ SQL Server
- Chuyển đổi ID từ long sang ObjectId (string)
- Insert vào MongoDB

## Lưu ý:
- Dữ liệu cũ trong SQL Server có ID là số (long)
- MongoDB dùng ObjectId (string) - format: 24 ký tự hex
- Cần map lại ID hoặc tạo ID mới

