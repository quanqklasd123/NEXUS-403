# CHƯƠNG 2: CƠ SỞ LÝ THUYẾT

## 2.1. Giới thiệu

Chương này trình bày các khái niệm, lý thuyết và công nghệ được sử dụng trong quá trình xây dựng hệ thống NEXUS-403. Các nội dung bao gồm: các khái niệm cơ bản về App Builder, khái niệm về kiến trúc multi-tenant (và khả năng mở rộng trong tương lai), các công nghệ frontend và backend, hệ thống cơ sở dữ liệu, các phương pháp xác thực và phân quyền, cùng với các mô hình và giải pháp kỹ thuật được áp dụng.

## 2.2. Các khái niệm cơ bản

### 2.2.1. App Builder và Low-Code/No-Code Platform

App Builder là một công cụ cho phép người dùng tạo ứng dụng mà không cần viết code. Khái niệm này thuộc về phạm trù Low-Code/No-Code (LCNC) - một xu hướng phát triển phần mềm hiện đại.

**Low-Code Platform** là nền tảng cho phép phát triển ứng dụng với ít code hơn so với phương pháp truyền thống. Người dùng có thể sử dụng giao diện trực quan, kéo-thả (drag-and-drop) để xây dựng ứng dụng, nhưng vẫn có thể tùy chỉnh bằng code khi cần thiết.

**No-Code Platform** là nền tảng cho phép tạo ứng dụng hoàn toàn không cần viết code. Người dùng chỉ cần sử dụng giao diện đồ họa và các công cụ trực quan.

Trong đồ án này, hệ thống NEXUS-403 được xây dựng theo hướng No-Code, cho phép người dùng tạo ứng dụng thông qua giao diện kéo-thả mà không cần kiến thức lập trình.

**Các thành phần chính của App Builder:**

1. **Toolbox (Hộp công cụ)**: Chứa các component có sẵn mà người dùng có thể kéo vào canvas. Các component được phân loại theo chức năng: Layout (Container, Row, Column), Display (Heading, Text, Image), Form (Input, Button, Checkbox, Select), Data (Table, List, Chart), và Control (Search, Filter, Sort).

2. **Canvas (Vùng thiết kế)**: Là vùng làm việc chính nơi người dùng kéo-thả và sắp xếp các component để tạo giao diện ứng dụng.

3. **Properties Panel (Bảng thuộc tính)**: Cho phép người dùng cấu hình các thuộc tính của từng component như kích thước, màu sắc, nội dung, hành vi.

4. **Preview Mode (Chế độ xem trước)**: Cho phép người dùng xem trước ứng dụng trước khi lưu và xuất bản.

**Ưu điểm của App Builder:**

- **Tăng tốc độ phát triển**: Người dùng có thể tạo ứng dụng nhanh chóng mà không cần viết code.
- **Giảm chi phí**: Không cần thuê lập trình viên chuyên nghiệp.
- **Dễ sử dụng**: Giao diện trực quan, thân thiện với người dùng không chuyên.
- **Tính linh hoạt**: Có thể tùy chỉnh và chỉnh sửa ứng dụng dễ dàng.

**Thách thức và giải pháp:**

- **Thách thức**: Cần quản lý state, xử lý sự kiện, và kết nối dữ liệu một cách trực quan.
- **Giải pháp**: Xây dựng hệ thống event handling và data binding tự động, cho phép người dùng kết nối các component thông qua giao diện.

### 2.2.2. Single Page Application (SPA)

Single Page Application (SPA) là một kiến trúc ứng dụng web trong đó toàn bộ ứng dụng được tải một lần duy nhất, và các tương tác tiếp theo được xử lý bằng JavaScript mà không cần tải lại trang.

**Đặc điểm của SPA:**

1. **Client-side Routing**: Điều hướng giữa các trang được xử lý ở phía client bằng JavaScript, không cần request mới đến server.

2. **Dynamic Content Loading**: Nội dung được tải động thông qua AJAX/API calls, chỉ cập nhật phần cần thiết của trang.

3. **State Management**: Quản lý trạng thái ứng dụng ở phía client, thường sử dụng các thư viện như Redux, Context API, hoặc MobX.

**Ưu điểm của SPA:**

- **Trải nghiệm người dùng tốt**: Không có hiện tượng "nhấp nháy" khi chuyển trang, tương tác mượt mà.
- **Giảm tải server**: Server chỉ cần cung cấp API, không cần render HTML.
- **Tách biệt frontend và backend**: Frontend và backend có thể phát triển độc lập.

**Nhược điểm và giải pháp:**

- **SEO kém**: Các công cụ tìm kiếm khó index nội dung động. Giải pháp: Sử dụng Server-Side Rendering (SSR) hoặc Static Site Generation (SSG) khi cần.

- **Thời gian tải ban đầu lâu**: Phải tải toàn bộ JavaScript. Giải pháp: Code splitting, lazy loading, và tối ưu bundle size.

Trong đồ án này, frontend được xây dựng bằng React.js - một framework phổ biến cho SPA, sử dụng React Router để xử lý client-side routing.

### 2.2.3. RESTful API

REST (Representational State Transfer) là một kiến trúc phần mềm cho việc thiết kế các ứng dụng web. RESTful API là API tuân theo các nguyên tắc của REST.

**Các nguyên tắc của REST:**

1. **Stateless**: Mỗi request phải chứa đầy đủ thông tin cần thiết, server không lưu trữ trạng thái của client.

2. **Resource-based**: Mọi thứ đều được coi là tài nguyên (resource), được định danh bằng URI.

3. **HTTP Methods**: Sử dụng các phương thức HTTP chuẩn:
   - GET: Lấy dữ liệu
   - POST: Tạo mới
   - PUT: Cập nhật toàn bộ
   - PATCH: Cập nhật một phần
   - DELETE: Xóa

4. **Representation**: Dữ liệu được truyền dưới dạng JSON, XML, hoặc các format khác.

**Cấu trúc URL trong RESTful API:**

```
GET    /api/projects          # Lấy danh sách projects
GET    /api/projects/{id}     # Lấy project theo ID
POST   /api/projects          # Tạo project mới
PUT    /api/projects/{id}     # Cập nhật project
DELETE /api/projects/{id}     # Xóa project
```

**Ưu điểm của RESTful API:**

- **Đơn giản và dễ hiểu**: Sử dụng các phương thức HTTP chuẩn.
- **Tách biệt client và server**: Client và server có thể phát triển độc lập.
- **Khả năng mở rộng**: Dễ dàng thêm các endpoint mới.
- **Cacheable**: Có thể cache các response để tăng hiệu năng.

Trong đồ án này, backend được xây dựng theo kiến trúc RESTful API, sử dụng ASP.NET Core để xử lý các HTTP requests và trả về dữ liệu dưới dạng JSON.

### 2.2.4. Multi-Tenant Architecture

Multi-tenant architecture là kiến trúc phần mềm cho phép một instance ứng dụng phục vụ nhiều khách hàng (tenants) khác nhau, mỗi tenant có dữ liệu và cấu hình riêng biệt. Đây là một kiến trúc quan trọng trong các ứng dụng SaaS (Software as a Service) hiện đại.

**Các mô hình Multi-Tenant:**

1. **Shared Database, Shared Schema**: Tất cả tenants chia sẻ cùng một database và schema. Dữ liệu được phân biệt bằng `TenantId` trong mỗi bảng/collection. Đây là mô hình phổ biến nhất vì tiết kiệm tài nguyên và dễ quản lý.

