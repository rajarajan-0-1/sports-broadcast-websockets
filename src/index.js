import express, { json } from 'express';
import { matchRouter } from './routes/matches.routes.js';
import { attachWebSocketServer } from './ws/server.js';
import http from 'http';

const app = express();
const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(app);



app.use(json());

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.use('/api/matches', matchRouter);

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;   

server.listen(PORT, HOST, () => {
    const baseURL = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`Server listening on port ${baseURL}`);
    console.log(`WebSocket Server is running on ${baseURL}/ws`);
});