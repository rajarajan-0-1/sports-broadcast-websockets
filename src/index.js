import express, { json } from 'express';
import { matchRouter } from './routes/matches.routes.js';
import { attachWebSocketServer } from './ws/server.js';
import http from 'http';
import { securityMiddleware } from './arcjet.js';

const app = express();
const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(app);

app.set("trust proxy", true);
app.use(json());
app.use(securityMiddleware());

app.get('/', (req, res) => {
    res.send('Server is running');
});

// Apply security middleware to all routes

app.use('/api/matches', matchRouter);

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;   

server.listen(PORT, HOST, () => {
    const baseURL = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`Server listening on port ${baseURL}`);
    console.log(`WebSocket Server is running on ${baseURL}/ws`);
});