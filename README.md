# Erostar Star Enterprises – Solar VFD Monitoring System

Full Stack IoT Monitoring System for Solar VFD data sent by ESP32 devices.

## Architecture

ESP32 -> Backend API (Node/Express) -> MongoDB Atlas -> React Dashboard

- Supports multiple ESP32 devices.
- Admin can view all devices.
- User can view only assigned device.

## Tech Stack

### Frontend
- React (Vite)
- Axios
- Chart.js + react-chartjs-2
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Mongoose
- JWT Authentication
- bcrypt

### Database
- MongoDB Atlas

### Deployment
- Backend: Render Web Service
- Frontend: Render Static Site

## Project Structure

```text
Solar_vfd/
	backend/
		middleware/
			authMiddleware.js
		models/
			User.js
			VfdData.js
		routes/
			authRoutes.js
			vfdRoutes.js
		server.js
		package.json
	src/
		components/
			Navbar.jsx
			ProtectedRoute.jsx
			VfdCard.jsx
			Charts.jsx
		context/
			AuthContext.jsx
		pages/
			Login.jsx
			AdminDashboard.jsx
			UserDashboard.jsx
			DeviceData.jsx
		services/
			api.js
		App.jsx
```

## Backend Setup

1. Go to backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment in `backend/.env`:

```env
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key
PORT=5000
NODE_ENV=development
```

4. Run backend:

```bash
npm run dev
```

## Frontend Setup

1. From project root install dependencies:

```bash
npm install
```

2. Create `.env` (or use `.env.example`) in root:

```env
VITE_API_URL=http://localhost:5000/api
```

3. Run frontend:

```bash
npm run dev
```

## API Endpoints

### Auth
 - `GET /api/setup-status` -> Check if first-time setup is needed
 - `POST /api/setup` -> Create your own first admin and optional first user (works only once)

### VFD Data
- `POST /api/vfd-data` -> ESP32 sends VFD data
- `GET /api/my-device-data` -> User's latest device data
- `GET /api/device-history/:deviceId` -> Device history data
- `GET /api/all-vfd-data` -> Admin all devices latest data
- `GET /api/devices` -> Device ID list
- `GET /api/statistics` -> Admin dashboard statistics

## ESP32 Payload Format

POST to:

`https://your-backend-url/api/vfd-data`

Headers:

`Content-Type: application/json`

Body:

## First-Time Account Setup

When the database is empty, open:

- `http://localhost:5173/setup`

From this page, you can:

- Create your own admin account
- Optionally create your first user with `deviceId`

After setup is completed once, setup endpoint is locked automatically.

```json
{
	"deviceId": "ESP32_001",
	"status": "STOPPED",
	"runFrequency": 0.0,
	"dcBusVoltage": 565.0,
	"outputCurrent": 0.0,
	"fault": "0x00 No Fault",
	"communicationStatus": "Communication OK"
}
```

## Dashboard Features

- Login page with JWT-based auth.
- Role-based redirection:
	- Admin -> Admin Dashboard
	- User -> User Dashboard
- Admin dashboard:
	- Total Users
	- Total Devices
	- Latest readings from all devices
- User dashboard:
	- Assigned device latest readings (card layout)
	- Real-time charts:
		- Run Frequency vs Time
		- DC Bus Voltage vs Time
		- Output Current vs Time
- Device Data page for detailed device history.
- Auto-refresh every 5 seconds using Axios.

## Render Deployment

`render.yaml` is included for blueprint deployment.

### Backend (Render Web Service)
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node server.js`
- Environment Variables:
	- `MONGODB_URI`
	- `JWT_SECRET`
	- `PORT`

### Frontend (Render Static Site)
- Root Directory: project root
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment Variables:
	- `VITE_API_URL` = `https://your-backend-service.onrender.com/api`

## MongoDB Collections

### Users
- `name`
- `email`
- `password` (hashed)
- `role` (`admin` or `user`)
- `deviceId` (required for user role)

### vfdData
- `deviceId`
- `status`
- `runFrequency`
- `dcBusVoltage`
- `outputCurrent`
- `fault`
- `communicationStatus`
- `timestamp`


