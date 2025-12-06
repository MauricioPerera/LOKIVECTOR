const http = require('http');

function request(apiKey, path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runSaaSDemo() {
    console.log('--- SaaS Demo: Multi-tenancy & Quotas ---');

    // 1. Unauthorized Request (No Key)
    // Expected: 401 Unauthorized
    console.log('\n1. Request without API Key:');
    let res = await request('', '/collections', 'POST', { name: 'test_col' });
    console.log(`Status: ${res.status}, Body:`, res.body);

    // 2. Create Authorized Collection (Free Tier)
    console.log('\n2. Create Collection (Free Tier):');
    res = await request('sk_free_123', '/collections', 'POST', { name: 'demo_col' });
    console.log(`Status: ${res.status}, Body:`, res.body);

    // 3. Authorized Free Tier Insert
    console.log('\n3. Free Tier Insert (Authorized):');
    res = await request('sk_free_123', '/collections/demo_col/insert', 'POST', { data: 'ok' });
    console.log(`Status: ${res.status}, Body:`, res.body);

    // 4. Access Denied (Isolation)
    // Free tier tries to access 'premium_data' which is not in its allowed list
    console.log('\n4. Free Tier accessing restricted collection (Isolation):');
    res = await request('sk_free_123', '/collections/premium_data/search', 'POST', {});
    console.log(`Status: ${res.status}, Body:`, res.body);

    // 5. Pro Tier Create & Access
    console.log('\n5. Pro Tier Create & Insert (Full Access):');
    await request('sk_pro_999', '/collections', 'POST', { name: 'premium_data' });
    res = await request('sk_pro_999', '/collections/premium_data/insert', 'POST', { secret: 'data' });
    console.log(`Status: ${res.status}, Body:`, res.body);
}

runSaaSDemo();
