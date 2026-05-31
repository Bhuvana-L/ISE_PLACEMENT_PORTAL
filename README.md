# ISE Placement Data Management System

A full-stack MERN application for managing student placement data in the Information Science & Engineering department.

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Auth**: JWT + bcryptjs
- **File upload**: Multer
- **Excel export**: ExcelJS

---

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB running locally (or MongoDB Atlas URI)

---

### 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

Backend runs on: http://localhost:5000

### 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:5173

---

### 3. Create the first admin account

After both servers are running, make a POST request:

```bash
curl -X POST http://localhost:5000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@ise.edu","password":"admin123"}'
```

Or use Postman / Insomnia. After creating the admin, **disable or remove** the `/create-admin` route in `backend/src/routes/auth.js`.

---

## User roles and access

| Role | Login | Access |
|------|-------|--------|
| Admin | admin@ise.edu | All batches, all students, manage coordinators |
| Coordinator | (created by admin) | Only assigned batch |
| Student | (self-register) | Own batch forms only |

---

## Workflow

1. Admin logs in → creates coordinator → assigns a batch (e.g. 2026)
2. Students self-register at `/register` → select matching batch
3. Coordinator logs in → creates forms for their batch
4. Students see forms → fill and submit → upload resume/marksheet
5. Students use Calculator to compute SGPA/CGPA → save to profile
6. Coordinator views Submissions → sees pending/submitted list
7. Coordinator verifies student CGPA → clicks Verify
8. Coordinator clicks "Send to Admin" → verified students appear in Admin dashboard
9. Admin exports Excel reports (all / verified / pending / batch-wise)

---

## API Endpoints

### Auth
- `POST /api/auth/register` — Student register
- `POST /api/auth/login` — Login (all roles)
- `GET  /api/auth/me` — Get current user

### Admin (requires admin JWT)
- `GET  /api/admin/stats`
- `POST /api/admin/coordinators`
- `GET  /api/admin/coordinators`
- `PUT  /api/admin/coordinators/:id`
- `DELETE /api/admin/coordinators/:id`
- `GET  /api/admin/students?batch=&search=`
- `GET  /api/admin/students/verified`
- `GET  /api/admin/export?batch=&type=all|verified|pending`

### Coordinator (requires coordinator JWT)
- `GET  /api/coordinator/stats`
- `GET  /api/coordinator/students?search=`
- `GET  /api/coordinator/students/:id`
- `PUT  /api/coordinator/students/:id/verify`
- `POST /api/coordinator/students/send-to-admin`
- `POST /api/coordinator/forms`
- `GET  /api/coordinator/forms`
- `PUT  /api/coordinator/forms/:id`
- `DELETE /api/coordinator/forms/:id`
- `GET  /api/coordinator/submissions?formId=`
- `GET  /api/coordinator/export?type=all|verified|pending`

### Student (requires student JWT)
- `GET  /api/student/profile`
- `PUT  /api/student/profile`
- `GET  /api/student/forms`
- `GET  /api/student/forms/:id`
- `POST /api/student/forms/:id/submit`
- `GET  /api/student/submissions`

---

## Project Structure

```
ise-placement/
├── backend/
│   ├── src/
│   │   ├── models/         User, Form, Submission
│   │   ├── routes/         auth, admin, coordinator, student
│   │   ├── controllers/    authController, adminController,
│   │   │                   coordinatorController, studentController
│   │   ├── middleware/     auth.js (JWT), upload.js (Multer)
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/            axios.js
    │   ├── context/        AuthContext.jsx
    │   ├── components/     Navbar, ProtectedRoute, FormBuilder
    │   ├── pages/
    │   │   ├── admin/      Dashboard, Coordinators, Students, Reports
    │   │   ├── coordinator/ Dashboard, Forms, Submissions, Students
    │   │   └── student/    Dashboard, Forms, Calculator, Profile
    │   ├── App.jsx
    │   └── main.jsx
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## Security

- All passwords hashed with bcryptjs (salt rounds: 12)
- JWT tokens expire in 7 days
- Role-based route protection on both frontend (ProtectedRoute) and backend (restrictTo middleware)
- Coordinators can only access their assigned batch data
- File uploads restricted to: `.pdf .jpg .jpeg .png .doc .docx` (max 5MB)

---

## Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ise_placement
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
UPLOAD_PATH=./uploads
```
