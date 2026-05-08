// ─── Weather & Route Intelligence ───
function loadWeather() {
    fetch('/api/weather').then(r => r.json()).then(renderCurrentWeather).catch(() => {
        document.getElementById('weather-current').innerHTML = '<p class="text-gray-500 text-sm">Unable to load weather</p>';
    });
    fetch('/api/weather/forecast').then(r => r.json()).then(renderForecast).catch(() => {});
}
function renderCurrentWeather(d) {
    if (!d.main) { document.getElementById('weather-current').innerHTML = '<p class="text-gray-500 text-sm">Unavailable</p>'; return; }
    const icon = d.weather[0].icon, rain = d.clouds ? d.clouds.all : 0, isRainy = d.weather[0].main==='Rain'||rain>70;
    document.getElementById('weather-current').innerHTML = `<img src="https://openweathermap.org/img/wn/${icon}@2x.png" class="mx-auto" width="64"><div class="text-3xl font-bold">${Math.round(d.main.temp)}°C</div><div class="text-sm text-gray-400 capitalize">${d.weather[0].description}</div><div class="grid grid-cols-2 gap-2 mt-4 text-xs text-gray-500"><div>💧 ${d.main.humidity}%</div><div>💨 ${d.wind.speed} m/s</div></div>`;
    const gc = rain>70?'#ef4444':rain>40?'#fbbf24':'#4ade80';
    document.getElementById('weather-rain').innerHTML = `<div class="flex items-center justify-between mb-2"><span class="text-sm font-semibold">Rain Probability</span><span class="text-2xl font-bold" style="color:${gc}">${rain}%</span></div><div class="rain-gauge mb-4"><div class="rain-gauge-fill" style="width:${rain}%;background:${gc}"></div></div><div class="text-xs text-gray-500">${isRainy?'⚠️ High rain. Consider route alternatives.':'✅ Favorable conditions.'}</div>`;
    if(isRainy){document.getElementById('weather-alert-box').style.display='block';document.getElementById('weather-alert-text').textContent='Heavy rain in Raichur. Use alternate routes from red zones.';}
}
function renderForecast(d) {
    if(!d.list) return; const daily={}; d.list.forEach(i=>{const dt=i.dt_txt.split(' ')[0];if(!daily[dt])daily[dt]=i;});
    document.getElementById('weather-forecast').innerHTML = Object.values(daily).slice(0,5).map(f=>{
        const dn=new Date(f.dt*1000).toLocaleDateString('en',{weekday:'short'});
        return `<div class="text-center p-3 rounded-xl bg-white/5 border border-white/6"><div class="text-xs text-gray-500 mb-1">${dn}</div><img src="https://openweathermap.org/img/wn/${f.weather[0].icon}.png" class="mx-auto" width="36"><div class="text-sm font-semibold">${Math.round(f.main.temp)}°C</div><div class="text-[10px] text-gray-500 capitalize">${f.weather[0].description}</div></div>`;
    }).join('');
}