2. **Shared Database, Separate Schema**: Tất cả tenants chia sẻ database nhưng mỗi tenant có schema riêng. Mô hình này cung cấp mức độ tách biệt cao hơn nhưng phức tạp hơn trong quản lý.

3. **Separate Database**: Mỗi tenant có database riêng biệt. Mô hình này đảm bảo tách biệt dữ liệu hoàn toàn nhưng tốn kém và khó quản lý khi số lượng tenants tăng.

**Ưu điểm của Multi-Tenant Architecture:**

- **Tiết kiệm chi phí**: Chia sẻ tài nguyên giữa các tenants, giảm chi phí vận hành.
- **Dễ bảo trì**: Chỉ cần bảo trì một instance ứng dụng, cập nhật một lần áp dụng cho tất cả tenants.
- **Khả năng mở rộng**: Dễ dàng thêm tenants mới mà không cần thay đổi cấu trúc hệ thống.
- **Tập trung quản lý**: Quản lý tất cả tenants từ một nơi, dễ dàng theo dõi và phân tích.

**Thách thức và giải pháp:**

- **Data Isolation**: Đảm bảo dữ liệu của các tenants không bị lẫn lộn là yêu cầu quan trọng nhất. Giải pháp: Luôn filter theo `TenantId` trong mọi query, sử dụng middleware để tự động thêm filter này.

- **Performance**: Khi số lượng tenants tăng, cần tối ưu database để đảm bảo hiệu năng. Giải pháp: Tạo indexes cho `TenantId`, sử dụng connection pooling, và cache dữ liệu thường dùng.

- **Customization**: Mỗi tenant có thể cần cấu hình riêng (theme, tính năng, giới hạn). Giải pháp: Lưu trữ cấu hình trong database hoặc metadata, sử dụng feature flags.

- **Security**: Đảm bảo không có tenant nào có thể truy cập dữ liệu của tenant khác. Giải pháp: Kiểm tra quyền truy cập ở nhiều lớp (middleware, controller, database).

**Trong đồ án này:**

Hiện tại, hệ thống NEXUS-403 chưa triển khai multi-tenant architecture. Hệ thống đang sử dụng mô hình single-tenant với user isolation, trong đó mỗi user chỉ có thể truy cập và quản lý dữ liệu của chính mình thông qua trường `AppUserId` trong các collections MongoDB.

Tuy nhiên, kiến trúc hiện tại đã được thiết kế với khả năng mở rộng để hỗ trợ multi-tenant trong tương lai. Khi cần thiết, có thể nâng cấp hệ thống lên mô hình **Shared Database, Shared Schema với TenantId** bằng cách:

1. Thêm trường `TenantId` vào các models và collections hiện có.
2. Tạo collection `tenants` để quản lý thông tin các tổ chức/doanh nghiệp.
3. Cập nhật các controllers để filter theo `TenantId` thay vì chỉ `AppUserId`.
4. Thêm middleware để tự động xác định tenant từ request (qua subdomain, header, hoặc user context).
5. Tạo indexes cho `TenantId` để tối ưu hiệu năng query.

Việc sử dụng MongoDB với schema linh hoạt và kiến trúc hiện tại sẽ giúp việc migration sang multi-tenant trở nên dễ dàng hơn so với các hệ thống sử dụng relational database với schema cố định.

### 2.2.5. Component-Based Architecture

Component-Based Architecture là kiến trúc phần mềm trong đó ứng dụng được xây dựng từ các component độc lập, có thể tái sử dụng.

**Đặc điểm của Component-Based Architecture:**

1. **Reusability**: Các component có thể được sử dụng lại ở nhiều nơi.

2. **Modularity**: Mỗi component là một module độc lập, có thể phát triển và test riêng.

3. **Encapsulation**: Mỗi component đóng gói logic và UI của nó.

4. **Composition**: Các component nhỏ có thể kết hợp thành component lớn hơn.

**Component trong React:**

React sử dụng component-based architecture. Mỗi component là một function hoặc class trả về JSX (JavaScript XML) để mô tả UI.

```javascript
// Ví dụ component trong React
function Button({ label, onClick }) {
  return (
    <button onClick={onClick} className="btn-primary">
      {label}
    </button>
  );
}
```

**Ưu điểm:**

- **Dễ bảo trì**: Thay đổi một component không ảnh hưởng đến các component khác.
- **Tái sử dụng**: Có thể sử dụng lại component ở nhiều nơi.
- **Test dễ dàng**: Có thể test từng component độc lập.

Trong đồ án này, cả frontend (React) và App Builder đều sử dụng component-based architecture. Các component trong App Builder được thiết kế để người dùng có thể kéo-thả và kết hợp chúng để tạo ứng dụng.

## 2.3. Công nghệ Frontend

### 2.3.1. React.js

React.js là một thư viện JavaScript mã nguồn mở được phát triển bởi Facebook (Meta) để xây dựng giao diện người dùng, đặc biệt là các ứng dụng web single-page.

**Đặc điểm chính của React:**

1. **Virtual DOM**: React sử dụng Virtual DOM - một bản sao của DOM thật trong bộ nhớ. Khi state thay đổi, React so sánh Virtual DOM với DOM thật và chỉ cập nhật những phần thay đổi (diffing algorithm), giúp tăng hiệu năng.

2. **Component-Based**: Ứng dụng được xây dựng từ các component có thể tái sử dụng.

3. **Unidirectional Data Flow**: Dữ liệu chỉ chảy một chiều từ parent component xuống child component thông qua props.

4. **JSX (JavaScript XML)**: Cú pháp mở rộng cho phép viết HTML-like code trong JavaScript.

**React Hooks:**

React Hooks là các function cho phép sử dụng state và lifecycle methods trong functional components.

- **useState**: Quản lý state trong functional component.
- **useEffect**: Thực hiện side effects (API calls, subscriptions) sau khi render.
- **useContext**: Truy cập context để chia sẻ data giữa các component.
- **useReducer**: Quản lý state phức tạp với reducer pattern.

**Ví dụ sử dụng React Hooks:**

```javascript
import { useState, useEffect } from 'react';

function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from API
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  );
}
```

**Lý do chọn React:**

- **Phổ biến và cộng đồng lớn**: Nhiều tài liệu, thư viện, và hỗ trợ.
- **Hiệu năng tốt**: Virtual DOM giúp ứng dụng chạy nhanh.
- **Ecosystem phong phú**: Nhiều thư viện hỗ trợ như React Router, React Query.
- **Dễ học**: Cú pháp đơn giản, dễ hiểu.

Trong đồ án này, React.js phiên bản 18.x được sử dụng để xây dựng toàn bộ giao diện frontend, bao gồm các trang Dashboard, App Builder, My App, và Marketplace.

### 2.3.2. Vite

Vite là một build tool và dev server hiện đại cho các ứng dụng web frontend, được phát triển bởi Evan You (tác giả của Vue.js).

**Đặc điểm của Vite:**

1. **Fast HMR (Hot Module Replacement)**: Cập nhật code thay đổi ngay lập tức mà không cần reload trang, giữ nguyên state của ứng dụng.

2. **Fast Build**: Sử dụng ES modules native và Rollup để build, nhanh hơn nhiều so với Webpack.

3. **Optimized Production Build**: Tự động code splitting, tree shaking, và minification.

4. **Plugin System**: Hỗ trợ nhiều plugin cho React, Vue, TypeScript, v.v.

**So sánh Vite với Webpack:**

| Đặc điểm | Vite | Webpack |
|----------|------|---------|
| Dev Server | Sử dụng ES modules native | Bundle toàn bộ trước |
| HMR Speed | Rất nhanh | Chậm hơn với project lớn |
| Build Time | Nhanh | Chậm hơn |
| Configuration | Đơn giản | Phức tạp |

