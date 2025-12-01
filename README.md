# ZakatVault – Docker Compose Setup and Environment Configuration

This guide explains how to configure environment values and run the full stack using Docker Compose.

## Overview
- Services
  - `frontend` (Nginx + static React build) on `http://localhost:5051`
  - `backend` (.NET API) on `http://localhost:8080`
  - `sqlserver` (SQL Server) internal only; persisted via Docker volume
- Networking
  - Inside Docker, the frontend proxies `GET/POST /api/...` to the backend.
  - From your browser, use `http://localhost:5051/api/...` to hit the API via Nginx.

## Prerequisites
- Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- Docker Compose v2 (bundled with Docker Desktop)

## Environment Configuration

You can supply values via a root `.env` file. Compose automatically reads it when run in the repo root.

Create a `.env` file at the repository root:

```env
# Database
SA_PASSWORD=ChangeMe_StrongP@ssw0rd

# Backend configuration overrides (optional)
JwtSettings__SecretKey=ReplaceWithAtLeast32CharsSecretKey
JwtSettings__Issuer=ZakatVaultApi
JwtSettings__Audience=ZakatVaultApiUsers
JwtSettings__ExpirationMinutes=10080

# Frontend proxy target for API (internal Docker URL)
API_ORIGIN=http://backend:80
```

Notes:
- `SA_PASSWORD` must meet SQL Server complexity requirements.
- The backend reads configuration from `appsettings.json` but can be overridden by environment variables using the double-underscore pattern shown above.
- `API_ORIGIN` is used by the frontend container’s Nginx to proxy `/api` requests to the backend.

## Docker Compose

The project includes `docker-compose.yml` at the root that builds and runs all services:
- `backend` builds from `./backend/ZakatVault/ZakatVault.Api/Dockerfile` and listens on port `80` in the container, published as `8080` on your host.
- `frontend` builds from `./frontend/Dockerfile` and publishes port `80` as `5051` on your host.
- `sqlserver` runs the official SQL Server image and stores data in a named volume.

## Run

- Build and start:

```sh
docker compose up --build -d
```

- Check status:

```sh
docker compose ps
```

- Access the app:

```
Frontend: http://localhost:5051
API (direct): http://localhost:8080
```

## API Access Patterns
- Through frontend proxy:
  - `http://localhost:5051/api/auth/login`
  - `http://localhost:5051/api/data`
- Direct backend:
  - `http://localhost:8080/api/auth/login`
  - `http://localhost:8080/api/data`

The backend controllers are under `backend/ZakatVault/ZakatVault.Api/Controllers` and expose routes prefixed with `/api`.

## Updating Environment Values
- Edit the root `.env` and re-create containers:

```sh
docker compose down
docker compose up --build -d
```

- To reset the database completely (drops data):

```sh
docker compose down -v
docker compose up --build -d
```

## Troubleshooting
- `ERR_NAME_NOT_RESOLVED` or calls to `http://backend/...` from the browser
  - Use `http://localhost:5051/api/...` instead. The hostname `backend` only exists inside Docker.
- 401 Unauthorized from `/api/data`
  - Login first and include the `Authorization: Bearer <token>` header.
- CORS errors
  - Requests via `http://localhost:5051/api/...` avoid cross-origin. If directly calling the backend from another origin, ensure CORS is updated in `Program.cs`.
- SQL Server fails to start due to weak password
  - Update `SA_PASSWORD` in `.env` to a strong value.

## Useful Commands
- View logs:

```sh
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f sqlserver
```

- Rebuild only one service:

```sh
docker compose build frontend
```

- Restart a service:

```sh
docker compose restart backend
```

## Security Considerations
- Do not hard-code secrets in Dockerfiles or source code.
- Keep `.env` out of version control (it is already excluded by `.gitignore`).
- Rotate JWT secrets and database passwords as needed.

## Directory Pointers
- Compose file: `docker-compose.yml`
- Backend Dockerfile: `backend/ZakatVault/ZakatVault.Api/Dockerfile`
- Frontend Dockerfile: `frontend/Dockerfile`
- Backend configuration: `backend/ZakatVault/ZakatVault.Api/appsettings.json`, `Program.cs`
- Frontend HTTP setup: `frontend/services/http.ts`, proxy in `frontend/Dockerfile`
