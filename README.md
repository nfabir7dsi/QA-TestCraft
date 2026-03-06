# QA TestCraft

AI-Powered Test Case Generator for QA Teams

## 🎯 Project Overview

QA TestCraft is a comprehensive test case management platform that allows QA professionals to:
- Create and manage testing projects
- Generate test cases using AI with customizable structures
- Sync test cases directly to Google Sheets
- Collaborate with team members

## 📋 Current Status: Sprint 2 - Project Management ✅

### Completed Features

**Sprint 1: Authentication** ✅
- ✅ User registration
- ✅ User login with JWT authentication
- ✅ User profile management
- ✅ Protected routes

**Sprint 2: Project Management** ✅
- ✅ Create and manage projects
- ✅ Project CRUD operations
- ✅ Search and filter projects
- ✅ Project detail views
- ✅ Project statistics
- ✅ Status management (Active, Archived, Completed)

## 🏗️ Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs for password hashing
- Joi for validation

### Frontend
- React 19.2.0 + Vite
- React Router DOM 7.x
- Tailwind CSS 4.x
- Axios
- Zustand (state management)
- React Hot Toast (notifications)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)

### Backend Setup

1. Navigate to server folder:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/qa-testcraft
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

5. Start the server:
```bash
npm run dev
```

Server will run at: `http://localhost:5000`

### Frontend Setup

1. Navigate to client folder:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run at: `http://localhost:5173`

## 📡 API Endpoints

### Authentication (Public)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "company": "Tech Corp" // optional
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <your_jwt_token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "name": "John Updated",
  "company": "New Company",
  "password": "newpassword123" // optional
}
```

### Projects (Protected - Requires JWT Token)

#### Create Project
```http
POST /api/projects
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "name": "E-commerce Testing",
  "websiteUrl": "https://example-shop.com",
  "description": "Testing checkout flow",
  "tags": ["frontend", "payment"],
  "status": "active"
}
```

#### Get All Projects
```http
GET /api/projects?status=active&search=keyword
Authorization: Bearer <your_jwt_token>
```

#### Get Single Project
```http
GET /api/projects/:id
Authorization: Bearer <your_jwt_token>
```

#### Update Project
```http
PUT /api/projects/:id
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "status": "completed"
}
```

#### Delete Project
```http
DELETE /api/projects/:id
Authorization: Bearer <your_jwt_token>
```

#### Get Project Statistics
```http
GET /api/projects/stats
Authorization: Bearer <your_jwt_token>
```

## 📁 Project Structure

```
QA-TestCraft/
├── server/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── utils/
│   │   └── generateToken.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
└── client/ (Coming in next steps)
```

## 🗺️ Roadmap

- [x] Sprint 1: Authentication & User Management
- [x] Sprint 2: Project Management
- [ ] Sprint 3: Custom Test Case Templates
- [ ] Sprint 4: AI Test Case Generation
- [ ] Sprint 5: Test Case Display & Management
- [ ] Sprint 6: Google Sheets Integration
- [ ] Sprint 7: Polish & Additional Features
- [ ] Sprint 8: Testing & Deployment

## 🤝 Contributing

This is a personal project. Contributions, issues, and feature requests are welcome!

## 📝 License

ISC