**Cấu hình Vite cơ bản:**

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5205',
        changeOrigin: true
      }
    }
  }
});
```

*Nguồn: todo-frontend/vite.config.js, dòng 1-8 (đã thêm proxy config để minh họa)*

**Lý do chọn Vite:**

- **Tốc độ phát triển nhanh**: HMR nhanh, giúp tăng năng suất làm việc.
- **Cấu hình đơn giản**: Ít cấu hình hơn so với Webpack.
- **Hiện đại**: Sử dụng các công nghệ mới nhất (ES modules, native ESM).

Trong đồ án này, Vite được sử dụng làm build tool và dev server cho frontend React, giúp tăng tốc độ phát triển và build ứng dụng.

### 2.3.3. TailwindCSS

TailwindCSS là một utility-first CSS framework, cung cấp các class CSS có sẵn để xây dựng giao diện nhanh chóng.

**Đặc điểm của TailwindCSS:**

1. **Utility-First**: Thay vì viết CSS tùy chỉnh, sử dụng các utility class có sẵn như `flex`, `pt-4`, `text-center`.

2. **Responsive Design**: Hỗ trợ responsive với các breakpoint: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`.

3. **Customizable**: Có thể tùy chỉnh theme, colors, spacing trong file `tailwind.config.js`.

4. **PurgeCSS**: Tự động loại bỏ CSS không sử dụng trong production build, giúp giảm kích thước file CSS.

**Ví dụ sử dụng TailwindCSS:**

```html
<!-- Thay vì viết CSS riêng -->
<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
  <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Create
  </button>
</div>
```

**So sánh với CSS truyền thống:**

```css
/* CSS truyền thống */
.dashboard-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
```

**Ưu điểm của TailwindCSS:**

- **Tốc độ phát triển nhanh**: Không cần viết CSS riêng, chỉ cần thêm class.
- **Consistency**: Đảm bảo design nhất quán với spacing và colors được định nghĩa sẵn.
- **Responsive dễ dàng**: Chỉ cần thêm prefix như `md:`, `lg:`.
- **Kích thước nhỏ**: PurgeCSS loại bỏ CSS không dùng, file CSS cuối cùng rất nhỏ.

**Nhược điểm và giải pháp:**

- **HTML dài dòng**: Nhiều class trong HTML. Giải pháp: Sử dụng `@apply` directive hoặc component trong React.
- **Học curve**: Cần nhớ các class. Giải pháp: Sử dụng IntelliSense và documentation.

Trong đồ án này, TailwindCSS được sử dụng để styling toàn bộ giao diện, đảm bảo responsive và design nhất quán.

### 2.3.4. React Router

React Router là thư viện routing chính thức cho React, cho phép xây dựng Single Page Application với client-side routing.

**Các thành phần chính:**

1. **BrowserRouter**: Sử dụng HTML5 History API để quản lý URL.

2. **Routes và Route**: Định nghĩa các route và component tương ứng.

3. **Link và NavLink**: Component để điều hướng giữa các trang.

4. **useNavigate**: Hook để điều hướng programmatically.

5. **useParams**: Hook để lấy parameters từ URL.

**Ví dụ sử dụng React Router:**

```javascript
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/builder">App Builder</Link>
      </nav>
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/builder/:projectId" element={<AppBuilderPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**Protected Routes:**

Để bảo vệ các route cần authentication, có thể tạo ProtectedRoute component:

```javascript
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
}

// Sử dụng
<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />
```

**Lý do chọn React Router:**

- **Chính thức**: Là thư viện routing chính thức cho React.
- **Dễ sử dụng**: API đơn giản, dễ hiểu.
- **Tính năng đầy đủ**: Hỗ trợ nested routes, route guards, lazy loading.

Trong đồ án này, React Router phiên bản 6.x được sử dụng để quản lý routing, bao gồm các trang: Login, Register, Dashboard, App Builder, My App, Marketplace, và App Runtime.

### 2.3.5. Axios

Axios là một HTTP client dựa trên Promise cho JavaScript, có thể chạy trong browser và Node.js.

**Đặc điểm của Axios:**

1. **Promise-based**: Sử dụng Promise, dễ dàng sử dụng async/await.

2. **Request/Response Interceptors**: Cho phép intercept requests và responses để thêm headers, xử lý errors.

3. **Automatic JSON transformation**: Tự động parse JSON response.

4. **Request cancellation**: Hỗ trợ hủy request.

**Ví dụ sử dụng Axios:**

```javascript
import axios from 'axios';

