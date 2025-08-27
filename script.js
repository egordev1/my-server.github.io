class PersonalDatabase {
    constructor() {
        this.data = this.loadData();
        this.init();
    }

    // Загрузка данных из LocalStorage
    loadData() {
        const data = localStorage.getItem('personalDB');
        return data ? JSON.parse(data) : [];
    }

    // Сохранение данных в LocalStorage
    saveData() {
        localStorage.setItem('personalDB', JSON.stringify(this.data));
    }

    // Добавление новой записи
    addRecord(record) {
        record.id = Date.now(); // Уникальный ID
        record.date = new Date().toLocaleString();
        this.data.push(record);
        this.saveData();
        this.renderData();
        this.updateCategories();
    }

    // Удаление записи
    deleteRecord(id) {
        this.data = this.data.filter(item => item.id !== id);
        this.saveData();
        this.renderData();
        this.updateCategories();
    }

    // Получение уникальных категорий
    getCategories() {
        const categories = [...new Set(this.data.map(item => item.category).filter(cat => cat))];
        return categories;
    }

    // Обновление списка категорий в фильтре
    updateCategories() {
        const categoryFilter = document.getElementById('categoryFilter');
        const categories = this.getCategories();
        
        // Сохраняем текущее значение
        const currentValue = categoryFilter.value;
        
        // Очищаем и добавляем опции
        categoryFilter.innerHTML = '<option value="">Все категории</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
        
        // Восстанавливаем значение
        categoryFilter.value = currentValue;
    }

    // Фильтрация данных
    filterData() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        
        return this.data.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || item.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }

    // Отображение данных
    renderData() {
        const dataList = document.getElementById('dataList');
        const filteredData = this.filterData();
        
        if (filteredData.length === 0) {
            dataList.innerHTML = '<p>Записей не найдено</p>';
            return;
        }
        
        dataList.innerHTML = filteredData.map(item => `
            <div class="data-item">
                <h3>${item.name}</h3>
                <div class="category">${item.category || 'Без категории'}</div>
                <div class="description">${item.description || ''}</div>
                <div class="date">${item.date}</div>
                <button class="delete-btn" onclick="db.deleteRecord(${item.id})">Удалить</button>
            </div>
        `).join('');
    }

    // Инициализация
    init() {
        // Обработчик формы
        document.getElementById('dataForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const category = document.getElementById('category').value;
            const description = document.getElementById('description').value;
            
            if (name.trim()) {
                this.addRecord({ name, category, description });
                document.getElementById('dataForm').reset();
            }
        });
        
        // Обработчики фильтров
        document.getElementById('searchInput').addEventListener('input', () => {
            this.renderData();
        });
        
        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.renderData();
        });
        
        // Первоначальный рендер
        this.renderData();
        this.updateCategories();
    }
}

// Инициализация базы данных при загрузке страницы
let db;
document.addEventListener('DOMContentLoaded', () => {
    db = new PersonalDatabase();
});