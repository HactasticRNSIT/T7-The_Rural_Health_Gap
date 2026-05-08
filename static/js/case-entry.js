// ─── New Case Entry & Vitals Form ───
let currentStep = 1;

function goStep(step) {
    // Validate current step before advancing
    if (step > currentStep) {
        if (currentStep === 1 && !validateStep1()) return;
        if (currentStep === 2) checkVitals();
    }
    document.querySelectorAll('.form-step').forEach(s => s.style.display = 'none');
    document.getElementById('step' + step).style.display = 'block';
    currentStep = step;
    // Update step dots
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById('step' + i + '-dot');
        dot.classList.remove('active', 'done');
        if (i === step) dot.classList.add('active');
        else if (i < step) dot.classList.add('done');
    }
}

function validateStep1() {
    const form = document.getElementById('case-form');
    const name = form.querySelector('[name="name"]');
    const age = form.querySelector('[name="age"]');
    if (!name.value.trim()) { name.classList.add('error'); name.focus(); return false; }
    name.classList.remove('error');
    if (!age.value) { age.classList.add('error'); age.focus(); return false; }
    age.classList.remove('error');
    return true;
}

function checkVitals() {
    const form = document.getElementById('case-form');
    const alerts = [];
    const bp_s = parseInt(form.querySelector('[name="bp_systolic"]').value);
    const bp_d = parseInt(form.querySelector('[name="bp_diastolic"]').value);
    const hr = parseInt(form.querySelector('[name="heart_rate"]').value);
    const temp = parseFloat(form.querySelector('[name="temperature"]').value);
    const spo2 = parseInt(form.querySelector('[name="spo2"]').value);

    if (bp_s && bp_s > 140) alerts.push('⚠️ High systolic BP (' + bp_s + ')');
    if (bp_s && bp_s < 90) alerts.push('⚠️ Low systolic BP (' + bp_s + ')');
    if (bp_d && bp_d > 90) alerts.push('⚠️ High diastolic BP (' + bp_d + ')');
    if (hr && hr > 100) alerts.push('⚠️ Elevated heart rate (' + hr + ' bpm)');
    if (hr && hr < 50) alerts.push('⚠️ Low heart rate (' + hr + ' bpm)');
    if (temp && temp > 100.4) alerts.push('⚠️ Fever detected (' + temp + '°F)');
    if (spo2 && spo2 < 94) alerts.push('🚨 Low SpO2 (' + spo2 + '%) — Needs attention');

    const alertBox = document.getElementById('vitals-alert');
    if (alerts.length) {
        alertBox.style.display = 'block';
        alertBox.innerHTML = alerts.join('<br>');
    } else {
        alertBox.style.display = 'none';
    }
}

function submitCase(e) {
    e.preventDefault();
    const form = document.getElementById('case-form');
    const fd = new FormData(form);
    const data = {};
    fd.forEach((v, k) => { data[k] = v; });

    fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(r => r.json())
    .then(res => {
        form.style.display = 'none';
        document.getElementById('form-success').style.display = 'block';
    })
    .catch(err => alert('Error saving record: ' + err));
}

function resetForm() {
    const form = document.getElementById('case-form');
    form.reset();
    form.style.display = 'block';
    document.getElementById('form-success').style.display = 'none';
    document.getElementById('vitals-alert').style.display = 'none';
    goStep(1);
}
