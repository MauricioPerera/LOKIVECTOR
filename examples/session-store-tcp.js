const net = require('net');

// Configuration
const TCP_PORT = 5000;
const HOST = 'localhost';

// Helper to send requests
function send(client, request) {
    return new Promise((resolve) => {
        const onData = (data) => {
            resolve(JSON.parse(data.toString()));
            client.removeListener('data', onData);
        };
        client.on('data', onData);
        client.write(JSON.stringify(request) + '\n');
    });
}

async function runSessionStore() {
    const client = new net.Socket();
    
    client.connect(TCP_PORT, HOST, async () => {
        console.log('Connected to Session Store (TCP)');

        // 1. Create Session (Login)
        // We use 'insert' to create a session document
        const sessionId = 'sess_' + Date.now();
        const userId = 'user_123';
        
        console.log(`\nCreating session for ${userId}...`);
        await send(client, {
            action: 'insert',
            collection: 'sessions',
            data: {
                sessionId: sessionId,
                userId: userId,
                loginTime: Date.now(),
                lastActive: Date.now(),
                data: { theme: 'dark', language: 'es' }
            }
        });
        console.log('Session created.');

        // 2. Retrieve Session (Middleware check)
        // Extremely fast lookups via TCP for every request
        console.log(`\nRetrieving session ${sessionId}...`);
        const start = process.hrtime();
        
        const res = await send(client, {
            action: 'findOne',
            collection: 'sessions',
            query: { sessionId: sessionId }
        });
        
        const end = process.hrtime(start);
        console.log(`Retrieved in ${(end[1] / 1000000).toFixed(3)}ms`);
        console.log('Session Data:', res.result.data);

        // 3. Update Session (Activity touch)
        // We update 'lastActive'
        console.log(`\nUpdating session activity...`);
        await send(client, {
            action: 'update',
            collection: 'sessions',
            query: { sessionId: sessionId },
            data: { lastActive: Date.now() }
        });
        console.log('Session updated.');

        // 4. Cleanup (Logout or Timeout)
        console.log(`\nDestroying session...`);
        await send(client, {
            action: 'remove',
            collection: 'sessions',
            query: { sessionId: sessionId }
        });
        console.log('Session destroyed.');

        client.end();
    });
}

runSessionStore();
