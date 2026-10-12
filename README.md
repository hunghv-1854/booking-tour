<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">Mock project — Hệ thống đặt tour du lịch, backend API bằng NestJS.</p>

<p align="center"><a href="https://github.com/hunghv-1854/booking-tour/actions/workflows/ci.yml"><img src="https://github.com/hunghv-1854/booking-tour/actions/workflows/ci.yml/badge.svg" alt="CI" /></a></p>

## Mô tả

Mock project thực hành NestJS: xây dựng backend API cho hệ thống đặt tour du lịch (Guest/User/Admin), tập trung hoàn toàn vào Backend.

**Kiến thức trọng tâm luyện tập:**

- Kiến trúc Modular, `@Module()`
- Routes/controllers, TypeORM (PostgreSQL), JWT authentication
- Exception handling & middlewares (Pipes, Filters)
- i18n, Swagger
- Unit test, e2e test
- Upload file, gửi mail (`@nestjs/bull` + Redis), lập lịch (`@nestjs/schedule`)
- Phân quyền (RolesGuard)
- Seeder qua CLI

## Tính năng

**Guest**

- [x] Đăng ký tài khoản
- [x] Xem thông tin chi tiết tour
- [x] Xem các tour hiện có
- [ ] Xem review của người khác
- [x] Tìm kiếm tour theo ngày bắt đầu/kết thúc

**User**

- [x] Đăng nhập / Đăng xuất / Lấy thông tin user hiện tại
- [x] Đặt tour
- [x] Xem tour đã đặt
- [ ] Thêm review cho tour
- [x] Tìm kiếm tour
- [x] Quản lý profile (update fullName/phone — upload avatar để dành B4)
- [x] Hủy tour khi chưa được admin confirm
- [ ] Đăng nhập qua mạng xã hội

**Admin**

- [x] Quản lý user
- [x] Quản lý tour (CRUD) (upload ảnh tour làm cùng PR upload file)
- [ ] Quản lý review
- [x] Quản lý yêu cầu đặt tour (approve/reject)
- [x] Quản lý category (CRUD)

**System**

- [x] Gửi email thông báo khi approve/reject request đặt tour
- [x] Tự chuyển booking đã approve sang `completed` khi tour kết thúc (cron 1h sáng mỗi ngày)

## Setup

```bash
cp .env.example .env
docker-compose up -d
npm install
npm run migration:run
npm run seed:admin
npm run start:dev
```

> Email (dev) gửi qua Mailpit trong docker-compose: SMTP `1026`, xem hộp thư tại `http://localhost:8026`.

> Postgres/Redis chạy ở port `5433`/`6380` (khác mặc định `5432`/`6379`) để không đụng port với `nestjs-tutorial` nếu chạy song song trên cùng máy.

API base path: `http://localhost:3000/api` (VD: `POST /api/auth/register`)
Swagger docs: `http://localhost:3000/docs`

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

### E2E testing

Chưa có e2e test thật (`test/jest-e2e.json` mới có config, chưa có file `*.e2e-spec.ts`) — `npm run test:e2e` dùng `passWithNoTests` để không đỏ CI. Sẽ triển khai đầy đủ ở B6, theo mô hình `nestjs-tutorial`: database test riêng (`.env.test`), truncate toàn bộ bảng sau mỗi test case, seed fixture trước mỗi test, coverage mức C2 (mọi nhánh điều kiện) cho ít nhất 1 controller.

## Database migration

Dự án dùng migration TypeORM thủ công (`synchronize: false`), không tự đồng bộ schema từ entity.

```bash
# tạo migration mới, rỗng
$ npm run migration:create -- src/database/migrations/<Name>

# sinh migration từ diff giữa entity và database hiện tại
$ npm run migration:generate -- src/database/migrations/<Name>

# áp dụng các migration chưa chạy
$ npm run migration:run

# revert migration gần nhất
$ npm run migration:revert
```

## Seeder

```bash
$ npm run seed:admin
```

Tạo sẵn 1 tài khoản `role: admin` (email/password lấy từ `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` trong `.env`) — vì API `POST /api/auth/register` chỉ tạo được `role: user`. Chạy lại nhiều lần an toàn (idempotent): nếu email đã tồn tại thì bỏ qua, không tạo trùng.

## Lint & format

```bash
$ npm run lint
$ npm run format
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) chạy tự động mỗi khi mở/cập nhật PR vào `main` và khi push lên `main`, gồm 2 job:

- **Lint & format / Build**: `eslint` (không `--fix`, sai format là fail), `tsc --noEmit`, `npm run build`.
- **Test / E2E testing / Database migration**: dựng Postgres + Redis service, rồi chạy trên DB trống:
  - `migration:run` → `migration:generate --check` (fail nếu entity bị sửa mà quên tạo migration) → `migration:revert` → `migration:run` lại (đảm bảo `down()` của migration mới nhất chạy được)
  - `seed:admin` 2 lần (boot toàn bộ app context + kiểm tra idempotent)
  - `npm test`, `npm run test:e2e`
