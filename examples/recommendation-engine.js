const loki = require('../src/lokijs.js');
require('../src/loki-vector-plugin.js');

// 1. Setup Database
const db = new loki('recommendations.db');
const products = db.addCollection('products');

// 2. Create Vector Index (HNSW)
// We will use a 3-dimensional vector for simplicity (e.g., [price_score, popularity_score, quality_score])
products.ensureVectorIndex("embedding", {
  M: 16,
  efConstruction: 100,
  distanceFunction: 'cosine' 
});

// 3. Seed Data
// Let's imagine these vectors represent: [Technology-Focus, Home-Focus, Outdoor-Focus]
const catalog = [
    { name: "Laptop", category: "Tech", embedding: [0.9, 0.1, 0.0] },
    { name: "Smart Watch", category: "Tech", embedding: [0.8, 0.2, 0.1] },
    { name: "Coffee Maker", category: "Home", embedding: [0.1, 0.9, 0.0] },
    { name: "Tent", category: "Outdoor", embedding: [0.0, 0.1, 0.9] },
    { name: "Portable Charger", category: "Tech", embedding: [0.7, 0.1, 0.2] },
    { name: "Camping Stove", category: "Outdoor", embedding: [0.1, 0.2, 0.8] }
];

products.insert(catalog);

console.log(`Database seeded with ${products.count()} products.`);

// 4. Use Case: "User is looking at a Laptop. What else should we recommend?"
const currentProduct = products.findOne({ name: "Laptop" });
console.log(`\nUser is viewing: ${currentProduct.name}`);

// Find top 3 similar items based on vector embedding
const recommendations = products.findNearest("embedding", currentProduct.embedding, 3);

console.log("Recommendations:");
recommendations.forEach((item, idx) => {
    // Skip the item itself if it appears (distance 0)
    if (item.name === currentProduct.name) return;
    // If dist is NaN (likely due to zero vector or issue), handle gracefully
    const similarity = isNaN(item.dist) ? "N/A" : (1 - item.dist).toFixed(4);
    console.log(`${idx}. ${item.name} (Similarity: ${similarity})`);
});

// 5. Use Case: Hybrid Search
// "I want Tech products similar to a Tent (maybe rugged tech?)"
console.log(`\nHybrid Search: Tech products similar to 'Tent'`);
const tent = products.findOne({ name: "Tent" });

// We use chain() or specific hybrid methods if available, but here we filter post-search or use hybridSearch if implemented in plugin
// The plugin exposes `hybridSearch`
const ruggedTech = products.hybridSearch(
    "embedding", 
    tent.embedding, 
    { category: "Tech" }, // Filter
    { k: 2 }
);

ruggedTech.forEach(item => {
    console.log(`- ${item.name} (Category: ${item.category})`);
});
