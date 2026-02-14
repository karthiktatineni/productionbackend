
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
    'http://localhost:8081',
    'http://localhost:8082',
    'https://productionbackend-3sr4.onrender.com',
    'https://productionbackend-o3tk.onrender.com',
    'https://munproduction.vercel.app',
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
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>IARE MUN API | System Status</title>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
            <style>
                :root {
                    --primary: #6366f1;
                    --secondary: #a855f7;
                    --bg: #0f172a;
                    --card-bg: rgba(30, 41, 59, 0.7);
                    --text: #f8fafc;
                    --success: #22c55e;
                }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Outfit', sans-serif;
                    background-color: var(--bg);
                    background-image: 
                        radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
                        radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 40%);
                    color: var(--text);
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .container {
                    background: var(--card-bg);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 3rem;
                    border-radius: 24px;
                    text-align: center;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    max-width: 500px;
                    width: 90%;
                    animation: fadeIn 0.8s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                h1 {
                    font-size: 2.5rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                    background: linear-gradient(to right, var(--primary), var(--secondary));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(34, 197, 94, 0.1);
                    color: var(--success);
                    padding: 0.5rem 1.25rem;
                    border-radius: 9999px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-bottom: 2rem;
                    border: 1px solid rgba(34, 197, 94, 0.2);
                }
                .pulse {
                    width: 8px;
                    height: 8px;
                    background: var(--success);
                    border-radius: 50%;
                    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }
                p {
                    color: #94a3b8;
                    line-height: 1.6;
                    margin-bottom: 2rem;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-top: 2rem;
                }
                .info-item {
                    background: rgba(255, 255, 255, 0.03);
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .info-label {
                    font-size: 0.75rem;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.25rem;
                }
                .info-value {
                    font-weight: 600;
                    color: var(--text);
                }
                .footer {
                    margin-top: 3rem;
                    font-size: 0.8rem;
                    color: #475569;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="status-badge">
                    <div class="pulse"></div>
                    System Operational
                </div>
                <h1>IARE MUN API</h1>
                <p>The backend core is running smoothly and ready to process registrations and payments.</p>
                
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Environment</div>
                        <div class="info-value">Production</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Version</div>
                        <div class="info-value">1.0.4</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Uptime</div>
                        <div class="info-value">${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Port</div>
                        <div class="info-value">${process.env.PORT || 5000}</div>
                    </div>
                </div>

                <div class="footer">
                    &copy; 2026 IARE MUN Tech Team • Protected by Firebase
                </div>
            </div>
        </body>
        </html>
    `);
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
