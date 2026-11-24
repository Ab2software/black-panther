const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const colors = require('colors');
const connectDb = require('./config/db');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const swaggerUi = require("swagger-ui-express");
const specs = require("./config/swagger");
const cleanupExpiredDemoUsers = require('./utils/cleanupDemoUsers')
const captureIp = require("./middleWare/captureIp");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
app.use(captureIp);
connectDb();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "https://eagleexchang.com",
];

const corsOriginHandler = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (
    allowedOrigins.includes(origin) ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
    origin.endsWith(".eagleexchang.com")
  ) {
    return callback(null, true);
  }
  return callback(null, false);
};

app.use(cors({
  origin: corsOriginHandler,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-token", "token"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

cleanupExpiredDemoUsers();
setInterval(cleanupExpiredDemoUsers, 24 * 60 * 60 * 1000);
console.log('Serving uploads from:', path.join(__dirname, 'uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

console.log('Serving scanners from:', path.join(__dirname, 'scanners'));
app.use('/scanners', express.static(path.join(__dirname, 'scanners')));

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    swaggerOptions: { persistAuthorization: true },
  })
);

app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/admin', require('./routes/admin/adminAuthRoutes'));
app.use("/api/v1/admin/clients", require("./routes/admin/adminclientroutes"));
app.use('/api/v1/wallet', require('./routes/Wallet/WalletRoutes'));
app.use('/api/v1/transaction', require('./routes/Transaction/TransactionRoutes'));
app.use('/api/v1', require('./routes/gameRoutes'));
app.use('/api', require('./routes/callbackRoutes'));
app.use('/api/v1/admin/subadmins', require('./routes/admin/subadminroutes'));
app.use("/api/v1/admin", require("./routes/betHistoryRoutes"));
app.use("/api/bets", require("./routes/cashoutRoute"));
app.use("/api/v1/chips", require("./routes/chips/Chiproutes"));
app.use("/api/v1/owner", require("./routes/admin/ownerRoutes"))
app.use("/api/v1/sports", require("./routes/sportsRoutes"));
app.use("/api/v1", require("./routes/admin/adminCasinoHistoryRoutes"));
app.use("/api/v1", require("./routes/bankRoutes"));
app.use("/api/v1/admin/insights", require("./routes/admin/userInsightsRoutes"));
app.use("/api/v1/admin",  require("./routes/admin/accountStatementRoutes"));
app.use("/api/v1", require("./routes/userRoutes")); 

require("./cron/settlement.cron");

app.get('/', (req, res) => {
  res.send('Backend is running');
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working properly' });
});

// ── SOCKET.IO SETUP ─────────────────────────────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: corsOriginHandler,
    credentials: true,
  },
});

require('./sockets/matchSocket')(io); // ← registers connection handler + poller

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`.white.bgMagenta);
  });
}

module.exports = app;