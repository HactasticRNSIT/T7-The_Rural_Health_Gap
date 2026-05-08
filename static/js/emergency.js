// ─── Emergency Logistics ───
function loadEmergency() {
    fetch('/api/ambulances').then(r => r.json()).then(renderAmbulances);
    fetch('/api/hospitals').then(r => r.json()).then(renderHospitalStatus);
}

function renderAmbulances(ambs) {
    let avail = 0, enroute = 0, busy = 0;
    ambs.forEach(a => { if(a.status==='available') avail++; else if(a.status==='en_route') enroute++; else busy++; });
    document.getElementById('amb-available').textContent = avail;
    document.getElementById('amb-enroute').textContent = enroute;
    document.getElementById('amb-busy').textContent = busy;

    document.getElementById('ambulance-list').innerHTML = ambs.map(a => `
        <div class="glass-card" style="padding:16px">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-3">
                    <span class="status-dot ${a.status}"></span>
                    <span class="font-semibold text-sm">${a.vehicle_number}</span>
                </div>
                <span class="text-xs px-2 py-1 rounded-full ${a.status==='available'?'bg-green-500/15 text-green-400':a.status==='en_route'?'bg-yellow-500/15 text-yellow-400':'bg-red-500/15 text-red-400'}">${a.status.replace('_',' ').toUpperCase()}</span>
            </div>
            <div class="text-xs text-gray-500 mb-1">${a.type} · ${a.attached_hospital}</div>
            <div class="text-xs text-gray-500">Driver: ${a.driver} · 📞 ${a.phone}</div>
            ${a.eta_minutes ? `<div class="text-xs text-yellow-400 mt-1">→ ${a.destination} · ETA ${a.eta_minutes} min</div>` : ''}
            ${a.status==='available' ? `<button class="btn-primary mt-3 w-full text-xs" style="padding:6px 12px" onclick="dispatchAmb('${a.id}')">Dispatch</button>` : ''}
        </div>
    `).join('');
}

function renderHospitalStatus(hospitals) {
    const emergencyHospitals = hospitals.filter(h => h.emergency);
    document.getElementById('hospital-status-list').innerHTML = emergencyHospitals.map(h => {
        const occ = Math.floor(40 + Math.random() * 50);
        const erWait = Math.floor(5 + Math.random() * 40);
        return `<div class="glass-card" style="padding:16px">
            <div class="font-semibold text-sm mb-1">${h.name}</div>
            <div class="text-xs text-gray-500 mb-3">${h.type}</div>
            <div class="grid grid-cols-3 gap-2 text-center">
                <div><div class="text-lg font-bold text-teal-400">${h.beds}</div><div class="text-[10px] text-gray-500">Total Beds</div></div>
                <div><div class="text-lg font-bold ${occ>80?'text-red-400':'text-green-400'}">${occ}%</div><div class="text-[10px] text-gray-500">Occupancy</div></div>
                <div><div class="text-lg font-bold ${erWait>30?'text-yellow-400':'text-green-400'}">${erWait}m</div><div class="text-[10px] text-gray-500">ER Wait</div></div>
            </div>
        </div>`;
    }).join('');
}

function dispatchAmb(id) {
    const dest = prompt('Enter destination:');
    if (!dest) return;
    fetch('/api/emergency/dispatch', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ ambulance_id: id, destination: dest })
    }).then(r => r.json()).then(d => {
        alert(d.message + ` (ETA: ${d.eta_minutes} min)`);
        loadEmergency();
    });
}
