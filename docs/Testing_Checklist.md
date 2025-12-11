# Testing Checklist - App Builder Features

**Ngày tạo:** 11/27/2025
**Mục đích:** Checklist để test các tính năng đã triển khai trong Phase 1 & Phase 2

---

## ✅ Phase 1: Foundation

### 1. Item Naming & Metadata

- [ ] **Test 1.1:** Tạo một Button mới

  - [ ] Chọn Button → Tab "Info"
  - [ ] Nhập name: "Submit Button"
  - [ ] Kiểm tra name hiển thị trong header PropertiesPanel
  - [ ] Kiểm tra metadata.createdAt và updatedAt được tạo tự động
- [ ] **Test 1.2:** Thêm Tags

  - [ ] Tab "Info" → Nhập tags: "form, button, primary"
  - [ ] Kiểm tra tags hiển thị dạng badges
  - [ ] Kiểm tra tags có trong search filter
- [ ] **Test 1.3:** Thêm Notes

  - [ ] Tab "Info" → Nhập notes: "Button để submit form"
  - [ ] Kiểm tra notes được lưu
  - [ ] Refresh page → Kiểm tra notes vẫn còn

### 2. Hierarchy System

- [ ] **Test 2.1:** Tạo Container và thêm items vào

  - [ ] Kéo Container vào canvas
  - [ ] Kéo Button vào Container (vào bên trong Container)
  - [ ] Kéo Input vào Container
  - [ ] Kiểm tra Button và Input hiển thị bên trong Container
  - [ ] Kiểm tra Tab "Info" → Hierarchy → Children hiển thị 2 items
- [ ] **Test 2.2:** Xóa Container

  - [ ] Chọn Container có children
  - [ ] Click Delete
  - [ ] Kiểm tra Container và tất cả children đều bị xóa
- [ ] **Test 2.3:** Row và Grid với children

  - [ ] Kéo Row vào canvas
  - [ ] Kéo 2 Button vào Row
  - [ ] Kiểm tra 2 Button hiển thị ngang (flex)
  - [ ] Tương tự với Grid

### 3. Search & Filter

- [ ] **Test 3.1:** Search by Name

  - [ ] Tạo nhiều items với names khác nhau
  - [ ] Nhập search query: "Button"
  - [ ] Kiểm tra chỉ items có "Button" trong name hiển thị
- [ ] **Test 3.2:** Search by Type

  - [ ] Nhập search query: "input"
  - [ ] Kiểm tra chỉ input items hiển thị
- [ ] **Test 3.3:** Filter by Tag

  - [ ] Thêm tag "form" cho một số items
  - [ ] Click tag button "form" trong Toolbox
  - [ ] Kiểm tra chỉ items có tag "form" hiển thị
- [ ] **Test 3.4:** Clear Search/Filter

  - [ ] Click "All" button
  - [ ] Xóa search query
  - [ ] Kiểm tra tất cả items hiển thị lại

---

## ✅ Phase 2: Logic

### 4. Conditional Visibility

- [ ] **Test 4.1:** Basic Visibility Condition

  - [ ] Tạo một Button
  - [ ] Tab "Logic" → Chọn "Conditional"
  - [ ] Nhập condition: `{{user.isLoggedIn}}`
  - [ ] Vào Preview mode
  - [ ] Kiểm tra Button hiển thị (vì appState.user.isLoggedIn = true)
  - [ ] Thay đổi appState.user.isLoggedIn = false (cần thêm UI để test)
  - [ ] Kiểm tra Button ẩn đi
- [ ] **Test 4.2:** Complex Condition

  - [ ] Nhập condition: `{{user.role}} === 'admin'`
  - [ ] Vào Preview mode
  - [ ] Kiểm tra Button ẩn (vì user.role = 'user')
  - [ ] Thay đổi user.role = 'admin'
  - [ ] Kiểm tra Button hiển thị

### 5. Conditional Styling

- [ ] **Test 5.1:** Add Conditional Style

  - [ ] Tạo một Button
  - [ ] Tab "Logic" → "Add Condition"
  - [ ] Nhập "When": `{{formData.isValid}}`
  - [ ] Nhập "Style": `{"backgroundColor": "#22c55e"}`
  - [ ] Vào Preview mode
  - [ ] Kiểm tra Button có background xanh khi formData.isValid = true
- [ ] **Test 5.2:** Multiple Conditions

  - [ ] Thêm condition thứ 2: When `{{formData.isValid}} === false`, Style `{"backgroundColor": "#ef4444"}`
  - [ ] Vào Preview mode
  - [ ] Kiểm tra Button đổi màu theo điều kiện

### 6. Conditional Props

- [ ] **Test 6.1:** Disabled Condition

  - [ ] Tạo một Button
  - [ ] Tab "Logic" → "Disabled": `{{!user.isLoggedIn}}`
  - [ ] Vào Preview mode
  - [ ] Kiểm tra Button disabled khi user.isLoggedIn = false
- [ ] **Test 6.2:** Dynamic Placeholder

  - [ ] Tạo một Input
  - [ ] Tab "Logic" → "Placeholder": `{{user.name ? 'Hi ' + user.name : 'Enter name'}}`
  - [ ] Vào Preview mode
  - [ ] Kiểm tra placeholder thay đổi theo user.name
- [ ] **Test 6.3:** Dynamic Label

  - [ ] Tạo một Button
  - [ ] Tab "Properties" → "Label": `{{formData.submitText}}`
  - [ ] Vào Preview mode
  - [ ] Kiểm tra Button label hiển thị "Submit" (từ appState.formData.submitText)

### 7. Item Relationships

