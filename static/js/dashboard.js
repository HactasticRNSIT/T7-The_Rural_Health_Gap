// ─── Dashboard Navigation ───
const sectionTitles = {
    'map': 'Interactive Risk Map',
    'patients': 'Patient Health Records',
    'case-entry': 'New Case Entry & Vitals',
    'chatbot': 'AI Health Assistant & Tele-Consultation',
    'emergency': 'Emergency Logistics',
    'weather': 'Weather & Route Intelligence',
    'advocacy': 'Government Advocacy Portal'
};

function switchSection(id) {
    document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item[data-section]').forEach(n => n.classList.remove('active'));
    const panel = document.getElementById('sec-' + id);
    const navItem = document.querySelector(`.nav-item[data-section="${id}"]`);
    if (panel) panel.classList.add('active');
    if (navItem) navItem.classList.add('active');
    document.getElementById('section-title').textContent = sectionTitles[id] || '';
    // Initialize section-specific content
    if (id === 'map') initMap();
    if (id === 'patients') loadPatients();
    if (id === 'emergency') loadEmergency();
    if (id === 'weather') loadWeather();
    if (id === 'advocacy') loadAdvocacy();
    // Close mobile sidebar
    const sb = document.getElementById('sidebar');
    if (sb.classList.contains('open')) toggleSidebar();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('open');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initMap();
});
