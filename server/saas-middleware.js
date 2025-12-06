// Simple In-Memory Key Store for MVP
// In production, this should be a separate DB (Redis/Mongo)
const apiKeys = new Map();

// Seed some keys for testing
apiKeys.set('sk_free_123', { 
    plan: 'free', 
    requests: 0, 
    limit: 100, 
    collections: ['demo_col'] // Isolation: only access to these collections
});
apiKeys.set('sk_pro_999', { 
    plan: 'pro', 
    requests: 0, 
    limit: 10000, 
    collections: '*' // Access all
});

function saasMiddleware(req, res, next) {
    console.log('DEBUG: req.path:', req.path);
    console.log('DEBUG: req.url:', req.url);
    console.log('DEBUG: req.originalUrl:', req.originalUrl);

    // Bypass for internal replication or status checks if needed
    // Also bypass for admin dashboard static files if served from same origin
    // AND bypass for the admin stats/keys API itself (in a real app, use a different port or internal IP check)
    // Also check for /admin/stats and /admin/keys explicitly
    if (req.path === '/' || req.path.startsWith('/replication') || req.path.startsWith('/admin')) {
        console.log('Bypassing SaaS check for:', req.path);
        return next();
    }
    // Handle exact /admin match or /admin/ something else
    if (req.originalUrl && req.originalUrl.startsWith('/admin')) {
        console.log('Bypassing SaaS check for originalUrl:', req.originalUrl);
        return next();
    }

    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({ error: 'Missing x-api-key header' });
    }

    const client = apiKeys.get(apiKey);
    if (!client) {
        return res.status(403).json({ error: 'Invalid API Key' });
    }

    // 1. Rate Limiting / Quota Check
    if (client.requests >= client.limit) {
        return res.status(429).json({ 
            error: 'Quota exceeded. Please upgrade your plan.',
            usage: `${client.requests}/${client.limit}`
        });
    }

    // 2. Multi-tenancy / Isolation Check
    // Extract collection name from URL if present (e.g., /collections/:name/...)
    // The regex should catch /collections/NAME and /collections/NAME/...
    const match = req.path.match(/^\/collections\/([^\/]+)/);
    if (match) {
        const requestedCol = match[1];
        // Skip check if creating a new collection? 
        // No, even creation should be restricted or mapped.
        // For MVP: If collection list is specific, you can ONLY touch those collections.
        
        if (client.collections !== '*' && !client.collections.includes(requestedCol)) {
            return res.status(403).json({ 
                error: `Access denied to collection '${requestedCol}'.`,
                allowed: client.collections
            });
        }
    }

    // Increment Usage
    client.requests++;
    
    // Inject client info for downstream use
    req.saasClient = client;
    
    next();
}

module.exports = { saasMiddleware, apiKeys };
