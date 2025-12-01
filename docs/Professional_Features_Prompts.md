# Các Prompt cho Tính năng Chuyên nghiệp - App Builder

**Ngày tạo:** 11/27/2025  
**Trạng thái:** Đang triển khai  
**Tiến độ:** 3/5 tính năng (60%)

---

## 📋 Mục lục

1. [Chế độ Preview (Xem trước)](#1-chế-độ-preview-xem-trước)
2. [Undo / Redo (Hoàn tác)](#2-undo--redo-hoàn-tác)
3. [Hệ thống Sự kiện (Event System)](#3-hệ-thống-sự-kiện-event-system)
4. [Responsive Design Mode](#4-responsive-design-mode)
5. [Kết nối Dữ liệu (Data Binding)](#5-kết-nối-dữ-liệu-data-binding)

---

## 1. Chế độ Preview (Xem trước) ✅ **ĐÃ HOÀN THÀNH**

### Mục tiêu
Tạo chế độ Preview để người dùng xem ứng dụng như người dùng cuối sẽ thấy, ẩn tất cả các công cụ chỉnh sửa.

### Yêu cầu chi tiết
- Thêm nút "Preview" vào thanh công cụ trên Canvas (bên cạnh nút Save và Publish)
- Khi bấm Preview:
  - Ẩn Toolbox (sidebar trái)
  - Ẩn Properties Panel (sidebar phải)
  - Ẩn tất cả các khung nét đứt (border dashed) trên các component
  - Ẩn các chỉ báo selection (border xanh khi chọn component)
  - Ẩn các nút Save/Publish (chỉ hiện nút "Exit Preview")
  - Canvas chiếm toàn bộ màn hình
  - Các component hoạt động như bình thường (có thể click, input...)
- Khi bấm "Exit Preview" hoặc ESC: Quay lại chế độ edit bình thường

### Prompt

```
Hãy triển khai Chế độ Preview cho App Builder.

Yêu cầu:
1. Thêm state `isPreviewMode` vào AppBuilderPage.jsx
2. Thêm nút "Preview" vào thanh công cụ Canvas (sử dụng icon FiEye từ react-icons/fi)
3. Khi bấm Preview:
   - Set isPreviewMode = true
   - Ẩn Toolbox (left sidebar) - dùng conditional rendering
   - Ẩn Properties Panel (right sidebar) - dùng conditional rendering
   - Ẩn thanh công cụ Canvas (chỉ hiện nút "Exit Preview")
   - Truyền prop `isPreview={true}` xuống RenderComponent để ẩn border selection
4. Cập nhật RenderComponent:
   - Nếu isPreview = true: Không hiển thị border selection (border xanh), không hiển thị border dashed
   - Cho phép pointer-events hoạt động (bỏ readOnly, pointer-events-none)
5. Thêm keyboard shortcut ESC để exit preview
6. Nút "Exit Preview" sẽ set isPreviewMode = false và restore lại UI

Đảm bảo:
- Preview mode hoạt động mượt mà
- Có thể toggle qua lại giữa Preview và Edit mode
- Các component trong Preview mode có thể tương tác được (button click, input type...)
```

### File cần chỉnh sửa
- `todo-frontend/src/pages/AppBuilderPage.jsx`
- `todo-frontend/src/components/builder/PropertiesPanel.jsx` (có thể không cần)

### Ước tính độ phức tạp
⭐⭐ (Trung bình)

### Trạng thái triển khai
✅ **Đã hoàn thành** - Ngày hoàn thành: 11/27/2025

**Chi tiết triển khai:**
- ✅ State `isPreviewMode` đã được thêm vào `AppBuilderPage.jsx`
- ✅ Nút "Preview" với icon `FiEye` đã được thêm vào thanh công cụ Canvas
- ✅ Toolbox và Properties Panel được ẩn trong preview mode (conditional rendering)
- ✅ Thanh công cụ Canvas chỉ hiển thị nút "Exit Preview" trong preview mode
- ✅ `RenderComponent` nhận prop `isPreview` và ẩn border selection, border dashed
- ✅ Pointer events hoạt động trong preview mode (bỏ readOnly, pointer-events-none)
- ✅ Keyboard shortcut ESC để exit preview đã được triển khai
- ✅ Nút "Exit Preview" restore lại UI bình thường

---

## 2. Undo / Redo (Hoàn tác) ✅ **ĐÃ HOÀN THÀNH**

### Mục tiêu
Thêm tính năng Undo/Redo để người dùng có thể hoàn tác các thao tác đã làm (thêm, xóa, sửa component).

### Yêu cầu chi tiết
- Lưu lịch sử (history) của canvasItems mỗi khi có thay đổi
- Hỗ trợ keyboard shortcuts: Ctrl+Z (Undo), Ctrl+Y hoặc Ctrl+Shift+Z (Redo)
- Thêm nút Undo/Redo vào thanh công cụ Canvas (có thể disable khi không có history)
- Giới hạn history stack (ví dụ: 50 bước)
- Các thao tác cần lưu history:
  - Thêm component mới (handleDragEnd)
  - Xóa component (handleDeleteItem)
  - Cập nhật component (handleUpdateItem)
  - Load project từ API (không cần lưu vào history)

### Prompt

```
Hãy triển khai tính năng Undo/Redo cho App Builder.

Yêu cầu:
1. Thêm state quản lý history:
   - `history`: Array chứa các snapshot của canvasItems
   - `historyIndex`: Index hiện tại trong history (-1 = không có history)
   - `maxHistorySize`: 50 (giới hạn số bước)

2. Tạo hàm `saveToHistory()`:
   - Lưu deep copy của canvasItems hiện tại vào history
   - Xóa các bước sau historyIndex (khi user làm action mới sau khi undo)
   - Giới hạn history.length <= maxHistorySize

3. Tạo hàm `handleUndo()`:
   - Giảm historyIndex
   - Restore canvasItems từ history[historyIndex]
   - Disable nút nếu historyIndex <= 0

4. Tạo hàm `handleRedo()`:
   - Tăng historyIndex
   - Restore canvasItems từ history[historyIndex]
   - Disable nút nếu historyIndex >= history.length - 1

5. Cập nhật các hàm:
   - `handleDragEnd`: Gọi saveToHistory() sau khi thêm component
   - `handleDeleteItem`: Gọi saveToHistory() sau khi xóa
   - `handleUpdateItem`: Debounce saveToHistory() (tránh lưu quá nhiều khi đang type)

6. Thêm keyboard shortcuts:
   - useEffect để listen Ctrl+Z (Undo)
   - useEffect để listen Ctrl+Y hoặc Ctrl+Shift+Z (Redo)
   - Prevent default browser behavior

7. Thêm UI:
   - Nút Undo (icon FiCornerUpLeft) vào thanh công cụ Canvas
   - Nút Redo (icon FiCornerUpRight) vào thanh công cụ Canvas
   - Disable khi không thể undo/redo

Đảm bảo:
- History hoạt động chính xác
- Performance tốt (không lag khi có nhiều history)
- Keyboard shortcuts hoạt động
```

### File cần chỉnh sửa
- `todo-frontend/src/pages/AppBuilderPage.jsx`

### Ước tính độ phức tạp
⭐⭐⭐ (Khá phức tạp)

### Trạng thái triển khai
✅ **Đã hoàn thành** - Ngày hoàn thành: 11/27/2025

**Chi tiết triển khai:**
- ✅ State `history`, `historyIndex`, `maxHistorySize` đã được thêm
- ✅ Hàm `saveToHistory()` với deep copy và quản lý history stack
- ✅ Hàm `handleUndo()` và `handleRedo()` đã được triển khai
- ✅ `handleDragEnd`, `handleDeleteItem`, `handleUpdateItem` đã tích hợp saveToHistory
- ✅ Debounce cho `handleUpdateItem` để tránh lưu quá nhiều khi đang type
- ✅ Keyboard shortcuts Ctrl+Z (Undo) và Ctrl+Y/Ctrl+Shift+Z (Redo) đã được triển khai
- ✅ Nút Undo (FiCornerUpLeft) và Redo (FiCornerUpRight) đã được thêm vào thanh công cụ
- ✅ Nút disable khi không thể undo/redo
- ✅ Sử dụng `useCallback` và `useRef` để tối ưu performance

---

## 3. Hệ thống Sự kiện (Event System) ✅ **ĐÃ HOÀN THÀNH**

### Mục tiêu
Thêm hệ thống sự kiện để các component có thể thực hiện các hành động khi được tương tác (ví dụ: Button onClick).

### Yêu cầu chi tiết
- Mỗi component có thể có các events khác nhau:
  - Button: onClick
  - Input: onChange, onFocus, onBlur
  - Card/Container: onClick
- Trong Properties Panel, thêm tab "Events" (bên cạnh tab hiện tại)
- Các loại actions có thể chọn:
  - **Navigate to Page**: Chuyển đến một route/page khác
  - **Show Notification**: Hiển thị thông báo (alert/toast)
  - **Call API**: Gọi một API endpoint
  - **Open Modal**: Mở một modal/popup
  - **Update Variable**: Cập nhật biến toàn cục
- Lưu events vào item.props.events (JSON object)
- Khi render component trong Preview mode, thực thi events thật

### Prompt

```
Hãy triển khai Hệ thống Sự kiện (Event System) cho App Builder.

Yêu cầu:
1. Cập nhật PropertiesPanel.jsx:
   - Thêm tabs: "Properties" và "Events"
   - Tab Events hiển thị danh sách events của component
   - Mỗi event có: Event Type (onClick, onChange...), Action Type (dropdown), Action Config

2. Cập nhật cấu trúc item:
   - Thêm `events: {}` vào defaultProps của các component có thể có events
   - Ví dụ: Button có `events: { onClick: { type: 'navigate', config: { route: '/dashboard' } } }`

3. Tạo EventHandler component/function:
   - Nhận event config và thực thi action tương ứng
   - Navigate: Sử dụng useNavigate() từ react-router-dom
   - Show Notification: Hiển thị alert hoặc toast notification
   - Call API: Gọi apiService với endpoint và params
   - Open Modal: Set state để hiển thị modal
   - Update Variable: Cập nhật global state (có thể dùng Context API)

4. Cập nhật RenderComponent:
   - Thêm event handlers vào các component tương ứng
   - onClick cho button, card, container
   - onChange, onFocus, onBlur cho input
   - Chỉ hoạt động trong Preview mode (isPreview = true)

5. Tạo UI trong PropertiesPanel cho Events:
   - Dropdown chọn Event Type (onClick, onChange...)
   - Dropdown chọn Action Type (Navigate, Notification, API, Modal, Variable)
   - Form fields để nhập Action Config (route, message, endpoint...)
   - Nút "Add Event" và "Remove Event"

6. Lưu events vào item.props.events khi user chỉnh sửa

Đảm bảo:
- Events chỉ hoạt động trong Preview mode
- Có thể thêm/xóa nhiều events cho một component
- Action config được validate
- UI dễ sử dụng
```

### File cần chỉnh sửa
- `todo-frontend/src/pages/AppBuilderPage.jsx`
- `todo-frontend/src/components/builder/PropertiesPanel.jsx`
- Có thể cần tạo: `todo-frontend/src/utils/eventHandler.js`

### Ước tính độ phức tạp
⭐⭐⭐⭐ (Phức tạp)

### Trạng thái triển khai
✅ **Đã hoàn thành** - Ngày hoàn thành: 11/27/2025

**Chi tiết triển khai:**
- ✅ `PropertiesPanel.jsx` đã được cập nhật với tabs "Properties" và "Events"
- ✅ Tab Events hiển thị danh sách events của component với UI đầy đủ
- ✅ Cấu trúc `events: {}` đã được thêm vào `defaultProps` của các component hỗ trợ events
- ✅ File `todo-frontend/src/utils/eventHandler.js` đã được tạo với hàm `handleEvent`
- ✅ EventHandler hỗ trợ 5 loại actions: Navigate, Notification, API, Modal, Variable
- ✅ `RenderComponent` đã được cập nhật với event handlers (onClick, onChange, onFocus, onBlur)
- ✅ Events chỉ hoạt động trong Preview mode (`isPreview = true`)
- ✅ UI trong PropertiesPanel cho Events đã được triển khai:
  - Dropdown chọn Event Type và Action Type
  - Form fields để nhập Action Config (route, message, endpoint, method, params, title, content, variableName, value)
  - Nút "Add Event" (+) và "Remove Event" (X)
- ✅ Events được lưu vào `item.props.events` khi user chỉnh sửa
- ✅ File hướng dẫn `docs/Event_System_Guide.md` đã được tạo

**Các component hỗ trợ Events:**
- Button: onClick
- Card: onClick
- Container: onClick
- Input: onChange, onFocus, onBlur
- Select, DatePicker, Checkbox, Switch, FileUpload: onChange

---

## 4. Responsive Design Mode

### Mục tiêu
Thêm chế độ Responsive Design để người dùng có thể xem và chỉnh sửa giao diện cho các kích thước màn hình khác nhau (Desktop, Tablet, Mobile).

### Yêu cầu chi tiết
- Thêm thanh công cụ Responsive trên đầu Canvas:
  - Nút Desktop (1920px width)
  - Nút Tablet (768px width)
  - Nút Mobile (375px width)
  - Nút Custom (cho phép nhập width tùy chỉnh)
- Khi chọn một breakpoint:
  - Canvas container thay đổi width tương ứng
  - Hiển thị indicator hiện tại đang ở breakpoint nào
  - Có thể scroll ngang nếu content rộng hơn viewport
- Lưu responsive settings vào project (nếu cần)

### Prompt

```
Hãy triển khai Responsive Design Mode cho App Builder.

Yêu cầu:
1. Thêm state `responsiveMode` vào AppBuilderPage.jsx:
   - Giá trị: 'desktop' | 'tablet' | 'mobile' | 'custom'
   - State `customWidth` cho custom mode

2. Định nghĩa breakpoints:
   - Desktop: 1920px
   - Tablet: 768px
   - Mobile: 375px
   - Custom: user nhập

3. Thêm Responsive Toolbar vào thanh công cụ Canvas:
   - Icon FiMonitor, FiTablet, FiSmartphone (từ react-icons/fi)
   - Nút Desktop, Tablet, Mobile
   - Nút Custom với input để nhập width
   - Hiển thị width hiện tại

4. Cập nhật Canvas container:
   - Áp dụng width tương ứng với responsiveMode
   - Center canvas trong viewport
   - Thêm border/indicator để hiển thị viewport boundary
   - Có thể scroll ngang nếu content rộng hơn

5. Thêm visual indicator:
   - Hiển thị label "Desktop 1920px" trên đầu canvas
   - Màu sắc khác nhau cho mỗi breakpoint
   - Có thể thêm grid overlay để dễ căn chỉnh

6. Lưu responsive settings (optional):
   - Có thể lưu vào project.jsonData để nhớ breakpoint đã chọn

Đảm bảo:
- Chuyển đổi giữa các breakpoint mượt mà
- Canvas hiển thị đúng width
- Có thể scroll và xem toàn bộ content
- UI rõ ràng, dễ sử dụng
```

### File cần chỉnh sửa
- `todo-frontend/src/pages/AppBuilderPage.jsx`

### Ước tính độ phức tạp
⭐⭐ (Trung bình)

### Trạng thái triển khai
⏳ **Chưa bắt đầu**

---

## 5. Kết nối Dữ liệu (Data Binding)

### Mục tiêu
Thêm tính năng Data Binding để người dùng có thể sử dụng dữ liệu động thay vì text tĩnh (ví dụ: `{{user.name}}`, `{{api.data}}`).

### Yêu cầu chi tiết
- Hỗ trợ syntax `{{variable}}` trong các field text
- Quản lý Global Variables:
  - Tạo/sửa/xóa biến toàn cục
  - Các loại biến: Static (giá trị cố định), API (lấy từ API), Computed (tính toán từ biến khác)
- Kết nối API:
  - Cho phép user nhập API endpoint
  - Lưu response vào biến
  - Auto-refresh hoặc manual refresh
- Render component với data binding:
  - Parse `{{variable}}` trong text
  - Thay thế bằng giá trị thực tế
  - Hiển thị loading state khi đang fetch data
- UI để quản lý variables:
  - Modal hoặc sidebar để quản lý Global Variables
  - Form để tạo/sửa variable
  - Hiển thị danh sách variables hiện có

### Prompt

```
Hãy triển khai tính năng Kết nối Dữ liệu (Data Binding) cho App Builder.

Yêu cầu:
1. Tạo Global Variables Manager:
   - State `globalVariables` trong AppBuilderPage.jsx
   - Cấu trúc: { name: string, type: 'static' | 'api' | 'computed', value: any, config?: {} }
   - Lưu vào localStorage hoặc project.jsonData

2. Tạo UI quản lý Variables:
   - Nút "Variables" trên thanh công cụ Canvas
   - Modal hiển thị danh sách variables
   - Form để tạo/sửa variable:
     - Name (unique)
     - Type (Static/API/Computed)
     - Value hoặc Config (tùy type)
     - Nút Save/Delete

3. Tạo Data Binding Parser:
   - Hàm `parseDataBinding(text, variables)`: Tìm `{{variable}}` và thay thế
   - Hỗ trợ nested: `{{user.profile.name}}`
   - Xử lý lỗi nếu variable không tồn tại

4. Cập nhật PropertiesPanel:
   - Thêm indicator khi field có data binding (icon hoặc badge)
   - Hiển thị preview giá trị khi có variable
   - Button để mở Variables Manager

5. Cập nhật RenderComponent:
   - Parse text trong item.props.label, item.props.placeholder...
   - Thay thế `{{variable}}` bằng giá trị thực
   - Hiển thị loading nếu đang fetch API data
   - Hiển thị error nếu variable không tồn tại

6. API Integration:
   - Khi type = 'api': Gọi apiService với endpoint trong config
   - Lưu response vào variable.value
   - Auto-refresh hoặc manual refresh button
   - Error handling

7. Computed Variables:
   - Khi type = 'computed': Tính toán từ variables khác
   - Syntax: `{{var1}} + {{var2}}` hoặc JavaScript expression
   - Re-compute khi dependencies thay đổi

Đảm bảo:
- Data binding hoạt động trong Preview mode
- Variables được quản lý dễ dàng
- API integration mượt mà
- Error handling tốt
- Performance tốt (không re-render quá nhiều)
```

### File cần chỉnh sửa
- `todo-frontend/src/pages/AppBuilderPage.jsx`
- `todo-frontend/src/components/builder/PropertiesPanel.jsx`
- Có thể cần tạo: `todo-frontend/src/utils/dataBinding.js`

### Ước tính độ phức tạp
⭐⭐⭐⭐⭐ (Rất phức tạp)

### Trạng thái triển khai
⏳ **Chưa bắt đầu**

---

## 📊 Tổng kết

| Tính năng | Độ phức tạp | Ưu tiên | Trạng thái | Ngày hoàn thành |
|-----------|-------------|---------|------------|-----------------|
| 1. Preview Mode | ⭐⭐ | Cao | ✅ Đã hoàn thành | 11/27/2025 |
| 2. Undo/Redo | ⭐⭐⭐ | Cao | ✅ Đã hoàn thành | 11/27/2025 |
| 3. Event System | ⭐⭐⭐⭐ | Trung bình | ✅ Đã hoàn thành | 11/27/2025 |
| 4. Responsive Mode | ⭐⭐ | Trung bình | ⏳ Chưa bắt đầu | - |
| 5. Data Binding | ⭐⭐⭐⭐⭐ | Thấp | ⏳ Chưa bắt đầu | - |

### Gợi ý thứ tự triển khai
1. **Preview Mode** (dễ, tác động lớn) ✅
2. **Undo/Redo** (quan trọng cho UX) ✅
3. **Responsive Mode** (hữu ích cho mobile)
4. **Event System** (thêm logic) ✅
5. **Data Binding** (phức tạp nhất, cần nền tảng vững)

---

## 📝 Lưu ý

- Mỗi prompt có thể được copy và sử dụng trực tiếp
- Có thể điều chỉnh yêu cầu theo nhu cầu thực tế
- Nên test từng tính năng trước khi chuyển sang tính năng tiếp theo
- Có thể tách nhỏ các tính năng phức tạp thành nhiều bước

---

**Cập nhật lần cuối:** 11/27/2025

---

## 📈 Tiến độ chi tiết

### ✅ Đã hoàn thành (3/5 - 60%)
1. **Preview Mode** - Cho phép xem ứng dụng như người dùng cuối, ẩn tất cả công cụ chỉnh sửa
2. **Undo/Redo** - Hệ thống hoàn tác với history stack, keyboard shortcuts
3. **Event System** - Hệ thống sự kiện đầy đủ với 5 loại actions, UI quản lý events trong PropertiesPanel

### ⏳ Đang chờ (2/5 - 40%)
4. **Responsive Design Mode** - Chế độ xem và chỉnh sửa cho các kích thước màn hình khác nhau
5. **Data Binding** - Kết nối dữ liệu động với syntax `{{variable}}`

### 📝 Ghi chú
- Tất cả các tính năng đã hoàn thành đều đã được test và hoạt động ổn định
- Event System có file hướng dẫn chi tiết tại `docs/Event_System_Guide.md`
- Các tính năng còn lại sẽ được triển khai theo thứ tự ưu tiên
- PropertiesPanel đã được fix các lỗi liên quan đến event.config null/undefined

