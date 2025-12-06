const loki = require('../src/lokijs.js');

// 1. Setup Log Database
// In a real scenario, this could be receiving logs via TCP/HTTP
const db = new loki('logs.db');
const logs = db.addCollection('syslogs', {
    indices: ['level', 'service', 'timestamp'] // Index for speed
});

// 2. Simulator: Generate Logs
const services = ['auth-service', 'payment-api', 'user-db', 'frontend'];
const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];

function generateLog() {
    const service = services[Math.floor(Math.random() * services.length)];
    const level = levels[Math.floor(Math.random() * levels.length)];
    return {
        timestamp: Date.now(),
        service: service,
        level: level,
        message: `Event in ${service}: ${Math.random().toString(36).substring(7)}`,
        responseTime: Math.floor(Math.random() * 500) // ms
    };
}

// Simulate 10,000 logs ingestion
console.log("Ingesting 10,000 logs...");
const start = process.hrtime();

// Batch insert is faster
const batch = [];
for(let i=0; i<10000; i++) {
    batch.push(generateLog());
}
logs.insert(batch);

const end = process.hrtime(start);
console.log(`Ingestion complete in ${(end[1] / 1000000).toFixed(2)}ms`);

// 3. Real-time Analysis

// A. Find all Critical Errors in Payment API
console.log("\n--- Critical Errors in Payment API ---");
const paymentErrors = logs.chain()
    .find({ 'service': 'payment-api' })
    .find({ 'level': 'ERROR' })
    .simplesort('timestamp', true) // Newest first
    .limit(5)
    .data();

console.log(`Found ${logs.count({ service: 'payment-api', level: 'ERROR' })} errors.`);
paymentErrors.forEach(l => console.log(`[${new Date(l.timestamp).toISOString()}] ${l.message}`));

// B. Performance Monitoring (Slow Queries > 400ms)
console.log("\n--- Slow Responses (>400ms) ---");
const slowQueries = logs.chain()
    .find({ 'responseTime': { '$gt': 400 } })
    .data();

console.log(`Total slow requests: ${slowQueries.length}`);

// C. Aggregation: Error counts by Service
console.log("\n--- Error Distribution by Service ---");
const errorStats = {};
services.forEach(svc => {
    const count = logs.count({ service: svc, level: 'ERROR' });
    errorStats[svc] = count;
});
console.table(errorStats);

// D. Dynamic View (Real-time Dashboard)
// Views automatically update when underlying data changes!
console.log("\n--- Dynamic View: 'Recent Errors' ---");
const recentErrorsView = logs.addDynamicView('recent_errors');
recentErrorsView.applyFind({ 'level': 'ERROR' });
recentErrorsView.applySimpleSort('timestamp', true);

console.log(`Initial View Count: ${recentErrorsView.data().length}`);

// Simulate new incoming error
console.log("Simulating new ERROR log...");
logs.insert({
    timestamp: Date.now(),
    service: 'auth-service',
    level: 'ERROR',
    message: 'CRITICAL AUTH FAILURE',
    responseTime: 50
});

// View should update automatically without re-querying
console.log(`Updated View Count: ${recentErrorsView.data().length}`);
console.log(`Top Error: ${recentErrorsView.data()[0].message}`);
