# ZakatVault – Docker Compose Setup and Environment Configuration

This guide explains how to configure environment values and run the full stack using Docker Compose.

## Overview
- **Services**
  - `frontend` (Nginx + static React build) on `http://localhost:5051`
  - `backend` (.NET API) on `http://localhost:8080`
  - `sqlserver` (SQL Server) internal only; persisted via Docker volume
- **Networking**
  - Inside Docker, the frontend proxies `/api/...` requests to the backend.
  - Runtime environment variables are injected into the frontend static files on container startup.

## Prerequisites
- Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- Docker Compose v2 (bundled with Docker Desktop)

## Environment Configuration

You **MUST** create a `.env` file at the repository root to supply secrets and configuration.

Create a `.env` file with the following keys:

```env
# Database Credentials
# Must meet SQL Server complexity requirements (uppercase, lowercase, number, special char)
SA_PASSWORD=YourStrongPassword123!

# JWT Authentication Settings
JWT_SECRET_KEY=YourSuperSecretKeyThatIsAtLeast32CharsLong
JWT_ISSUER=ZakatVaultApi
JWT_AUDIENCE=ZakatVaultApiUsers
JWT_EXPIRATION_IN_DAYS=14

# Frontend Configuration
# Google API Key (for specific frontend features)
API_KEY=AIzaSy...
# Resend.com API Key (for email notifications)
RESEND_API_KEY=re_123...
RESEND_SENDER=Zakat Vault <noreply@example.com>
NOTIFICATION_EMAIL=your_email@example.com
# Optional: Backend URL accessible from the browser
BACKEND_URL=http://localhost:8080
```

> **Note:** Do not use `localhost` for service-to-service communication within Docker; use service names (handled automatically mostly). The `BACKEND_URL` is for the browser to know where the API is if not proxied.

## Docker Compose

The project includes `docker-compose.yml` at the root that builds and runs all services:
- **backend**: Builds from `./backend/ZakatVault/ZakatVault.Api/Dockerfile`.
- **frontend**: Builds from `./frontend/Dockerfile`. Includes a runtime entrypoint to inject environment variables into the static React app.
- **sqlserver**: Official SQL Server image.

## Run

1. **Build and start:**
   ```sh
   docker compose up --build -d
   ```

2. **Check status:**
   ```sh
   docker compose ps
   ```

3. **Access the application:**
   - Frontend: `http://localhost:5051`
   - API (Swagger/Direct): `http://localhost:8080/swagger` (if enabled) or `http://localhost:8080/api/...`

## API Access Patterns
- **Through frontend proxy:**
  - `http://localhost:5051/api/auth/login`
- **Direct backend:**
  - `http://localhost:8080/api/auth/login`

## Updating Environment Values
If you change `.env`, you must recreate the containers:
```sh
docker compose down
docker compose up --build -d
```

## Resetting Data
To drop the database and start fresh:
```sh
docker compose down -v
docker compose up --build -d
```

## Troubleshooting
- **Frontend variables missing/placeholder**: Check container logs to see if the entrypoint script ran successfully.
  ```sh
  docker compose logs frontend
  ```
- **SQL Server Connection Error**: Ensure `SA_PASSWORD` is strong enough.
- **Emails not sending**: Verify `RESEND_API_KEY` and that the domain is verified in Resend (or use the registered testing email).

## Directory Pointers
- Compose file: `docker-compose.yml`
- Backend Dockerfile: `backend/ZakatVault/ZakatVault.Api/Dockerfile`
- Frontend Dockerfile: `frontend/Dockerfile`
- Frontend Entrypoint: `frontend/docker-entrypoint.sh`
