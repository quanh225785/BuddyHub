# BuddyHub

Full-stack web application — NestJS (backend) + React Vite (frontend).

## Yêu cầu cài đặt

Trước khi bắt đầu, đảm bảo máy đã có:

- [Node.js](https://nodejs.org/) >= 20
- [PostgreSQL](https://www.postgresql.org/download/) >= 15
- [Git](https://git-scm.com/)

---

## Hướng dẫn cài đặt lần đầu

### 1. Clone repository

```bash
git clone https://github.com/huyensiukawaii/BuddyHub.git
cd BuddyHub
```

### 2. Cài dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Tạo database PostgreSQL

Mở pgAdmin hoặc psql và chạy:

```sql
CREATE DATABASE buddyhub_db;
```

### 4. Cấu hình biến môi trường

**Backend** — tạo file `backend/.env` từ file mẫu:

```bash
cp backend/.env.example backend/.env
```

Sau đó mở `backend/.env` và sửa lại:

```env
DATABASE_URL="postgresql://postgres:MẬT_KHẨU_CỦA_BẠN@localhost:5432/buddyhub_db"
JWT_SECRET="tự-đặt-chuỗi-bí-mật-bất-kỳ"
JWT_EXPIRES_IN="7d"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

**Frontend** — tạo file `frontend/.env` từ file mẫu:

```bash
cp frontend/.env.example frontend/.env
```

### 5. Chạy migration database

```bash
cd backend
npx prisma migrate dev
```

### 6. Khởi động ứng dụng

Mở 2 terminal riêng biệt:

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd backend
npm run start:dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend
npm run dev
```

---

## Quy ước làm việc nhóm

### Cấu trúc branch

```
main            ← nhánh chính, TL merge vào đây
ten/feature/... ← tính năng mới (tạo từ main)
ten/fix/...     ← sửa bug (tạo từ main)
```

### Quy tắc đặt tên branch

Format: `tên/feature/mô-tả` hoặc `tên/fix/mô-tả`

```bash
huyen/feature/login
nam/feature/user-profile
linh/fix/login-error
```

### Quy ước commit (Conventional Commits)

| Prefix | Khi nào dùng |
|--------|--------------|
| `feat:` | Thêm tính năng mới |
| `fix:` | Sửa bug |
| `chore:` | Cấu hình, cài thư viện |
| `refactor:` | Tái cấu trúc code |
| `style:` | Sửa UI, CSS |
| `docs:` | Cập nhật tài liệu |

Ví dụ:
```
feat: thêm tính năng đăng nhập
fix: sửa lỗi không load được danh sách user
```

### Workflow làm việc

```bash
# 1. Cập nhật develop trước khi tạo branch mới
git checkout develop
git pull origin develop

# 2. Tạo branch mới từ main
git checkout -b ten/feature/mo-ta-tinh-nang

# 3. Code, commit thường xuyên
git add .
git commit -m "feat: mo ta tinh nang"

# 4. Push lên GitHub
git push origin ten/feature/mo-ta-tinh-nang

# 5. Tạo Pull Request vào main trên GitHub
```

### Quy trình trước khi merge

> **Không tự merge.** Mọi PR phải được TL hoặc SL review và merge.

1. Push code lên branch của mình
2. **Dùng AI (Claude / Copilot) review code trước** — kiểm tra logic, lỗi, code style
3. Sửa các vấn đề AI chỉ ra
4. Tạo Pull Request vào `main` trên GitHub
5. Báo TL/SL để TL/SL review lần cuối và merge

---

## Cấu trúc dự án

```
BuddyHub/
├── backend/          # NestJS API
│   ├── prisma/       # Schema và migrations
│   ├── src/
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── .env.example
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── lib/
│   │   │   └── axios.ts   # API client
│   │   └── main.tsx
│   └── .env.example
└── README.md
```
