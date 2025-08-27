// script.js
class RealtimeMessenger {
    constructor() {
        this.currentUser = null;
        this.db = firebase.firestore();
        this.messagesRef = this.db.collection('messages');
        this.init();
    }

    init() {
        // Проверка аутентификации
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.showChat();
                this.loadMessages();
            } else {
                this.showLogin();
            }
        });

        // Обработчики событий
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.login();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('messageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });
    }

    login() {
        const displayName = document.getElementById('displayName').value.trim();
        if (!displayName) return alert('Введите имя');

        firebase.auth().signInAnonymously()
            .then(result => {
                const user = result.user;
                user.updateProfile({ displayName })
                    .then(() => {
                        this.currentUser = user;
                        this.showChat();
                        this.loadMessages();
                    });
            })
            .catch(error => {
                console.error('Ошибка входа:', error);
                alert('Ошибка входа');
            });
    }

    logout() {
        firebase.auth().signOut()
            .then(() => {
                this.currentUser = null;
                this.showLogin();
                document.getElementById('messagesContainer').innerHTML = `
                    <div class="welcome-message">
                        <p>Добро пожаловать в групповой чат!</p>
                        <p>Авторизуйтесь, чтобы начать общение.</p>
                    </div>
                `;
            });
    }

    showLogin() {
        document.getElementById('authSection').style.display = 'flex';
        document.getElementById('userSection').style.display = 'none';
        document.getElementById('messageFormSection').style.display = 'none';
    }

    showChat() {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('userSection').style.display = 'flex';
        document.getElementById('messageFormSection').style.display = 'block';
        document.getElementById('currentUserName').textContent = this.currentUser.displayName;
    }

    loadMessages() {
        this.messagesRef.orderBy('timestamp', 'desc').limit(50).onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const message = change.doc.data();
                    this.displayMessage(message);
                    this.scrollToBottom();
                }
            });
        });
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        if (!text) return;

        const messageData = {
            text,
            senderId: this.currentUser.uid,
            senderName: this.currentUser.displayName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        this.messagesRef.add(messageData)
            .then(() => {
                input.value = '';
            })
            .catch(error => {
                console.error('Ошибка отправки:', error);
                alert('Ошибка отправки сообщения');
            });
    }

    displayMessage(message) {
        const container = document.getElementById('messagesContainer');
        const isOwn = message.senderId === this.currentUser.uid;

        if (container.querySelector('.welcome-message')) {
            container.innerHTML = '';
        }

        const msgElement = document.createElement('div');
        msgElement.className = `message ${isOwn ? 'own' : 'other'}`;
        msgElement.innerHTML = `
            <div class="sender">${this.escapeHtml(message.senderName)}</div>
            <div class="text">${this.escapeHtml(message.text)}</div>
            <div class="time">${this.formatTime(message.timestamp)}</div>
        `;
        container.appendChild(msgElement);
        this.scrollToBottom();
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        return date.toDateString() === now.toDateString()
            ? date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            : date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        container.scrollTop = container.scrollHeight;
    }
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new RealtimeMessenger();
});
