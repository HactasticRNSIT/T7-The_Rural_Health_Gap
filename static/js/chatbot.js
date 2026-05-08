// ─── Chatbot (Gemini AI) ───
let chatLang = 'en';

function setLang(lang) {
    chatLang = lang;
    document.getElementById('lang-en').classList.toggle('active', lang === 'en');
    document.getElementById('lang-kn').classList.toggle('active', lang === 'kn');
}

function quickChat(msg) {
    document.getElementById('chat-input').value = msg;
    sendChat();
}

function sendChat() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    appendChat('user', msg);
    appendTyping();

    fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, lang: chatLang })
    })
    .then(r => r.json())
    .then(data => {
        removeTyping();
        appendChat('bot', data.reply);
        if (data.escalate) {
            document.getElementById('escalation-banner').style.display = 'flex';
            document.getElementById('escalation-banner').scrollIntoView({ behavior: 'smooth' });
        }
    })
    .catch(err => {
        removeTyping();
        appendChat('bot', '⚠️ Connection error. Please try again.');
    });
}

function appendChat(role, text) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `chat-bubble ${role}`;
    // Simple markdown-like formatting
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\n/g, '<br>');
    div.innerHTML = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function appendTyping() {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-bubble bot';
    div.id = 'typing-indicator';
    div.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function removeTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}