// Tạo instance với base URL và default config
const apiClient = axios.create({
  baseURL: 'http://localhost:5205/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor để thêm token vào mọi request
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor để xử lý errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token hết hạn, redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Sử dụng
const projects = await apiClient.get('/projects');
const newProject = await apiClient.post('/projects', { name: 'My Project' });
```

*Nguồn: todo-frontend/src/services/apiService.js, dòng 1-65 (đã rút gọn để minh họa)*

**So sánh với Fetch API:**

| Đặc điểm | Axios | Fetch |
|----------|-------|-------|
| Browser Support | Cần polyfill cho IE | Native (trừ IE) |
| JSON transformation | Tự động | Cần gọi .json() |
| Request timeout | Hỗ trợ sẵn | Cần tự implement |
| Interceptors | Có sẵn | Không có |
| Request cancellation | Hỗ trợ | Cần AbortController |

**Lý do chọn Axios:**

- **API dễ sử dụng**: Đơn giản hơn Fetch API.
- **Interceptors**: Dễ dàng thêm token, xử lý errors globally.
- **Error handling**: Tốt hơn Fetch API.

Trong đồ án này, Axios được sử dụng để gọi API từ frontend đến backend, với interceptors để tự động thêm JWT token và xử lý errors.

## 2.4. Công nghệ Backend

### 2.4.1. ASP.NET Core

ASP.NET Core là một framework mã nguồn mở, đa nền tảng để xây dựng các ứng dụng web hiện đại, được phát triển bởi Microsoft.

**Đặc điểm của ASP.NET Core:**

1. **Cross-platform**: Chạy trên Windows, Linux, và macOS.

2. **High Performance**: Hiệu năng cao, được tối ưu cho cloud và container.

3. **Dependency Injection**: Hỗ trợ built-in Dependency Injection container.

4. **Middleware Pipeline**: Xử lý requests qua pipeline của các middleware.

5. **Configuration**: Hỗ trợ nhiều nguồn cấu hình (appsettings.json, environment variables, command line).

**Kiến trúc MVC trong ASP.NET Core:**

- **Model**: Đại diện cho dữ liệu và business logic.
- **View**: Đại diện cho giao diện người dùng (trong API thì không có View, chỉ trả về JSON).
- **Controller**: Xử lý requests, gọi business logic, và trả về responses.

**Ví dụ Controller trong ASP.NET Core:**

```csharp
[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly MongoDbContext _mongoContext;
    
    public ProjectsController(MongoDbContext mongoContext)
    {
        _mongoContext = mongoContext;
    }
    
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<ProjectDTO>>> GetProjects()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var filter = Builders<Project>.Filter.Eq(p => p.AppUserId, userId);
        var projects = await _mongoContext.Projects
            .Find(filter)
            .ToListAsync();
        return Ok(projects);
    }
    
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ProjectDTO>> CreateProject(CreateProjectDTO dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var project = new Project
        {
            Name = dto.Name,
            Description = dto.Description,
            AppUserId = userId,
            CreatedAt = DateTime.UtcNow
        };
        await _mongoContext.Projects.InsertOneAsync(project);
        return Ok(project);
    }
}
```

*Nguồn: TodoApi/Controllers/ProjectsController.cs, dòng 15-185 (đã rút gọn để minh họa)*

**Dependency Injection:**

ASP.NET Core có built-in DI container. Các services được đăng ký trong `Program.cs`:

```csharp
// Đăng ký service
builder.Services.AddScoped<MongoDbContext>();
builder.Services.AddScoped<IProjectService, ProjectService>();

// Sử dụng trong Controller
public ProjectsController(MongoDbContext mongoContext, IProjectService projectService)
{
    _mongoContext = mongoContext;
    _projectService = projectService;
}
```

*Nguồn: TodoApi/Program.cs, dòng 74-78 và TodoApi/Controllers/ProjectsController.cs, dòng 20-24*

**Middleware Pipeline:**

Requests đi qua pipeline của các middleware theo thứ tự:

```csharp
app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

*Nguồn: TodoApi/Program.cs, dòng 233-248*

**Lý do chọn ASP.NET Core:**

- **Hiệu năng cao**: Nhanh hơn nhiều framework khác.
- **Type-safe**: Sử dụng C# - ngôn ngữ type-safe, giảm lỗi runtime.
- **Ecosystem phong phú**: Nhiều thư viện và tools.
- **Cross-platform**: Có thể deploy trên nhiều platform.

Trong đồ án này, ASP.NET Core 9.0 được sử dụng để xây dựng RESTful API backend, xử lý authentication, authorization, và business logic.

### 2.4.2. Entity Framework Core

Entity Framework Core (EF Core) là một ORM (Object-Relational Mapping) framework cho .NET, cho phép làm việc với database bằng cách sử dụng .NET objects thay vì SQL queries trực tiếp.

**Đặc điểm của EF Core:**

1. **Code-First**: Tạo database từ C# models.

2. **Database-First**: Tạo models từ database có sẵn.

3. **Migrations**: Quản lý thay đổi schema database.

4. **LINQ**: Sử dụng LINQ để query database.

**Ví dụ sử dụng EF Core:**

```csharp
// Model
public class User
{
    public int Id { get; set; }
    public string Email { get; set; }
    public string UserName { get; set; }
}

// DbContext
public class ApplicationDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseSqlServer(connectionString);
    }
}

// Sử dụng
var users = await _context.Users
    .Where(u => u.Email.Contains("@gmail.com"))
    .ToListAsync();
```

**Migrations:**

```bash
# Tạo migration
dotnet ef migrations add InitialCreate

# Apply migration
dotnet ef database update
```

**Lý do sử dụng EF Core:**

- **Type-safe queries**: Sử dụng LINQ, type-safe, có IntelliSense.
- **Migrations**: Quản lý schema changes dễ dàng.
- **Abstraction**: Không cần viết SQL trực tiếp.

**Trong đồ án này:**

Đồ án NEXUS-403 không sử dụng Entity Framework Core. Thay vào đó, hệ thống sử dụng MongoDB.Driver để làm việc trực tiếp với MongoDB cho tất cả dữ liệu, bao gồm cả Identity (Users, Roles). Việc sử dụng MongoDB cho phép hệ thống có schema linh hoạt, phù hợp với yêu cầu của App Builder nơi cấu trúc components có thể thay đổi.

### 2.4.3. MongoDB.Driver

MongoDB.Driver là driver chính thức của MongoDB cho .NET, cho phép kết nối và thao tác với MongoDB từ C#.

**Đặc điểm của MongoDB:**

1. **NoSQL Document Database**: Lưu trữ dữ liệu dưới dạng documents (JSON-like BSON).

2. **Schema-less**: Không cần định nghĩa schema trước, linh hoạt.

3. **Scalable**: Dễ dàng scale horizontally với sharding.

4. **Flexible**: Dễ dàng thay đổi structure của documents.

**Ví dụ sử dụng MongoDB.Driver:**

```csharp
// Model
public class Project
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }
    
    [BsonElement("name")]
    public string Name { get; set; }
    
    [BsonElement("appUserId")]
    public string AppUserId { get; set; }
}

// MongoDbContext
public class MongoDbContext
{
    private readonly IMongoDatabase _database;
    
    public MongoDbContext(IMongoClient client, string databaseName)
    {
        _database = client.GetDatabase(databaseName);
    }
    
    public IMongoCollection<Project> Projects => 
        _database.GetCollection<Project>("projects");
}

// Sử dụng
var filter = Builders<Project>.Filter.Eq(p => p.AppUserId, userId);
var projects = await _mongoContext.Projects
    .Find(filter)
    .SortByDescending(p => p.CreatedAt)
    .ToListAsync();
```

*Nguồn: TodoApi/Data/MongoDbContext.cs, dòng 6-38 và TodoApi/Controllers/ProjectsController.cs, dòng 48-54*

**Query Operations:**

```csharp
// Find one
var project = await _mongoContext.Projects
    .Find(p => p.Id == projectId)
    .FirstOrDefaultAsync();

// Insert
await _mongoContext.Projects.InsertOneAsync(project);

// Update
var update = Builders<Project>.Update
    .Set(p => p.Name, newName)
    .Set(p => p.UpdatedAt, DateTime.UtcNow);
await _mongoContext.Projects.UpdateOneAsync(
    filter, update);

// Delete
await _mongoContext.Projects.DeleteOneAsync(p => p.Id == projectId);
```

**Aggregation Pipeline:**

```csharp
var pipeline = new BsonDocument[]
{
    new BsonDocument("$match", new BsonDocument("appUserId", userId)),
    new BsonDocument("$group", new BsonDocument
    {
        { "_id", "$category" },
        { "count", new BsonDocument("$sum", 1) }
    })
};
var results = await _mongoContext.Projects
    .Aggregate<BsonDocument>(pipeline)
    .ToListAsync();
```

**Lý do chọn MongoDB:**

- **Linh hoạt**: Schema-less, dễ thay đổi structure.
- **Hiệu năng**: Tốt cho read-heavy workloads.
- **Scalable**: Dễ scale với sharding.
- **Cloud**: MongoDB Atlas cung cấp managed MongoDB trên cloud.

Trong đồ án này, MongoDB.Driver được sử dụng để kết nối với MongoDB Atlas (cloud database) để lưu trữ toàn bộ dữ liệu của hệ thống, bao gồm: Identity data (Users, Roles), Business data (Projects, TodoLists, TodoItems, UserApps), và Marketplace data (Categories).

### 2.4.4. ASP.NET Identity

ASP.NET Identity là hệ thống quản lý người dùng và xác thực được tích hợp sẵn trong ASP.NET Core.

**Đặc điểm của ASP.NET Identity:**

1. **User Management**: Quản lý users, passwords, roles, claims.

2. **Password Hashing**: Tự động hash passwords sử dụng PBKDF2.

3. **Role-Based Authorization**: Hỗ trợ roles và role-based access control.

4. **Claims-Based Authorization**: Hỗ trợ claims-based authorization.

5. **External Authentication**: Hỗ trợ OAuth providers (Google, Facebook, etc.).

**Cấu hình ASP.NET Identity:**

```csharp
// Đăng ký Identity với MongoDB
builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
})
.AddDefaultTokenProviders();

// Đăng ký custom MongoDB stores thay vì EntityFrameworkStores
builder.Services.AddScoped<IUserStore<AppUser>>(sp =>
{
    var mongoContext = sp.GetRequiredService<MongoDbContext>();
    return new MongoUserStore(mongoContext.Database);
});

builder.Services.AddScoped<IRoleStore<IdentityRole>>(sp =>
{
    var mongoContext = sp.GetRequiredService<MongoDbContext>();
    return new MongoRoleStore(mongoContext.Database);
});
```

*Nguồn: TodoApi/Program.cs, dòng 115-129*

**User Management:**

```csharp
// Tạo user
var user = new AppUser { UserName = "john@example.com", Email = "john@example.com" };
var result = await _userManager.CreateAsync(user, "Password123!");

// Đăng nhập
var result = await _signInManager.PasswordSignInAsync(
    userName, password, isPersistent: false, lockoutOnFailure: true);

// Gán role
await _userManager.AddToRoleAsync(user, "Admin");
```

**Custom User Store:**

Trong đồ án này, hệ thống sử dụng MongoDB cho Identity thay vì SQL Server (mặc định của ASP.NET Identity). Do đó, cần tạo custom User Store và Role Store để tích hợp ASP.NET Identity với MongoDB:

```csharp
public class MongoUserStore : IUserStore<AppUser>, IUserPasswordStore<AppUser>
{
    private readonly IMongoCollection<AppUser> _users;
    
    public MongoUserStore(IMongoDatabase database)
    {
        _users = database.GetCollection<AppUser>("users");
    }
    
    public async Task<IdentityResult> CreateAsync(AppUser user, CancellationToken cancellationToken)
    {
        await _users.InsertOneAsync(user, cancellationToken: cancellationToken);
        return IdentityResult.Success;
    }
    
    // Implement các interface methods khác...
}
```

*Nguồn: TodoApi/Data/MongoIdentity/MongoUserStore.cs (đã rút gọn để minh họa)*

**Lý do sử dụng ASP.NET Identity:**

- **Tích hợp sẵn**: Có sẵn trong ASP.NET Core.
- **Bảo mật**: Password hashing, lockout, 2FA.
- **Flexible**: Có thể customize và extend.

Trong đồ án này, ASP.NET Identity được sử dụng với custom MongoDB stores để quản lý users và roles.

### 2.4.5. AutoMapper

AutoMapper là một thư viện object-object mapping cho .NET, cho phép map giữa các objects khác nhau một cách tự động.

**Vấn đề AutoMapper giải quyết:**

Khi làm việc với API, thường cần chuyển đổi giữa:
- **Entity/Model**: Objects từ database.
- **DTO (Data Transfer Object)**: Objects để truyền qua API.

Thay vì viết code map thủ công:

```csharp
// Manual mapping
var dto = new ProjectDTO
{
    Id = project.Id,
    Name = project.Name,
    Description = project.Description,
    CreatedAt = project.CreatedAt
    // ... nhiều properties khác
};
```

AutoMapper tự động map dựa trên tên properties:

```csharp
// Cấu hình AutoMapper
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Project, ProjectDTO>();
        CreateMap<CreateProjectDTO, Project>();
        CreateMap<UpdateProjectDTO, Project>();
    }
}

// Sử dụng
var dto = _mapper.Map<ProjectDTO>(project);
var project = _mapper.Map<Project>(createDto);
```

**Custom Mapping:**

Khi cần map phức tạp hơn:

```csharp
CreateMap<Project, ProjectDTO>()
    .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.UserName))
    .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.IsPublished ? "Published" : "Draft"));
```

**Lý do sử dụng AutoMapper:**

- **Giảm boilerplate code**: Không cần viết code map thủ công.
- **Dễ maintain**: Thay đổi mapping ở một nơi.
- **Type-safe**: Compile-time checking.

Trong đồ án này, AutoMapper được sử dụng để map giữa Models và DTOs trong các Controllers.

## 2.5. Hệ thống cơ sở dữ liệu

### 2.5.1. MongoDB Atlas

MongoDB Atlas là dịch vụ MongoDB được quản lý trên cloud, cung cấp bởi MongoDB Inc.

**Đặc điểm của MongoDB:**

1. **Document Database**: Lưu trữ dữ liệu dưới dạng documents (BSON - Binary JSON).

2. **Schema-less**: Không cần định nghĩa schema trước, linh hoạt.

3. **Horizontal Scaling**: Dễ dàng scale bằng cách thêm shards.

4. **Rich Query Language**: Hỗ trợ query phức tạp với aggregation pipeline.

**Cấu trúc Document trong MongoDB:**

```javascript
// Collection: projects
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "My Project",
  description: "Project description",
  appUserId: "user123",
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  components: [
    {
      type: "Heading",
      props: { text: "Hello", level: 1 }
    },
    {
      type: "Button",
      props: { label: "Click Me", onClick: "handleClick" }
    }
  ]
}
```

**Indexes trong MongoDB:**

```csharp
// Tạo index để tăng tốc query
var indexKeys = Builders<Project>.IndexKeys
    .Ascending(p => p.AppUserId);
var indexOptions = new CreateIndexOptions { Name = "AppUserId_Index" };
await _mongoContext.Projects.Indexes.CreateOneAsync(
    new CreateIndexModel<Project>(indexKeys, indexOptions)
);
```

**Lý do sử dụng MongoDB Atlas:**

- **Cloud Managed**: Không cần tự quản lý database server.
- **Scalable**: Dễ dàng scale khi cần.
- **Flexible Schema**: Dễ dàng thay đổi structure, phù hợp cho App Builder (components có structure khác nhau).
- **Cost-effective**: Chỉ trả tiền cho những gì sử dụng.

Trong đồ án này, MongoDB Atlas được sử dụng để lưu trữ toàn bộ dữ liệu của hệ thống, bao gồm:

- **Identity data**: Users và Roles (thông qua custom MongoDB stores cho ASP.NET Identity)
- **Business data**: Projects (với components), TodoLists, TodoItems, UserApps
- **Marketplace data**: Categories và published apps

Việc sử dụng MongoDB cho tất cả dữ liệu giúp hệ thống đơn giản hóa kiến trúc, giảm số lượng database connections cần quản lý, và tận dụng được tính linh hoạt của schema-less database cho App Builder.

### 2.5.2. Kiến trúc Database MongoDB

Hệ thống sử dụng kiến trúc database đơn giản với MongoDB Atlas làm database duy nhất cho toàn bộ hệ thống.

**Cấu trúc Collections trong MongoDB:**

1. **Identity Collections**:
   - `users`: Lưu trữ thông tin người dùng (AppUser)
   - `roles`: Lưu trữ các vai trò (IdentityRole)

2. **Business Collections**:
   - `projects`: Lưu trữ các dự án App Builder
   - `todoLists`: Lưu trữ danh sách công việc
   - `todoItems`: Lưu trữ các mục công việc
   - `userApps`: Lưu trữ các ứng dụng đã tạo hoặc tải về

3. **Marketplace Collections**:
   - `categories`: Lưu trữ danh mục ứng dụng

**Sơ đồ kiến trúc:**

Hệ thống được tổ chức theo kiến trúc Client-Server với các thành phần sau:

- Frontend (React/Vite): Giao diện người dùng, xử lý UI/UX và client-side routing
- Backend (ASP.NET Core): Xử lý business logic và API endpoints
  - Identity (Authentication): Kết nối với MongoDB Atlas để quản lý Users và Roles thông qua custom stores
  - Business Logic: Kết nối với MongoDB Atlas để quản lý Projects, TodoLists, TodoItems, UserApps

Luồng dữ liệu: Frontend gửi HTTP/API requests đến Backend, Backend xử lý và truy vấn từ MongoDB Atlas cho tất cả các loại dữ liệu.

**Quan hệ giữa các collections:**

- **AppUserId** trong các business collections (projects, todoLists, etc.) là **string ID** từ collection `users`.
- Tất cả dữ liệu đều được lưu trong cùng một database MongoDB, giúp dễ dàng query và join dữ liệu khi cần.

**Ưu điểm của kiến trúc này:**

- **Đơn giản**: Chỉ cần quản lý một database connection, giảm độ phức tạp.
- **Linh hoạt**: Schema-less cho phép thay đổi cấu trúc dữ liệu dễ dàng, phù hợp cho App Builder.
- **Hiệu năng**: Không cần join giữa các database khác nhau, query nhanh hơn.
- **Scalability**: MongoDB Atlas dễ dàng scale horizontally khi cần.
- **Cost-effective**: Chỉ cần trả tiền cho một database service.

**Thách thức và giải pháp:**

- **Thách thức**: MongoDB không có ACID transactions như SQL Server cho các operations phức tạp.
- **Giải pháp**: Sử dụng MongoDB transactions khi cần (MongoDB 4.0+ hỗ trợ multi-document transactions), và thiết kế schema để giảm thiểu nhu cầu transactions.

## 2.6. Xác thực và phân quyền

### 2.6.1. JWT (JSON Web Token)

JWT là một chuẩn mở (RFC 7519) để truyền thông tin an toàn giữa các parties dưới dạng JSON object.

**Cấu trúc của JWT:**

JWT gồm 3 phần, được phân tách bởi dấu chấm (.):

```
header.payload.signature
```

1. **Header**: Chứa metadata về token (algorithm, type).

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

2. **Payload**: Chứa claims (thông tin về user).

```json
{
  "sub": "user123",
  "email": "user@example.com",
  "role": "User",
  "exp": 1234567890
}
```

3. **Signature**: Được tạo bằng cách encode header và payload, sau đó sign bằng secret key.

**Quy trình xác thực với JWT:**

1. User đăng nhập với username/password.
2. Server xác thực và tạo JWT token chứa user information.
3. Server trả về token cho client.
4. Client lưu token (thường trong localStorage) và gửi kèm trong mọi request tiếp theo (trong header `Authorization: Bearer <token>`).
5. Server verify token và xác thực user.

**Tạo JWT Token trong ASP.NET Core:**

```csharp
private async Task<string> GenerateJwtToken(AppUser user)
{
    var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Name, user.UserName)
    };
    
    // Thêm roles vào claims
    var roles = await _userManager.GetRolesAsync(user);
    foreach (var role in roles)
    {
        claims.Add(new Claim(ClaimTypes.Role, role));
    }
    
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtConfig:Secret"]));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    
    var token = new JwtSecurityToken(
        issuer: _configuration["JwtConfig:Issuer"],
        audience: _configuration["JwtConfig:Audience"],
        claims: claims,
        expires: DateTime.UtcNow.AddHours(24),
        signingCredentials: creds
    );
    
    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

*Nguồn: TodoApi/Controllers/AuthController.cs, dòng 299-344*

**Verify JWT Token:**

```csharp
// Cấu hình trong Program.cs
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidIssuer = configuration["JwtConfig:Issuer"],
        ValidAudience = configuration["JwtConfig:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(configuration["JwtConfig:Secret"]))
    };
});
```

*Nguồn: TodoApi/Program.cs, dòng 132-153*

**Ưu điểm của JWT:**

- **Stateless**: Server không cần lưu session, giảm memory usage.
- **Scalable**: Dễ dàng scale vì không cần share session store.
- **Cross-domain**: Có thể sử dụng cho microservices, mobile apps.

**Nhược điểm và giải pháp:**

- **Không thể revoke**: Một khi token được tạo, không thể revoke cho đến khi hết hạn. Giải pháp: Sử dụng refresh tokens, hoặc blacklist tokens.
- **Security**: Nếu token bị lộ, attacker có thể sử dụng. Giải pháp: Sử dụng HTTPS, set expiration time ngắn, sử dụng refresh tokens.

Trong đồ án này, JWT được sử dụng để xác thực users. Token được tạo khi đăng nhập và được gửi kèm trong mọi API request.

### 2.6.2. OAuth 2.0 và Google OAuth

OAuth 2.0 là một framework authorization cho phép ứng dụng truy cập tài nguyên của user mà không cần biết password.

**OAuth 2.0 Flow (Authorization Code Flow):**

1. User click "Login with Google".
2. App redirect user đến Google authorization server.
3. User đăng nhập và authorize app.
4. Google redirect về app với authorization code.
5. App đổi authorization code lấy access token.
6. App sử dụng access token để lấy user information.
7. App tạo account hoặc đăng nhập user.

**Google OAuth Integration:**

```csharp
// Frontend: Load Google Sign-In library
<script src="https://accounts.google.com/gsi/client" async defer></script>

