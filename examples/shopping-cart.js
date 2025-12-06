const loki = require('../src/lokijs.js');

// 1. Setup Shopping Cart Database
const db = new loki('shopping.db');
const carts = db.addCollection('carts', { unique: ['userId'] });
const products = db.addCollection('products');

// Seed Products
products.insert([
    { id: 'p1', name: 'Laptop', price: 1000, stock: 5 },
    { id: 'p2', name: 'Mouse', price: 20, stock: 10 },
    { id: 'p3', name: 'Keyboard', price: 50, stock: 0 } // Out of stock
]);

// 2. Cart Manager Class
class CartManager {
    constructor() {
        // Define a transform for calculating totals
        // LokiJS Transforms allow pre-compiling query chains
        carts.addTransform('cartTotal', [
            { 
                type: 'map', 
                value: (cart) => {
                    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
                    return cart;
                }
            }
        ]);
    }

    getCart(userId) {
        let cart = carts.by('userId', userId);
        if (!cart) {
            cart = carts.insert({ userId: userId, items: [], status: 'active', lastUpdated: Date.now() });
        }
        return cart;
    }

    addToCart(userId, productId, qty) {
        const cart = this.getCart(userId);
        const product = products.findOne({ id: productId });

        if (!product) throw new Error("Product not found");
        if (product.stock < qty) throw new Error(`Insufficient stock for ${product.name}`);

        // Check if item exists in cart
        const existingItem = cart.items.find(i => i.productId === productId);
        if (existingItem) {
            existingItem.qty += qty;
        } else {
            cart.items.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                qty: qty
            });
        }

        // Update metadata
        cart.lastUpdated = Date.now();
        carts.update(cart);
        
        // Decrement stock
        product.stock -= qty;
        products.update(product);

        return cart;
    }

    getCartWithTotal(userId) {
        // Simple computation instead of transform to avoid complexity with map returning same object reference causing issues in some LokiJS versions
        const cart = carts.findOne({ userId: userId });
        if (cart) {
            cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        }
        return cart;
    }

    checkout(userId) {
        const cart = this.getCart(userId);
        if (cart.items.length === 0) throw new Error("Cart is empty");

        cart.status = 'completed';
        cart.completedAt = Date.now();
        carts.update(cart);
        
        // In a real app, we would create an Order here
        return { orderId: `ORD-${Date.now()}`, total: this.getCartWithTotal(userId).total };
    }
}

// 3. Run Simulation
const shop = new CartManager();
const user = "user_alice";

console.log("--- Shopping Simulation ---");

try {
    console.log("1. Adding Laptop to cart...");
    shop.addToCart(user, 'p1', 1);
    
    console.log("2. Adding 2 Mice to cart...");
    shop.addToCart(user, 'p2', 2);

    console.log("3. Trying to add out-of-stock Keyboard...");
    try {
        shop.addToCart(user, 'p3', 1);
    } catch(e) {
        console.log(`   Error: ${e.message}`);
    }

    const cartState = shop.getCartWithTotal(user);
    console.log(`\nCart Summary for ${user}:`);
    console.table(cartState.items);
    console.log(`Total: $${cartState.total}`);

    console.log("\n4. Checking Out...");
    const order = shop.checkout(user);
    console.log(`Order Placed! ID: ${order.orderId}, Amount: $${order.total}`);

    // Verify Stock Update
    const laptop = products.findOne({ id: 'p1' });
    console.log(`\nRemaining Laptop Stock: ${laptop.stock}`);

} catch (err) {
    console.error(err);
}
