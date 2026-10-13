// ---------- Data ----------
const products = [
  { id: 1, name: "Aero Runner",   category: "running",  price: 5999, rating: 5, color: "#ff4d2e", bg: "#fff0ec" },
  { id: 2, name: "Urban Low",     category: "sneakers", price: 4499, rating: 5, color: "#2f6bff", bg: "#eaf0ff" },
  { id: 3, name: "Trail Guard",   category: "boots",    price: 7499, rating: 4, color: "#7a5230", bg: "#f6eee6" },
  { id: 4, name: "Cloud Slip-On", category: "casual",   price: 2999, rating: 4, color: "#14b88a", bg: "#e6f8f2" },
  { id: 5, name: "Sprint Pro",    category: "running",  price: 6999, rating: 5, color: "#8a3cff", bg: "#f2eaff" },
  { id: 6, name: "Street Hi-Top", category: "sneakers", price: 5499, rating: 4, color: "#14161f", bg: "#eceef4" },
  { id: 7, name: "Summit Boot",   category: "boots",    price: 8999, rating: 5, color: "#c0392b", bg: "#fbeceb" },
  { id: 8, name: "Daily Canvas",  category: "casual",   price: 2499, rating: 4, color: "#f5a623", bg: "#fff6e6" },
];

// ---------- Helpers ----------
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const money = (n) => "₹" + n.toLocaleString("en-IN");
const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

// Inline SVG shoe, coloured per product
function shoeSVG(color = "#ff4d2e") {
  return `
  <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Shoe illustration">
    <!-- sole -->
    <path d="M10 92 Q10 80 28 80 L176 80 Q194 80 192 94 Q190 106 172 106 L30 106 Q10 106 10 92Z" fill="#ffffff"/>
    <path d="M10 92 Q10 98 18 100 L184 100 Q192 98 192 94" fill="none" stroke="#d9dce6" stroke-width="3"/>
    <!-- upper -->
    <path d="M24 80 Q22 46 44 38 L70 30 Q82 44 104 50 Q132 56 160 66 Q184 72 186 80Z" fill="${color}"/>
    <!-- tongue / collar -->
    <path d="M44 38 Q50 20 70 18 Q76 24 70 30Z" fill="${color}" opacity="0.75"/>
    <!-- toe cap -->
    <path d="M140 62 Q172 66 186 80 L150 80 Q146 70 140 62Z" fill="#000" opacity="0.12"/>
    <!-- swoosh stripe -->
    <path d="M40 76 Q90 70 132 58" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
    <!-- laces -->
    <g stroke="#fff" stroke-width="3" stroke-linecap="round">
      <line x1="80" y1="38" x2="92" y2="46"/>
      <line x1="94" y1="44" x2="106" y2="52"/>
      <line x1="108" y1="50" x2="120" y2="56"/>
    </g>
  </svg>`;
}

// ---------- Cart state ----------
let cart = JSON.parse(localStorage.getItem("stride-cart") || "[]");
const saveCart = () => localStorage.setItem("stride-cart", JSON.stringify(cart));

// ---------- Render products ----------
const grid = $("#product-grid");

function renderProducts(filter = "all") {
  const list = filter === "all" ? products : products.filter((p) => p.category === filter);
  grid.innerHTML = list
    .map(
      (p, i) => `
    <article class="card" style="animation-delay:${i * 0.05}s">
      <div class="card-img" style="background:${p.bg}">${shoeSVG(p.color)}</div>
      <div class="card-body">
        <span class="tag">${p.category}</span>
        <h3>${p.name}</h3>
        <div class="rating" aria-label="${p.rating} out of 5 stars">${stars(p.rating)}</div>
        <div class="card-foot">
          <span class="price">${money(p.price)}</span>
          <button class="add-btn" data-id="${p.id}">Add to cart</button>
        </div>
      </div>
    </article>`
    )
    .join("");
}

// Filters
$$(".filter").forEach((btn) =>
  btn.addEventListener("click", () => {
    $$(".filter").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderProducts(btn.dataset.filter);
  })
);