// JavaScript: Initialize Google Sign-In
window.onload = function () {
    google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID',
        callback: handleCredentialResponse
    });
    
    google.accounts.id.renderButton(
        document.getElementById("google-signin-button"),
        { theme: "outline", size: "large" }
    );
};

function handleCredentialResponse(response) {
    // Gửi credential token đến backend
    fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
    })
    .then(res => res.json())
    .then(data => {
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard';
    });
}
```

```csharp
// Backend: Verify Google token
[HttpPost("google-login")]
public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
{
    // Verify Google token
    var payload = await VerifyGoogleToken(request.Credential);
    if (payload == null)
        return Unauthorized();
    
    // Tìm hoặc tạo user
    var user = await _userManager.FindByEmailAsync(payload.Email);
    if (user == null)
    {
        // Tạo user mới
        user = new AppUser
        {
            Email = payload.Email,
            UserName = payload.Email,
            EmailConfirmed = true
        };
        await _userManager.CreateAsync(user);
        await _userManager.AddToRoleAsync(user, "User");
    }
    
    // Tạo JWT token
    var token = await GenerateJwtToken(user);
    return Ok(new { token });
}

private async Task<GoogleJsonWebSignature.Payload> VerifyGoogleToken(string credential)
{
    try
    {
        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = new[] { _configuration["Google:ClientId"] }
        };
        return await GoogleJsonWebSignature.ValidateAsync(credential, settings);
    }
    catch
    {
        return null;
    }
}
```

*Nguồn: TodoApi/Controllers/AuthController.cs, dòng 136-265 (đã rút gọn để minh họa)*

**Lý do sử dụng Google OAuth:**

- **User Experience**: User không cần tạo account mới, chỉ cần click một nút.
- **Security**: Google xử lý authentication, giảm rủi ro về password.
- **Trust**: User tin tưởng Google hơn.

Trong đồ án này, Google OAuth 2.0 được tích hợp để cho phép users đăng nhập bằng Google account, ngoài phương thức đăng nhập thông thường.

### 2.6.3. Role-Based Access Control (RBAC)

Role-Based Access Control (RBAC) là mô hình phân quyền dựa trên vai trò của user.

**Các thành phần của RBAC:**

1. **Users**: Người dùng của hệ thống.
2. **Roles**: Vai trò (ví dụ: Admin, User).
3. **Permissions**: Quyền hạn (ví dụ: Create Project, Delete Project).
4. **Resources**: Tài nguyên cần bảo vệ (ví dụ: Projects, Users).

**Mô hình RBAC trong hệ thống:**

Mô hình phân quyền theo chuỗi: User đến Role đến Permissions đến Resources

Ví dụ:
- User "john" có Role "Admin"
- Role "Admin" có Permissions: "Create Project", "Delete Project", "Manage Users"
- Permissions cho phép truy cập Resources: Projects, Users

**Implementation trong ASP.NET Core:**

```csharp
// Đăng ký roles
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("UserOrAdmin", policy => policy.RequireRole("User", "Admin"));
});

