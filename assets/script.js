const url = "http://localhost:5000"
const preloader = document.querySelector('.preloader');
window.addEventListener('load', () => setTimeout(() => preloader.classList.add('done'), 350));

const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.classList.toggle('active', open);
  menuButton.setAttribute('aria-expanded', String(open));
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.classList.remove('active');
  menuButton.setAttribute('aria-expanded', 'false');
}));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

document.getElementById('year').textContent = new Date().getFullYear();

const checkin = document.querySelector('[name="checkin"]');
const checkout = document.querySelector('[name="checkout"]');
const today = new Date();
const localDate = d => {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
};
checkin.min = localDate(today);
checkout.min = localDate(today);
checkin.addEventListener('change', () => {
  checkout.min = checkin.value || localDate(today);
  if (checkout.value && checkout.value <= checkin.value) checkout.value = '';
});

document.getElementById('enquiry-form').addEventListener('submit', async function(event) {
    event.preventDefault();
  const form = new FormData(event.currentTarget);
  if (form.get('checkout') <= form.get('checkin')) {
    document.querySelector('.form-status').textContent = 'Please choose a check-out date after your check-in date.';
    return;
  }
  
  statusText = document.querySelector('.form-status');
  
  const bookingData = {
    'name': form.get('name'),
    'mobile': form.get('mobile'),
    'email': form.get('email'),
    'checkin': form.get('checkin'),
    'checkout': form.get('checkout'),
    'guests': form.get('guests'),
    'room': form.get('room'),
    'message': form.get('message') || '—'
  };

  
  try {
      const response = await fetch(`${url}/api/book`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(bookingData)
      });
      
      if (response.ok) {
          statusText.textContent = 'Enquiry sent successfully! We will contact you shortly.';
          statusText.style.color = '#55745a'; // Green
          event.target.reset();
      } else{
          throw new Error('Server error');
      }
  } catch(error) {
      statusText.textContent = 'Something went wrong. Please try again or call / email us directly.';
      statusText.style.color = '#d9534f'; // Red
  }
});


// ==========================================
// DYNAMIC GALLERY BUILDER
// ==========================================
const gallery = document.getElementById('photo-gallery');
const lightbox = document.getElementById('gallery-lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxCount = document.getElementById('lightbox-count');
let activePhoto = 0;
let photoPaths = []; // Populated dynamically

function buildGallery(paths) {
  if (!gallery) return;
  gallery.innerHTML = ''; // Clear container
  
  paths.forEach((src, i) => {
    const tile = document.createElement('button');
    tile.className = 'gallery-tile';
    tile.type = 'button';
    tile.dataset.index = `${String(i + 1).padStart(2, '0')} / ${paths.length}`;
    tile.setAttribute('aria-label', `Open guesthouse photograph ${i + 1}`);
    
    const img = document.createElement('img');
    img.src = src;
    img.alt = `Silk Road Guesthouse photograph ${i + 1}`;
    img.loading = i < 4 ? 'eager' : 'lazy';
    
    img.onerror = () => {
      tile.classList.add('image-missing');
      tile.title = `Add ${src} to display this photograph`;
      tile.innerHTML = `<span class="missing-photo">PHOTO ${String(i + 1).padStart(2, '0')}<small>${src.split('/').pop()}</small></span>`;
    };
    
    tile.appendChild(img);
    tile.addEventListener('click', () => openPhoto(i));
    gallery.appendChild(tile);
    observer.observe(tile);
  });
}

// 1. Try to fetch the directory listing from the server
fetch('https://github.com/shahzadamoon-hash/silk-road-guesthouse/tree/main/assets/gallery')
  .then(res => {
    if (!res.ok) throw new Error('Directory listing blocked');
    return res.text();
  })
  .then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = Array.from(doc.querySelectorAll('a'));
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
    
    const images = links
      .map(a => a.getAttribute('href'))
      .filter(href => {
        if (!href) return false;
        // Ignore subdirectories or parent directory links
        if (href.endsWith('/') || href.startsWith('?')) return false;
        // Check if it ends with a valid image extension
        return validExtensions.some(ext => href.toLowerCase().endsWith(ext));
      })
      .map(href => `assets/gallery/${href.split('/').pop()}`); // Ensure clean path

    if (images.length === 0) throw new Error('No images found in directory');
    
    // Sort alphabetically to maintain a consistent order
    images.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    
    photoPaths = images;
    buildGallery(photoPaths);
  })
  .catch(err => {
    console.warn('Could not scan directory (server likely blocks listing). Using fallback 24 images.', err);
    // Fallback: Default to 24 hardcoded images
    photoPaths = Array.from({length: 24}, (_, i) => `assets/gallery/image-${String(i + 1).padStart(2, '0')}.jpg`);
    buildGallery(photoPaths);
  });