- [ ] **Test 7.1:** Depends On

  - [ ] Tạo Input (id: input-1)
  - [ ] Tạo Button (id: button-1)
  - [ ] Chọn Button → Tab "Logic" → "Relationships"
  - [ ] Thêm "Depends On": chọn input-1
  - [ ] Vào Preview mode
  - [ ] Kiểm tra Button disabled nếu Input invalid (logic cơ bản)
- [ ] **Test 7.2:** Affects

  - [ ] Tạo Button và Modal
  - [ ] Chọn Button → Tab "Logic" → "Relationships"
  - [ ] Thêm "Affects": chọn Modal
  - [ ] Kiểm tra relationship được lưu
- [ ] **Test 7.3:** References

  - [ ] Tạo Input và Text
  - [ ] Chọn Text → Tab "Logic" → "Relationships"
  - [ ] Thêm "References": chọn Input
  - [ ] Kiểm tra relationship được lưu

### 8. Data Binding

- [ ] **Test 8.1:** Simple Data Binding

  - [ ] Tạo Text component
  - [ ] Tab "Properties" → "Label": `{{user.name}}`
  - [ ] Vào Preview mode
  - [ ] Kiểm tra Text hiển thị "User" (từ appState.user.name)
- [ ] **Test 8.2:** Nested Data Binding

  - [ ] Tab "Properties" → "Label": `{{user.role}}`
  - [ ] Vào Preview mode
  - [ ] Kiểm tra Text hiển thị "user"
- [ ] **Test 8.3:** Data Binding với Expression

  - [ ] Tab "Properties" → "Label": `Hi {{user.name}}!`
  - [ ] Vào Preview mode
  - [ ] Kiểm tra Text hiển thị "Hi User!"

### 9. State Management

- [ ] **Test 9.1:** Global State

  - [ ] Kiểm tra appState được khởi tạo với:
    - [ ] user.role = 'user'
    - [ ] user.isLoggedIn = true
    - [ ] user.name = 'User'
    - [ ] formData.isValid = false
    - [ ] formData.submitText = 'Submit'
- [ ] **Test 9.2:** State được truyền xuống Context

  - [ ] Tạo component sử dụng `{{user.role}}`
  - [ ] Vào Preview mode
  - [ ] Kiểm tra component nhận được giá trị từ appState

### 10. Integration Tests

- [ ] **Test 10.1:** Hierarchy + Conditional Visibility

  - [ ] Tạo Container với visibility condition
  - [ ] Thêm children vào Container
  - [ ] Vào Preview mode
  - [ ] Kiểm tra Container và children đều ẩn khi condition = false
- [ ] **Test 10.2:** Conditional Style + Data Binding

  - [ ] Tạo Button với conditional style
  - [ ] Label sử dụng data binding
  - [ ] Vào Preview mode
  - [ ] Kiểm tra cả style và label đều hoạt động đúng
- [ ] **Test 10.3:** Relationships + Conditional Props

  - [ ] Tạo Button phụ thuộc vào Input
  - [ ] Button có disabled condition
  - [ ] Vào Preview mode
  - [ ] Kiểm tra Button disabled khi dependencies invalid

---

## 🐛 Known Issues & Edge Cases

### Cần test kỹ:

1. **Backward Compatibility:**

   - [ ] Load project cũ (không có metadata) → Kiểm tra migration tự động
   - [ ] Load project cũ → Thêm item mới → Kiểm tra structure mới
2. **Edge Cases:**

   - [ ] Condition với variable không tồn tại → Kiểm tra default behavior
   - [ ] Condition với syntax sai → Kiểm tra error handling
   - [ ] Data binding với nested key không tồn tại → Kiểm tra fallback
   - [ ] Xóa item có relationships → Kiểm tra cleanup
3. **Performance:**

   - [ ] Canvas với 50+ items → Kiểm tra performance
   - [ ] Search với nhiều items → Kiểm tra không lag
   - [ ] Conditional rendering với nhiều conditions → Kiểm tra performance

---

## 📝 Test Results Template

```
Test Date: __________
Tester: __________

Phase 1 Results:
- Item Naming: ✅/❌
- Hierarchy: ✅/❌
- Search & Filter: ✅/❌

Phase 2 Results:
- Conditional Visibility: ✅/❌
- Conditional Styling: ✅/❌
- Conditional Props: ✅/❌
- Item Relationships: ✅/❌
- Data Binding: ✅/❌

Issues Found:
1. __________
2. __________

Notes:
__________
```

---

## 🎯 Quick Test Scenarios

### Scenario 1: Simple Form với Conditional Logic

1. Tạo Container
2. Thêm Input "Name" vào Container
3. Thêm Input "Email" vào Container
4. Thêm Button "Submit" vào Container
5. Button có:
   - Visibility: `{{user.isLoggedIn}}`
   - Disabled: `{{!formData.isValid}}`
   - Label: `{{formData.submitText}}`
6. Vào Preview mode
7. Kiểm tra tất cả hoạt động đúng

### Scenario 2: Admin Panel

1. Tạo Container với visibility: `{{user.role}} === 'admin'`
2. Thêm các components admin vào Container
3. Vào Preview mode
4. Kiểm tra Container ẩn (vì user.role = 'user')
5. (Cần thêm UI để thay đổi appState để test)

### Scenario 3: Dynamic Content

1. Tạo StatCard
2. Value: `{{formData.total}}`
3. Title: `{{formData.title}}`
4. Vào Preview mode
5. Kiểm tra StatCard hiển thị giá trị từ appState

---

**Cập nhật lần cuối:** 11/27/2025
