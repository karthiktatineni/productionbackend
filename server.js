
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import registrationRoutes from './routes/registrationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(compression());
app.use(morgan('combined')); // Production logging

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:8080',
    'https://productionbackend-she7.onrender.com',
    'https://munproduction.vercel.app', // Anticipated Vercel URL
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl) 
        // and allow our specific domains or subdomains of vercel
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/api/registrations', registrationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('IARE MUN Backend is running in production mode!');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
