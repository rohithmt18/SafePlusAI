# SafeplusAI — Intelligent Personal Safety & Emergency Detection

SafeplusAI is an AI-powered personal safety platform designed to automatically identify potentially dangerous situations and assist users when they may be unable to manually press an SOS button.

Unlike traditional safety applications that depend entirely on manual triggers, SafeplusAI uses a multi-modal context engine to analyze environmental signals in real time.

## 🌟 Key Features

* **AI Risk Scoring Engine:** Analyzes multiple signals (Speech, Audio Events, Voice Emotion, GPS, Device Motion, Time of Day) to calculate a live risk score (0-100).
* **Explainable AI Timelines:** Provides full visibility into exactly *why* an alert was triggered, listing specific keywords and detected events.
* **Real-Time GPS Tracking (Leaflet):** Interactive live map displaying your exact location with accuracy radiuses and a pulsing beacon.
* **Twilio SMS Alerts:** Automatically text emergency contacts with a Google Maps link when danger is detected (supports silent fallback for local testing).
* **SOS Audio Siren:** Uses the Web Audio API to instantly generate a loud, sweeping siren sound to attract attention in emergencies.
* **Automated & Manual SOS:** Enter emergency mode automatically if the AI risk score exceeds 80, or trigger it manually at any time. Features a 15-second cancellation countdown to prevent false alarms.

## 🛠️ Technology Stack

* **Frontend:** React.js, React Router, CSS Variables (Dark/Glassmorphism theme), Leaflet.js, Web Audio API, Lucide Icons.
* **Backend:** Node.js, Express.js, Mongoose.
* **Database:** MongoDB Atlas (with a seamless fallback to `mongodb-memory-server` for instant local testing).
* **Integrations:** Twilio SDK (SMS).

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites
* Node.js (v16 or higher)
* (Optional) A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster
* (Optional) A free [Twilio](https://www.twilio.com/) account for SMS functionality

### 1. Installation

Clone the repository and install dependencies for both the backend and frontend.

```bash
git clone https://github.com/rohithmt18/SafePlusAI.git
cd SafePlusAI

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../safeplusai
npm install
```

### 2. Environment Configuration

Navigate to the `backend` folder and create a `.env` file based on the template below:

```bash
# backend/.env

# MongoDB Connection String (leave blank to use local in-memory DB)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/safeplusai

# JWT Secret for Authentication
JWT_SECRET=supersecretjwtkey_change_me_in_production

# Twilio SMS (leave blank to use console logs instead of real SMS)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3. Running the Application

You need to start both the backend server and the frontend development server.

**Start the Backend:**
```bash
cd backend
npm start
# Runs on http://localhost:5000
```
> *Note: If you didn't provide a `MONGODB_URI`, the backend will automatically spin up an in-memory database so you can test the app instantly!*

**Start the Frontend:**
```bash
cd safeplusai
npm start
# Runs on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the app!

## 📸 Screenshots & Usage
1. **Create an Account:** The system uses JWT for secure authentication.
2. **Add Contacts:** Add trusted individuals to your emergency contacts list.
3. **Start Monitoring:** Go to the Monitor tab, enable location/microphone permissions, and watch the live risk gauge.
4. **Trigger SOS:** Press the manual SOS button to experience the siren, SMS dispatch, and explainable event timeline generation.

---
*Disclaimer: SafeplusAI is an experimental AI safety project and should not be relied upon as a replacement for official emergency services (e.g., 911).*
