// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());

// In-memory storage (use database in production)
const users = [];
const messages = [];

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.sendStatus(401);
    
    try {
        const decoded = jwt.verify(token, 'your-secret-key');
        req.user = decoded;
        next();
    } catch {
        res.sendStatus(403);
    }
};

// Registration endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user exists
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = { id: Date.now(), name, email, password: hashedPassword };
        users.push(user);
        
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Generate JWT token
        const token = jwt.sign({ id: user.id, name: user.name }, 'your-secret-key');
        
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Socket.io connection
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    
    try {
        const decoded = jwt.verify(token, 'your-secret-key');
        socket.userId = decoded.id;
        socket.userName = decoded.name;
        next();
    } catch {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.userName);
    
    // Join chat room
    socket.on('join_room', (room) => {
        socket.join(room);
    });
    
    // Handle messages
    socket.on('send_message', (data) => {
        const message = {
            id: Date.now(),
            userId: socket.userId,
            userName: socket.userName,
            text: data.text,
            timestamp: new Date(),
            room: data.room
        };
        
        messages.push(message);
        io.to(data.room).emit('receive_message', message);
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.userName);
    });
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});