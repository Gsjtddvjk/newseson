const products = [
    { id: 1, name: "قميص كلاسيكي", price: 299, category: "men", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400" },
    { id: 2, name: "فستان سهرة", price: 599, category: "women", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400" },
    { id: 3, name: "ساعة أنيقة", price: 899, category: "accessories", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400" },
    { id: 4, name: "بنطلون جينز", price: 349, category: "men", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400" },
    { id: 5, name: "بلوزة حرير", price: 249, category: "women", image: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400" },
    { id: 6, name: "حقيبة يد", price: 499, category: "accessories", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400" },
    { id: 7, name: "جاكيت شتوي", price: 799, category: "men", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400" },
    { id: 8, name: "تنورة ميدي", price: 279, category: "women", image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400" }
];

let cart = [];

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const cartBtn = document.getElementById('cartBtn');
const cartSidebar = document.getElementById('cartSidebar');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const totalPrice = document.getElementById('totalPrice');
const overlay = document.getElementById('overlay');
const filterBtns = document.querySelectorAll('.filter-btn');

// Render Products
function renderProducts(filter = 'all') {
    const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
    productsGrid.innerHTML = filtered.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">${product.price} ر.س</p>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => addToCart(parseInt(card.dataset.id)));
    });
}

// Add to Cart
function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existing = cart.find(item => item.id === id);
    
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    updateCart();
    openCart();
}

// Update Cart
function updateCart() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartCount.textContent = count;
    totalPrice.textContent = `${total} ر.س`;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">سلتك فارغة</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="price">${item.price} ر.س × ${item.quantity}</p>
                    <button class="remove-item" data-id="${item.id}">إزالة</button>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFromCart(parseInt(btn.dataset.id));
            });
        });
    }
}

// Remove from Cart
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCart();
}

// Open/Close Cart
function openCart() {
    cartSidebar.classList.add('active');
    overlay.classList.add('active');
}

function closeCartSidebar() {
    cartSidebar.classList.remove('active');
    overlay.classList.remove('active');
}

cartBtn.addEventListener('click', openCart);
closeCart.addEventListener('click', closeCartSidebar);
overlay.addEventListener('click', closeCartSidebar);

// Filter Products
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderProducts(btn.dataset.filter);
    });
});

// Form Submit
document.querySelector('.contact-form').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('شكراً لتواصلك معنا!');
    e.target.reset();
});

// Mobile Menu
document.getElementById('menuBtn').addEventListener('click', function() {
    const nav = document.querySelector('.nav');
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
});

// Initialize
renderProducts();
