import os
import json
import sqlite3
import uuid
from datetime import datetime

from flask import Flask, render_template, request, jsonify, g
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret')
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
DB_PATH = os.path.join(DATA_DIR, 'patients.db')

# ─── Database helpers ────────────────────────────────────────────────
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(exc):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER,
        gender TEXT,
        village TEXT,
        phone TEXT,
        weight REAL,
        bp_systolic INTEGER,
        bp_diastolic INTEGER,
        heart_rate INTEGER,
        temperature REAL,
        spo2 INTEGER,
        diabetes_status TEXT,
        chronic_conditions TEXT,
        health_history TEXT,
        current_symptoms TEXT,
        created_at TEXT,
        updated_at TEXT
    )''')
    conn.commit()

    # seed some sample patients if table is empty
    cur = conn.execute('SELECT COUNT(*) FROM patients')
    if cur.fetchone()[0] == 0:
        samples = [
            ("p1","Lakshmi Devi",45,"Female","Sirwar","9845012345",58,140,92,78,98.2,96,
             "Type 2","Diabetes, Hypertension","Diagnosed with Type-2 diabetes in 2019. On Metformin 500mg.","Frequent headaches"),
            ("p2","Hanumanthappa G",62,"Male","Kavital","9845012346",72,155,98,82,98.6,94,
             "Type 2","Diabetes, Heart Disease","Underwent angioplasty in 2021. On blood thinners.","Chest tightness on exertion"),
            ("p3","Savitri B",35,"Female","Maski","9845012347",55,120,80,72,98.4,98,
             "None","Anemia","History of iron-deficiency anemia. Currently on supplements.","Fatigue and dizziness"),
            ("p4","Rajappa M",50,"Male","Mudgal","9845012348",80,160,100,88,99.0,95,
             "Pre-diabetic","Hypertension, Obesity","On Amlodipine 5mg for BP since 2020.","Swollen ankles"),
            ("p5","Asha K",28,"Female","Manvi","9845012349",52,110,70,70,98.0,99,
             "None","None","No significant medical history. First pregnancy.","Routine antenatal checkup"),
            ("p6","Basavaraj R",55,"Male","Devadurga","9845012350",65,145,95,90,99.1,93,
             "Type 1","Diabetes, COPD","On insulin since 2015. Chronic smoker for 30 years.","Breathlessness and wheezing"),
            ("p7","Parvathamma H",70,"Female","Lingasugur","9845012351",48,135,85,68,97.8,92,
             "Type 2","Diabetes, Arthritis, Cataract","Multiple chronic conditions. Knee replacement advised.","Joint pain and blurred vision"),
            ("p8","Sharanappa D",40,"Male","Sindhanur","9845012352",78,130,88,75,98.5,97,
             "None","Asthma","Using inhaler since childhood. Well controlled.","Occasional wheezing at night"),
        ]
        now = datetime.utcnow().isoformat()
        for s in samples:
            conn.execute('''INSERT INTO patients VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                         (*s, now, now))
        conn.commit()
    conn.close()

# ─── Data loaders ────────────────────────────────────────────────────
def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

# ─── Page routes ─────────────────────────────────────────────────────
@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

# ─── API: Hospitals & Map ───────────────────────────────────────────
@app.route('/api/hospitals')
def api_hospitals():
    return jsonify(load_json('hospitals.json'))

@app.route('/api/ambulances')
def api_ambulances():
    return jsonify(load_json('ambulances.json'))

# ─── API: Patients ──────────────────────────────────────────────────
@app.route('/api/patients', methods=['GET'])
def get_patients():
    db = get_db()
    q = request.args.get('q', '').strip()
    if q:
        like = f'%{q}%'
        rows = db.execute(
            '''SELECT * FROM patients WHERE name LIKE ? OR village LIKE ? OR chronic_conditions LIKE ? ORDER BY updated_at DESC''',
            (like, like, like)
        ).fetchall()
    else:
        rows = db.execute('SELECT * FROM patients ORDER BY updated_at DESC').fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/patients/<pid>', methods=['GET'])
def get_patient(pid):
    db = get_db()
    row = db.execute('SELECT * FROM patients WHERE id = ?', (pid,)).fetchone()
    if row is None:
        return jsonify({'error': 'Patient not found'}), 404
    return jsonify(dict(row))

