import WebSocket, { WebSocketServer } from 'ws';

function sendJSON(socket, payload) {
    if(socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
    for(const client of wss.clients) {
        if(client.readyState !== WebSocket.OPEN) return;

        client.send(JSON.stringify(payload));
    }
}

export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: '/ws',
        payload: 1024 * 1024, // 1mb
    });

    wss.on('connection', (socket) => {
        sendJSON(socket, { type: 'welcome' });

        socket.on('error', console.error);
    });

    function broadcastMatchCreated(match) {
        broadcast(wss, { type: 'matchCreated', data: match });
    };

    return { broadcastMatchCreated };
}