function openPhoto(index) {
  if (photoPaths.length === 0) return;
  activePhoto = (index + photoPaths.length) % photoPaths.length;
  lightboxImage.src = photoPaths[activePhoto];
  lightboxCount.textContent = `${String(activePhoto + 1).padStart(2, '0')} / ${photoPaths.length}`;
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closePhoto() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.querySelector('.lightbox-close').addEventListener('click', closePhoto);
document.querySelector('.lightbox-prev').addEventListener('click', () => openPhoto(activePhoto - 1));
document.querySelector('.lightbox-next').addEventListener('click', () => openPhoto(activePhoto + 1));
lightbox.addEventListener('click', e => { if (e.target === lightbox) closePhoto(); });
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closePhoto();
  if (e.key === 'ArrowLeft') openPhoto(activePhoto - 1);
  if (e.key === 'ArrowRight') openPhoto(activePhoto + 1);
});


// ==========================================
// REVIEWS
// ==========================================
fetch('reviews.json')
  .then(response => { if (!response.ok) throw new Error('Review data unavailable'); return response.json(); })
  .then(data => {
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];
    const list = document.getElementById('review-list');
    list.innerHTML = '';

    const buildCard = (review, clone) => {
      const card = document.createElement('article');
      card.className = 'review-card';
      if (clone) card.setAttribute('aria-hidden', 'true');

      const rating = Math.max(0, Math.min(10, Number(review.rating) || 0));
      const stars = '★'.repeat(Math.round(rating / 2)) + '☆'.repeat(5 - Math.round(rating / 2));
      const starLine = document.createElement('div');
      starLine.className = 'review-card-stars';
      starLine.textContent = `${stars}  ${rating.toFixed(1)}/10`;

      const quote = document.createElement('p');
      quote.textContent = `“${review.comment || ''}”`;

      const author = document.createElement('div');
      author.className = 'review-card-author';
      author.textContent = `${review.name || 'GUEST'}${review.country ? ` · ${review.country}` : ''}${review.date ? ` · ${review.date}` : ''}`;

      card.append(starLine, quote, author);
      return card;
    };

    reviews.forEach(review => list.appendChild(buildCard(review, false)));
    reviews.forEach(review => list.appendChild(buildCard(review, true)));

    if (!reviews.length) {
      list.innerHTML = '<p class="review-disclaimer">No guest reviews have been added yet.</p>';
      return;
    }

    if (Number.isFinite(Number(data.averageRating))) {
      document.getElementById('review-average').textContent = Number(data.averageRating).toFixed(1);
    }
    
    const total = data.reviewCount ?? reviews.length;
    const avg = Number(data.averageRating) || 0;
    
    let desc = "Good";
    if (avg >= 9) desc = "Exceptional";
    else if (avg >= 8) desc = "Excellent";
    else if (avg >= 7) desc = "Very good";
    
    document.getElementById('review-total').textContent = `${desc} · ${total} review${total === 1 ? '' : 's'}`;

    setupReviewScroller(list);
  })
  .catch(() => {
    const list = document.getElementById('review-list');
    if (list && !list.children.length) {
      list.innerHTML = '<p class="review-disclaimer">Reviews are temporarily unavailable.</p>';
    }
  });


