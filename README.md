# ITD110 Case Study #1

## Student Document Repository System

A web application that helps students quickly find, search, and manage school forms (e.g., subject withdrawal, INC completion, shifting forms).

## Features

- CRUD operations for form records
- Search by keyword (title, description, tags)
- Dashboard data visualization (forms per category)
- JSON backup download
- MongoDB backend using Express

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- Chart: Chart.js (`react-chartjs-2`)

## Project Structure

- `client/` - React frontend
- `server/` - Express + MongoDB backend
- `docs/` - project documentation

## Prerequisites

- Node.js and npm installed
- MongoDB running locally

## Setup and Run

### 1) Run backend

```bash
cd server
npm install
npm run dev
```

Backend runs at: `http://localhost:5000`

### 2) Run frontend (new terminal)

```bash
cd client
npm install
npm run dev
```

Frontend usually runs at `http://localhost:5173`.
If port `5173` is busy, Vite automatically uses another port (e.g., `http://localhost:5174`).

## API Endpoints

- `GET /api/forms` - list forms
- `GET /api/forms?q=keyword` - search forms
- `POST /api/forms` - create form
- `PUT /api/forms/:id` - update form
- `DELETE /api/forms/:id` - delete form
- `GET /api/forms/dashboard/stats` - dashboard stats
- `GET /api/forms/backup/json` - download JSON backup

## Notes for Demo

- Ensure backend is running before opening frontend
- Use the Add/Edit/Delete form controls for CRUD demonstration
- Use Search and Dashboard sections to show required features
- Use "Download JSON Backup" to demonstrate backup requirement
