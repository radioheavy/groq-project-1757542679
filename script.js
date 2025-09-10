class TodoApp {
    constructor() {
        this.tasks = [];
        this.initializeElements();
        this.attachEventListeners();
        this.loadTasksFromStorage();
        this.updateDisplay();
    }

    initializeElements() {
        this.taskForm = document.getElementById('task-form');
        this.taskInput = document.getElementById('task-input');
        this.addTaskBtn = document.getElementById('add-task-btn');
        this.taskList = document.getElementById('task-list');
        this.emptyState = document.getElementById('empty-state');
        this.taskCount = document.getElementById('task-count');
        this.completedCount = document.getElementById('completed-count');
        this.exportBtn = document.getElementById('export-btn');
        this.importBtn = document.getElementById('import-btn');
        this.importInput = document.getElementById('import-input');
    }

    attachEventListeners() {
        this.taskForm.addEventListener('submit', (e) => this.handleAddTask(e));
        this.exportBtn.addEventListener('click', () => this.exportTasks());
        this.importBtn.addEventListener('click', () => this.importInput.click());
        this.importInput.addEventListener('change', (e) => this.handleImportTasks(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.taskInput.focus();
                }
            }
        });
    }

    handleAddTask(e) {
        e.preventDefault();
        const taskText = this.taskInput.value.trim();
        
        if (!taskText) {
            this.showError('Task cannot be empty');
            return;
        }

        if (taskText.length > 200) {
            this.showError('Task is too long (max 200 characters)');
            return;
        }

        this.addTask(taskText);
        this.taskInput.value = '';
        this.clearError();
    }

    addTask(text, completed = false) {
        const task = {
            id: this.generateId(),
            text: text,
            completed: completed,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasksToStorage();
        this.updateDisplay();
        this.renderNewTask(task);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasksToStorage();
            this.updateDisplay();
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasksToStorage();
        this.updateDisplay();
    }

    renderTasks() {
        this.taskList.innerHTML = '';
        
        this.tasks.forEach(task => {
            this.renderTask(task);
        });
    }

    renderTask(task) {
        const taskElement = this.createTaskElement(task);
        this.taskList.appendChild(taskElement);
    }

    renderNewTask(task) {
        const taskElement = this.createTaskElement(task);
        taskElement.classList.add('new');
        this.taskList.appendChild(taskElement);
        
        // Remove animation class after animation completes
        setTimeout(() => {
            taskElement.classList.remove('new');
        }, 300);
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('role', 'listitem');
        li.setAttribute('data-task-id', task.id);

        li.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                 role="checkbox" 
                 aria-checked="${task.completed}"
                 tabindex="0"
                 aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}">
            </div>
            <span class="task-text">${this.escapeHtml(task.text)}</span>
            <button class="delete-btn" aria-label="Delete task: ${this.escapeHtml(task.text)}">
                Delete
            </button>
        `;

        // Add event listeners
        const checkbox = li.querySelector('.task-checkbox');
        const deleteBtn = li.querySelector('.delete-btn');

        checkbox.addEventListener('click', () => this.toggleTask(task.id));
        checkbox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleTask(task.id);
            }
        });

        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this task?')) {
                this.deleteTask(task.id);
            }
        });

        return li;
    }

    updateDisplay() {
        this.renderTasks();
        this.updateStats();
        this.toggleEmptyState();
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;

        this.taskCount.textContent = `${totalTasks} task${totalTasks !== 1 ? 's' : ''}`;
        this.completedCount.textContent = `${completedTasks} completed`;
    }

    toggleEmptyState() {
        if (this.tasks.length === 0) {
            this.emptyState.classList.remove('hidden');
            this.taskList.style.display = 'none';
        } else {
            this.emptyState.classList.add('hidden');
            this.taskList.style.display = 'flex';
        }
    }

    loadTasksFromStorage() {
        try {
            const stored = localStorage.getItem('todoAppTasks');
            if (stored) {
                this.tasks = JSON.parse(stored);
                // Ensure all tasks have required properties
                this.tasks = this.tasks.map(task => ({
                    id: task.id || this.generateId(),
                    text: task.text || '',
                    completed: Boolean(task.completed),
                    createdAt: task.createdAt || new Date().toISOString()
                }));
            }
        } catch (error) {
            console.error('Error loading tasks from storage:', error);
            this.tasks = [];
        }
    }

    saveTasksToStorage() {
        try {
            localStorage.setItem('todoAppTasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks to storage:', error);
            this.showError('Failed to save tasks. Storage may be full.');
        }
    }

    exportTasks() {
        try {
            const taskText = this.tasks.map(task => {
                const status = task.completed ? '[x]' : '[ ]';
                return `${status} ${task.text}`;
            }).join('\n');

            const blob = new Blob([taskText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'tasks.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showSuccess('Tasks exported successfully!');
        } catch (error) {
            console.error('Error exporting tasks:', error);
            this.showError('Failed to export tasks');
        }
    }

    handleImportTasks(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
            this.showError('Please select a .txt file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                this.importTasksFromText(event.target.result);
                this.showSuccess('Tasks imported successfully!');
            } catch (error) {
                console.error('Error importing tasks:', error);
                this.showError('Failed to import tasks. Please check the file format.');
            }
        };

        reader.onerror = () => {
            this.showError('Failed to read the file');
        };

        reader.readAsText(file);
        
        // Reset the input
        this.importInput.value = '';
    }

    importTasksFromText(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const importedTasks = [];

        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            let completed = false;
            let taskText = line;

            // Parse task format: [x] or [ ] followed by text
            if (line.startsWith('[x] ')) {
                completed = true;
                taskText = line.substring(4);
            } else if (line.startsWith('[ ] ')) {
                completed = false;
                taskText = line.substring(4);
            }

            if (taskText) {
                importedTasks.push({
                    id: this.generateId(),
                    text: taskText,
                    completed: completed,
                    createdAt: new Date().toISOString()
                });
            }
        });

        if (importedTasks.length > 0) {
            // Ask user if they want to replace or append
            const replace = confirm(
                `Import ${importedTasks.length} tasks?\n\nOK = Replace current tasks\nCancel = Add to current tasks`
            );

            if (replace) {
                this.tasks = importedTasks;
            } else {
                this.tasks = [...this.tasks, ...importedTasks];
            }

            this.saveTasksToStorage();
            this.updateDisplay();
        } else {
            throw new Error('No valid tasks found in file');
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
        this.taskForm.parentElement.classList.add('error');
        setTimeout(() => {
            this.taskForm.parentElement.classList.remove('error');
        }, 3000);
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    clearError() {
        this.taskForm.parentElement.classList.remove('error');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existing = document.querySelector('.message');
        if (existing) {
            existing.remove();
        }

        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            background: ${type === 'error' ? '#dc2626' : '#059669'};
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        `;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => messageEl.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});

// Add CSS for message animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);