// Add to cart (event delegation)
grid.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-btn");
  if (!btn) return;
  addToCart(Number(btn.dataset.id));
});

// ---------- Cart logic ----------
function addToCart(id) {
  const existing = cart.find((i) => i.id === id);
  if (existing) existing.qty++;
  else cart.push({ id, qty: 1 });
  saveCart();
  updateCart();
  const p = products.find((x) => x.id === id);
  showToast(`${p.name} added to cart`);
}

function changeQty(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((i) => i.id !== id);
  saveCart();
  updateCart();
}

function removeItem(id) {
  cart = cart.filter((i) => i.id !== id);
  saveCart();
  updateCart();
}

function updateCart() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.qty * products.find((p) => p.id === i.id).price, 0);

  const badge = $("#cart-count");
  badge.textContent = count;
  badge.classList.remove("bump");
  void badge.offsetWidth; // restart animation
  badge.classList.add("bump");

  $("#cart-total").textContent = money(total);

  const list = $("#cart-items");
  if (!cart.length) {
    list.innerHTML = `<li class="cart-empty">Your cart is empty.</li>`;
    return;
  }
  list.innerHTML = cart
    .map((i) => {
      const p = products.find((x) => x.id === i.id);
      return `
      <li class="cart-item">
        <div class="cart-thumb" style="background:${p.bg}">${shoeSVG(p.color)}</div>
        <div>
          <h4>${p.name}</h4>
          <span class="price">${money(p.price * i.qty)}</span>
          <div class="qty">
            <button data-act="dec" data-id="${p.id}" aria-label="Decrease quantity">−</button>
            <span>${i.qty}</span>
            <button data-act="inc" data-id="${p.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button class="remove" data-act="rm" data-id="${p.id}" aria-label="Remove ${p.name}">✕</button>
      </li>`;
    })
    .join("");
}

$("#cart-items").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.dataset.act === "inc") changeQty(id, 1);
  if (btn.dataset.act === "dec") changeQty(id, -1);
  if (btn.dataset.act === "rm") removeItem(id);
});

// Drawer open / close
const drawer = $("#cart-drawer");
const overlay = $("#overlay");

function toggleCart(open) {
  drawer.classList.toggle("open", open);
  overlay.classList.toggle("show", open);
  drawer.setAttribute("aria-hidden", String(!open));
}
$("#cart-btn").addEventListener("click", () => toggleCart(true));
$("#cart-close").addEventListener("click", () => toggleCart(false));
overlay.addEventListener("click", () => toggleCart(false));
document.addEventListener("keydown", (e) => e.key === "Escape" && toggleCart(false));

$("#clear-btn").addEventListener("click", () => {
  cart = [];
  saveCart();
  updateCart();
});
$("#checkout-btn").addEventListener("click", () => {
  if (!cart.length) return showToast("Your cart is empty");
  cart = [];
  saveCart();
  updateCart();
  toggleCart(false);
  showToast("Thanks! This is a demo — no real order placed.");
});

// ---------- Toast ----------
let toastTimer;
function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

// ---------- Mobile menu ----------
const menu = $("#nav-menu");
const toggle = $("#menu-toggle");
toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});
$$("#nav-menu a").forEach((a) =>
  a.addEventListener("click", () => {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  })
);

// ---------- Highlight active nav link on scroll ----------
const sections = $$("main section[id]");
const links = $$("#nav-menu a");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + entry.target.id));
      }
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
sections.forEach((s) => observer.observe(s));

// ---------- Newsletter form ----------
$("#newsletter-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("#email").value.trim();
  const msg = $("#form-msg");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  msg.className = "form-msg " + (valid ? "success" : "error");
  msg.textContent = valid ? "You're in! Check your inbox for your 10% code." : "Please enter a valid email address.";
  if (valid) e.target.reset();
});

// ---------- Init ----------
$("#hero-shoe").innerHTML = shoeSVG("#14161f");
$("#year").textContent = new Date().getFullYear();
renderProducts();
updateCart();