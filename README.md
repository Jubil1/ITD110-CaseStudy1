# ITD110 Case Study #1

## Student Document Repository System

A web application that helps students quickly find, search, and manage school documents (e.g., ISO forms, registrar forms, and other student-facing files).

## Demo Video

https://github.com/user-attachments/assets/2b3e500a-ac28-4632-a482-61751133916e

## Features

- CRUD operations for document records
- Search by keyword (title, description, tags)
- Filter by document type (`ISO Form`, `Special Order`, `Calendar`, `Memo`, `Guide`)
- Dashboard data visualization (documents per category + top downloaded)
- JSON export download
- Download tracking (`downloadCount`) when a document is opened
- MongoDB backend using Express

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- Chart: Chart.js (`react-chartjs-2`)

## Project Structure

```text
ITD110-CaseStudy1/
├── README.md
├── docs/
│   └── project-context.md
├── client/                          # React + Vite frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx                 # App entry
│       ├── App.jsx                  # UI, tabs, CRUD, search, dashboard
│       ├── App.css
│       ├── index.css
│       └── assets/                  # Static images (hero, etc.)
└── server/                          # Express + MongoDB API
    ├── package.json
    ├── public/
    │   └── forms/                   # Optional: .pdf / .doc(x) for `http://localhost:5000/forms/...`
    └── src/
        ├── server.js                # HTTP server bootstrap
        ├── app.js                   # Express app, middleware, static `/forms`
        ├── config/
        │   └── db.js                # MongoDB connection
        ├── controllers/
        │   └── formController.js    # CRUD, search, stats, export, download tracking
        ├── models/
        │   └── Form.js              # Mongoose schema
        └── routes/
            └── formRoutes.js        # `/api/forms` routes
```

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

### 3) (Optional) Add local files for serving

Put `.doc/.docx/.pdf` files in:

`server/public/forms`

Then use file links like:

`http://localhost:5000/forms/<filename>`

## API Endpoints

- `GET /api/forms` - list documents
- `GET /api/forms?q=keyword` - search documents
- `GET /api/forms?documentType=ISO%20Form` - filter by document type
- `POST /api/forms` - create document
- `PUT /api/forms/:id` - update document
- `DELETE /api/forms/:id` - delete document
- `GET /api/forms/dashboard/stats` - dashboard stats
- `GET /api/forms/backup/json` - download JSON export
- `GET /api/forms/:id/open` - increment `downloadCount` and open file

## Notes for Demo

- Ensure backend is running before opening frontend
- Use the Add/Edit/Delete controls in `Manage Forms (CRUD)` for full CRUD demo
- Use Search and Dashboard sections to show required features
- Use the `File Repository` tab to demonstrate document browsing and filtering
- Use `Download JSON` to demonstrate backup/export requirement