@app.route('/api/patients', methods=['POST'])
def create_patient():
    data = request.get_json()
    pid = str(uuid.uuid4())[:8]
    now = datetime.utcnow().isoformat()
    db = get_db()
    db.execute('''INSERT INTO patients (id,name,age,gender,village,phone,weight,bp_systolic,bp_diastolic,
        heart_rate,temperature,spo2,diabetes_status,chronic_conditions,health_history,current_symptoms,
        created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
        (pid, data.get('name',''), data.get('age'), data.get('gender',''),
         data.get('village',''), data.get('phone',''), data.get('weight'),
         data.get('bp_systolic'), data.get('bp_diastolic'), data.get('heart_rate'),
         data.get('temperature'), data.get('spo2'), data.get('diabetes_status','None'),
         data.get('chronic_conditions',''), data.get('health_history',''),
         data.get('current_symptoms',''), now, now))
    db.commit()
    return jsonify({'id': pid, 'message': 'Patient created successfully'}), 201

# ─── API: Gemini Chatbot ───────────────────────────────────────────
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_msg = data.get('message', '')
    lang = data.get('lang', 'en')

    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return jsonify({'reply': 'Gemini API key not configured.', 'escalate': False}), 500

    try:
        from google import genai
        client = genai.Client(api_key=api_key)

        lang_instruction = "Respond in English." if lang == 'en' else "Respond in Kannada (ಕನ್ನಡ)."

        system_prompt = f"""You are a rural healthcare assistant for Raichur district, Karnataka, India.
Your role is to provide first-aid guidance, basic medical advice, and health education to rural communities.

RULES:
1. {lang_instruction}
2. Provide clear, step-by-step first-aid instructions when asked.
3. Always recommend visiting the nearest hospital for serious conditions.
4. If you detect ANY of these life-threatening conditions in the user's message, you MUST start your response with the exact tag [EXTREME_CONDITION]:
   - Snake bite with swelling, numbness, or difficulty breathing
   - Heart attack symptoms (chest pain, arm pain, jaw pain, shortness of breath)
   - Severe uncontrolled bleeding
   - Stroke signs (facial drooping, arm weakness, speech difficulty)
   - Severe allergic reaction / anaphylaxis
   - Drowning or choking
   - Severe burns covering large body areas
   - Poisoning
   - Unconsciousness / unresponsiveness
5. For non-emergency queries, provide helpful health advice without the tag.
6. Be empathetic, concise, and culturally sensitive to rural Indian communities.
"""
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=f"{system_prompt}\n\nUser: {user_msg}"
        )
        reply_text = response.text
        escalate = '[EXTREME_CONDITION]' in reply_text
        reply_text = reply_text.replace('[EXTREME_CONDITION]', '').strip()

        return jsonify({'reply': reply_text, 'escalate': escalate})

    except Exception as e:
        return jsonify({'reply': f'AI service error: {str(e)}', 'escalate': False}), 500

# ─── API: Weather ───────────────────────────────────────────────────
@app.route('/api/weather')
def weather_current():
    import requests as req
    key = os.getenv('OPENWEATHER_API_KEY')
    lat, lon = 16.2120, 77.3439
    try:
        r = req.get(f'https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={key}&units=metric')
        return jsonify(r.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/weather/forecast')
def weather_forecast():
    import requests as req
    key = os.getenv('OPENWEATHER_API_KEY')
    lat, lon = 16.2120, 77.3439
    try:
        r = req.get(f'https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={key}&units=metric')
        return jsonify(r.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─── API: Emergency Dispatch ────────────────────────────────────────
@app.route('/api/emergency/dispatch', methods=['POST'])
def dispatch_ambulance():
    data = request.get_json()
    amb_id = data.get('ambulance_id')
    destination = data.get('destination', 'Unknown')
    # In a real system this would update a database and notify drivers
    return jsonify({
        'status': 'dispatched',
        'ambulance_id': amb_id,
        'destination': destination,
        'message': f'Ambulance {amb_id} dispatched to {destination}',
        'eta_minutes': 15
    })

# ─── API: Advocacy Report ──────────────────────────────────────────
@app.route('/api/advocacy/report', methods=['POST'])
def generate_advocacy_report():
    data = request.get_json()
    red_zones = data.get('red_zones', [])
    now = datetime.utcnow().strftime('%d %B %Y')

    report = {
        'title': f'Healthcare Infrastructure Gap Report — Raichur District',
        'date': now,
        'prepared_by': 'Raichur Health-Reach Platform',
        'summary': f'This report identifies {len(red_zones)} healthcare desert zones in Raichur district where residents must travel more than 15 km to reach the nearest medical facility.',
        'red_zones': red_zones,
        'recommendations': [
            'Establish new Primary Health Centres in identified red zones',
            'Deploy mobile health units for immediate coverage',
            'Upgrade existing PHCs to Community Health Centres',
            'Improve road connectivity to reduce travel time',
            'Deploy telemedicine kiosks in underserved villages'
        ],
        'generated_at': datetime.utcnow().isoformat()
    }
    return jsonify(report)

# ─── Bootstrap ──────────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
