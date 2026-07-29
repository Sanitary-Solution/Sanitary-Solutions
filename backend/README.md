# Sanitary Solutions Backend

Node.js + Express + MongoDB backend using MVC architecture for the React frontend.

## Stack

- Node.js (ES modules)
- Express
- MongoDB + Mongoose
- JWT authentication for admin APIs

## Project Structure

```text
backend/
  src/
    config/
    controllers/
    middlewares/
    models/
    routes/
    scripts/
    utils/
    app.js
    server.js
```

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Start API server:

```bash
npm run dev
```

4. Seed database (optional but recommended for this frontend):

```bash
npm run seed
```

Reset and reseed:

```bash
npm run seed:reset
```

## API Base URL

`http://localhost:5000/api/v1`

## Main Endpoints

- Auth
  - `POST /auth/login`
  - `GET /auth/me`
  - `POST /auth/change-password` (admin)
  - `POST /customer-auth/forgot-password`
  - `POST /customer-auth/verify-password-reset`
  - `POST /customer-auth/reset-password`
- Products
  - `GET /products`
  - `GET /products/meta`
  - `GET /products/:id`
  - `POST /products` (admin)
  - `PATCH /products/:id` (admin)
  - `DELETE /products/:id` (admin)
- Categories / Brands
  - `GET /categories`
  - `POST /categories` (admin)
  - `PATCH /categories/:id` (admin)
  - `DELETE /categories/:id` (admin)
  - `GET /brands`
  - `POST /brands` (admin)
  - `PATCH /brands/:id` (admin)
  - `DELETE /brands/:id` (admin)
- Orders
  - `POST /orders`
  - `GET /orders` (admin)
  - `GET /orders/:id` (admin)
  - `PATCH /orders/:id/status` (admin)
  - `DELETE /orders/:id` (admin)
- Quotes
  - `POST /quotes`
  - `GET /quotes` (admin)
  - `GET /quotes/:id` (admin)
  - `PATCH /quotes/:id/status` (admin)
  - `DELETE /quotes/:id` (admin)
- Customers
  - `GET /customers` (admin)
  - `GET /customers/:id` (admin)
- Dashboard / Reports
  - `GET /dashboard/summary` (admin)
  - `GET /dashboard/revenue-trend` (admin)
  - `GET /dashboard/customer-satisfaction` (admin)
  - `GET /dashboard/bundle` (admin)
  - `GET /reports/overview` (admin)
- Contacts
  - `POST /contacts`
  - `GET /contacts` (admin)
  - `PATCH /contacts/:id/status` (admin)
- Settings
  - `GET /settings/public`
  - `GET /settings/store` (admin)
  - `PATCH /settings/store` (admin)

## Demo Admin

After seeding:

- Username: `admin`
- Password: `admin123`

## Password Reset Email

Configure these environment variables for customer password reset emails:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `PASSWORD_RESET_OTP_EXPIRES_IN_MINUTES`

The sample values in `backend/.env.example` are placeholders. Replace `SMTP_HOST` with your real SMTP provider host before using password reset email features.
