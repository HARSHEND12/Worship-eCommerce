document.addEventListener("DOMContentLoaded", function () {
    fetchProducts();
    displayCartItems();
    document.getElementById("logoutButton")?.addEventListener("click", logout);
    document.getElementById("buyNowBtn")?.addEventListener("click", checkout);
});

// ✅ User Logout Function
function logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    alert("✅ Logged out successfully!");
    window.location.href = "login.html";
}

// ✅ Fetch and Display Products
async function fetchProducts() {
    try {
        const response = await fetch("http://localhost:5000/api/products");
        const products = await response.json();

        const productsContainer = document.querySelector(".products");
        if (!productsContainer) {
            console.error("❌ ERROR: Element with class 'products' not found!");
            return;
        }

        productsContainer.innerHTML = "";
        products.forEach(product => {
            const imagePath = `http://localhost:5000/uploads/${product.image}`;
            productsContainer.innerHTML += `
                <div class="product-card">
                    <img src="${imagePath}" onerror="this.onerror=null; this.src='default.jpg';" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <p><strong>Price:</strong> ₹${product.price}</p>
                    <button onclick="addToCart(${product.id}, '${product.name}', ${product.price}, '${imagePath}')">Add to Cart</button>
                </div>
            `;
        });
    } catch (error) {
        console.error("❌ Error fetching products:", error);
    }
}

// ✅ Add to Cart Function
function addToCart(id, name, price, image) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${name} added to cart!`);
    displayCartItems();
}

// ✅ Display Cart Items
function displayCartItems() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartContainer = document.getElementById("cart-items");
    if (!cartContainer) {
        console.error("❌ ERROR: Element with ID 'cart-items' not found!");
        return;
    }
    cartContainer.innerHTML = "";
    let totalAmount = 0;
    cart.forEach((item, index) => {
        totalAmount += item.price * item.quantity;
        cartContainer.innerHTML += `
            <div class="cart-item">
                <img src="${item.image}" onerror="this.onerror=null; this.src='default.jpg';" alt="${item.name}" width="80">
                <h4>${item.name}</h4>
                <p>₹${item.price} x ${item.quantity}</p>
                <button onclick="removeFromCart(${index})">Remove</button>
            </div>
        `;
    });
    document.getElementById("totalAmount").textContent = `Total: ₹${totalAmount.toFixed(2)}`;
}

// ✅ Checkout Function
async function checkout() {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken"); // ✅ Get JWT token from local storage
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (!userId || cart.length === 0) {
        alert("❌ Please log in and add items to your cart before checking out!");
        return;
    }

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const paymentMethod = "UPI";  // Can be dynamic based on user selection
    const transactionId = "TXN" + Date.now();  // Generate unique transaction ID
    const shippingAddress = document.getElementById("shippingAddress")?.value || "Default Address";

    try {
        const response = await fetch("http://localhost:5000/api/checkout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // ✅ Send JWT token in the request
            },
            body: JSON.stringify({ userId, totalAmount, paymentMethod, transactionId, shippingAddress }),
        });

        const result = await response.json();
        
        if (response.ok) {
            alert("✅ Order placed successfully! Redirecting to payment...");
            localStorage.removeItem("cart"); // ✅ Clear cart after successful checkout
            window.location.href = "payment.html"; // ✅ Redirect to payment gateway
        } else {
            alert("❌ Error placing order: " + result.error);
        }
    } catch (error) {
        console.error("❌ Checkout Error:", error);
        alert("Server error! Please try again.");
    }
}

// ✅ Ensure Buy Now Button Calls checkout()
document.getElementById("buyNowBtn").addEventListener("click", function () {
    let totalAmount = document.getElementById("totalAmount").textContent; 
    localStorage.setItem("orderTotal", totalAmount); // Save the amount before redirecting
    window.location.href = "payment.html"; // Redirect to payment page
});


