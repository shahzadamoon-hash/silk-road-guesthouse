// ==========================================
// DATA SIMULATION (localStorage)
// ==========================================
const defaultData = {
  bookings: [
    { id: 1, name: "John Doe", email: "john@example.com", mobile: "+7 701 123 4567", room: "Double Room", checkin: "2026-06-10", checkout: "2026-06-14", guests: "2 guests", status: "pending" },
    { id: 2, name: "Aisha K.", email: "aisha@example.com", mobile: "+7 777 987 6543", room: "Triple Room", checkin: "2026-07-01", checkout: "2026-07-05", guests: "3 guests", status: "confirmed" }
  ],
  reviews: [
    { id: 1, name: "Marco Rossi", country: "Italy", rating: 10, comment: "Absolutely stunning stay. The courtyard was a peaceful oasis.", status: "pending" },
    { id: 2, name: "Sarah Jenkins", country: "UK", rating: 9, comment: "Beautiful room, very comfortable beds, and the breakfast was delicious.", status: "pending" }
  ],
  rooms: [
    { id: "triple-room", name: "Triple Room", price: 1494, status: "Available", image: "" },
    { id: "twin-room", name: "Twin Room", price: 1886, status: "Available", image: "" },
    { id: "double-room", name: "Double Room", price: 3348, status: "Available", image: "" }
  ]
};

// Load data from localStorage or initialize with defaults
let db = JSON.parse(localStorage.getItem('sr_admin_data')) || defaultData;
let searchQuery = "";

function saveData() {
  try {
    localStorage.setItem('sr_admin_data', JSON.stringify(db));
    updateDashboard();
  } catch (e) {
    alert("Storage limit reached! Try uploading a smaller image.");
  }
}

// ==========================================
// IMAGE RESIZER (Converts to Base64 to save space)
// ==========================================
function resizeImage(file, maxWidth, maxHeight) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG at 70% quality
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

// ==========================================
// LOGIN LOGIC
// ==========================================
const loginOverlay = document.getElementById('login-overlay');
const dashboard = document.getElementById('dashboard');
const loginBtn = document.getElementById('login-btn');
const passwordInput = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');

loginBtn.addEventListener('click', () => {
  if (passwordInput.value === 'silkroad2026') {
    loginOverlay.style.display = 'none';
    dashboard.style.display = 'grid';
    updateDashboard();
  } else {
    loginError.style.display = 'block';
    passwordInput.value = '';
  }
});

document.getElementById('logout-btn').addEventListener('click', (e) => {
  e.preventDefault();
  dashboard.style.display = 'none';
  loginOverlay.style.display = 'grid';
  passwordInput.value = '';
});