// Sử dụng trong Controller
[HttpGet("admin/users")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> GetAllUsers()
{
    // Chỉ Admin mới có thể truy cập
    var users = await _userManager.Users.ToListAsync();
    return Ok(users);
}

[HttpPost("projects")]
[Authorize(Roles = "User,Admin")] // User hoặc Admin đều được
public async Task<IActionResult> CreateProject(CreateProjectDTO dto)
{
    // User và Admin đều có thể tạo project
    // ...
}
```

*Nguồn: TodoApi/Program.cs, dòng 156-188 và TodoApi/Controllers/AdminController.cs, ProjectsController.cs (đã rút gọn để minh họa)*

**Roles trong hệ thống:**

1. **Admin**: Có quyền quản lý users, xem tất cả projects, quản lý marketplace.
2. **User**: Có quyền tạo và quản lý projects của mình, tải apps từ marketplace.

**Lý do sử dụng RBAC:**

- **Đơn giản**: Dễ hiểu và implement.
- **Scalable**: Dễ thêm roles và permissions mới.
- **Maintainable**: Quản lý permissions ở một nơi.

Trong đồ án này, RBAC được sử dụng để phân quyền giữa Admin và User, đảm bảo users chỉ có thể truy cập và thao tác trên dữ liệu của chính họ.

## 2.7. Kiến trúc và mô hình hệ thống

### 2.7.1. Client-Server Architecture

Client-Server là kiến trúc mạng trong đó client (frontend) gửi requests đến server (backend), và server xử lý và trả về responses.

**Đặc điểm của Client-Server Architecture:**

1. **Separation of Concerns**: Client xử lý UI, Server xử lý business logic và data.

2. **Stateless Communication**: Mỗi request độc lập, server không lưu state của client.

3. **Scalability**: Có thể scale server và client độc lập.

**Kiến trúc trong đồ án:**

Hệ thống được tổ chức theo mô hình Client-Server:

- Client (React SPA): Xử lý UI/UX, State Management, và Routing
- Server (ASP.NET Core): Xử lý API Endpoints, Business Logic, Authentication, và Data Access
- Database:
  - MongoDB Atlas: Lưu trữ toàn bộ dữ liệu (Identity và Business data)

Luồng giao tiếp: Client gửi HTTP/REST API requests (JSON) đến Server, Server xử lý và truy vấn từ MongoDB Atlas cho tất cả các loại dữ liệu.

**Ưu điểm:**

- **Tách biệt**: Frontend và backend có thể phát triển độc lập.
- **Reusability**: API có thể được sử dụng bởi nhiều clients (web, mobile).
- **Security**: Business logic ở server, client không thể truy cập trực tiếp database.

### 2.7.2. MVC Pattern trong Backend

MVC (Model-View-Controller) là một design pattern chia ứng dụng thành 3 phần:

1. **Model**: Đại diện cho dữ liệu và business logic.
2. **View**: Đại diện cho giao diện (trong API thì không có View, chỉ trả về JSON).
3. **Controller**: Xử lý user input, gọi Model, và trả về response.

**MVC trong ASP.NET Core API:**

```
Request đến Controller đến Service/Repository đến Model/Database đến Response
```

**Ví dụ MVC trong đồ án:**

```csharp
// Model
public class Project
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string AppUserId { get; set; }
}

