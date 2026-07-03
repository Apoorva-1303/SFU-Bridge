# SFU Bridge

An advanced, highly optimized real-time video conferencing application featuring multi-party audio/video routing, client-side hardware-accelerated AI transcription, and automated server-side meeting summarization.

---

## Architecture & Key Features

- **Media Layer**: [Mediasoup](https://mediasoup.org/) (SFU WebRTC) for ultra-low latency multi-party audio/video routing.
- **Audio Pipeline**: Web Audio API `AudioWorklet` for thread-isolated Voice Activity Detection (VAD) to keep performance smooth and the main thread free.
- **Privacy-First Local AI Inference**: [Transformers.js](https://xenova.github.io/transformers.js/) running a Whisper model inside a Web Worker using WebGPU acceleration.
  > [!NOTE]
  > Audio processing and transcription are performed entirely on the client side. Your raw audio never leaves your device or streams to third-party APIs. Only the final text transcript is securely sent to the LLM API for summarization, ensuring maximum privacy.
- **Signaling & State**: Node.js with Express, Socket.io, and Passport.js (supporting Local and Google OIDC authentication).
- **Intelligence Layer**: Google Gemini API (`gemini-2.5-flash`) for asynchronous automated conversation summaries generated at regular intervals.
- **Persistence**: MongoDB for user session management and storing meeting metadata.

---

## Prerequisites

Before getting started, ensure you have the following installed:

- **Node.js** (v18+ recommended)
- **MongoDB** (Local instance or MongoDB Atlas URI)
- **Google Cloud Console account** (for setting up Google OAuth credentials)
- **Google Gemini API Key** (from Google AI Studio)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/SFU-Bridge.git
cd SFU-Bridge
```

### 2. Backend Setup & Configuration

Navigate to the `backend` directory and install the dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the root of the `backend` directory by copying the `.env-example` file:

```bash
cp .env-example .env
```

Open the `.env` file and fill in the required variables matching the exact structure of `.env-example`:

```env
# Google Gemini API configuration
GEMINI_API_KEY=your_gemini_api_key

# Google OAuth Credentials (Google OIDC)
AUTH_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
AUTH_CLIENT_SECRET=your_google_client_secret

# Session configuration
SESSION_CONFIG_SECRET=your_secure_session_secret

# Database connection
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/SFUbridge

# Application URLs
BASE_CLIENT_URL=http://localhost:5173
BASE_API_URL=http://localhost:3000
```

### 3. Frontend Setup & Configuration

Navigate to the `frontend` directory and install the dependencies:

```bash
cd ../frontend
npm install
```

> [!NOTE]
> Under development, Vite is configured to automatically proxy API calls (`/api`) and WebSocket connections (`/socket.io`) to the backend server running at `http://localhost:3000`. Therefore, no additional frontend `.env` configuration is required.

---

## Running the Application

To run the application, you will need to start both the backend server and the frontend client.

### Start the Backend Server

From the `backend` directory:

```bash
npm run dev
```

The server will run on port `3000` by default (or the port defined by `SERVER_PORT`).

### Start the Frontend Server

From the `frontend` directory:

```bash
npm run dev
```

By default, the Vite dev server will spin up at `http://localhost:5173`.

### Access the App

Open **http://localhost:5173** in a modern web browser.
> [!TIP]
> Google Chrome or Microsoft Edge is recommended to take full advantage of WebGPU-accelerated local Whisper transcription.