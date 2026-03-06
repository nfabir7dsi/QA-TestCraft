# Getting Started with QA TestCraft - Sprint 1

## 🎉 Sprint 1 Complete: Authentication & User Management

You now have a fully functional authentication system with:
- ✅ User Registration
- ✅ User Login (JWT-based)
- ✅ User Profile Management
- ✅ Protected Routes
- ✅ Beautiful UI with Tailwind CSS

---

## 📋 Prerequisites

Before you begin, ensure you have:
- **Node.js** v18 or higher
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn**

---

## 🚀 Installation & Setup

### Step 1: Install Backend Dependencies

```bash
cd server
npm install
```

### Step 2: Install Frontend Dependencies

```bash
cd ../client
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the `server` folder:

```bash
cd ../server
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/qa-testcraft
# OR use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qa-testcraft

# JWT Secret (change this to a random string)
JWT_SECRET=your_super_secret_jwt_key_here_change_this
JWT_EXPIRE=7d

# Anthropic AI (for future sprints)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Frontend URL
CLIENT_URL=http://localhost:5173
```

---

## 🏃 Running the Application

You need to run **2 terminals** (Backend + Frontend):

### Terminal 1: Start Backend Server

```bash
cd server
npm run dev
```

You should see:
```
🚀 Server running on port 5000
📍 Environment: development
MongoDB Connected: localhost
```

### Terminal 2: Start Frontend

```bash
cd client
npm run dev
```

You should see:
```
VITE v7.3.1  ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

## 🌐 Access the Application

Open your browser and go to: **http://localhost:5173**

### Test the Features:

1. **Register a New Account**
   - Click "Sign Up" or visit http://localhost:5173/register
   - Fill in your details (name, email, password)
   - Click "Sign up"

2. **Login**
   - Click "Login" or visit http://localhost:5173/login
   - Enter your credentials
   - Click "Sign in"

3. **View Dashboard**
   - After login, you'll be redirected to the dashboard
   - See your profile stats and quick actions

4. **Update Profile**
   - Click "Profile" in the navbar
   - Update your name, company, or password
   - Click "Update Profile"

5. **Logout**
   - Click the "Logout" button in the navbar

---

## 📁 Project Structure

```
QA-TestCraft/
├── server/                    # Backend (Express + MongoDB)
│   ├── config/
│   │   └── database.js       # MongoDB connection
│   ├── controllers/
│   │   └── authController.js # Auth logic
│   ├── middleware/
│   │   └── auth.js           # JWT verification
│   ├── models/
│   │   └── User.js           # User schema
│   ├── routes/
│   │   └── authRoutes.js     # Auth endpoints
│   ├── utils/
│   │   └── generateToken.js  # JWT generator
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Main server file
│
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── PrivateRoute.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Profile.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── authService.js
│   │   ├── store/
│   │   │   └── authStore.js  # Zustand state management
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 🧪 Testing API Endpoints

### Using cURL or Postman:

**1. Register User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "company": "Tech Corp"
  }'
```

**2. Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**3. Get Profile (Protected):**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**4. Update Profile:**
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "company": "New Company"
  }'
```

---

## 🔧 Troubleshooting

### MongoDB Connection Issues:
- **Local MongoDB:** Make sure MongoDB is running (`mongod` command)
- **MongoDB Atlas:** Verify your connection string and whitelist your IP address

### Port Already in Use:
```bash
# Change PORT in server/.env file
PORT=5001
```

### CORS Errors:
- Verify `CLIENT_URL` in `.env` matches your frontend URL

### Token Issues:
- Make sure `JWT_SECRET` is set in `.env`
- Check browser localStorage for the token

---

## 🎯 What's Next?

Now that Sprint 1 is complete, you're ready for:

### **Sprint 2: Project Management**
- Create/Edit/Delete projects
- Project listing and details
- Associate projects with users

Stay tuned!

---

## 📞 Need Help?

If you encounter any issues:
1. Check the console logs (both frontend and backend)
2. Verify all dependencies are installed
3. Ensure MongoDB is running
4. Check that ports 5000 and 5173 are available

---

**Happy Testing! 🚀**
