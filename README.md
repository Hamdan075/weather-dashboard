# Weather Dashboard

A full-stack Weather Dashboard application that allows users to view weather forecasts. It features a React frontend built with Vite and an Express backend that securely proxies requests to the OpenWeatherMap API.

## Project Structure

This repository is a monorepo consisting of two main parts:

- `client/`: The React frontend application.
- `server/`: The Node.js/Express backend API.

## Tech Stack

### Frontend (Client)
- **React 19**
- **Vite** - Build tool and development server
- **Vitest** & **React Testing Library** - Testing framework
- **ESLint** - Linting

### Backend (Server)
- **Node.js** & **Express**
- **Axios** - HTTP client for proxying API requests
- **dotenv** - Environment variable management
- **CORS** - Cross-origin resource sharing
- **Vitest** & **Supertest** - Testing framework

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn
- OpenWeatherMap API Key (Get one for free at [https://openweathermap.org/api](https://openweathermap.org/api))

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd weather-dashboard
   ```

2. **Install Client Dependencies**:
   ```bash
   cd client
   npm install
   ```

3. **Install Server Dependencies**:
   ```bash
   cd ../server
   npm install
   ```

### Environment Variables

You need to set up the environment variables for the backend server.

1. Navigate to the `server/` directory.
2. Copy the `.env.example` file to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open the `.env` file and replace `your_api_key_here` with your actual OpenWeatherMap API key:
   ```env
   OPENWEATHER_API_KEY=your_actual_api_key_here
   PORT=5000
   FRONTEND_URL=*
   ```

### Running the Application Locally

You will need two terminal windows to run both the frontend and backend simultaneously.

**Terminal 1: Start the Backend Server**
```bash
cd server
npm run dev
```
The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

**Terminal 2: Start the Frontend Client**
```bash
cd client
npm run dev
```
The Vite development server will start. Open your browser and navigate to the URL provided in the terminal (usually `http://localhost:5173`).

## Testing

Both the client and server use Vitest for testing.

**Client Tests:**
```bash
cd client
npm run test
```

**Server Tests:**
```bash
cd server
npm run test
```
