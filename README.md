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
- [x] Xem review của người khác
- [x] Tìm kiếm tour theo ngày bắt đầu/kết thúc

**User**

- [x] Đăng nhập / Đăng xuất / Lấy thông tin user hiện tại
- [x] Đặt tour
- [x] Xem tour đã đặt
- [x] Thêm review cho tour
- [x] Tìm kiếm tour
- [x] Quản lý profile (fullName, phone, upload avatar)
- [x] Hủy tour khi chưa được admin confirm
- [x] Đăng nhập qua mạng xã hội (Google)

**Admin**

- [x] Quản lý user
- [x] Quản lý tour (CRUD, upload/xoá ảnh tour)
- [x] Quản lý review
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

> File upload (avatar, ảnh tour) lưu ở `public/uploads/{avatars,tours}`, truy cập qua `http://localhost:3000/uploads/...`. Chỉ nhận JPEG/PNG/WEBP, tối đa 5MB/file.

> Email (dev) gửi qua Mailpit trong docker-compose: SMTP `1026`, xem hộp thư tại `http://localhost:8026`.

> Postgres/Redis chạy ở port `5433`/`6380` (khác mặc định `5432`/`6379`) để không đụng port với `nestjs-tutorial` nếu chạy song song trên cùng máy.

### Đăng nhập Google

1. Tạo OAuth Client ID (loại *Web application*) tại Google Cloud Console → APIs & Services → Credentials
2. Thêm *Authorized redirect URI*: `http://localhost:3000/api/auth/google/callback`
3. Điền `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` vào `.env`
4. Mở `http://localhost:3000/api/auth/google` trên trình duyệt → đăng nhập Google → callback trả về `accessToken`, `refreshToken`, `user`

Tài khoản Google được liên kết qua bảng `user_oauth_accounts`: đã liên kết thì đăng nhập luôn, trùng email với user có sẵn thì liên kết vào user đó, chưa có thì tạo user mới.

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

### Unit test

Unit test (`src/**/*.spec.ts`) tập trung vào logic nghiệp vụ của service, mock repository/DataSource qua `Test.createTestingModule` (helper chung ở `src/common/testing/`):

- `BookingsService`, `BookingTransitionService`, `booking.util`: khoảng ngày đặt tour, hết slot, tính tổng tiền, chuyển trạng thái + hoàn slot
- `AdminToursService`, `tours-validation.util`: validate tạo/sửa tour, resize `maxSlot`, thay itinerary
- `ReviewsService`: điều kiện review (1 query), unique violation → 409
- `AuthService`: login, refresh token rotation, logout blacklist
- `BookingNotificationProcessor`, `RemoveUploadsOnErrorInterceptor`, `validationExceptionFactory`

### E2E testing

```bash
$ npm run test:e2e        # chạy e2e
$ npm run test:e2e:cov    # kèm coverage cho module bookings (coverage-e2e/)
```

- **Database test riêng**: cấu hình trong `.env.test` (`DB_NAME=booking_tour_test`). `test/setup/global-setup.ts` tự tạo database nếu chưa có và chạy toàn bộ migration trước khi test. Biến môi trường có sẵn (VD trên CI) được ưu tiên hơn `.env.test`.
- **Mỗi test case độc lập**: `beforeEach` seed fixture (`test/fixtures/booking.fixtures.ts`: admin, 2 user, 3 tour, 3 booking), `afterEach` `TRUNCATE ... RESTART IDENTITY CASCADE` toàn bộ bảng.
- App được dựng giống production qua `configureApp()` (`src/app.setup.ts`: prefix `/api`, `ValidationPipe`, format lỗi 422); riêng queue gửi email được mock để assert job được đẩy.
- **Coverage C2** cho `BookingsController` + `AdminBookingsController` (và service đi kèm): mọi nhánh điều kiện nghiệp vụ đều có test — 401/403, validate, tour không tồn tại, ngày ngoài khoảng (trước khi mở, quá muộn, đã qua), hết slot, đặt đồng thời không oversell, filter/pagination, xem/huỷ booking người khác, huỷ/duyệt/từ chối khi không còn pending, hoàn slot, gửi email. Các branch còn báo "uncovered" trong report là code do `emitDecoratorMetadata` sinh ở constructor/decorator, không phải logic.
- Jest e2e transform thêm các package chỉ có bản ESM (`@nestjs/bullmq`, `@nestjs/bull-shared`, `@nestjs/schedule`, `nodemailer`) sang CommonJS.

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
