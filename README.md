# Integrated Platform Data Environment (IPDE) – Simplified Version

This is a professional MERN stack implementation of the Integrated Platform Data Environment (IPDE) for a B.Tech Final Year Project.

## Key Features

1. **Component Management**: Create and link system components (e.g. Radar, Transmitter, Antenna) dynamically.
2. **Data Upload System**: Versioned document upload via Multer (prevents overwrites).
3. **Graph Interconnectivity Alert**: BFS algorithm to detect and alert transitively affected components when a component updates.
4. **Clean MERN Architecture**: Node.js/Express backend, MongoDB/Mongoose models, and React.js/Vite frontend.

---

## Folder Structure

```text
Garima/
├── README.md
├── backend/
│   ├── .env
│   ├── package.json
│   ├── server.js
│   ├── config/db.js
│   ├── models/
│   │   ├── Component.js
│   │   └── Data.js
│   ├── controllers/
│   │   └── componentController.js
│   ├── routes/
│   │   └── componentRoutes.js
│   └── uploads/
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx + App.css
        ├── main.jsx
        ├── services/api.js
        ├── components/
        │   ├── CreateComponentModal.jsx
        │   └── ConnectComponentModal.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── UploadPage.jsx
            └── VersionHistoryPage.jsx
```

---

## Setup & Running instructions

### Prerequisites
- Node.js (v16+)
- MongoDB Local or MongoDB Atlas URI

### 1. Backend Setup
1. Navigate to the `backend` directory.
2. Create a `.env` file with `MONGO_URI` and `PORT`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
