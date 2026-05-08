// ─── Government Advocacy Portal ───
function loadAdvocacy() {
    const zones = window._redZones || [];
    document.getElementById('adv-zones').textContent = zones.length;
    const totalPop = zones.reduce((s,z) => s + (z.est_population||0), 0);
    document.getElementById('adv-pop').textContent = totalPop.toLocaleString();
    const avgDist = zones.length ? (zones.reduce((s,z) => s + parseFloat(z.distance_km||0), 0) / zones.length).toFixed(1) : '—';
    document.getElementById('adv-dist').textContent = avgDist + ' km';

    if (zones.length) {
        document.getElementById('red-zones-table').innerHTML = `
            <table class="w-full text-sm"><thead><tr class="text-left text-xs text-gray-500 border-b border-white/6">
                <th class="pb-2 pr-4">Zone</th><th class="pb-2 pr-4">Coordinates</th><th class="pb-2 pr-4">Nearest Hospital</th><th class="pb-2 pr-4">Est. Population</th>
            </tr></thead><tbody>${zones.slice(0, 15).map(z => `<tr class="border-b border-white/4">
                <td class="py-2 pr-4 text-red-400 font-medium">${z.name}</td>
                <td class="py-2 pr-4 text-gray-500">${z.lat}, ${z.lng}</td>
                <td class="py-2 pr-4 text-yellow-400">${z.distance_km} km</td>
                <td class="py-2 pr-4">${(z.est_population||0).toLocaleString()}</td>
            </tr>`).join('')}</tbody></table>`;
    }
}

function generateReport() {
    const zones = window._redZones || [];
    fetch('/api/advocacy/report', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ red_zones: zones })
    }).then(r => r.json()).then(report => {
        const addr = document.getElementById('report-to').value;
        const notes = document.getElementById('report-notes').value;
        const output = document.getElementById('report-output');
        output.style.display = 'block';
        output.innerHTML = `
            <div class="text-center mb-6">
                <div class="text-lg font-bold text-white">${report.title}</div>
                <div class="text-xs text-gray-500 mt-1">Generated on ${report.date}</div>
            </div>
            <div class="mb-4"><div class="text-xs text-gray-500">To:</div><div class="text-sm">${addr}</div></div>
            <div class="mb-4"><div class="text-xs text-gray-500">Subject:</div><div class="text-sm">Request for Healthcare Infrastructure in Underserved Areas of Raichur District</div></div>
            <div class="mb-4"><div class="text-xs text-gray-500 mb-1">Summary:</div><p class="text-sm text-gray-300">${report.summary}</p></div>
            <div class="mb-4"><div class="text-xs text-gray-500 mb-1">Key Findings:</div><ul class="text-sm text-gray-300 list-disc pl-5">
                <li>${zones.length} healthcare desert zones identified</li>
                <li>Estimated ${zones.reduce((s,z)=>s+(z.est_population||0),0).toLocaleString()} residents affected</li>
                <li>Average distance to nearest facility: ${zones.length?(zones.reduce((s,z)=>s+parseFloat(z.distance_km||0),0)/zones.length).toFixed(1):'—'} km</li>
            </ul></div>
            <div class="mb-4"><div class="text-xs text-gray-500 mb-1">Recommendations:</div><ul class="text-sm text-gray-300 list-disc pl-5">${report.recommendations.map(r=>`<li>${r}</li>`).join('')}</ul></div>
            ${notes ? `<div class="mb-4"><div class="text-xs text-gray-500 mb-1">Additional Notes:</div><p class="text-sm text-gray-300">${notes}</p></div>` : ''}
            <div class="text-right text-xs text-gray-500 mt-6">— ${report.prepared_by}</div>
            <div class="flex gap-3 mt-6"><button class="btn-primary text-xs" onclick="window.print()">🖨️ Print Report</button><button class="btn-secondary text-xs" onclick="alert('Report saved!')">💾 Save</button></div>
        `;
    });
}
