# Password Reset Security Setup

Use these settings so forgot-password OTP works and follows current baseline protections.

## 1) Required SMTP env vars

Set these in your backend runtime (Render, Docker, local shell):

- `MAIL_USERNAME` = sender mailbox
- `MAIL_PASSWORD` = SMTP/App password (never your normal mailbox password)

For Gmail, create an App Password and use that value for `MAIL_PASSWORD`.

## 2) Required auth secret

- `APP_AUTH_TOKEN_SECRET` = long random secret (at least 32 chars)

Do not deploy with the default `change-me-in-production`.

## 3) Optional hardening controls

- `APP_AUTH_PASSWORD_MIN_LENGTH` (default `8`)
- `APP_AUTH_RESET_OTP_TTL_MINUTES` (default `10`)
- `APP_AUTH_RESET_MAX_VERIFY_ATTEMPTS` (default `5`)
- `APP_AUTH_RESET_REQUEST_WINDOW_MINUTES` (default `15`)
- `APP_AUTH_RESET_MAX_REQUESTS_PER_WINDOW` (default `3`)
- `APP_AUTH_RESET_MIN_SECONDS_BETWEEN_REQUESTS` (default `30`)

## 4) Behavior after this patch

- OTP is generated with a cryptographically secure RNG.
- OTP is stored hashed (not plaintext).
- OTP verification is attempt-limited and lockout protected.
- Reset requests are rate-limited per account.
- Reset responses are generic to reduce account enumeration risk.
