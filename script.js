class RealtimeMessenger {
    constructor() {
        this.currentUser = null;
        this.messagesRef = firebase.database().ref('messages');
        this.init();
    }

    // Инициализация
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
        this.setupEventListeners();
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Вход в чат
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.login();
        });

        // Выход из чата
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Отправка сообщения
        document.getElementById('messageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Поддержка Enter для отправки
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('messageForm').dispatchEvent(new Event('submit'));
            }
        });
    }

    // Вход в чат
    async login() {
        const displayName = document.getElementById('displayName').value.trim();
        
        if (!displayName) {
            alert('Пожалуйста, введите ваше имя');
            return;
        }

        try {
            // Создание анонимного пользователя
            const result = await firebase.auth().signInAnonymously();
            const user = result.user;
            
            // Обновление профиля
            await user.updateProfile({
                displayName: displayName
            });

            this.currentUser = user;
            this.showChat();
            this.loadMessages();
            
        } catch (error) {
            console.error('Ошибка входа:', error);
            alert('Ошибка входа: ' + error.message);
        }
    }

    // Выход из чата
    async logout() {
        try {
            await firebase.auth().signOut();
            this.currentUser = null;
            this.showLogin();
            
            // Очистка чата
            document.getElementById('messagesContainer').innerHTML = `
                <div class="welcome-message">
                    <p>Добро пожаловать в групповой чат!</p>
                    <p>Авторизуйтесь, чтобы начать общение.</p>
                </div>
            `;
        } catch (error) {
            console.error('Ошибка выхода:', error);
        }
    }

    // Показать форму входа
    showLogin() {
        document.getElementById('authSection').style.display = 'flex';
        document.getElementById('userSection').style.display = 'none';
        document.getElementById('messageFormSection').style.display = 'none';
    }

    // Показать чат
    showChat() {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('userSection').style.display = 'flex';
        document.getElementById('messageFormSection').style.display = 'block';
        document.getElementById('currentUserName').textContent = this.currentUser.displayName;
    }

    // Загрузка сообщений в реальном времени
    loadMessages() {
        this.messagesRef orderByChild('timestamp').limitToLast(50).on('child_added', (snapshot) => {
            const message = snapshot.val();
            this.displayMessage(message);
            this.scrollToBottom();
        });
    }

    // Отправка сообщения
    sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        
        if (!text) return;

        const message = {
            text: text,
            senderId: this.currentUser.uid,
            senderName: this.currentUser.displayName,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        // Добавление сообщения в базу данных
        this.messagesRef.push(message)
            .then(() => {
                input.value = '';
            })
            .catch((error) => {
                console.error('Ошибка отправки сообщения:', error);
                alert('Ошибка отправки сообщения');
            });
    }

    // Отображение сообщения
    displayMessage(message) {
        const container = document.getElementById('messagesContainer');
        const isOwn = message.senderId === this.currentUser.uid;
        
        // Если это первое сообщение, очищаем приветствие
        if (container.querySelector('.welcome-message')) {
            container.innerHTML = '';
        }

        const messageElement = document.createElement('div');
        messageElement.className = `message ${isOwn ? 'own' : 'other'}`;
        messageElement.innerHTML = `
            <div class="sender">${this.escapeHtml(message.senderName)}</div>
            <div class="text">${this.escapeHtml(message.text)}</div>
            <div class="time">${this.formatTime(message.timestamp)}</div>
        `;

        container.appendChild(messageElement);
        this.scrollToBottom();
    }

    // Получение отформатированного времени
    formatTime(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        
        // Если сегодня
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        
        // Если вчера или ранее
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Экранирование HTML для безопасности
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Прокрутка к последнему сообщению
    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        container.scrollTop = container.scrollHeight;
    }
}

// Инициализация мессенджера при загрузке страницы
let messenger;
document.addEventListener('DOMContentLoaded', () => {
    messenger = new RealtimeMessenger();
});