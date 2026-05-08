// ─── New Case Entry & Vitals Form (4-Step) ───
let currentStep = 1;
const TOTAL_STEPS = 4;

function goStep(step) {
    // Validate current step before advancing
    if (step > currentStep) {
        if (currentStep === 1 && !validateStep1()) return;
        if (currentStep === 2) checkVitals();
    }

    // Hide all steps, show target
    document.querySelectorAll('.form-step').forEach(s => s.style.display = 'none');
    const target = document.getElementById('step' + step);
    if (target) {
        target.style.display = 'block';
        target.style.animation = 'panelFadeIn 0.3s ease';
    }
    currentStep = step;

    // Update step dots
    for (let i = 1; i <= TOTAL_STEPS; i++) {
        const dot = document.getElementById('step' + i + '-dot');
        if (!dot) continue;
        dot.classList.remove('active', 'done');
        if (i === step) dot.classList.add('active');
        else if (i < step) dot.classList.add('done');
    }
}

function validateStep1() {
    const form = document.getElementById('case-form');
    const name = form.querySelector('[name="name"]');
    const age = form.querySelector('[name="age"]');
    let valid = true;

    if (!name.value.trim()) {
        name.classList.add('error');
        name.focus();
        valid = false;
    } else {
        name.classList.remove('error');
    }

    if (!age.value) {
        age.classList.add('error');
        if (valid) age.focus();
        valid = false;
    } else {
        age.classList.remove('error');
    }

    return valid;
}

function checkVitals() {
    const form = document.getElementById('case-form');
    const alerts = [];
    const bp_s = parseInt(form.querySelector('[name="bp_systolic"]').value);
    const bp_d = parseInt(form.querySelector('[name="bp_diastolic"]').value);
    const hr = parseInt(form.querySelector('[name="heart_rate"]').value);
    const temp = parseFloat(form.querySelector('[name="temperature"]').value);
    const spo2 = parseInt(form.querySelector('[name="spo2"]').value);

    if (bp_s && bp_s > 140) alerts.push('⚠️ High systolic BP (' + bp_s + ' mmHg)');
    if (bp_s && bp_s < 90) alerts.push('⚠️ Low systolic BP (' + bp_s + ' mmHg)');
    if (bp_d && bp_d > 90) alerts.push('⚠️ High diastolic BP (' + bp_d + ' mmHg)');
    if (hr && hr > 100) alerts.push('⚠️ Elevated heart rate (' + hr + ' bpm)');
    if (hr && hr < 50) alerts.push('⚠️ Low heart rate (' + hr + ' bpm)');
    if (temp && temp > 100.4) alerts.push('⚠️ Fever detected (' + temp + '°F)');
    if (spo2 && spo2 < 94) alerts.push('🚨 Low SpO2 (' + spo2 + '%) — Needs immediate attention');

    const alertBox = document.getElementById('vitals-alert');
    if (alerts.length) {
        alertBox.style.display = 'block';
        alertBox.innerHTML = alerts.join('<br>');
    } else {
        alertBox.style.display = 'none';
    }
}

// Severity dropdown alert
document.addEventListener('DOMContentLoaded', () => {
    // Listen for severity change to show alert on Critical
    const severitySelect = document.querySelector('[name="severity"]');
    if (severitySelect) {
        severitySelect.addEventListener('change', function () {
            const alertBox = document.getElementById('severity-alert');
            if (this.value === 'Critical' || this.value === 'Severe') {
                alertBox.style.display = 'block';
            } else {
                alertBox.style.display = 'none';
            }
        });
    }
});

function submitCase(e) {
    e.preventDefault();
    const form = document.getElementById('case-form');
    const fd = new FormData(form);
    const data = {};
    fd.forEach((v, k) => { data[k] = v; });

    // Collect checkbox conditions into chronic_conditions string
    const conditions = [];
    const checkboxes = form.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(cb => conditions.push(cb.value));
    // Append any manual chronic conditions
    if (data.chronic_conditions) {
        conditions.push(data.chronic_conditions);
    }
    data.chronic_conditions = conditions.join(', ');

    // Remove individual checkbox keys from data
    delete data.cond_diabetes;
    delete data.cond_hypertension;
    delete data.cond_heatstroke;
    delete data.cond_heart;
    delete data.cond_allergies;
    delete data.cond_other;

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
    const sevAlert = document.getElementById('severity-alert');
    if (sevAlert) sevAlert.style.display = 'none';
    currentStep = 1;
    goStep(1);
}
