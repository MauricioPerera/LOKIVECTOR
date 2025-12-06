
const Loki = require('./src/lokijs.js');

function benchmarkKV() {
    const store = new Loki.KeyValueStore();
    const iterations = 100000;
    
    console.time('Set');
    for(let i=0; i<iterations; i++) {
        store.set(`key_${i}`, `value_${i}`);
    }
    console.timeEnd('Set');
    
    console.time('Get');
    for(let i=0; i<iterations; i++) {
        store.get(`key_${i}`);
    }
    console.timeEnd('Get');
}

benchmarkKV();
