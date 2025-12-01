# ZakatVault - Savings Management & Zakat Calculator

A comprehensive Progressive Web Application (PWA) designed to manage personal savings (Gold, Silver, Currencies), track liabilities, and automatically calculate Zakat obligations based on real-time market rates.

## Features

- **Multi-Asset Portfolio**: Track Gold (24k & 21k), Silver, USD, and EGP.
- **Transaction History**: Record Buy/Sell transactions with automatic Average Cost and FIFO (First-In, First-Out) value calculations.
- **Zakat Engine**: Automated calculation of Zakat base, deducting short-term liabilities, and comparing against live Nisab thresholds.
- **Real-time Rates**: Integration with **Google Gemini AI** to fetch live market prices for Gold, Silver, and Exchange rates.
- **Cloud Sync**: Secure data persistence using a remote JSON storage API with offline-first capabilities.
- **Bilingual Support**: Full English and Arabic (RTL) UI support.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Visualization**: Recharts
- **State Management**: React Context + Offline-first Storage Service
- **AI Integration**: Google GenAI SDK (`@google/genai`)
- **Containerization**: Docker + Nginx

---

## Backend Developer Guide

This section outlines the API endpoints required to support the frontend application. The backend serves as a persistence layer for user data and an authentication provider.

### Base Configuration
- **Base URL**: `/api` (Proxied in Dev/Docker)
- **CORS**: Must allow requests from the frontend domain.
- **Content-Type**: `application/json`

### 1. Authentication Endpoints

#### **Register User**
Creates a new user account and returns a session token.

- **Endpoint**: `POST /api/auth/register`
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }
  ```
- **Response (200 OK / 201 Created)**:
  ```json
  {
    "user": {
      "id": "uuid-string",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "jwt-token-string"
  }
  ```
- **Response (400 Bad Request)**: `{ "message": "Email already exists" }`

#### **Login User**
Authenticates a user and returns a session token.

- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securePassword123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "user": {
      "id": "uuid-string",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "jwt-token-string"
  }
  ```
- **Response (401 Unauthorized)**: `{ "message": "Invalid credentials" }`

---

### 2. Data Synchronization Endpoints

These endpoints are responsible for loading and saving the user's financial data. The backend should treat the `body` as a JSON blob associated with the authenticated user ID.

**Authentication Required**:
- Header: `Authorization: Bearer <jwt-token-string>`

#### **Get User Data**
Retrieves the stored JSON data for the authenticated user.

- **Endpoint**: `GET /api/data`
- **Response (200 OK)**: Returns the `StoreData` object (see structure below).
- **Response (404 Not Found)**: Return 404 if it's a new user with no data yet. The frontend will initialize default data.

#### **Save User Data**
Overwrites the stored JSON data for the authenticated user.

- **Endpoint**: `POST /api/data`
- **Request Body**: The `StoreData` object (see structure below).
- **Response (200 OK)**: `{ "success": true }`

---

### 3. Data Structure (`StoreData`)

The backend should store this entire JSON structure.

```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "BUY" | "SELL",
      "assetType": "GOLD" | "GOLD_21" | "SILVER" | "USD" | "EGP",
      "amount": 10.5,
      "pricePerUnit": 3500,
      "date": "2023-10-25",
      "notes": "Optional note"
    }
  ],
  "liabilities": [
    {
      "id": "uuid",
      "title": "Car Loan",
      "amount": 50000,
      "dueDate": "2024-01-01",
      "isDeductible": true
    }
  ],
  "rates": {
    "gold_egp": 3500,
    "gold21_egp": 3000,
    "silver_egp": 45,
    "usd_egp": 50,
    "lastUpdated": 1698234567890,
    "dataSources": [{ "title": "Source", "uri": "http..." }]
  },
  "zakatConfig": {
    "zakatDate": "2024-04-10",
    "reminderEnabled": true,
    "email": "user@example.com"
  },
  "priceAlerts": [
    {
      "id": "uuid",
      "assetType": "GOLD",
      "targetPrice": 4000,
      "condition": "ABOVE",
      "isActive": true
    }
  ]
}
```

---

## Deployment via Docker

The application includes a `Dockerfile` for easy deployment. It builds the static assets and serves them using Nginx.

### Prerequisites
- Docker installed on your machine.
- A valid Google Gemini API Key.

### Build the Image

```bash
docker build -t zakat-vault .
```

### Run the Container

You must pass your Google API Key as an environment variable (`API_KEY`) to the container. The application reads this at runtime to authenticate with Google's services.

```bash
docker run -d \
  -p 8080:80 \
  -e API_KEY="your_actual_api_key_here" \
  --name zakat-vault-app \
  zakat-vault
```

The app will be accessible at `http://localhost:8080`.

### Development

To run the app locally without Docker:

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Start development server**:
    ```bash
    # Linux/Mac
    export API_KEY="your_api_key"
    npm run dev
    
    # Windows (PowerShell)
    $env:API_KEY="your_api_key"
    npm run dev
    ```
