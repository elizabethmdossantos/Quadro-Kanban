document.addEventListener('DOMContentLoaded', () => {

    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const clearAllBtn = document.getElementById('clearAll');
    const columns = {
        1: document.getElementById('todo'),
        2: document.getElementById('doing'),
        3: document.getElementById('done')
    };

    const kanban_tasks = 'kanbanTasks';
    let tasks = loadTasks();

    function loadTasks() {
        const storedTasks = localStorage.getItem(kanban_tasks);
        return storedTasks ? JSON.parse(storedTasks) : [];
    }

    function saveTasks() {
        localStorage.setItem(kanban_tasks, JSON.stringify(tasks));
    }

    function createTaskCard(task) {
        const card = document.createElement('div');
        card.classList.add('kanban-card');
        card.setAttribute('draggable', true);
        card.setAttribute('data-id', task.id);
        card.setAttribute('data-column-id', task.columnId);
        card.innerHTML = `
            <span class="card-text">${task.content}</span>
            <button class="edit-btn" data-id="${task.id}">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" data-id="${task.id}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        card.addEventListener('dragstart', handleDragStart);
        card.querySelector('.delete-btn').addEventListener('click', handleDelete);
        card.querySelector('.card-text').addEventListener('dblclick', handleEditStart);
        card.querySelector('.edit-btn').addEventListener('click', handleEditStart);
        return card;
    }
    function renderTasks() {
        Object.values(columns).forEach(column => column.innerHTML = '');
        tasks.forEach(task => {
            const card = createTaskCard(task);
            columns[task.columnId].appendChild(card);
        });
        Object.values(columns).forEach(col => {
            col.addEventListener('dragover', handleDragOver);
            col.addEventListener('drop', handleDrop);
        });
    }
    function addTask() {
        const content = taskInput.value.trim();
        if (content) {
            const isDuplicate = tasks.some(task => task.content.toLowerCase() === content.toLowerCase());
            
            if (isDuplicate) {
                alert("Esta tarefa já existe!");
                taskInput.value = '';
                return;
            }
            const newTask = {
                id: Date.now().toString(),
                content: content,
                columnId: 1
            };
            tasks.push(newTask);
            saveTasks();
            renderTasks();
            taskInput.value = '';
        }
    }
    function handleDelete(event) {
        const taskId = event.currentTarget.getAttribute('data-id');
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
    }
    function clearAllTasks() {
        if (confirm("Tem certeza de que deseja excluir TODAS as tarefas?")) {
            tasks = [];
            saveTasks();
            renderTasks();
        }
    }
    function handleEditStart(event) {
        const cardTextElement = event.currentTarget.classList.contains('card-text') 
                                ? event.currentTarget 
                                : event.currentTarget.closest('.kanban-card').querySelector('.card-text');
        
        const taskId = cardTextElement.closest('.kanban-card').getAttribute('data-id');
        const currentText = cardTextElement.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.classList.add('card-edit-input');
        input.setAttribute('data-id', taskId);
        cardTextElement.style.display = 'none';
        cardTextElement.parentElement.insertBefore(input, cardTextElement);
        input.focus();
        input.select();
        input.addEventListener('blur', handleEditSave);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });
    }
    function handleEditSave(event) {
        const input = event.currentTarget;
        const taskId = input.getAttribute('data-id');
        const newContent = input.value.trim();
        const card = input.closest('.kanban-card');
        const cardTextElement = card.querySelector('.card-text');
        if (newContent) {
            const isDuplicate = tasks.some(
                task => task.id !== taskId && task.content.toLowerCase() === newContent.toLowerCase()
            );
            if (isDuplicate) {
                alert("Não é possível salvar. Já existe outra tarefa com esse nome!");
                input.remove();
                cardTextElement.style.display = 'block';
                return;
            }
            const taskIndex = tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex].content = newContent;
                saveTasks();
            }
            
            cardTextElement.textContent = newContent;
        } 
        input.remove();
        cardTextElement.style.display = 'block';
    }
    let draggedCardId = null;
    function handleDragStart(event) {
        draggedCardId = event.target.getAttribute('data-id');
        event.dataTransfer.setData('text/plain', draggedCardId);
        event.target.classList.add('dragging');
    }
    document.addEventListener('dragend', (event) => {
        if (event.target.classList.contains('kanban-card')) {
            event.target.classList.remove('dragging');
        }
        draggedCardId = null;
    });
    function handleDragOver(event) {
        event.preventDefault();
    }
    function handleDrop(event) {
        event.preventDefault();
        const dropZone = event.currentTarget;
        const newColumnId = parseInt(dropZone.parentElement.getAttribute('data-id'));
        if (draggedCardId && newColumnId) {
            const taskIndex = tasks.findIndex(task => task.id === draggedCardId);
            if (taskIndex !== -1 && tasks[taskIndex].columnId !== newColumnId) {
                tasks[taskIndex].columnId = newColumnId;
                saveTasks();
                renderTasks(); 
            }
        }
    }
    addTaskBtn.addEventListener('click', addTask);
    clearAllBtn.addEventListener('click', clearAllTasks);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    renderTasks();
});