// Controller
[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly MongoDbContext _mongoContext;
    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectDTO>>> GetProjects()
    {
        // Business logic
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var projects = await _mongoContext.Projects
            .Find(p => p.AppUserId == userId)
            .ToListAsync();
        
        // Return response (View equivalent)
        return Ok(projects);
    }
}
```

*Nguồn: TodoApi/Models/Project.cs và TodoApi/Controllers/ProjectsController.cs, dòng 34-68*

**Lợi ích của MVC:**

- **Separation of Concerns**: Mỗi phần có trách nhiệm riêng.
- **Testability**: Dễ test từng phần độc lập.
- **Maintainability**: Dễ maintain và extend.

### 2.7.3. Repository Pattern

Repository Pattern là một design pattern cung cấp abstraction layer giữa business logic và data access layer.

**Mục đích:**

- Tách biệt business logic khỏi data access code.
- Dễ dàng thay đổi data source hoặc cách truy vấn dữ liệu.
- Dễ test bằng cách mock repository.

**Ví dụ Repository Pattern:**

```csharp
// Interface
public interface IProjectRepository
{
    Task<IEnumerable<Project>> GetByUserIdAsync(string userId);
    Task<Project> GetByIdAsync(string id);
    Task<Project> CreateAsync(Project project);
    Task UpdateAsync(Project project);
    Task DeleteAsync(string id);
}

// Implementation
public class ProjectRepository : IProjectRepository
{
    private readonly IMongoCollection<Project> _projects;
    
    public ProjectRepository(MongoDbContext context)
    {
        _projects = context.Projects;
    }
    
    public async Task<IEnumerable<Project>> GetByUserIdAsync(string userId)
    {
        return await _projects
            .Find(p => p.AppUserId == userId)
            .ToListAsync();
    }
    
    // Implement other methods...
}

// Sử dụng trong Controller
public class ProjectsController : ControllerBase
{
    private readonly IProjectRepository _repository;
    
    public ProjectsController(IProjectRepository repository)
    {
        _repository = repository;
    }
    
    [HttpGet]
    public async Task<ActionResult> GetProjects()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var projects = await _repository.GetByUserIdAsync(userId);
        return Ok(projects);
    }
}
```

**Lợi ích:**

- **Testability**: Có thể mock repository để test controller.
- **Flexibility**: Dễ thay đổi data source.
- **Clean Code**: Controller không cần biết chi tiết về database.

Trong đồ án này, mặc dù không implement Repository Pattern một cách chính thức, nhưng MongoDbContext đóng vai trò tương tự, cung cấp abstraction cho data access.

### 2.7.4. Event-Driven Architecture trong App Builder

Event-Driven Architecture là kiến trúc trong đó các components giao tiếp với nhau thông qua events.

**Event System trong App Builder:**

Khi user tương tác với component (ví dụ: click button), component phát event, và các component khác có thể lắng nghe và phản ứng.

**Ví dụ Event System:**

```javascript
// Event Bus
class EventBus {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
}

// Component phát event
function Button({ onClick }) {
    const handleClick = () => {
        eventBus.emit('button:click', { action: onClick });
    };
    return <button onClick={handleClick}>Click Me</button>;
}

