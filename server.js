const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
// Connect to MySQL Database
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "harsh@2006",
    database: "worship_store"
});

// Route to fetch all products
app.get("/api/products", async (req, res) => {
    try {
        const [products] = await db.execute("SELECT * FROM products");
        res.json(products);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

// User Signup Route
app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    try {
        // Check if user already exists
        const [existingUser] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email already in use!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
        await db.execute(sql, [name, email, hashedPassword]);

        res.status(201).json({ message: "Signup successful!" });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Server error!" });
    }
});

// User Login
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const [results] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);

        if (results.length === 0) {
            return res.status(400).json({ error: "User not found" });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, "your_secret_key", { expiresIn: "1h" });

        res.json({ token, userId: user.id });
    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ error: "Server error!" });
    }
});

// Add Item to Cart
app.post("/cart", async (req, res) => {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const sql = `
            INSERT INTO cart (user_id, product_id, quantity) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE quantity = quantity + ?`;
        await db.execute(sql, [userId, productId, quantity, quantity]);

        res.json({ message: "Item added to cart" });
    } catch (error) {
        console.error("Cart Error:", error);
        res.status(500).json({ error: "Database error" });
    }
});

// Checkout - Create Order & Transaction
app.post("/checkout", async (req, res) => {
    const { userId, totalAmount, paymentMethod, transactionId, shippingAddress } = req.body;

    if (!userId || !totalAmount || !paymentMethod || !transactionId || !shippingAddress) {
        return res.status(400).json({ error: "Missing required fields!" });
    }

    try {
        const orderSql = `
            INSERT INTO orders (user_id, total_amount, payment_status, payment_method, transaction_id, shipping_address) 
            VALUES (?, ?, 'Pending', ?, ?, ?)`;

        const [orderResult] = await db.execute(orderSql, [userId, totalAmount, paymentMethod, transactionId, shippingAddress]);

        const orderId = orderResult.insertId;

        const transactionSql = `
            INSERT INTO transactions (order_id, user_id, amount, transaction_id, payment_method, status) 
            VALUES (?, ?, ?, ?, ?, 'Completed')`;

        await db.execute(transactionSql, [orderId, userId, totalAmount, transactionId, paymentMethod]);

        res.json({ message: "Order placed successfully!", orderId });
    } catch (error) {
        console.error("Checkout Error:", error);
        res.status(500).json({ error: "Transaction failed!" });
    }
});

// Start Server (Fixing Port Conflict)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
// ✅ Secret Key for JWT
const JWT_SECRET = "your_secret_key";  // Change this to a strong secret

// ✅ Middleware to Protect Routes
function authenticateToken(req, res, next) {
    const token = req.header("Authorization");
    
    if (!token) {
        return res.status(401).json({ error: "Access Denied! No token provided." });
    }

    try {
        const verified = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
        req.user = verified; // ✅ Attach user data to request
        next();  // ✅ Proceed to the protected route
    } catch (err) {
        res.status(403).json({ error: "Invalid Token" });
    }
}

// ✅ User Login Route with JWT Token Generation
app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0) return res.status(400).json({ error: "User not found" });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        // ✅ Generate JWT Token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

        res.json({ token, userId: user.id });
    });
});
// ✅ Add item to cart (protected)
app.post("/api/cart", authenticateToken, (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user.userId; // ✅ Extract user ID from JWT

    const sql = "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)";
    db.query(sql, [userId, productId, quantity], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ message: "Item added to cart" });
    });
});

// ✅ Checkout (protected)
app.post("/api/checkout", authenticateToken, (req, res) => {
    const { totalAmount, paymentMethod, transactionId, shippingAddress } = req.body;
    const userId = req.user.userId; // ✅ Extract user ID from JWT

    const orderSql = `INSERT INTO orders (user_id, total_amount, payment_status, payment_method, transaction_id, shipping_address) 
                      VALUES (?, ?, 'Pending', ?, ?, ?)`;

    db.query(orderSql, [userId, totalAmount, paymentMethod, transactionId, shippingAddress], (err, result) => {
        if (err) return res.status(500).json({ error: "Order creation failed!" });

        const orderId = result.insertId;

        const transactionSql = `INSERT INTO transactions (order_id, user_id, amount, transaction_id, payment_method, status) 
                                VALUES (?, ?, ?, ?, ?, 'Completed')`;

        db.query(transactionSql, [orderId, userId, totalAmount, transactionId, paymentMethod], (err, result) => {
            if (err) return res.status(500).json({ error: "Transaction failed!" });
            res.json({ message: "Order placed successfully!", orderId });
        });
    });
});
