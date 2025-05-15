# EasyNotes - Collaborative Note Taking Application

A real-time collaborative note-taking application built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features

- User authentication (JWT-based)
- Create, edit, and delete notes
- Real-time collaboration using WebSocket
- Role-based access control (read/write permissions)
- Share notes with other users
- Real-time notifications for note updates
- Responsive and modern UI
- Auto-save functionality
- Pagination for notes listing

## Tech Stack

### Frontend
- React.js with hooks
- Redux Toolkit for state management
- React Router for navigation
- Material-UI for components
- Socket.io-client for real-time features
- Axios for API requests

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- Socket.io for real-time features
- Express-validator for validation
- Rate limiting and security features

## Local Setup Guide

### Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/easynotes.git
cd easynotes
```

### Step 2: Set Up Environment Variables

1. Create `.env` file in the backend directory:
```bash
cd backend
```

Create a file named `.env` with the following content:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/easynotes
JWT_SECRET=easynotes_jwt_secret_key_2024
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=http://localhost:3000
NODE_ENV=development
```

2. Create `.env` file in the frontend directory:
```bash
cd ../frontend
```

Create a file named `.env` with the following content:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### Step 3: Install Dependencies

1. Install root dependencies:
```bash
cd ..
npm install
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Step 4: Start MongoDB

1. Make sure MongoDB is installed on your system
2. Start MongoDB service:
   - On Windows:
     ```bash
     net start MongoDB
     ```
   - On macOS/Linux:
     ```bash
     sudo service mongod start
     ```
   - Or using MongoDB Compass

### Step 5: Run the Application

1. Start the backend server (from the root directory):
```bash
cd backend
npm run dev
```

2. In a new terminal, start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Step 6: Access the Application

1. Open your browser and navigate to http://localhost:3000
2. Register a new account or login with existing credentials
3. Start creating and managing your notes

## Troubleshooting

### Common Issues and Solutions

1. **PowerShell Execution Policy Error**
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **MongoDB Connection Issues**
   - Verify MongoDB is running: `mongo` or `mongosh`
   - Check MongoDB service status
   - Verify connection string in backend/.env

3. **Node.js/npm Issues**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall:
     ```bash
     rm -rf node_modules
     npm install
     ```

4. **Port Already in Use**
   - Change frontend port in package.json
   - Change backend port in .env file

### Environment Setup Issues

1. **Missing Dependencies**
   ```bash
   cd backend
   npm install express-rate-limit
   ```

2. **Frontend Build Issues**
   - Clear browser cache
   - Delete build folder and rebuild:
     ```bash
     cd frontend
     rm -rf build
     npm run build
     ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or need help, please:
1. Check the troubleshooting guide above
2. Open an issue in the repository
3. Contact the development team 