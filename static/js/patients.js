// ─── Patient Records ───
let patientsCache = [];

function loadPatients(query = '') {
    const url = query ? `/api/patients?q=${encodeURIComponent(query)}` : '/api/patients';
    fetch(url).then(r => r.json()).then(data => {
        patientsCache = data;
        renderPatients(data);
    });
}

function searchPatients(q) { loadPatients(q); }

function renderPatients(patients) {
    const grid = document.getElementById('patients-grid');
    if (!patients.length) {
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500">No patients found</div>';
        return;
    }
    grid.innerHTML = patients.map(p => `
        <div class="patient-card" onclick="showPatientDetail('${p.id}')">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center text-teal-400 font-semibold text-sm">${(p.name||'?')[0]}</div>
                <div>
                    <div class="font-semibold text-sm">${p.name}</div>
                    <div class="text-xs text-gray-500">${p.age || '—'} yrs · ${p.gender || ''} · ${p.village || ''}</div>
                </div>
            </div>
            <div class="flex flex-wrap gap-1.5 mb-3">${getConditionPills(p.chronic_conditions)}</div>
            <div class="flex items-center justify-between text-xs text-gray-500">
                <span>BP: ${p.bp_systolic||'—'}/${p.bp_diastolic||'—'}</span>
                <span>SpO2: ${p.spo2||'—'}%</span>
                <span>HR: ${p.heart_rate||'—'}</span>
            </div>
        </div>
    `).join('');
}

function getConditionPills(conditions) {
    if (!conditions || conditions === 'None') return '<span class="condition-pill none">Healthy</span>';
    return conditions.split(',').map(c => {
        c = c.trim();
        let cls = 'default';
        if (/diabet/i.test(c)) cls = 'diabetes';
        else if (/heart/i.test(c)) cls = 'heart';
        else if (/hyper|bp/i.test(c)) cls = 'bp';
        else if (/asthma/i.test(c)) cls = 'asthma';
        else if (/anemia/i.test(c)) cls = 'anemia';
        else if (/copd/i.test(c)) cls = 'copd';
        return `<span class="condition-pill ${cls}">${c}</span>`;
    }).join('');
}

function showPatientDetail(id) {
    const p = patientsCache.find(x => x.id === id);
    if (!p) return;
    const content = document.getElementById('patient-detail-content');
    content.innerHTML = `
        <button onclick="closePatientModal()" class="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
        <div class="flex items-center gap-4 mb-6">
            <div class="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center text-teal-400 font-bold text-xl">${(p.name||'?')[0]}</div>
            <div><h3 class="text-xl font-semibold">${p.name}</h3><p class="text-sm text-gray-400">${p.age} yrs · ${p.gender} · ${p.village}</p><p class="text-xs text-gray-500">📞 ${p.phone || 'N/A'}</p></div>
        </div>
        <div class="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
            ${vitalBox('Weight', p.weight ? p.weight+'kg' : '—', '')}
            ${vitalBox('BP', (p.bp_systolic||'—')+'/'+(p.bp_diastolic||'—'), p.bp_systolic>140?'red':'')}
            ${vitalBox('Heart Rate', p.heart_rate ? p.heart_rate+' bpm':'—', p.heart_rate>100?'red':'')}
            ${vitalBox('Temp', p.temperature ? p.temperature+'°F':'—', p.temperature>100?'red':'')}
            ${vitalBox('SpO2', p.spo2 ? p.spo2+'%':'—', p.spo2<94?'red':'')}
            ${vitalBox('Diabetes', p.diabetes_status||'None', p.diabetes_status!=='None'?'orange':'')}
        </div>
        <div class="mb-4"><div class="text-xs text-gray-500 mb-1">Chronic Conditions</div><div class="flex flex-wrap gap-1.5">${getConditionPills(p.chronic_conditions)}</div></div>
        <div class="mb-4"><div class="text-xs text-gray-500 mb-1">Health History</div><p class="text-sm text-gray-300">${p.health_history || 'No history recorded.'}</p></div>
        <div><div class="text-xs text-gray-500 mb-1">Current Symptoms</div><p class="text-sm text-gray-300">${p.current_symptoms || 'None reported.'}</p></div>
    `;
    document.getElementById('patient-detail-modal').style.display = 'flex';
}

function vitalBox(label, value, alertColor) {
    const border = alertColor === 'red' ? 'border-red-500/30' : alertColor === 'orange' ? 'border-orange-500/30' : 'border-white/6';
    const color = alertColor === 'red' ? 'text-red-400' : alertColor === 'orange' ? 'text-orange-400' : 'text-white';
    return `<div class="p-3 rounded-lg bg-white/5 border ${border} text-center"><div class="text-lg font-bold ${color}">${value}</div><div class="text-[10px] text-gray-500">${label}</div></div>`;
}

function closePatientModal() {
    document.getElementById('patient-detail-modal').style.display = 'none';
}
