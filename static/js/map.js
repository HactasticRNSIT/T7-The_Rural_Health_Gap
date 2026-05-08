// ─── Interactive Risk Map (Leaflet.js) ───
let riskMap = null;
let mapInitialized = false;
let hospitalData = [];
let redZones = [];

function initMap() {
    if (mapInitialized) return;
    mapInitialized = true;

    riskMap = L.map('risk-map', { zoomControl: true }).setView([16.2120, 77.3439], 10);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO', maxZoom: 18
    }).addTo(riskMap);

    fetch('/api/hospitals')
        .then(r => r.json())
        .then(data => {
            hospitalData = data;
            plotHospitals(data);
            detectDeserts(data);
        })
        .catch(err => console.error('Map error:', err));
}

function plotHospitals(hospitals) {
    let hCount = 0, pCount = 0;
    hospitals.forEach(h => {
        const isPhc = h.type.includes('Primary') || h.type.includes('Community');
        const color = isPhc ? '#fbbf24' : '#14b8a6';
        const icon = L.divIcon({
            html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid ${color}33;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px ${color}55">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></svg></div>`,
            className: '', iconSize: [28, 28], iconAnchor: [14, 14]
        });
        const marker = L.marker([h.lat, h.lng], { icon }).addTo(riskMap);
        marker.bindPopup(`
            <div style="min-width:200px">
                <div style="font-weight:700;font-size:14px;margin-bottom:6px;color:#e2e8f0">${h.name}</div>
                <div style="font-size:11px;color:#94a3b8;margin-bottom:8px">${h.type}</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:11px">
                    <span style="padding:2px 8px;border-radius:6px;background:rgba(20,184,166,0.15);color:#5eead4">🛏️ ${h.beds} beds</span>
                    ${h.icu ? '<span style="padding:2px 8px;border-radius:6px;background:rgba(168,85,247,0.15);color:#c084fc">ICU</span>' : ''}
                    ${h.emergency ? '<span style="padding:2px 8px;border-radius:6px;background:rgba(239,68,68,0.15);color:#f87171">ER</span>' : ''}
                </div>
                <div style="margin-top:8px;font-size:11px;color:#64748b">📞 ${h.contact}</div>
            </div>
        `);
        if (isPhc) pCount++; else hCount++;
    });
    document.getElementById('hospital-count').textContent = hCount;
    document.getElementById('phc-count').textContent = pCount;
}

function detectDeserts(hospitals) {
    // Grid-based healthcare desert detection
    const bounds = { minLat: 15.65, maxLat: 16.55, minLng: 76.3, maxLng: 77.6 };
    const step = 0.06; // ~6.6km grid
    const thresholdKm = 15;
    redZones = [];
    const villageNames = [
        'Kallur','Hatti','Yeragera','Turvihal','Ballatgi','Kodlipet','Hunsagi','Gojanur',
        'Tawaragera','Lingsugur East','Wadavatti','Ramdurg','Nilgal','Buddinni','Konkal',
        'Marched','Siraguppa','Yermankal','Basapura','Hallikhed'
    ];
    let vi = 0;

    for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += step) {
        for (let lng = bounds.minLng; lng <= bounds.maxLng; lng += step) {
            let minDist = Infinity;
            hospitals.forEach(h => {
                const d = haversine(lat, lng, h.lat, h.lng);
                if (d < minDist) minDist = d;
            });
            if (minDist > thresholdKm) {
                const opacity = Math.min(0.45, 0.15 + (minDist - thresholdKm) * 0.01);
                const radius = Math.min(6000, 3000 + (minDist - thresholdKm) * 100);
                L.circle([lat, lng], {
                    radius: radius, color: '#ef4444', fillColor: '#ef4444',
                    fillOpacity: opacity, weight: 1, opacity: 0.3
                }).addTo(riskMap).bindPopup(
                    `<div><div style="font-weight:700;color:#f87171;margin-bottom:4px">⚠️ Healthcare Desert</div>
                    <div style="font-size:12px;color:#94a3b8">Nearest facility: ${minDist.toFixed(1)} km away</div></div>`
                );
                redZones.push({
                    name: villageNames[vi % villageNames.length] + ' Area',
                    lat: lat.toFixed(4), lng: lng.toFixed(4),
                    distance_km: minDist.toFixed(1),
                    est_population: Math.floor(2000 + Math.random() * 8000)
                });
                vi++;
            }
        }
    }
    document.getElementById('desert-count').textContent = redZones.length;
    // Store globally for advocacy
    window._redZones = redZones;
}

function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
