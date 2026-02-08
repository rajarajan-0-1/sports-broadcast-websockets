import WebSocket, { WebSocketServer } from 'ws';
import { wsArcjet } from '../arcjet.js';
import { de } from 'zod/locales';

function sendJSON(socket, payload) {
    if(socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
    for(const client of wss.clients) {
        if(client.readyState !== WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload));
    }
}

export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: '/ws',
        payload: 1024 * 1024, // 1mb
    });

    wss.on('connection', async (socket, req) => {
        // this if will protect the WebSocket connection with Arcjet's bot detection and rate limiting middleware
        if(wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req);
                if(decision.isDenied()) {
                    const code = decision.reason.isRateLimit() ? 1013 : 1008; // 1013 for rate limit, 1008 for other denials    
                    const reason = decision.reason.isRateLimit() ? 'Too many connections!' : 'Forbidden!';
                    socket.close(code, reason);
                    return;
                }
            } catch (error) {
                console.error('Error in WebSocket security check:', error);
                socket.close(1011, 'Internal Server Error');
                return;
            }
        }

        socket.isAlive = true;
        socket.on('pong', () => socket.isAlive = true);

        sendJSON(socket, { type: 'welcome' });


        socket.on('error', console.error);
    });

    const interval = setInterval(() => {
        wss.clients.forEach((socket) => {
            if(socket.isAlive === false) return socket.terminate();     
            socket.isAlive = false;
            socket.ping();
        });
    }, 30000);  

    function broadcastMatchCreated(match) {
        broadcast(wss, { type: 'matchCreated', data: match });
    };

    return { broadcastMatchCreated };
}