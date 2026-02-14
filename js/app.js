// ===== STATE =====
let spots = [];
let savedSpots = new Set();
let currentFilter = 'all';
let map;

// ===== CATEGORY COLORS =====
const categoryColors = {
    'Nightlife': { hex: '#D4622B', rgba: 'rgba(212, 98, 43, 0.75)' },
    'Relax':     { hex: '#2D9D78', rgba: 'rgba(45, 157, 120, 0.75)' },
    'Parks':     { hex: '#1A8A5C', rgba: 'rgba(26, 138, 92, 0.75)' },
    'Classics':  { hex: '#D4982B', rgba: 'rgba(212, 152, 43, 0.75)' },
    'Food':      { hex: '#C94444', rgba: 'rgba(201, 68, 68, 0.75)' },
    'Rooftops':  { hex: '#6366F1', rgba: 'rgba(99, 102, 241, 0.75)' }
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    loadSpots();
    initNavbarScroll();
    initMap();
    renderFilters();
    renderCards();
    renderCharts();
    updateSavedCount();
    initScrollAnimations();
});

// ===== DATA LOADING =====
function loadSpots() {
    if (typeof SPOTS_DATA !== 'undefined') {
        spots = SPOTS_DATA;
    } else {
        console.error('Spots data not found. Make sure data/spots.js is loaded.');
    }
}

// ===== NAVBAR SCROLL EFFECT =====
function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    const observer = new IntersectionObserver(
        ([entry]) => {
            navbar.classList.toggle('scrolled', !entry.isIntersecting);
        },
        { threshold: 0.8 }
    );
    const hero = document.querySelector('.hero');
    if (hero) observer.observe(hero);
}

// ===== MAP =====
function initMap() {
    map = L.map('map', {
        zoomControl: false,
        scrollWheelZoom: true
    }).setView([13.74, 100.53], 12);

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    spots.forEach(spot => {
        const color = categoryColors[spot.category]?.hex || '#888';

        const iconHtml = `
            <div style="
                width: 14px; 
                height: 14px; 
                background: ${color}; 
                border: 2.5px solid #fff; 
                border-radius: 50%; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                transition: transform 0.2s;
            "></div>
        `;

        const icon = L.divIcon({
            html: iconHtml,
            className: 'custom-marker',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
            popupAnchor: [0, -10]
        });

        const marker = L.marker([spot.lat, spot.lng], { icon }).addTo(map);

        const popupContent = `
            <div class="popup-card" onclick="openModal(${spot.id})">
                <img src="${spot.image}" alt="${spot.name}" loading="lazy">
                <div class="popup-card-body">
                    <div class="popup-card-title">${spot.name}</div>
                    <div class="popup-card-category" style="color:${color}">${spot.category}</div>
                    <div class="popup-card-tagline">${spot.tagline}</div>
                    <button class="popup-btn">See Details →</button>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent);
    });
}

// ===== FILTERS =====
function renderFilters() {
    const container = document.getElementById('filter-container');
    if (!container) return;

    const categories = ['all', ...new Set(spots.map(s => s.category)), 'Saved'];
    const labels = {
        'all': 'All',
        'Nightlife': 'Nightlife',
        'Relax': 'Relax',
        'Parks': 'Parks',
        'Classics': 'Classics',
        'Food': 'Food & Markets',
        'Rooftops': 'Rooftops',
        'Saved': '♥ Saved'
    };

    container.innerHTML = '';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${cat === 'all' ? 'active' : ''}`;
        btn.dataset.filter = cat;
        btn.textContent = labels[cat] || cat;
        btn.addEventListener('click', () => setFilter(cat));
        container.appendChild(btn);
    });
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderCards();
}

// ===== CARDS =====
function renderCards() {
    const grid = document.getElementById('cards-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const filtered = spots.filter(spot => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'Saved') return savedSpots.has(spot.id);
        return spot.category === currentFilter;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state"><p>No spots found in this category.</p></div>`;
        return;
    }

    filtered.forEach((spot, index) => {
        const isSaved = savedSpots.has(spot.id);
        const card = document.createElement('div');
        card.className = 'card fade-in';
        card.onclick = (e) => { if (!e.target.closest('.save-btn')) openModal(spot.id); };

        card.innerHTML = `
            <div class="card-image-wrapper">
                <img class="card-image" src="${spot.image}" alt="${spot.name}" loading="lazy">
                <div class="card-image-overlay"></div>
                ${spot.mustDo ? '<div class="card-badge"><span class="badge-must-do">★ Must Do</span></div>' : ''}
            </div>
            <div class="card-body">
                <div>
                    <div class="card-category">${spot.category}</div>
                    <h3 class="card-title">${spot.name}</h3>
                    <p class="card-desc">${spot.description}</p>
                </div>
                <div class="card-footer">
                    <span class="card-location">📍 ${spot.location}</span>
                    <button class="save-btn ${isSaved ? 'saved' : ''}" onclick="toggleSave(event, ${spot.id})">
                        ${isSaved ? '♥ Saved' : '♡ Save'}
                    </button>
                </div>
            </div>
        `;

        grid.appendChild(card);

        // Trigger animation
        requestAnimationFrame(() => {
            setTimeout(() => card.classList.add('visible'), index * 60);
        });
    });
}