// ==========================================
// TAB NAVIGATION
// ==========================================
const navLinks = document.querySelectorAll('.sidebar-nav a');
const tabPanels = document.querySelectorAll('.tab-panel');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = link.dataset.target;
    
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    
    tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${target}`);
    });
  });
});

// ==========================================
// SEARCH LOGIC
// ==========================================
document.getElementById('guest-search').addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase();
  updateDashboard();
});

// ==========================================
// RENDER FUNCTIONS
// ==========================================
function updateDashboard() {
  // 1. Update Stats
  document.getElementById('stat-bookings').textContent = db.bookings.length;
  const pendingReviews = db.reviews.filter(r => r.status === 'pending').length;
  document.getElementById('stat-reviews').textContent = pendingReviews;
  
  let revenue = 0;
  db.bookings.forEach(b => {
    if (b.status === 'confirmed') {
      const room = db.rooms.find(r => r.name === b.room);
      if (room) revenue += room.price * 3; 
    }
  });
  document.getElementById('stat-revenue').textContent = `₹${revenue.toLocaleString()}`;

  // 2. Render Recent Activity (Overview)
  const recentBody = document.getElementById('recent-bookings-body');
  recentBody.innerHTML = db.bookings.slice(-3).reverse().map(b => `
    <tr>
      <td><strong>${b.name}</strong></td>
      <td>${b.mobile}</td>
      <td>${b.room}</td>
      <td><span class="status-badge status-${b.status}">${b.status}</span></td>
    </tr>
  `).join('');

  // 3. Render Bookings Tab (With Search Filter)
  const bookingsBody = document.getElementById('bookings-body');
  const filteredBookings = db.bookings.filter(b => 
    b.name.toLowerCase().includes(searchQuery) || 
    b.email.toLowerCase().includes(searchQuery) || 
    b.mobile.toLowerCase().includes(searchQuery)
  );

  if (filteredBookings.length === 0) {
    bookingsBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px; color: var(--muted);">No guests found matching your search.</td></tr>';
  } else {
    bookingsBody.innerHTML = filteredBookings.map(b => `
      <tr>
        <td><strong>${b.name}</strong><br><small style="color:var(--muted)">${b.guests}</small></td>
        <td>${b.email}<br><small style="color:var(--muted)">${b.mobile}</small></td>
        <td>${b.room}</td>
        <td>${b.checkin}</td>
        <td>${b.checkout}</td>
        <td><span class="status-badge status-${b.status}">${b.status}</span></td>
        <td>
          ${b.status === 'pending' ? `
            <button class="btn-action btn-confirm" onclick="updateBookingStatus(${b.id}, 'confirmed')">Confirm</button>
            <button class="btn-action btn-cancel" onclick="updateBookingStatus(${b.id}, 'cancelled')">Cancel</button>
          ` : ''}
        </td>
      </tr>
    `).join('');
  }

  // 4. Render Reviews Tab
  const reviewsGrid = document.getElementById('reviews-grid');
  if (db.reviews.length === 0) {
    reviewsGrid.innerHTML = '<p style="color:var(--muted);">No reviews pending approval.</p>';
  } else {
    reviewsGrid.innerHTML = db.reviews.map(r => `
      <div class="review-admin-card">
        <div class="stars">${'★'.repeat(Math.round(r.rating/2))}${'☆'.repeat(5-Math.round(r.rating/2))}</div>
        <p>“${r.comment}”</p>
        <div class="author">${r.name} · ${r.country}</div>
        <div class="review-actions">
          <button class="btn-approve" onclick="approveReview(${r.id})">Approve</button>
          <button class="btn-delete" onclick="deleteReview(${r.id})">Delete</button>
        </div>
      </div>
    `).join('');
  }

  // 5. Render Rooms Tab
  const roomsGrid = document.getElementById('room-settings-grid');
  roomsGrid.innerHTML = db.rooms.map(r => `
    <div class="room-setting-card">
      <!-- Show Image Preview or a placeholder -->
      <img src="${r.image || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=400&q=80'}" class="room-image-preview" alt="${r.name}">
      
      <h3>${r.name}</h3>
      
      <!-- Upload Button -->
      <label class="upload-btn" for="img-${r.id}">Update Picture</label>
      <input type="file" id="img-${r.id}" accept="image/*" onchange="updateRoomImage('${r.id}', this)">
      
      <label>Nightly Price (₹)</label>
      <input type="number" id="price-${r.id}" value="${r.price}">
      <button onclick="updateRoomPrice('${r.id}')">Save Price</button>
    </div>
  `).join('');
}

// ==========================================
// ACTION HANDLERS
// ==========================================
window.updateBookingStatus = function(id, status) {
  const booking = db.bookings.find(b => b.id === id);
  if (booking) {
    booking.status = status;
    saveData();
  }
};

window.approveReview = function(id) {
  db.reviews = db.reviews.filter(r => r.id !== id);
  saveData();
  alert('Review approved!');
};

window.deleteReview = function(id) {
  if (confirm('Are you sure you want to delete this review?')) {
    db.reviews = db.reviews.filter(r => r.id !== id);
    saveData();
  }
};

window.updateRoomPrice = function(roomId) {
  const newPrice = document.getElementById(`price-${roomId}`).value;
  const room = db.rooms.find(r => r.id === roomId);
  if (room) {
    room.price = Number(newPrice);
    saveData();
    alert(`${room.name} price updated to ₹${Number(newPrice).toLocaleString()}`);
  }
};

// Process and save image for existing room
window.updateRoomImage = async function(roomId, input) {
  if (!input.files || input.files.length === 0) return;
  
  const file = input.files[0];
  try {
    // Resize to max 600x600 and compress to save localStorage space
    const base64Image = await resizeImage(file, 600, 600);
    const room = db.rooms.find(r => r.id === roomId);
    if (room) {
      room.image = base64Image;
      saveData();
    }
  } catch (error) {
    alert("Error processing image.");
    console.error(error);
  }
};

// Add a completely new room
window.addNewRoom = async function() {
  const nameInput = document.getElementById('new-room-name');
  const priceInput = document.getElementById('new-room-price');
  const imageInput = document.getElementById('new-room-image');
  
  const name = nameInput.value.trim();
  const price = Number(priceInput.value);

  if (!name || !price) {
    alert("Please enter both a room name and a valid price.");
    return;
  }

  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  if (db.rooms.some(r => r.id === id)) {
    alert("A room with this name already exists.");
    return;
  }

  let base64Image = "";
  
  // Process image if uploaded
  if (imageInput.files && imageInput.files.length > 0) {
    try {
      base64Image = await resizeImage(imageInput.files[0], 600, 600);
    } catch (error) {
      console.warn("Image upload failed, adding room without image.");
    }
  }

  db.rooms.push({ id: id, name: name, price: price, status: "Available", image: base64Image });
  saveData();

  nameInput.value = '';
  priceInput.value = '';
  imageInput.value = '';
  alert(`${name} has been added successfully!`);
};