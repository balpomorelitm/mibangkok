// ===== STATE =====
let spots = [];
let savedSpots = new Set();
let currentFilter = 'all';
let searchQuery = '';
let map;
let routeLayer = null;
let markers = [];
let userLocationMarker = null;

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
    initSearch();
    initItinerary();
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

// ===== SEARCH =====
function initSearch() {
    const input = document.getElementById('search-input');
    if (!input) return;
    input.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderCards();
    });
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
        marker.spotId = spot.id;
        markers.push(marker);
    });
}

// ===== ROUTE ON MAP =====
function drawRoute() {
    // Remove existing route
    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }

    if (savedSpots.size < 2) return;

    const savedArr = spots.filter(s => savedSpots.has(s.id));
    const latlngs = savedArr.map(s => [s.lat, s.lng]);

    routeLayer = L.polyline(latlngs, {
        color: '#D4622B',
        weight: 3,
        opacity: 0.8,
        dashArray: '10, 8',
        lineJoin: 'round'
    }).addTo(map);

    // Add numbered markers for route order
    savedArr.forEach((spot, idx) => {
        L.marker([spot.lat, spot.lng], {
            icon: L.divIcon({
                html: `<div class="route-number">${idx + 1}</div>`,
                className: 'route-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).addTo(map);
    });

    map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
}

// ===== GEOLOCATION / NEAR ME =====
function locateMe() {
    const btn = document.getElementById('locate-btn');
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }

    if (btn) btn.classList.add('loading');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            // Add user marker
            if (userLocationMarker) map.removeLayer(userLocationMarker);
            userLocationMarker = L.marker([userLat, userLng], {
                icon: L.divIcon({
                    html: '<div class="user-marker-dot"></div>',
                    className: 'user-marker',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(map).bindPopup('You are here').openPopup();

            // Sort spots by distance
            spots.sort((a, b) => {
                const distA = haversine(userLat, userLng, a.lat, a.lng);
                const distB = haversine(userLat, userLng, b.lat, b.lng);
                return distA - distB;
            });

            // Add distance info to spots
            spots.forEach(s => {
                s._distance = haversine(userLat, userLng, s.lat, s.lng);
            });

            renderCards();
            map.setView([userLat, userLng], 13);

            if (btn) {
                btn.classList.remove('loading');
                btn.classList.add('active');
            }
        },
        (error) => {
            if (btn) btn.classList.remove('loading');
            alert('Could not get your location. Please enable location services.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
        btn.className = `filter-btn ${cat === currentFilter ? 'active' : ''}`;
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
        // Category filter
        if (currentFilter === 'Saved' && !savedSpots.has(spot.id)) return false;
        if (currentFilter !== 'all' && currentFilter !== 'Saved' && spot.category !== currentFilter) return false;

        // Search filter
        if (searchQuery) {
            const haystack = `${spot.name} ${spot.category} ${spot.tagline} ${spot.description} ${spot.location} ${spot.vibe}`.toLowerCase();
            return haystack.includes(searchQuery);
        }
        return true;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state"><p>No spots found.</p></div>`;
        return;
    }

    filtered.forEach((spot, index) => {
        const isSaved = savedSpots.has(spot.id);
        const card = document.createElement('div');
        card.className = 'card fade-in';
        card.onclick = (e) => { if (!e.target.closest('.save-btn')) openModal(spot.id); };

        const distanceHtml = spot._distance !== undefined
            ? `<span class="card-distance">${spot._distance.toFixed(1)} km</span>`
            : '';

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
                    <span class="card-location">📍 ${spot.location} ${distanceHtml}</span>
                    <button class="save-btn ${isSaved ? 'saved' : ''}" onclick="toggleSave(event, ${spot.id})">
                        ${isSaved ? '♥ Saved' : '♡ Save'}
                    </button>
                </div>
            </div>
        `;

        grid.appendChild(card);
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
    renderItinerary();
    drawRoute();
}

function updateSavedCount() {
    const el = document.getElementById('saved-count');
    if (el) el.textContent = savedSpots.size;
}

// ===== ITINERARY BUILDER =====
function initItinerary() {
    renderItinerary();
}

function renderItinerary() {
    const container = document.getElementById('itinerary-list');
    const emptyState = document.getElementById('itinerary-empty');
    const content = document.getElementById('itinerary-content');
    if (!container) return;

    const savedArr = spots.filter(s => savedSpots.has(s.id));

    if (savedArr.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (content) content.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (content) content.style.display = 'block';

    container.innerHTML = '';
    savedArr.forEach((spot, idx) => {
        const item = document.createElement('div');
        item.className = 'itinerary-item';
        item.draggable = true;
        item.dataset.id = spot.id;

        const color = categoryColors[spot.category]?.hex || '#888';
        item.innerHTML = `
            <div class="itinerary-number">${idx + 1}</div>
            <div class="itinerary-info">
                <div class="itinerary-name">${spot.name}</div>
                <div class="itinerary-cat" style="color:${color}">${spot.category} · ${spot.location}</div>
            </div>
            <div class="itinerary-actions">
                <button class="itinerary-up" onclick="moveItinerary(${spot.id}, -1)" title="Move up">▲</button>
                <button class="itinerary-down" onclick="moveItinerary(${spot.id}, 1)" title="Move down">▼</button>
                <button class="itinerary-remove" onclick="toggleSave(event, ${spot.id})" title="Remove">✕</button>
            </div>
        `;

        // Drag events
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);

        container.appendChild(item);
    });

    // Update route on map
    drawRoute();
}

let dragSrcId = null;

function handleDragStart(e) {
    dragSrcId = parseInt(this.dataset.id);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    const dropId = parseInt(this.dataset.id);
    if (dragSrcId === dropId) return;

    // Reorder savedSpots
    const arr = [...savedSpots];
    const fromIdx = arr.indexOf(dragSrcId);
    const toIdx = arr.indexOf(dropId);
    arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, dragSrcId);
    savedSpots = new Set(arr);
    renderItinerary();
}

function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function moveItinerary(id, direction) {
    const arr = [...savedSpots];
    const idx = arr.indexOf(id);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    savedSpots = new Set(arr);
    renderItinerary();
    drawRoute();
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

// ===== MODAL WITH GALLERY =====
let currentGalleryIndex = 0;
let currentGalleryImages = [];

// ===== NEARBY SPOTS =====
const NEARBY_RADIUS_KM = 2.5; // ~15 min walk/ride

function getNearbySpots(spot, limit = 5) {
    return spots
        .filter(s => s.id !== spot.id)
        .map(s => ({
            ...s,
            dist: haversine(spot.lat, spot.lng, s.lat, s.lng)
        }))
        .filter(s => s.dist <= NEARBY_RADIUS_KM)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, limit);
}

function openModal(id) {
    const spot = spots.find(s => s.id === id);
    if (!spot) return;

    const overlay = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');

    const vibes = spot.vibe.split(',').map(v => `<span class="vibe-tag">${v.trim()}</span>`).join('');
    const galleryImages = spot.images || [spot.image];

    currentGalleryImages = galleryImages;
    currentGalleryIndex = 0;

    const galleryDots = galleryImages.length > 1
        ? `<div class="gallery-dots">${galleryImages.map((_, i) => `<span class="gallery-dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></span>`).join('')}</div>`
        : '';

    const galleryNav = galleryImages.length > 1
        ? `<button class="gallery-prev" onclick="prevSlide(event)">‹</button><button class="gallery-next" onclick="nextSlide(event)">›</button>`
        : '';

    const isSaved = savedSpots.has(spot.id);
    const saveBtn = `<button class="modal-save-btn ${isSaved ? 'saved' : ''}" onclick="toggleSaveFromModal(${spot.id})">
        ${isSaved ? '♥ Saved to Itinerary' : '♡ Add to Itinerary'}
    </button>`;

    // Nearby spots
    const nearby = getNearbySpots(spot);
    let nearbyHtml = '';
    if (nearby.length > 0) {
        const nearbyCards = nearby.map(ns => {
            const color = categoryColors[ns.category]?.hex || '#888';
            return `<div class="nearby-card" onclick="openModal(${ns.id})">
                <img src="${ns.image}" alt="${ns.name}" loading="lazy">
                <div class="nearby-card-body">
                    <span class="nearby-card-cat" style="color:${color}">${ns.category}</span>
                    <span class="nearby-card-name">${ns.name}</span>
                    <span class="nearby-card-dist">${(ns.dist * 1000).toFixed(0)}m away</span>
                </div>
            </div>`;
        }).join('');

        nearbyHtml = `
            <div class="modal-nearby">
                <h4>📍 Nearby (< 15 min)</h4>
                <div class="nearby-scroll">${nearbyCards}</div>
            </div>`;
    }

    body.innerHTML = `
        <button class="modal-close" onclick="closeModal()" aria-label="Close">&times;</button>
        <div class="modal-hero">
            <div class="gallery-container">
                <img id="gallery-img" src="${galleryImages[0]}" alt="${spot.name}">
                ${galleryNav}
                ${galleryDots}
            </div>
            <div class="modal-hero-overlay">
                <div class="modal-hero-text">
                    <span class="modal-category">${spot.category}</span>
                    <h2>${spot.name}</h2>
                </div>
            </div>
        </div>
        <div class="modal-details">
            ${saveBtn}
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
            ${nearbyHtml}
        </div>
    `;

    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
        overlay.classList.add('showing');
    });
    document.body.style.overflow = 'hidden';
}

function toggleSaveFromModal(id) {
    if (savedSpots.has(id)) savedSpots.delete(id);
    else savedSpots.add(id);
    updateSavedCount();
    renderCards();
    renderItinerary();
    drawRoute();
    // Update button in modal
    const btn = document.querySelector('.modal-save-btn');
    if (btn) {
        const isSaved = savedSpots.has(id);
        btn.className = `modal-save-btn ${isSaved ? 'saved' : ''}`;
        btn.innerHTML = isSaved ? '♥ Saved to Itinerary' : '♡ Add to Itinerary';
    }
}

function prevSlide(e) {
    e.stopPropagation();
    currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
    updateGallery();
}

function nextSlide(e) {
    e.stopPropagation();
    currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryImages.length;
    updateGallery();
}

function goToSlide(idx) {
    currentGalleryIndex = idx;
    updateGallery();
}

function updateGallery() {
    const img = document.getElementById('gallery-img');
    if (img) {
        img.style.opacity = '0';
        setTimeout(() => {
            img.src = currentGalleryImages[currentGalleryIndex];
            img.style.opacity = '1';
        }, 200);
    }
    document.querySelectorAll('.gallery-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentGalleryIndex);
    });
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
    if (e.key === 'ArrowLeft') { prevSlide(e); }
    if (e.key === 'ArrowRight') { nextSlide(e); }
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