// ===== SAVE FUNCTIONALITY =====
function toggleSave(e, id) {
    e.stopPropagation();
    if (savedSpots.has(id)) savedSpots.delete(id);
    else savedSpots.add(id);
    updateSavedCount();
    renderCards();
}

function updateSavedCount() {
    const el = document.getElementById('saved-count');
    if (el) el.textContent = savedSpots.size;
}

// ===== CHARTS =====
function renderCharts() {
    renderVibeChart();
    renderCategoryChart();
}

function renderVibeChart() {
    const ctx = document.getElementById('vibeChart');
    if (!ctx) return;

    const scatterData = spots.map(spot => ({
        x: spot.chaosScore,
        y: spot.costScore,
        r: spot.mustDo ? 10 : 7,
        spotId: spot.id,
        name: spot.name,
        category: spot.category
    }));

    new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'Spots',
                data: scatterData,
                backgroundColor: (c) => categoryColors[c.raw?.category]?.rgba || 'rgba(128,128,128,0.5)',
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    min: -1, max: 11,
                    title: { display: true, text: 'Energy  (Chill → Chaotic)', font: { family: 'Inter', size: 11 }, color: '#9A9A9A' },
                    grid: { color: 'rgba(0,0,0,0.04)' },
                    ticks: { font: { family: 'Inter', size: 10 }, color: '#9A9A9A' }
                },
                y: {
                    min: 0, max: 10,
                    title: { display: true, text: 'Price  (Free → High End)', font: { family: 'Inter', size: 11 }, color: '#9A9A9A' },
                    grid: { color: 'rgba(0,0,0,0.04)' },
                    ticks: { font: { family: 'Inter', size: 10 }, color: '#9A9A9A' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(17,17,17,0.9)',
                    titleFont: { family: 'Inter', weight: '600' },
                    bodyFont: { family: 'Inter' },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: (c) => `${c.raw.name}  •  ${c.raw.category}`
                    }
                }
            },
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    openModal(scatterData[elements[0].index].spotId);
                }
            }
        }
    });
}

function renderCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    const catCounts = {};
    spots.forEach(s => catCounts[s.category] = (catCounts[s.category] || 0) + 1);

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(catCounts),
            datasets: [{
                data: Object.values(catCounts),
                backgroundColor: Object.keys(catCounts).map(k => categoryColors[k]?.rgba || 'rgba(128,128,128,0.5)'),
                borderWidth: 0,
                spacing: 3,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Inter', size: 11 },
                        color: '#6B6B6B',
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 8
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17,17,17,0.9)',
                    titleFont: { family: 'Inter', weight: '600' },
                    bodyFont: { family: 'Inter' },
                    padding: 12,
                    cornerRadius: 8
                }
            }
        }
    });
}

// ===== MODAL =====
function openModal(id) {
    const spot = spots.find(s => s.id === id);
    if (!spot) return;

    const overlay = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');

    const vibes = spot.vibe.split(',').map(v => `<span class="vibe-tag">${v.trim()}</span>`).join('');

    body.innerHTML = `
        <button class="modal-close" onclick="closeModal()" aria-label="Close">&times;</button>
        <div class="modal-hero">
            <img src="${spot.image}" alt="${spot.name}">
            <div class="modal-hero-overlay">
                <div class="modal-hero-text">
                    <span class="modal-category">${spot.category}</span>
                    <h2>${spot.name}</h2>
                </div>
            </div>
        </div>
        <div class="modal-details">
            <p class="modal-tagline">"${spot.tagline}"</p>
            <div class="modal-grid">
                <div class="modal-info">
                    <h4>The Experience</h4>
                    <p>${spot.description}</p>
                    <div class="modal-vibe-tags">${vibes}</div>
                </div>
                <div class="modal-tip">
                    <h4>⚡ Insider Tip</h4>
                    <p>${spot.insiderTip}</p>
                </div>
            </div>
            <div class="modal-location-bar">
                <div class="modal-location-text">
                    <h4>Location</h4>
                    <p>📍 ${spot.location}</p>
                </div>
                <a href="${spot.mapLink}" target="_blank" rel="noopener" class="btn-map">
                    Open in Google Maps ↗
                </a>
            </div>
        </div>
    `;

    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
        overlay.classList.add('showing');
    });
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('showing');
    setTimeout(() => {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }, 300);
}

// Close modal on overlay click or Escape
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') closeModal();
        });
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ===== UTILITY =====
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}
