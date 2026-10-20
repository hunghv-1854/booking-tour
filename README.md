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

Tạo sẵn 1 tài khoản `role: admin` (email lấy từ `SEED_ADMIN_EMAIL`) — vì API `POST /api/auth/register` chỉ tạo được `role: user`. Chạy lại nhiều lần an toàn (idempotent): nếu email đã tồn tại thì bỏ qua, không tạo trùng.

**Không có mật khẩu nào được gửi đi**: admin được tạo với mật khẩu ngẫu nhiên không ai biết, hệ thống gửi email *Thiết lập tài khoản* tới `SEED_ADMIN_EMAIL` chứa token dùng 1 lần (hạn 24h) → admin tự đặt mật khẩu qua `POST /api/auth/reset-password`. Vì vậy `SEED_ADMIN_EMAIL` phải là hộp thư nhận được mail (local: xem ở Mailpit).

### Quên mật khẩu

- `POST /api/auth/forgot-password { email }`: luôn trả 200 cùng 1 message (không lộ email nào tồn tại); nếu user tồn tại và đang active thì gửi email chứa token đặt lại mật khẩu (hạn 30 phút).
- `POST /api/auth/reset-password { token, newPassword }`: token đúng và còn hạn thì đổi mật khẩu; token chỉ dùng được 1 lần.
- Redis chỉ lưu **hash SHA-256** của token (`auth:password-reset:<hash>` → userId, có TTL), lấy ra bằng `GETDEL`.
- `PASSWORD_RESET_URL` (tuỳ chọn): nếu có, email kèm link `<url>?token=...` cho frontend.

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

## Deploy (Railway) & CD

App chạy trên [Railway](https://railway.com) bằng `Dockerfile` (cấu hình ở `railway.json`): container chạy `migration:run:prod` → `seed:admin:prod` (idempotent) → `node dist/main`, health check `/docs`.

**CD**: job `Deploy to Railway` trong `.github/workflows/ci.yml` chỉ chạy khi push lên `main` **và** 2 job lint/build + test đã pass → `railway up --ci` build image và deploy, job fail nếu build/deploy lỗi. PR chỉ chạy CI, không deploy.

Thiết lập 1 lần:

1. Railway: tạo project → **+ New** → **Database → PostgreSQL** và **Database → Redis** → **+ New → Empty Service** (đặt tên `booking-tour`). Không kết nối GitHub repo cho service này (để chỉ CD trong GitHub Actions được deploy sau khi test pass).
2. Service `booking-tour` → **Variables** (dùng reference tới DB/Redis của Railway):
   ```
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_USERNAME=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   DB_NAME=${{Postgres.PGDATABASE}}
   REDIS_HOST=${{Redis.REDISHOST}}
   REDIS_PORT=${{Redis.REDISPORT}}
   REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
   JWT_SECRET=<chuỗi ngẫu nhiên>
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=<chuỗi ngẫu nhiên khác>
   JWT_REFRESH_EXPIRES_IN=7d
   BREVO_API_KEY=<Brevo API key>
   MAIL_FROM=Booking Tour <email đã xác minh trên Brevo>
   MAIL_HOST=unused
   MAIL_PORT=465
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_CALLBACK_URL=https://<domain>/api/auth/google/callback
   SEED_ADMIN_EMAIL=<email nhận được mail>
   ```
   > Railway chặn SMTP ra ngoài ở gói Trial/Hobby, nên production gửi mail qua **Brevo HTTP API** (HTTPS): tạo tài khoản Brevo → xác minh 1 sender (**Senders, Domains & Dedicated IPs → Senders**) → **SMTP & API → API Keys** → tạo key. Có `BREVO_API_KEY` thì app gửi qua API, không có thì dùng SMTP (`MAIL_HOST`/`MAIL_PORT`, local là Mailpit).
3. Service → **Settings → Networking → Generate Domain** (lấy `<domain>`); **Settings → Volumes** (hoặc chuột phải service → Attach Volume) mount path `/app/public/uploads` để ảnh upload không mất khi redeploy.
4. Project **Settings → Tokens** → tạo Project Token (environment `production`); lấy Service ID ở service **Settings** (hoặc URL `.../service/<id>`).
5. GitHub repo → **Settings → Secrets and variables → Actions**: thêm `RAILWAY_TOKEN`, `RAILWAY_SERVICE_ID`.
6. Google Cloud Console: thêm redirect URI `https://<domain>/api/auth/google/callback`.

Sau đó mỗi lần merge PR vào `main` sẽ tự deploy; theo dõi ở tab **Actions** (GitHub) và **Deployments** (Railway).
