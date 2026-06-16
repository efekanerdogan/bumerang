/**
 * Bumerang Application Controller
 * Handles state management, UI navigation, and data persistence.
 */

const app = {
    // State
    decks: [],
    currentDeckId: null,
    editingCardId: null,
    studyQueue: [],
    currentCardIndex: 0,
    isFlipped: false,

    // Initialization
    init: () => {
        app.loadTheme();
        app.loadData();
        app.renderDashboard();
    },

    // --- Persistence ---
    saveData: () => {
        localStorage.setItem('bumerang_decks', JSON.stringify(app.decks));
    },

    loadData: () => {
        const data = localStorage.getItem('bumerang_decks');
        if (data) {
            app.decks = JSON.parse(data);
        } else {
            // Seed with sample data if empty
            app.decks = [
                {
                    id: Date.now(),
                    name: 'Bumerang Demo',
                    cards: [
                        {
                            id: 1,
                            front: 'Bumerang nedir?',
                            back: 'Tekrara dayalı akıllı bir öğrenme aracıdır.',
                            interval: 0, repetitions: 0, easeFactor: 2.5, dueDate: new Date(Date.now() - 60000).toISOString()
                        },
                        {
                            id: 2,
                            front: 'Spaced Repetition nedir?',
                            back: 'Bilgileri unutulmaya yüz tuttuğu anda tekrar ederek hafızada kalıcı hale getirme tekniğidir.',
                            interval: 0, repetitions: 0, easeFactor: 2.5, dueDate: new Date(Date.now() - 60000).toISOString()
                        }
                    ]
                }
            ];
            app.saveData();
        }
    },

    // --- Navigation ---
    navigateTo: (viewId) => {
        document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));

        const target = document.getElementById(`view-${viewId}`);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active'); // For animation triggers
        }

        // Sidebar active state
        document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));

        // Find the link that points to this view
        const link = Array.from(document.querySelectorAll('.nav-links li')).find(li => {
            return li.getAttribute('onclick') && li.getAttribute('onclick').includes(viewId);
        });

        if (link) {
            link.classList.add('active');
        }

        if (viewId === 'dashboard') app.renderDashboard();
        if (viewId === 'browse') app.renderBrowse();
    },

    // --- Dashboard Logic ---
    renderDashboard: () => {
        let totalCards = 0;
        let totalDue = 0;
        const grid = document.getElementById('deck-grid');
        grid.innerHTML = '';

        app.decks.forEach(deck => {
            const now = new Date();

            // Logic Refinement:
            // Yeni: Never studied (reps 0, interval 0)
            const newCount = deck.cards.filter(c => c.repetitions === 0 && c.interval === 0).length;

            // Öğrenilen: Recently failed or just started (interval <= 1) BUT exclude New cards
            const learningCount = deck.cards.filter(c => c.interval <= 1 && !(c.repetitions === 0 && c.interval === 0)).length;

            // Tekrar: Learned/Spaced out (interval > 1) AND Due Now
            const reviewCount = deck.cards.filter(c => c.interval > 1 && new Date(c.dueDate) <= now).length;

            const card = document.createElement('div');
            card.className = 'deck-card';
            card.innerHTML = `
                <h3>${deck.name}</h3>
                <div class="progress-info" style="margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
                    Top. ${deck.cards.length} Kart
                </div>
                <div class="stats-badges" style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
                    <span style="background: #e3f2fd; color: #1565c0; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 500;">
                        🆕 ${newCount} Yeni
                    </span>
                    <span style="background: #ffebee; color: #c62828; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 500;">
                        🧠 ${learningCount} Öğrenilen
                    </span>
                    <span style="background: #e8f5e9; color: #2e7d32; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 500;">
                        ⏰ ${reviewCount} Tekrar
                    </span>
                </div>
                 <div class="deck-actions" style="gap: 0.5rem; justify-content: flex-start;">
                    <button class="btn primary" style="flex: 1; justify-content: center;" onclick="app.startStudy(${deck.id})">Çalış</button>
                    <button class="btn success" style="flex: 1; justify-content: center;" onclick="app.showAddCardModal(${deck.id})">
                        Ekle
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });

        document.getElementById('total-cards').innerText = totalCards;
        document.getElementById('total-due').innerText = totalDue;
    },

    // --- Browse & Edit Logic ---
    renderBrowse: () => {
        const container = document.getElementById('browse-content');
        container.innerHTML = '';

        // List Decks
        const grid = document.createElement('div');
        grid.className = 'deck-grid';

        app.decks.forEach(deck => {
            const card = document.createElement('div');
            card.className = 'deck-card';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <h3>${deck.name}</h3>
                     <button class="btn icon-only" style="color: #ff7070;" onclick="event.stopPropagation(); app.deleteDeck(${deck.id})">
                         <span class="material-icons-round">delete</span>
                    </button>
                </div>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${deck.cards.length} Kart</p>
                <div class="deck-actions">
                     <button class="btn text" style="width: 100%; justify-content: center; background: #eef1f5;" onclick="app.editDeck(${deck.id})">
                        İncele ve Düzenle
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });

        if (app.decks.length === 0) {
            container.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">Henüz hiç set yok.</p>';
        } else {
            container.appendChild(grid);
        }
    },

    showCreateDeckModal: () => {
        document.getElementById('modal-create-deck').classList.remove('hidden');
    },

    closeModal: (modalId) => {
        document.getElementById(modalId).classList.add('hidden');
    },

    createDeck: () => {
        const nameInput = document.getElementById('new-deck-name');
        const name = nameInput.value.trim();
        if (name) {
            app.decks.push({
                id: Date.now(),
                name: name,
                cards: []
            });
            app.saveData();
            nameInput.value = '';
            app.closeModal('modal-create-deck');
            app.renderDashboard();
        } else {
            app.showAlert('Lütfen bir set adı girin.');
        }
    },

    deleteDeck: (deckId) => {
        app.showConfirm('Bu seti silmek istediğine emin misin?', () => {
            app.decks = app.decks.filter(d => d.id !== deckId);
            app.saveData();
            if (!document.getElementById('view-browse').classList.contains('hidden')) {
                app.renderBrowse();
            } else {
                app.renderDashboard();
            }
        });
    },

    // --- Helper for Custom Modals ---
    showAlert: (message) => {
        document.getElementById('alert-message').innerText = message;
        document.getElementById('modal-alert').classList.remove('hidden');
    },

    showConfirm: (message, onConfirm) => {
        document.getElementById('confirm-message').innerText = message;
        const modal = document.getElementById('modal-confirm');
        const yesBtn = document.getElementById('confirm-yes-btn');

        // Remove old listeners to avoid stacking
        const newYesBtn = yesBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);

        newYesBtn.onclick = () => {
            onConfirm();
            app.closeModal('modal-confirm');
        };

        modal.classList.remove('hidden');
    },

    // --- Editor Logic ---
    editDeck: (deckId) => {
        app.currentDeckId = deckId;
        app.editingCardId = null; // Reset editing state
        const deck = app.decks.find(d => d.id === deckId);

        // Setup Header with Editable Title
        const header = document.getElementById('editor-deck-title');
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <input type="text" value="${deck.name}" id="deck-title-input" 
                    onchange="app.updateDeckName(this.value)"
                    style="font-size: 1.5rem; font-weight: bold; border: none; background: transparent; color: inherit; width: 100%;">
                <span class="material-icons-round" style="font-size: 1.2rem; color: var(--text-secondary);">edit</span>
            </div>
        `;

        // Reset inputs
        document.getElementById('card-front').value = '';
        document.getElementById('card-back').value = '';
        const saveBtn = document.getElementById('save-card-btn');
        if (saveBtn) saveBtn.innerText = 'Kart Ekle';

        app.renderEditorList();
        app.navigateTo('editor');
    },

    updateDeckName: (newName) => {
        if (newName && app.currentDeckId) {
            const deckIdx = app.decks.findIndex(d => d.id === app.currentDeckId);
            if (deckIdx !== -1) {
                app.decks[deckIdx].name = newName;
                app.saveData();
            }
        }
    },

    renderEditorList: () => {
        const deck = app.decks.find(d => d.id === app.currentDeckId);
        const list = document.getElementById('editor-card-list');
        list.innerHTML = '';

        // Check if any cards to determine if "Select All" or actions needed (optional, keeping simple)

        deck.cards.forEach((card) => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            item.style.cursor = 'pointer';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';

            // Interaction: Click to load into editor
            item.onclick = (e) => {
                // Prevent if clicking delete button or checkbox
                if (e.target.closest('.delete-btn') || e.target.type === 'checkbox') return;
                app.loadCardForEdit(card.id);

                // Visual feedback for selection
                document.querySelectorAll('.preview-item').forEach(el => el.style.background = 'transparent');
                item.style.background = '#eef0ff'; // Light highlight
            };

            // Container for Checkbox + Text
            const contentWrapper = document.createElement('div');
            contentWrapper.style.display = 'flex';
            contentWrapper.style.alignItems = 'center';
            contentWrapper.style.gap = '1rem';
            contentWrapper.style.flex = '1';
            contentWrapper.style.minWidth = '0'; // For Text truncation

            // Checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'card-select';
            checkbox.value = card.id;
            checkbox.style.cursor = 'pointer';
            checkbox.onchange = () => app.toggleBulkDeleteBtn(); // Update button visibility

            const textContent = document.createElement('div');
            textContent.innerHTML = `<strong>${card.front.substring(0, 50)}</strong> : ${card.back.substring(0, 50)}`;
            textContent.style.whiteSpace = 'nowrap';
            textContent.style.overflow = 'hidden';
            textContent.style.textOverflow = 'ellipsis';

            contentWrapper.appendChild(checkbox);
            contentWrapper.appendChild(textContent);

            const actions = document.createElement('div');
            // Only delete button remains, Edit button removed as per request
            actions.innerHTML = `
                 <button class="btn icon-only delete-btn" style="padding: 0.4rem; font-size: 0.8rem; color: #ff7070;" onclick="app.deleteCard(${card.id})">
                    <span class="material-icons-round" style="font-size: 1.2rem;">delete</span>
                </button>
            `;

            item.appendChild(contentWrapper);
            item.appendChild(actions);
            list.appendChild(item);
        });

        app.toggleBulkDeleteBtn(); // Init state
    },

    toggleBulkDeleteBtn: () => {
        const checked = document.querySelectorAll('.card-select:checked');
        const btn = document.getElementById('delete-selected-btn');
        if (btn) {
            btn.style.display = checked.length > 0 ? 'flex' : 'none';
            btn.innerHTML = `<span class="material-icons-round">delete_sweep</span> Seçilenleri Sil (${checked.length})`;
        }
    },

    deleteSelectedCards: () => {
        const checked = document.querySelectorAll('.card-select:checked');
        if (checked.length === 0) return;

        app.showConfirm(`${checked.length} kartı silmek istediğine emin misin?`, () => {
            const idsToDelete = Array.from(checked).map(cb => parseInt(cb.value));
            const deckIdx = app.decks.findIndex(d => d.id === app.currentDeckId);
            if (deckIdx !== -1) {
                app.decks[deckIdx].cards = app.decks[deckIdx].cards.filter(c => !idsToDelete.includes(c.id));
                app.saveData();
                app.renderEditorList();
                // Reset editor if current editing card was deleted
                if (idsToDelete.includes(app.editingCardId)) {
                    document.getElementById('card-front').value = '';
                    document.getElementById('card-back').value = '';
                    app.editingCardId = null;
                    document.getElementById('save-card-btn').innerText = 'Kart Ekle';
                }
            }
        });
    },

    loadCardForEdit: (cardId) => {
        const deck = app.decks.find(d => d.id === app.currentDeckId);
        const card = deck.cards.find(c => c.id === cardId);
        if (card) {
            document.getElementById('card-front').value = card.front;
            document.getElementById('card-back').value = card.back;
            app.editingCardId = cardId;
            const saveBtn = document.getElementById('save-card-btn');
            if (saveBtn) saveBtn.innerText = 'Kartı Güncelle'; // "Düzenle" logic on button
            // Focus is optional, maybe user just wants to see it, but editing is the goal
            document.getElementById('card-front').focus();
        }
    },

    deleteCard: (cardId) => {
        app.showConfirm('Bu kartı silmek istediğine emin misin?', () => {
            const deckIdx = app.decks.findIndex(d => d.id === app.currentDeckId);
            if (deckIdx === -1) return;

            app.decks[deckIdx].cards = app.decks[deckIdx].cards.filter(c => c.id !== cardId);
            app.saveData();
            app.renderEditorList();
        });
    },

    saveCard: () => {
        const front = document.getElementById('card-front').value.trim();
        const back = document.getElementById('card-back').value.trim();

        if (front && back && app.currentDeckId) {
            const deckIdx = app.decks.findIndex(d => d.id === app.currentDeckId);
            const deck = app.decks[deckIdx];

            if (app.editingCardId) {
                // Update existing
                const cardIdx = deck.cards.findIndex(c => c.id === app.editingCardId);
                if (cardIdx !== -1) {
                    deck.cards[cardIdx].front = front;
                    deck.cards[cardIdx].back = back;
                }
                app.editingCardId = null;
                const saveBtn = document.getElementById('save-card-btn');
                if (saveBtn) saveBtn.innerText = 'Kart Ekle';
            } else {
                // Add new
                deck.cards.push({
                    id: Date.now(),
                    front,
                    back,
                    interval: 0,
                    repetitions: 0,
                    easeFactor: 2.5,
                    dueDate: new Date(Date.now() - 1000).toISOString()
                });
            }

            app.saveData();

            // Clear inputs
            document.getElementById('card-front').value = '';
            document.getElementById('card-back').value = '';
            document.getElementById('card-front').focus();

            app.renderEditorList();
        }
    },

    // --- Modal Add Card Logic ---
    showAddCardModal: (deckId) => {
        app.currentDeckId = deckId;
        document.getElementById('modal-card-front').value = '';
        document.getElementById('modal-card-back').value = '';
        document.getElementById('modal-add-card').classList.remove('hidden');
        document.getElementById('modal-card-front').focus();
    },

    addCardFromModal: () => {
        const front = document.getElementById('modal-card-front').value.trim();
        const back = document.getElementById('modal-card-back').value.trim();

        if (front && back && app.currentDeckId) {
            const deckIdx = app.decks.findIndex(d => d.id === app.currentDeckId);
            if (deckIdx !== -1) {
                app.decks[deckIdx].cards.push({
                    id: Date.now(),
                    front,
                    back,
                    interval: 0,
                    repetitions: 0,
                    easeFactor: 2.5,
                    dueDate: new Date(Date.now() - 1000).toISOString()
                });
                app.saveData();
                app.renderDashboard(); // Update stats
                app.closeModal('modal-add-card');
            }
        } else {
            alert('Lütfen ön ve arka yüzü doldurun.');
        }
    },

    // --- Study Logic ---
    startStudy: (deckId) => {
        const deck = app.decks.find(d => d.id === deckId);
        const now = new Date();

        // Filter due cards
        app.studyQueue = deck.cards.filter(c => new Date(c.dueDate) <= now);

        if (app.studyQueue.length === 0) {
            alert("Bu set için bugün çalışılacak kart kalmadı! Harika iş.");
            return;
        }

        app.currentDeckId = deckId;
        app.currentCardIndex = 0;
        app.navigateTo('study');
        app.showNextCard();
    },

    showNextCard: () => {
        if (app.currentCardIndex >= app.studyQueue.length) {
            alert("Çalışma oturumu tamamlandı!");
            app.navigateTo('dashboard');
            return;
        }

        const card = app.studyQueue[app.currentCardIndex];
        const activeCard = document.getElementById('active-card');

        // Reset state
        app.isFlipped = false;
        activeCard.classList.remove('is-flipped');
        document.getElementById('rating-buttons').classList.add('hidden');

        // Update Content
        setTimeout(() => {
            document.getElementById('study-front').innerText = card.front;
            document.getElementById('study-back').innerText = card.back;

            // Progress Bar
            const percent = ((app.currentCardIndex) / app.studyQueue.length) * 100;
            document.getElementById('study-progress').style.width = `${percent}%`;
            document.getElementById('study-count').innerText = `${app.currentCardIndex + 1} / ${app.studyQueue.length}`;
        }, 200);
    },

    flipCard: (e) => {
        // Prevent flip if clicking on buttons (event bubbling)
        if (e && e.target.closest('.rate-btn')) return;

        const card = document.getElementById('active-card');
        card.classList.toggle('is-flipped');
        app.isFlipped = card.classList.contains('is-flipped');

        const btnContainer = document.getElementById('rating-buttons');
        if (app.isFlipped) {
            btnContainer.classList.remove('hidden');
        } else {
            btnContainer.classList.add('hidden');
        }
    },

    // --- Settings & Theme ---
    toggleTheme: () => {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('bumerang_theme', newTheme);
        app.updateThemeIcon(newTheme);
    },

    loadTheme: () => {
        const savedTheme = localStorage.getItem('bumerang_theme');
        if (savedTheme) {
            document.body.setAttribute('data-theme', savedTheme);
            app.updateThemeIcon(savedTheme);
        }
    },

    updateThemeIcon: (theme) => {
        const btn = document.getElementById('theme-toggle-btn');
        if (btn) btn.innerText = theme === 'dark' ? 'Açık Mod' : 'Karanlık Mod';
    },

    resetData: () => {
        if (confirm('TÜM verileriniz silinecek (Setler ve İlerlemeler). Emin misiniz?')) {
            localStorage.removeItem('bumerang_decks');
            location.reload();
        }
    },

    rateCard: (quality) => {
        // Don't rate if not flipped!
        if (!app.isFlipped) return;

        const currentCard = app.studyQueue[app.currentCardIndex];

        // Calculate new stats using SRS algorithm
        if (window.SRS) {
            const result = window.SRS.calculateNextReview(currentCard, quality);

            // Update card in main deck storage
            const deckIdx = app.decks.findIndex(d => d.id === app.currentDeckId);
            const cardIdx = app.decks[deckIdx].cards.findIndex(c => c.id === currentCard.id);

            if (cardIdx !== -1) {
                app.decks[deckIdx].cards[cardIdx] = {
                    ...currentCard,
                    ...result
                };
                app.saveData();
            }
        }

        if (quality < 3) {
            app.studyQueue.push(currentCard);
        }

        app.currentCardIndex++;
        app.showNextCard();
    }
};

// Start and Export
window.app = app;
document.addEventListener('DOMContentLoaded', app.init);
