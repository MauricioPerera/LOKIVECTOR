var loki = require('./src/lokijs.js');
var MRUCache = require('./src/mru-cache.js');

// Helper function to measure execution time
function benchmark(name, fn, iterations) {
  var start = process.hrtime();
  for (var i = 0; i < iterations; i++) {
    fn();
  }
  var end = process.hrtime(start);
  var timeInMs = (end[0] * 1000 + end[1] / 1e6);
  console.log(name + ': ' + timeInMs.toFixed(2) + 'ms (' + (timeInMs / iterations).toFixed(4) + 'ms per op)');
}

var db = new loki('benchmark.db');
var users = db.addCollection('users');

// Insert some data
var count = 10000;
console.log('Inserting ' + count + ' documents...');
for (var i = 0; i < count; i++) {
  users.insert({
    name: 'User ' + i,
    age: Math.floor(Math.random() * 100),
    active: Math.random() > 0.5,
    role: ['admin', 'user', 'guest'][Math.floor(Math.random() * 3)]
  });
}

// Define queries
var query1 = { age: { $gt: 25 } };
var query2 = { role: 'admin' };
var query3 = { active: true };

// Benchmark WITHOUT cache
console.log('\n--- Benchmark WITHOUT Cache ---');
benchmark('Query 1 (age > 25)', function() {
  users.find(query1);
}, 1000);

benchmark('Query 2 (role = admin)', function() {
  users.find(query2);
}, 1000);

benchmark('Query 3 (active = true)', function() {
  users.find(query3);
}, 1000);

// Enable Cache
console.log('\nEnabling MRU Cache...');
users.mruCache = new MRUCache(100);

// Benchmark WITH cache
console.log('\n--- Benchmark WITH Cache ---');
// First run to populate cache
users.find(query1);
users.find(query2);
users.find(query3);

benchmark('Query 1 (age > 25)', function() {
  users.find(query1);
}, 1000);

benchmark('Query 2 (role = admin)', function() {
  users.find(query2);
}, 1000);

benchmark('Query 3 (active = true)', function() {
  users.find(query3);
}, 1000);