function setupReviewScroller(list) {
  const nav = document.createElement('div');
  nav.className = 'review-nav';
  nav.innerHTML = `
    <button type="button" class="review-prev" aria-label="Previous reviews">‹</button>
    <button type="button" class="review-pause" aria-label="Pause auto-scroll" aria-pressed="false">❙❙</button>
    <span class="review-progress" aria-hidden="true"></span>
    <button type="button" class="review-next" aria-label="Next reviews">›</button>
  `;
  list.insertAdjacentElement('afterend', nav);

  const prevBtn  = nav.querySelector('.review-prev');
  const nextBtn  = nav.querySelector('.review-next');
  const pauseBtn = nav.querySelector('.review-pause');
  const progress = nav.querySelector('.review-progress');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED = 30;            
  const RESUME_DELAY = 2500;   

  let userPaused = false;
  let hoverPaused = false;
  let userPausedUntil = 0;
  let lastTime = 0;
  let rafId = null;

  function halfWidth() {
    const cards = list.querySelectorAll('.review-card');
    const half = cards.length / 2;
    if (!cards.length || !cards[half]) return list.scrollWidth / 2;
    return cards[half].offsetLeft - list.offsetLeft;
  }

  function wrap() {
    const half = halfWidth();
    if (half > 0 && list.scrollLeft >= half) list.scrollLeft -= half;
  }

  function updateProgress() {
    const half = halfWidth();
    if (!half) { progress.style.setProperty('--p', '0%'); return; }
    const pos = (list.scrollLeft % half) / half;
    progress.style.setProperty('--p', `${pos * 100}%`);
  }

  const isPaused = () => userPaused || hoverPaused || reduceMotion || performance.now() < userPausedUntil;

  function tick(now) {
    if (!lastTime) lastTime = now;
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    if (!isPaused() && dt > 0 && dt < 0.5) {
      list.scrollLeft += SPEED * dt;
      wrap();
      updateProgress();
    }
    rafId = requestAnimationFrame(tick);
  }

  const bumpInteraction = () => { userPausedUntil = performance.now() + RESUME_DELAY; };

  list.addEventListener('mouseenter', () => { hoverPaused = true; });
  list.addEventListener('mouseleave', () => { hoverPaused = false; lastTime = 0; });
  list.addEventListener('focusin',    () => { hoverPaused = true; });
  list.addEventListener('focusout',   () => { hoverPaused = false; lastTime = 0; });

  list.addEventListener('wheel',       bumpInteraction, { passive: true });
  list.addEventListener('touchstart',  bumpInteraction, { passive: true });
  list.addEventListener('pointerdown', bumpInteraction);

  const stepSize = () => {
    const card = list.querySelector('.review-card');
    if (!card) return 320;
    const gap = parseFloat(getComputedStyle(list).columnGap) || 16;
    return card.getBoundingClientRect().width + gap;
  };
  function scrollByCard(dir) {
    bumpInteraction();
    list.scrollBy({ left: dir * stepSize(), behavior: 'smooth' });
    setTimeout(wrap, 450);
  }
  prevBtn.addEventListener('click', () => scrollByCard(-1));
  nextBtn.addEventListener('click', () => scrollByCard(1));

  pauseBtn.addEventListener('click', () => {
    userPaused = !userPaused;
    pauseBtn.setAttribute('aria-pressed', String(userPaused));
    pauseBtn.setAttribute('aria-label', userPaused ? 'Play auto-scroll' : 'Pause auto-scroll');
    pauseBtn.textContent = userPaused ? '▶' : '❙❙';
    lastTime = 0;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!rafId) {
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    }
  });

  updateProgress();
  rafId = requestAnimationFrame(tick);
}

// ==========================================
// ROOM VIEW & RESERVE LOGIC
// ==========================================
const suiteDialog = document.getElementById('suite-dialog');
const suiteDialogTitle = document.getElementById('suite-dialog-title');
const suiteDialogImage = document.getElementById('suite-dialog-image');
const suiteDialogCopy = document.getElementById('suite-dialog-copy');
const suiteDialogReserve = document.getElementById('suite-dialog-reserve');

if (suiteDialog) {
  // Open Room Preview Modal
  document.querySelectorAll('.suite-view-room').forEach(btn => {
    btn.addEventListener('click', () => {
      const roomName = btn.dataset.room;
      
      const displayRoom = roomName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      
      suiteDialogTitle.textContent = displayRoom;
      suiteDialogImage.src = `assets/gallery/${roomName}.jpg`;
      suiteDialogCopy.textContent = `View of the ${displayRoom} at Silk Road Guesthouse.`;
      
      suiteDialogReserve.dataset.reserve = displayRoom;
      
      suiteDialog.showModal();
    });
  });

  // Close Modal
  document.querySelector('.suite-dialog-close').addEventListener('click', () => {
    suiteDialog.close();
  });

  // Reserve from within the Modal
  suiteDialogReserve.addEventListener('click', () => {
    const room = suiteDialogReserve.dataset.reserve;
    const roomSelect = document.querySelector('[name="room"]');
    if (roomSelect && room) roomSelect.value = room;
    
    suiteDialog.close();
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
  });

  // Select & Reserve from the Card (Anchor tag)
  document.querySelectorAll('.suite-reserve').forEach(btn => {
    btn.addEventListener('click', () => {
      const room = btn.dataset.reserve;
      const roomSelect = document.querySelector('[name="room"]');
      if (roomSelect && room) roomSelect.value = room;
    });
  });
}