// Component lắng nghe event
function TaskTable() {
    useEffect(() => {
        const handleButtonClick = (data) => {
            if (data.action === 'addTask') {
                // Thêm task mới
            }
        };
        eventBus.on('button:click', handleButtonClick);
        return () => eventBus.off('button:click', handleButtonClick);
    }, []);
}
```

*Nguồn: todo-frontend/src/utils/eventBus.js, dòng 1-76 (đã rút gọn để minh họa)*

**Lợi ích:**

- **Decoupling**: Components không cần biết về nhau, chỉ cần biết về events.
- **Flexibility**: Dễ dàng thêm components mới lắng nghe events.
- **Extensibility**: Dễ mở rộng functionality.

Trong đồ án này, Event System được sử dụng trong App Builder để các components có thể giao tiếp với nhau (ví dụ: SearchBox phát event, TaskTable lắng nghe và filter data).

## 2.8. Các ràng buộc và giải pháp

### 2.8.1. Ràng buộc về hiệu năng

**Vấn đề:**

- Khi số lượng projects và components tăng, việc load và render có thể chậm.
- API calls nhiều có thể làm chậm ứng dụng.

**Giải pháp:**

1. **Pagination**: Chia nhỏ dữ liệu thành các trang.

```csharp
[HttpGet]
public async Task<ActionResult> GetProjects(int page = 1, int pageSize = 10)
{
    var skip = (page - 1) * pageSize;
    var projects = await _mongoContext.Projects
        .Find(filter)
        .Skip(skip)
        .Limit(pageSize)
        .ToListAsync();
    return Ok(new { data: projects, page, pageSize });
}
```

2. **Lazy Loading**: Chỉ load dữ liệu khi cần.

```javascript
// React: Lazy load components
const AppBuilderPage = lazy(() => import('./pages/AppBuilderPage'));

// Sử dụng
<Suspense fallback={<Loading />}>
    <AppBuilderPage />
</Suspense>
```

3. **Caching**: Cache dữ liệu thường dùng.

```csharp
[ResponseCache(Duration = 60)]
[HttpGet("marketplace")]
public async Task<ActionResult> GetMarketplaceApps()
{
    // Response được cache 60 giây
}
```

4. **Database Indexes**: Tạo indexes để tăng tốc query.

```csharp
await _mongoContext.Projects.Indexes.CreateOneAsync(
    new CreateIndexModel<Project>(
        Builders<Project>.IndexKeys.Ascending(p => p.AppUserId)
    )
);
```

### 2.8.2. Ràng buộc về bảo mật

**Vấn đề:**

- Người dùng có thể truy cập dữ liệu của người dùng khác.
- API có thể bị tấn công (NoSQL Injection, XSS, CSRF).

**Giải pháp:**

1. **Authentication và Authorization**: Luôn kiểm tra user identity và permissions.

```csharp
[HttpGet("{id}")]
[Authorize]
public async Task<ActionResult> GetProject(string id)
{
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    var project = await _mongoContext.Projects
        .Find(p => p.Id == id && p.AppUserId == userId)
        .FirstOrDefaultAsync();
    
    if (project == null) return NotFound();
    return Ok(project);
}
```

2. **Input Validation**: Validate tất cả input từ user.

```csharp
public class CreateProjectDTO
{
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string Name { get; set; }
    
    [StringLength(500)]
    public string Description { get; set; }
}
```

3. **HTTPS**: Sử dụng HTTPS để mã hóa data trong transit.

4. **CORS**: Cấu hình CORS để chỉ cho phép requests từ domain được phép.

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
```

*Nguồn: TodoApi/Program.cs, dòng 21-34*

5. **JWT Expiration**: Set thời gian hết hạn cho JWT tokens.

```csharp
var token = new JwtSecurityToken(
    // ...
    expires: DateTime.UtcNow.AddHours(24) // Token hết hạn sau 24 giờ
);
```

*Nguồn: TodoApi/Controllers/AuthController.cs, dòng 334-340*

### 2.8.3. Ràng buộc về khả năng mở rộng

**Vấn đề:**

- Khi số lượng users và data tăng, hệ thống cần scale.
- Trong tương lai, nếu cần hỗ trợ multi-tenant architecture, cần đảm bảo data isolation giữa các tenants.

**Giải pháp:**

1. **User Isolation hiện tại**: Hệ thống hiện tại sử dụng `AppUserId` để isolate dữ liệu giữa các users. Mọi query đều filter theo `AppUserId` để đảm bảo users chỉ truy cập được dữ liệu của chính họ.

```csharp
// Filter theo AppUserId để đảm bảo user chỉ truy cập dữ liệu của mình
var filter = Builders<Project>.Filter.Eq(p => p.AppUserId, userId);
var projects = await _mongoContext.Projects.Find(filter).ToListAsync();
```

2. **Khả năng mở rộng Multi-Tenant**: Khi cần thiết, có thể nâng cấp lên multi-tenant bằng cách thêm `TenantId` và filter theo cả `TenantId` và `AppUserId`.

```csharp
// Ví dụ khi triển khai multi-tenant trong tương lai
var filter = Builders<Project>.Filter.And(
    Builders<Project>.Filter.Eq(p => p.TenantId, tenantId),
    Builders<Project>.Filter.Eq(p => p.AppUserId, userId)
);
var projects = await _mongoContext.Projects.Find(filter).ToListAsync();
```

3. **Cloud Database**: Sử dụng MongoDB Atlas để dễ scale horizontally khi cần.

4. **Microservices (Future)**: Có thể tách thành microservices khi hệ thống phát triển lớn hơn.

5. **Load Balancing**: Sử dụng load balancer để phân tải requests khi có nhiều instances backend.

### 2.8.4. Ràng buộc về trải nghiệm người dùng

**Vấn đề:**

- App Builder cần responsive và dễ sử dụng.
- Cần feedback ngay lập tức khi user thao tác.

**Giải pháp:**

1. **Optimistic Updates**: Cập nhật UI ngay lập tức, sau đó sync với server.

```javascript
const handleDelete = async (id) => {
    // Cập nhật UI ngay
    setProjects(projects.filter(p => p.id !== id));
    
    // Gọi API
    try {
        await apiService.deleteProject(id);
    } catch (error) {
        // Rollback nếu lỗi
        setProjects(originalProjects);
    }
};
```

2. **Loading States**: Hiển thị loading indicator khi đang xử lý.

```javascript
const [loading, setLoading] = useState(false);

const handleSave = async () => {
    setLoading(true);
    try {
        await apiService.saveProject(project);
    } finally {
        setLoading(false);
    }
};
```

3. **Error Handling**: Hiển thị thông báo lỗi rõ ràng.

```javascript
try {
    await apiService.saveProject(project);
    toast.success('Lưu thành công!');
} catch (error) {
    toast.error('Lỗi: ' + error.message);
}
```

4. **Responsive Design**: Sử dụng TailwindCSS để đảm bảo responsive trên mọi thiết bị.

## 2.9. Kết luận chương

Chương này đã trình bày các khái niệm, công nghệ, và phương pháp được sử dụng trong quá trình xây dựng hệ thống NEXUS-403. Các nội dung chính bao gồm:

1. **Các khái niệm cơ bản**: App Builder, SPA, RESTful API, Multi-tenant Architecture, Component-Based Architecture.

2. **Công nghệ Frontend**: React.js, Vite, TailwindCSS, React Router, Axios.

3. **Công nghệ Backend**: ASP.NET Core, MongoDB.Driver, ASP.NET Identity (với custom MongoDB stores), AutoMapper.

4. **Hệ thống cơ sở dữ liệu**: MongoDB Atlas cho toàn bộ dữ liệu (Identity và Business data), kiến trúc database đơn giản và thống nhất.

5. **Xác thực và phân quyền**: JWT, OAuth 2.0, RBAC.

6. **Kiến trúc và mô hình**: Client-Server, MVC, Repository Pattern, Event-Driven Architecture.

7. **Ràng buộc và giải pháp**: Hiệu năng, bảo mật, khả năng mở rộng, trải nghiệm người dùng.

Các công nghệ và phương pháp này được lựa chọn dựa trên yêu cầu của dự án, khả năng mở rộng, và best practices trong ngành. Chúng tạo nền tảng vững chắc cho việc phát triển hệ thống NEXUS-403, đảm bảo tính hiện đại, hiệu năng cao, và dễ bảo trì.
