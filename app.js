// ==============================================================================
// 0. UTILITÀ SICUREZZA, MODALE CONFERMA E TOAST
// ==============================================================================
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const confirmOverlay = document.getElementById("app-confirm-overlay");
const confirmMessageEl = document.getElementById("app-confirm-message");
const confirmCancelBtn = document.getElementById("app-confirm-cancel");
const confirmOkBtn = document.getElementById("app-confirm-ok");
const toastEl = document.getElementById("app-toast");

let pendingConfirmCallback = null;
let toastTimer = null;

function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("visible");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("visible");
  }, 2600);
}

function showConfirm(message, onConfirm) {
  pendingConfirmCallback = onConfirm;
  confirmMessageEl.textContent = message;
  confirmOverlay.style.display = "flex";
  confirmOkBtn.focus();
}

function closeConfirm() {
  confirmOverlay.style.display = "none";
  pendingConfirmCallback = null;
}

confirmCancelBtn.addEventListener("click", closeConfirm);
confirmOverlay.addEventListener("click", (e) => {
  if (e.target === confirmOverlay) closeConfirm();
});
confirmOkBtn.addEventListener("click", () => {
  const cb = pendingConfirmCallback;
  closeConfirm();
  if (typeof cb === "function") cb();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && confirmOverlay.style.display === "flex") {
    closeConfirm();
  }
});

// ==============================================================================
// 1. STATO DELL'APPLICAZIONE
// ==============================================================================
// Spese della sessione/spesa corrente
let currentExpenses = JSON.parse(localStorage.getItem("current_expenses"));
// Storico permanente di tutte le spese registrate
let expenseHistory = JSON.parse(localStorage.getItem("expense_history"));
// Recupero da versione precedente per retrocompatibilità
const legacyExpenses = JSON.parse(localStorage.getItem("expenses")) || [];

if (!expenseHistory) {
  expenseHistory = Array.isArray(legacyExpenses) ? [...legacyExpenses] : [];
  localStorage.setItem("expense_history", JSON.stringify(expenseHistory));
} else {
  legacyExpenses.forEach((exp) => {
    if (!expenseHistory.some((h) => h.id === exp.id)) {
      expenseHistory.push(exp);
    }
  });
  localStorage.setItem("expense_history", JSON.stringify(expenseHistory));
}

if (!currentExpenses) {
  currentExpenses = Array.isArray(legacyExpenses) ? [...legacyExpenses] : [];
  localStorage.setItem("current_expenses", JSON.stringify(currentExpenses));
}

// 'expenses' gestisce la sessione corrente per la Scheda Spese
let expenses = currentExpenses;
let currentFilter = "ALL";
let currentTagFilter = "ALL";
let customTags = JSON.parse(localStorage.getItem("custom_tags")) || [];
const DEFAULT_SUGGESTED_TAGS = ["urgente", "rimborso", "lavoro", "weekend"];
let recurringExpenses = JSON.parse(localStorage.getItem("recurring_expenses")) || [];

// Nomi dei mesi e giorni in italiano
const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

// Modalità Report attiva ("monthly" o "yearly")
let reportMode = "monthly";
let selectedReportMonth = ""; // formato "YYYY-MM"
let selectedReportYear = "";  // formato "YYYY"

// Lista iniziale degli acquisti frequenti
const DEFAULT_FREQUENT_ITEMS = [
  { desc: "Pane", cat: "Alimentari", store: "Panetteria" },
  { desc: "Pasta", cat: "Alimentari", store: "Supermercato" },
  { desc: "Frutta e Verdura", cat: "Alimentari", store: "Fruttivendolo" },
  { desc: "Latte e Uova", cat: "Alimentari", store: "Supermercato" },
  { desc: "Caffè al bar", cat: "Svago", store: "Bar" },
  { desc: "Pizza", cat: "Svago", store: "Pizzeria" },
  { desc: "Biglietto Bus / Metro", cat: "Trasporti", store: "Tabacchi" },
  { desc: "Carburante", cat: "Trasporti", store: "Distributore" },
  { desc: "Farmaci", cat: "Altro", store: "Farmacia" },
];

let frequentItems = JSON.parse(localStorage.getItem("frequent_items")) || DEFAULT_FREQUENT_ITEMS;
frequentItems = frequentItems.map(item => ({
  ...item,
  desc: item.desc.replace(/\uFFFD|\?/g, "è")
}));

// LISTA DELLA SPESA
let shoppingList = JSON.parse(localStorage.getItem("shopping_list")) || [];

// PROMEMORIA E SCADENZE
let remindersList = JSON.parse(localStorage.getItem("reminders_list")) || [];
let reminderStatusFilter = "PENDING";
let reminderTypeFilter = "ALL";

// NOTE E APPUNTI
let notesList = JSON.parse(localStorage.getItem("notes_list")) || [];
let noteSearchQuery = "";
let noteCategoryFilter = "ALL";

// ==============================================================================
// 2. SELEZIONE DEGLI ELEMENTI HTML
// ==============================================================================
// Schede Principali
const tabIndexBtn = document.getElementById("tab-index-btn");
const tabShoppingBtn = document.getElementById("tab-shopping-btn");
const tabExpensesBtn = document.getElementById("tab-expenses-btn");
const tabRemindersBtn = document.getElementById("tab-reminders-btn");
const tabNotesBtn = document.getElementById("tab-notes-btn");
const tabReportsBtn = document.getElementById("tab-reports-btn");

const tabIndexView = document.getElementById("tab-index-view");
const tabShoppingView = document.getElementById("tab-shopping-view");
const tabExpensesView = document.getElementById("tab-expenses-view");
const tabRemindersView = document.getElementById("tab-reminders-view");
const tabNotesView = document.getElementById("tab-notes-view");
const tabReportsView = document.getElementById("tab-reports-view");

const shoppingBadge = document.getElementById("shopping-badge");
const remindersBadge = document.getElementById("reminders-badge");

// Elementi Indice Generale
const indexTodayDate = document.getElementById("index-today-date");
const indexGlobalSearch = document.getElementById("index-global-search");
const indexSearchResults = document.getElementById("index-search-results");
const idxShoppingCount = document.getElementById("idx-shopping-count");
const idxShoppingPreview = document.getElementById("idx-shopping-preview");
const idxExpensesTotal = document.getElementById("idx-expenses-total");
const idxExpensesSub = document.getElementById("idx-expenses-sub");
const idxRemindersCount = document.getElementById("idx-reminders-count");
const idxRemindersSub = document.getElementById("idx-reminders-sub");
const idxNotesCount = document.getElementById("idx-notes-count");
const idxNotesSub = document.getElementById("idx-notes-sub");
const indexUpcomingReminders = document.getElementById("index-upcoming-reminders");
const indexRemindersEmpty = document.getElementById("index-reminders-empty");
const indexPinnedNotes = document.getElementById("index-pinned-notes");
const indexNotesEmpty = document.getElementById("index-notes-empty");
const idxMonthTitle = document.getElementById("idx-month-title");
const idxMonthDetail = document.getElementById("idx-month-detail");
const idxMonthTotal = document.getElementById("idx-month-total");

const qaAddShopping = document.getElementById("qa-add-shopping");
const qaAddExpense = document.getElementById("qa-add-expense");
const qaAddReminder = document.getElementById("qa-add-reminder");
const qaAddNote = document.getElementById("qa-add-note");

// Form e Controlli Lista della Spesa
const shoppingForm = document.getElementById("shopping-form");
const shoppingItemNameInput = document.getElementById("shopping-item-name");
const shoppingQuantityInput = document.getElementById("shopping-quantity");
const shoppingCategorySelect = document.getElementById("shopping-category");
const shoppingQuickSelect = document.getElementById("shopping-quick-select");
const deleteShoppingFrequentBtn = document.getElementById("delete-shopping-frequent-btn");
const shoppingListElement = document.getElementById("shopping-list");
const shoppingEmptyState = document.getElementById("shopping-empty-state");
const clearCheckedShoppingBtn = document.getElementById("clear-checked-shopping-btn");

// Form e Controlli Registro Spese
const expenseForm = document.getElementById("expense-form");
const quickSelect = document.getElementById("quick-select");
const deleteFrequentBtn = document.getElementById("delete-frequent-btn");
const descriptionInput = document.getElementById("description");
const quantityInput = document.getElementById("quantity");
const storeInput = document.getElementById("store");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const tagsInput = document.getElementById("tags");
const tagSuggestionsEl = document.getElementById("tag-suggestions");
const expenseQuickNoteInput = document.getElementById("expense-quick-note");
const expenseRecurringToggle = document.getElementById("expense-recurring-toggle");
const expenseRecurrenceGroup = document.getElementById("expense-recurrence-group");
const expenseRecurrenceFreq = document.getElementById("expense-recurrence-freq");
const recurringExpensesSection = document.getElementById("recurring-expenses-section");
const recurringExpensesList = document.getElementById("recurring-expenses-list");
const expenseList = document.getElementById("expense-list");
const totalAmountElement = document.getElementById("total-amount");
const totalCountElement = document.getElementById("total-count");
const totalLabelElement = document.getElementById("total-label");
const emptyStateElement = document.getElementById("empty-state");
const emptyStateText = document.getElementById("empty-state-text");
const clearAllBtn = document.getElementById("clear-all-btn");
const filterCategorySelect = document.getElementById("filter-category");
const filterTagSelect = document.getElementById("filter-tag");

// Form e Controlli Promemoria e Scadenze
const reminderForm = document.getElementById("reminder-form");
const reminderFormTitle = document.getElementById("reminder-form-title");
const reminderCancelEditBtn = document.getElementById("reminder-cancel-edit-btn");
const reminderEditIdInput = document.getElementById("reminder-edit-id");
const reminderTitleInput = document.getElementById("reminder-title");
const reminderTypeSelect = document.getElementById("reminder-type");
const reminderCategorySelect = document.getElementById("reminder-category");
const reminderDateInput = document.getElementById("reminder-date");
const reminderTimeInput = document.getElementById("reminder-time");
const reminderPrioritySelect = document.getElementById("reminder-priority");
const reminderAmountInput = document.getElementById("reminder-amount");
const reminderRecurrenceSelect = document.getElementById("reminder-recurrence");
const reminderNoteInput = document.getElementById("reminder-note");
const reminderSubmitBtn = document.getElementById("reminder-submit-btn");
const remindersActiveCountEl = document.getElementById("reminders-active-count");
const remindersUrgentCountEl = document.getElementById("reminders-urgent-count");
const reminderFilterStatusSelect = document.getElementById("reminder-filter-status");
const reminderFilterTypeSelect = document.getElementById("reminder-filter-type");
const clearCompletedRemindersBtn = document.getElementById("clear-completed-reminders-btn");
const remindersListEl = document.getElementById("reminders-list");
const remindersEmptyState = document.getElementById("reminders-empty-state");
const remindersEmptyText = document.getElementById("reminders-empty-text");

// Form e Controlli Note
const noteForm = document.getElementById("note-form");
const noteFormTitle = document.getElementById("note-form-title");
const noteCancelEditBtn = document.getElementById("note-cancel-edit-btn");
const noteEditIdInput = document.getElementById("note-edit-id");
const noteTitleInput = document.getElementById("note-title");
const noteCategorySelect = document.getElementById("note-category");
const noteContentInput = document.getElementById("note-content");
const notePinnedCheckbox = document.getElementById("note-pinned");
const noteSubmitBtn = document.getElementById("note-submit-btn");
const notesTotalCountEl = document.getElementById("notes-total-count");
const noteSearchInput = document.getElementById("note-search-input");
const noteFilterCategorySelect = document.getElementById("note-filter-category");
const notesListEl = document.getElementById("notes-list");
const notesEmptyState = document.getElementById("notes-empty-state");
const notesEmptyText = document.getElementById("notes-empty-text");

// Controlli Scheda Report e Storico
const btnModeMonthly = document.getElementById("btn-mode-monthly");
const btnModeYearly = document.getElementById("btn-mode-yearly");
const sectionSelectMonth = document.getElementById("section-select-month");
const sectionSelectYear = document.getElementById("section-select-year");
const reportMonthSelect = document.getElementById("report-month-select");
const reportYearSelect = document.getElementById("report-year-select");
const reportSummaryLabel = document.getElementById("report-summary-label");
const reportTotalAmount = document.getElementById("report-total-amount");
const reportTotalCount = document.getElementById("report-total-count");
const yearlyBreakdownSection = document.getElementById("yearly-breakdown-section");
const yearlyMonthsGrid = document.getElementById("yearly-months-grid");
const reportListTitle = document.getElementById("report-list-title");
const reportExpenseList = document.getElementById("report-expense-list");
const reportEmptyState = document.getElementById("report-empty-state");

// ==============================================================================
// 3. GESTIONE CAMBIO SCHEDA (TABS)
// ==============================================================================
const ALL_TAB_BTNS = [
  tabIndexBtn,
  tabShoppingBtn,
  tabExpensesBtn,
  tabRemindersBtn,
  tabNotesBtn,
  tabReportsBtn,
];

const ALL_TAB_VIEWS = [
  tabIndexView,
  tabShoppingView,
  tabExpensesView,
  tabRemindersView,
  tabNotesView,
  tabReportsView,
];

function switchTab(target) {
  ALL_TAB_BTNS.forEach((b) => b.classList.remove("active"));
  ALL_TAB_VIEWS.forEach((v) => v.classList.remove("active"));

  if (target === "index") {
    tabIndexBtn.classList.add("active");
    tabIndexView.classList.add("active");
    renderIndexOverview();
  } else if (target === "shopping") {
    tabShoppingBtn.classList.add("active");
    tabShoppingView.classList.add("active");
  } else if (target === "expenses") {
    tabExpensesBtn.classList.add("active");
    tabExpensesView.classList.add("active");
  } else if (target === "reminders") {
    tabRemindersBtn.classList.add("active");
    tabRemindersView.classList.add("active");
    renderReminders();
  } else if (target === "notes") {
    tabNotesBtn.classList.add("active");
    tabNotesView.classList.add("active");
    renderNotes();
  } else if (target === "reports") {
    tabReportsBtn.classList.add("active");
    tabReportsView.classList.add("active");
    renderReports();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

tabIndexBtn.addEventListener("click", () => switchTab("index"));
tabShoppingBtn.addEventListener("click", () => switchTab("shopping"));
tabExpensesBtn.addEventListener("click", () => switchTab("expenses"));
tabRemindersBtn.addEventListener("click", () => switchTab("reminders"));
tabNotesBtn.addEventListener("click", () => switchTab("notes"));
tabReportsBtn.addEventListener("click", () => switchTab("reports"));

// Delegazione click su bottoni/card dell'indice che puntano a una scheda
document.querySelectorAll("[data-nav-target]").forEach((el) => {
  el.addEventListener("click", () => {
    const target = el.getAttribute("data-nav-target");
    if (target) switchTab(target);
  });
});

qaAddShopping.addEventListener("click", () => {
  switchTab("shopping");
  setTimeout(() => shoppingItemNameInput.focus(), 120);
});
qaAddExpense.addEventListener("click", () => {
  switchTab("expenses");
  setTimeout(() => descriptionInput.focus(), 120);
});
qaAddReminder.addEventListener("click", () => {
  switchTab("reminders");
  setTimeout(() => reminderTitleInput.focus(), 120);
});
qaAddNote.addEventListener("click", () => {
  switchTab("notes");
  setTimeout(() => noteTitleInput.focus(), 120);
});

// ==============================================================================
// 4. FUNZIONI HELPER PER DATE
// ==============================================================================
function getExpenseDateInfo(expense) {
  let dateObj = null;

  if (expense.id && expense.id > 1000000000000) {
    const d = new Date(expense.id);
    if (!isNaN(d.getTime())) {
      dateObj = d;
    }
  }

  if (!dateObj && expense.date) {
    const parts = expense.date.split("/");
    if (parts.length === 3) {
      dateObj = new Date(
        parseInt(parts[2], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[0], 10)
      );
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const monthPadded = String(month + 1).padStart(2, "0");
  const monthKey = `${year}-${monthPadded}`;

  return {
    year: String(year),
    monthIndex: month,
    monthKey: monthKey,
    monthName: MONTH_NAMES[month],
    dateFormatted: expense.date || dateObj.toLocaleDateString("it-IT"),
  };
}

function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const dt = new Date(y, m, d);
  return isNaN(dt.getTime()) ? null : dt;
}

function formatItalianDate(dateStr) {
  const dt = parseLocalDate(dateStr);
  if (!dt) return "";
  return dt.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function addRecurrenceToDate(dateStr, recurrence) {
  const dt = parseLocalDate(dateStr);
  if (!dt) return "";
  const day = dt.getDate();
  const origMonth = dt.getMonth();
  if (recurrence === "Mensile") {
    dt.setMonth(dt.getMonth() + 1);
    if (dt.getDate() < day) dt.setDate(0);
  } else if (recurrence === "Bimensile") {
    dt.setMonth(dt.getMonth() + 2);
    if (dt.getDate() < day) dt.setDate(0);
  } else if (recurrence === "Semestrale") {
    dt.setMonth(dt.getMonth() + 6);
    if (dt.getDate() < day) dt.setDate(0);
  } else if (recurrence === "Annuale") {
    dt.setFullYear(dt.getFullYear() + 1);
    if (dt.getMonth() !== origMonth) dt.setDate(0);
  } else if (recurrence === "Decennale") {
    dt.setFullYear(dt.getFullYear() + 10);
    if (dt.getMonth() !== origMonth) dt.setDate(0);
  }
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ==============================================================================
// 5. GESTIONE DELLA LISTA DELLA SPESA (SCHEDA 1)
// ==============================================================================
function saveShoppingList() {
  localStorage.setItem("shopping_list", JSON.stringify(shoppingList));
}

function updateShoppingBadge() {
  const unboughtCount = shoppingList.filter((item) => !item.checked).length;
  shoppingBadge.textContent = unboughtCount;
  shoppingBadge.style.display = unboughtCount > 0 ? "inline-block" : "none";
}

function renderShoppingList() {
  shoppingListElement.innerHTML = "";

  if (shoppingList.length === 0) {
    shoppingEmptyState.style.display = "block";
    clearCheckedShoppingBtn.style.display = "none";
  } else {
    shoppingEmptyState.style.display = "none";
    const hasChecked = shoppingList.some((item) => item.checked);
    clearCheckedShoppingBtn.style.display = hasChecked ? "inline-block" : "none";
  }

  shoppingList.forEach((item) => {
    const li = document.createElement("li");
    li.className = `shopping-item ${item.checked ? "checked" : ""}`;

    const qtyBadge = item.quantity ? `<span class="badge-qty">${escapeHtml(item.quantity)}</span>` : "";
    const catBadge = item.category ? `<span class="badge-tag">${escapeHtml(item.category)}</span>` : "";

    li.innerHTML = `
      <div class="shopping-left">
        <input type="checkbox" class="shopping-checkbox" ${item.checked ? "checked" : ""} onchange="toggleShoppingItem(${item.id})">
        <div class="shopping-info">
          <span class="shopping-item-name">${escapeHtml(item.name)}</span>
          <div class="shopping-meta">
            ${catBadge}
            ${qtyBadge}
          </div>
        </div>
      </div>
      <div class="shopping-right">
        <button type="button" class="btn-convert-expense" title="Registra come spesa pagata" onclick="convertShoppingItemToExpense(${item.id})">
          💰 Registra
        </button>
        <button type="button" class="btn-delete" title="Elimina dalla lista" onclick="deleteShoppingItem(${item.id})">✕</button>
      </div>
    `;

    shoppingListElement.appendChild(li);
  });

  updateShoppingBadge();
  renderIndexOverview();
}

function addShoppingItem(name, quantity, category) {
  const cleanName = (name || "").trim();
  if (!cleanName) return;

  const newItem = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    name: cleanName,
    quantity: (quantity || "").trim(),
    category: category || "Alimentari",
    checked: false,
  };

  shoppingList.unshift(newItem);
  saveShoppingList();
  renderShoppingList();
}

shoppingForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const name = shoppingItemNameInput.value;
  const quantity = shoppingQuantityInput.value;
  const category = shoppingCategorySelect.value;

  addShoppingItem(name, quantity, category);

  shoppingForm.reset();
  shoppingQuickSelect.value = "";
  deleteShoppingFrequentBtn.disabled = true;
  shoppingItemNameInput.focus();
  showToast("Articolo aggiunto alla lista.");
});

window.toggleShoppingItem = function (id) {
  shoppingList = shoppingList.map((item) => {
    if (item.id === id) {
      return { ...item, checked: !item.checked };
    }
    return item;
  });
  saveShoppingList();
  renderShoppingList();
};

window.deleteShoppingItem = function (id) {
  shoppingList = shoppingList.filter((item) => item.id !== id);
  saveShoppingList();
  renderShoppingList();
};

clearCheckedShoppingBtn.addEventListener("click", function () {
  shoppingList = shoppingList.filter((item) => !item.checked);
  saveShoppingList();
  renderShoppingList();
  showToast("Articoli spuntati rimossi.");
});

window.convertShoppingItemToExpense = function (id) {
  const item = shoppingList.find((i) => i.id === id);
  if (!item) return;

  switchTab("expenses");

  descriptionInput.value = item.name;
  categorySelect.value = item.category || "Alimentari";
  quantityInput.value = 1;
  amountInput.value = "";
  setTimeout(() => amountInput.focus(), 120);

  item.checked = true;
  saveShoppingList();
  renderShoppingList();
};

// ==============================================================================
// 6. GESTIONE ACQUISTI FREQUENTI
// ==============================================================================
function renderFrequentDropdowns() {
  quickSelect.innerHTML = '<option value="">-- Seleziona o inserisci una nuova spesa sotto --</option>';
  shoppingQuickSelect.innerHTML = '<option value="">-- Seleziona o elimina una voce frequente --</option>';
  const quickExpenseFreqEl = document.getElementById("quick-expense-frequent");
  if (quickExpenseFreqEl) {
    quickExpenseFreqEl.innerHTML = '<option value="">-- Compila manualmente sotto --</option>';
  }

  frequentItems.forEach((item, index) => {
    const storeInfo = item.store ? ` (${item.store})` : "";

    const opt1 = document.createElement("option");
    opt1.value = index;
    opt1.textContent = `${item.desc}${storeInfo} [${item.cat}]`;
    quickSelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = index;
    opt2.textContent = `➕ ${item.desc} [${item.cat}]`;
    shoppingQuickSelect.appendChild(opt2);

    if (quickExpenseFreqEl) {
      const opt3 = document.createElement("option");
      opt3.value = index;
      opt3.textContent = `${item.desc}${storeInfo} [${item.cat}]`;
      quickExpenseFreqEl.appendChild(opt3);
    }
  });

  deleteFrequentBtn.disabled = true;
  deleteShoppingFrequentBtn.disabled = true;
}

function saveFrequentItems() {
  localStorage.setItem("frequent_items", JSON.stringify(frequentItems));
}

shoppingQuickSelect.addEventListener("change", function () {
  const selectedIndex = this.value;
  if (selectedIndex === "") {
    deleteShoppingFrequentBtn.disabled = true;
    return;
  }

  deleteShoppingFrequentBtn.disabled = false;
  const item = frequentItems[selectedIndex];
  if (item) {
    shoppingItemNameInput.value = item.desc;
    shoppingCategorySelect.value = item.cat || "Alimentari";
    shoppingQuantityInput.value = "1";
    shoppingItemNameInput.focus();
  }
});

deleteShoppingFrequentBtn.addEventListener("click", function () {
  const selectedIndex = shoppingQuickSelect.value;
  if (selectedIndex === "") return;

  const itemToDelete = frequentItems[selectedIndex];
  if (!itemToDelete) return;

  showConfirm(
    `Vuoi rimuovere "${itemToDelete.desc}" dall'elenco degli acquisti frequenti?`,
    () => {
      frequentItems.splice(selectedIndex, 1);
      saveFrequentItems();
      renderFrequentDropdowns();

      if (shoppingItemNameInput.value === itemToDelete.desc) {
        shoppingItemNameInput.value = "";
        shoppingQuantityInput.value = "";
      }
      showToast("Voce frequente rimossa.");
    }
  );
});

quickSelect.addEventListener("change", function () {
  const selectedIndex = this.value;
  if (selectedIndex === "") {
    deleteFrequentBtn.disabled = true;
    return;
  }

  deleteFrequentBtn.disabled = false;
  const selectedItem = frequentItems[selectedIndex];
  if (selectedItem) {
    descriptionInput.value = selectedItem.desc;
    categorySelect.value = selectedItem.cat;
    storeInput.value = selectedItem.store || "";
    if (tagsInput) {
      tagsInput.value = Array.isArray(selectedItem.tags) ? selectedItem.tags.join(", ") : "";
      refreshAllTagSuggestions();
    }
    quantityInput.value = 1;
    amountInput.value = "";
    amountInput.focus();
  }
});

deleteFrequentBtn.addEventListener("click", function () {
  const selectedIndex = quickSelect.value;
  if (selectedIndex === "") return;

  const itemToDelete = frequentItems[selectedIndex];
  if (!itemToDelete) return;

  showConfirm(
    `Vuoi rimuovere "${itemToDelete.desc}" dall'elenco degli acquisti frequenti?`,
    () => {
      frequentItems.splice(selectedIndex, 1);
      saveFrequentItems();
      renderFrequentDropdowns();

      if (descriptionInput.value === itemToDelete.desc) {
        descriptionInput.value = "";
        storeInput.value = "";
        amountInput.value = "";
        if (tagsInput) {
          tagsInput.value = "";
          refreshAllTagSuggestions();
        }
        if (expenseQuickNoteInput) expenseQuickNoteInput.value = "";
        quantityInput.value = 1;
      }
      showToast("Voce frequente rimossa.");
    }
  );
});

// ==============================================================================
// 7. GESTIONE REGISTRO SPESE (SCHEDA 2)
// ==============================================================================
function saveExpenses() {
  localStorage.setItem("current_expenses", JSON.stringify(expenses));
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function saveExpenseHistory() {
  localStorage.setItem("expense_history", JSON.stringify(expenseHistory));
}

function parseTagsInput(raw) {
  if (!raw) return [];
  const seen = new Set();
  const result = [];
  String(raw)
    .split(",")
    .forEach((part) => {
      const cleaned = part.trim().replace(/^#+/, "").trim();
      if (!cleaned) return;
      const key = cleaned.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(cleaned);
      }
    });
  return result;
}

function getAllKnownTags() {
  const seen = new Set();
  const merged = [];
  const addTag = (t) => {
    const clean = String(t || "").trim().replace(/^#+/, "");
    if (!clean) return;
    const key = clean.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(clean);
    }
  };
  customTags.forEach(addTag);
  expenseHistory.forEach((exp) => {
    if (Array.isArray(exp.tags)) exp.tags.forEach(addTag);
  });
  expenses.forEach((exp) => {
    if (Array.isArray(exp.tags)) exp.tags.forEach(addTag);
  });
  DEFAULT_SUGGESTED_TAGS.forEach(addTag);
  return merged;
}

function registerCustomTags(tagsArray) {
  if (!Array.isArray(tagsArray) || tagsArray.length === 0) return;
  const seen = new Set(customTags.map((t) => t.toLowerCase()));
  let changed = false;
  tagsArray.forEach((t) => {
    const clean = String(t || "").trim().replace(/^#+/, "");
    if (clean && !seen.has(clean.toLowerCase())) {
      seen.add(clean.toLowerCase());
      customTags.unshift(clean);
      changed = true;
    }
  });
  if (changed) {
    localStorage.setItem("custom_tags", JSON.stringify(customTags));
  }
}

function renderTagSuggestionsFor(inputEl, containerEl) {
  if (!inputEl || !containerEl) return;
  const currentTagsLower = new Set(parseTagsInput(inputEl.value).map((t) => t.toLowerCase()));
  const known = getAllKnownTags().slice(0, 12);
  containerEl.innerHTML = "";

  known.forEach((tag) => {
    const btn = document.createElement("button");
    btn.type = "button";
    const isActive = currentTagsLower.has(tag.toLowerCase());
    btn.className = `tag-pick-btn ${isActive ? "active" : ""}`;
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    btn.textContent = `#${tag}`;
    btn.addEventListener("click", () => {
      const existing = parseTagsInput(inputEl.value);
      const existsIdx = existing.findIndex((t) => t.toLowerCase() === tag.toLowerCase());
      if (existsIdx >= 0) {
        existing.splice(existsIdx, 1);
      } else {
        existing.push(tag);
      }
      inputEl.value = existing.join(", ");
      renderTagSuggestionsFor(inputEl, containerEl);
    });
    containerEl.appendChild(btn);
  });
}

function refreshAllTagSuggestions() {
  renderTagSuggestionsFor(tagsInput, tagSuggestionsEl);
  const qTags = document.getElementById("quick-expense-tags");
  const qContainer = document.getElementById("quick-expense-tag-suggestions");
  renderTagSuggestionsFor(qTags, qContainer);
}

if (tagsInput) {
  tagsInput.addEventListener("input", () => renderTagSuggestionsFor(tagsInput, tagSuggestionsEl));
}

function renderTagFilterDropdown() {
  if (!filterTagSelect) return;
  const seen = new Set();
  const activeTags = [];
  expenses.forEach((exp) => {
    if (Array.isArray(exp.tags)) {
      exp.tags.forEach((t) => {
        const key = t.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          activeTags.push(t);
        }
      });
    }
  });

  filterTagSelect.innerHTML = '<option value="ALL">🏷️ Tutti i tag</option>';
  activeTags.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = `#${t}`;
    filterTagSelect.appendChild(opt);
  });

  if (currentTagFilter !== "ALL" && !seen.has(currentTagFilter.toLowerCase())) {
    currentTagFilter = "ALL";
  }
  filterTagSelect.value = currentTagFilter;
}

function formatTagsInlineHtml(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return "";
  const formatted = tags.map((t) => `#${escapeHtml(t)}`).join(" · ");
  return `<span class="expense-custom-tags">${formatted}</span>`;
}

function renderExpenses() {
  expenseList.innerHTML = "";
  renderTagFilterDropdown();

  const displayedExpenses = expenses.filter((e) => {
    const matchesCat = currentFilter === "ALL" || e.category === currentFilter;
    const matchesTag =
      currentTagFilter === "ALL" ||
      (Array.isArray(e.tags) && e.tags.some((t) => t.toLowerCase() === currentTagFilter.toLowerCase()));
    return matchesCat && matchesTag;
  });

  const total = displayedExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  if (currentFilter === "ALL" && currentTagFilter === "ALL") {
    totalLabelElement.textContent = "Totale Spesa Corrente";
  } else if (currentFilter !== "ALL" && currentTagFilter !== "ALL") {
    totalLabelElement.textContent = `Totale (${currentFilter} · #${currentTagFilter})`;
  } else if (currentFilter !== "ALL") {
    totalLabelElement.textContent = `Totale (${currentFilter})`;
  } else {
    totalLabelElement.textContent = `Totale (#${currentTagFilter})`;
  }
  totalAmountElement.textContent = `€ ${total.toFixed(2)}`;
  totalCountElement.textContent = displayedExpenses.length;

  if (displayedExpenses.length === 0) {
    emptyStateElement.style.display = "block";
    if (currentFilter === "ALL" && currentTagFilter === "ALL") {
      if (expenseHistory && expenseHistory.length > 0) {
        emptyStateText.innerHTML = "Nessuna spesa nella lista corrente.<br><small style='color: #6b7280; display: inline-block; margin-top: 6px;'>💡 Le spese precedenti rimangono registrate nella scheda <strong>📊 Storico</strong>.</small>";
      } else {
        emptyStateText.textContent = "Nessuna spesa registrata. Aggiungine una dal modulo sopra!";
      }
    } else {
      emptyStateText.textContent = "Nessuna spesa trovata con i filtri selezionati.";
    }
    clearAllBtn.style.display = expenses.length > 0 ? "inline-block" : "none";
  } else {
    emptyStateElement.style.display = "none";
    clearAllBtn.style.display = "inline-block";
  }

  displayedExpenses.forEach((expense) => {
    const li = document.createElement("li");
    li.className = "expense-item";

    const qtyBadge = expense.quantity && expense.quantity > 1
      ? `<span class="badge-qty">Qtà: ${expense.quantity}</span>`
      : "";

    const storeBadge = expense.store
      ? `<span class="badge-store">🏬 ${escapeHtml(expense.store)}</span>`
      : "";

    const tagsHtml = formatTagsInlineHtml(expense.tags);
    const recHtml = expense.recurrence
      ? `<span class="expense-recurrence-label">🔄 ${escapeHtml(getExpenseRecurrenceLabel(expense.recurrence))}</span>`
      : "";
    const noteHtml = expense.note
      ? `<div class="expense-note-text">📝 ${escapeHtml(expense.note)}</div>`
      : "";

    li.innerHTML = `
      <div class="expense-info">
        <span class="expense-desc">${escapeHtml(expense.description)}</span>
        ${noteHtml}
        <div class="expense-meta">
          <span class="badge-tag">${escapeHtml(expense.category)}</span>
          ${storeBadge}
          ${qtyBadge}
          ${recHtml}
          ${tagsHtml}
          <span>📅 ${escapeHtml(expense.date)}</span>
        </div>
      </div>
      <div class="expense-right">
        <span class="expense-amount">€ ${Number(expense.amount).toFixed(2)}</span>
        <button type="button" class="btn-delete" title="Elimina spesa" onclick="deleteExpense(${expense.id})">✕</button>
      </div>
    `;

    expenseList.appendChild(li);
  });

  renderRecurringExpensesList();
  refreshAllTagSuggestions();
  renderIndexOverview();
}

function saveRecurringExpenses() {
  localStorage.setItem("recurring_expenses", JSON.stringify(recurringExpenses));
}

function getExpenseRecurrenceLabel(freq) {
  if (freq === "daily") return "Giornaliera";
  if (freq === "weekly") return "Settimanale";
  if (freq === "monthly") return "Mensile";
  return "";
}

function computeNextExpenseDate(dateStr, frequency) {
  const dt = parseLocalDate(dateStr);
  if (!dt) return "";
  if (frequency === "daily") {
    dt.setDate(dt.getDate() + 1);
  } else if (frequency === "weekly") {
    dt.setDate(dt.getDate() + 7);
  } else if (frequency === "monthly") {
    const day = dt.getDate();
    dt.setMonth(dt.getMonth() + 1);
    if (dt.getDate() < day) dt.setDate(0);
  }
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function createRecurringRuleFromExpense(exp, frequency) {
  const todayStr = getTodayDateString();
  const nextDue = computeNextExpenseDate(todayStr, frequency);
  recurringExpenses.unshift({
    id: Date.now() + Math.floor(Math.random() * 1000) + 1,
    description: exp.description,
    quantity: exp.quantity || 1,
    store: exp.store || "",
    amount: exp.amount,
    category: exp.category,
    tags: Array.isArray(exp.tags) ? exp.tags : [],
    note: exp.note || "",
    frequency,
    startDate: todayStr,
    lastGeneratedDate: todayStr,
    nextDueDate: nextDue,
    active: true,
  });
  saveRecurringExpenses();
}

function processRecurringExpenses() {
  if (!Array.isArray(recurringExpenses) || recurringExpenses.length === 0) return 0;
  const todayStr = getTodayDateString();
  let generatedCount = 0;
  let idOffset = 0;

  recurringExpenses.forEach((rule) => {
    if (!rule.active || !rule.nextDueDate) return;
    let guard = 0;
    while (rule.nextDueDate && rule.nextDueDate <= todayStr && guard < 90) {
      guard += 1;
      idOffset += 1;
      const dueDt = parseLocalDate(rule.nextDueDate);
      const baseTs = dueDt ? dueDt.getTime() + 12 * 3600 * 1000 : Date.now();
      const generatedExpense = {
        id: baseTs + idOffset,
        description: rule.description,
        quantity: rule.quantity || 1,
        store: rule.store || "",
        amount: Number(rule.amount),
        category: rule.category || "Altro",
        tags: Array.isArray(rule.tags) ? [...rule.tags] : [],
        note: rule.note || undefined,
        recurrence: rule.frequency,
        recurringRuleId: rule.id,
        date: formatItalianDate(rule.nextDueDate),
      };

      expenses.unshift(generatedExpense);
      expenseHistory.unshift(generatedExpense);
      generatedCount += 1;

      rule.lastGeneratedDate = rule.nextDueDate;
      rule.nextDueDate = computeNextExpenseDate(rule.nextDueDate, rule.frequency);
    }
  });

  if (generatedCount > 0) {
    saveExpenses();
    saveExpenseHistory();
    saveRecurringExpenses();
  }
  return generatedCount;
}

function renderRecurringExpensesList() {
  if (!recurringExpensesSection || !recurringExpensesList) return;
  const activeRules = recurringExpenses.filter((r) => r.active);
  if (activeRules.length === 0) {
    recurringExpensesSection.style.display = "none";
    recurringExpensesList.innerHTML = "";
    return;
  }

  recurringExpensesSection.style.display = "block";
  recurringExpensesList.innerHTML = "";
  activeRules.forEach((rule) => {
    const li = document.createElement("li");
    li.className = "compact-item";
    const freqLabel = getExpenseRecurrenceLabel(rule.frequency);
    const nextLabel = rule.nextDueDate ? formatItalianDate(rule.nextDueDate) : "—";
    li.innerHTML = `
      <div class="compact-item-main">
        <div class="compact-item-title">${escapeHtml(rule.description)} · € ${Number(rule.amount).toFixed(2)}</div>
        <div class="compact-item-meta">${escapeHtml(rule.category)} · 🔄 ${escapeHtml(freqLabel)} · Prossima: ${escapeHtml(nextLabel)}</div>
      </div>
      <button type="button" class="compact-action-btn" onclick="stopRecurringExpense(${rule.id})" title="Interrompi ricorrenza automatica">Interrompi</button>
    `;
    recurringExpensesList.appendChild(li);
  });
}

window.stopRecurringExpense = function (ruleId) {
  showConfirm("Vuoi interrompere questa spesa ricorrente? Le spese già registrate resteranno salvate.", () => {
    recurringExpenses = recurringExpenses.filter((r) => r.id !== ruleId);
    saveRecurringExpenses();
    renderRecurringExpensesList();
    showToast("Ricorrenza interrotta.");
  });
};

if (expenseRecurringToggle && expenseRecurrenceGroup) {
  expenseRecurringToggle.addEventListener("change", () => {
    expenseRecurrenceGroup.style.display = expenseRecurringToggle.checked ? "flex" : "none";
  });
}

filterCategorySelect.addEventListener("change", function (event) {
  currentFilter = event.target.value;
  renderExpenses();
});

if (filterTagSelect) {
  filterTagSelect.addEventListener("change", function (event) {
    currentTagFilter = event.target.value;
    renderExpenses();
  });
}

expenseForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const quantity = parseInt(quantityInput.value, 10) || 1;
  const store = storeInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;
  const tags = parseTagsInput(tagsInput ? tagsInput.value : "");
  const note = expenseQuickNoteInput ? expenseQuickNoteInput.value.trim() : "";
  const isRecurring = Boolean(expenseRecurringToggle && expenseRecurringToggle.checked);
  const frequency = isRecurring && expenseRecurrenceFreq ? expenseRecurrenceFreq.value : "";

  if (!description || isNaN(amount) || amount <= 0) {
    showToast("Inserisci una descrizione e un importo valido!");
    return;
  }

  registerCustomTags(tags);

  const alreadyExists = frequentItems.some(
    (item) => item.desc.toLowerCase() === description.toLowerCase()
  );

  if (!alreadyExists) {
    frequentItems.push({
      desc: description,
      cat: category,
      store: store,
      tags: tags,
    });
    saveFrequentItems();
    renderFrequentDropdowns();
  }

  const newExpense = {
    id: Date.now(),
    description: description,
    quantity: quantity,
    store: store,
    amount: amount,
    category: category,
    tags: tags,
    note: note || undefined,
    recurrence: frequency || undefined,
    date: new Date().toLocaleDateString("it-IT"),
  };

  expenses.unshift(newExpense);
  saveExpenses();

  expenseHistory.unshift(newExpense);
  saveExpenseHistory();

  if (isRecurring && frequency) {
    createRecurringRuleFromExpense(newExpense, frequency);
  }

  renderExpenses();
  if (tabReportsView.classList.contains("active")) {
    renderReports();
  }

  expenseForm.reset();
  quantityInput.value = 1;
  quickSelect.value = "";
  deleteFrequentBtn.disabled = true;
  if (tagsInput) tagsInput.value = "";
  if (expenseQuickNoteInput) expenseQuickNoteInput.value = "";
  if (expenseRecurringToggle) expenseRecurringToggle.checked = false;
  if (expenseRecurrenceGroup) expenseRecurrenceGroup.style.display = "none";
  if (expenseRecurrenceFreq) expenseRecurrenceFreq.value = "monthly";
  refreshAllTagSuggestions();
  descriptionInput.focus();
  showToast(
    isRecurring
      ? `Spesa salvata con ricorrenza ${getExpenseRecurrenceLabel(frequency).toLowerCase()}.`
      : "Spesa salvata nel registro."
  );
});

window.deleteExpense = function (id) {
  showConfirm(
    "Vuoi eliminare questa spesa? Verrà rimossa anche dallo storico.",
    () => {
      expenses = expenses.filter((expense) => expense.id !== id);
      expenseHistory = expenseHistory.filter((expense) => expense.id !== id);
      saveExpenses();
      saveExpenseHistory();
      renderExpenses();
      if (tabReportsView.classList.contains("active")) {
        renderReports();
      }
      showToast("Spesa eliminata.");
    }
  );
};

clearAllBtn.addEventListener("click", function () {
  if (expenses.length === 0) return;

  showConfirm(
    "Vuoi azzerare le spese registrate per iniziare una nuova lista?\n\nTutte le spese rimarranno salvate nello Storico.",
    () => {
      expenses = [];
      saveExpenses();
      renderExpenses();
      showToast("Lista spese corrente azzerata.");
    }
  );
});

window.deleteHistoryExpense = function (id) {
  showConfirm(
    "Vuoi eliminare definitivamente questa spesa dallo storico?",
    () => {
      expenseHistory = expenseHistory.filter((e) => e.id !== id);
      expenses = expenses.filter((e) => e.id !== id);
      saveExpenseHistory();
      saveExpenses();
      renderReports();
      renderExpenses();
      showToast("Spesa eliminata dallo storico.");
    }
  );
};

// ==============================================================================
// 8. GESTIONE PROMEMORIA E SCADENZE (SCHEDA 3)
// ==============================================================================
function saveReminders() {
  localStorage.setItem("reminders_list", JSON.stringify(remindersList));
}

function getReminderDueStatus(rem) {
  if (rem.completed) {
    return { code: "done", label: "Completato", sortRank: 4, isUrgent: false };
  }
  if (!rem.dueDate) {
    return { code: "nodate", label: "Senza data", sortRank: 3, isUrgent: false };
  }

  const today = parseLocalDate(getTodayDateString());
  const due = parseLocalDate(rem.dueDate);
  if (!today || !due) {
    return { code: "nodate", label: "Senza data", sortRank: 3, isUrgent: false };
  }

  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = formatItalianDate(rem.dueDate);

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return {
      code: "overdue",
      label: abs === 1 ? `Scaduto ieri (${formatted})` : `Scaduto da ${abs} giorni (${formatted})`,
      sortRank: 0,
      isUrgent: true,
    };
  }
  if (diffDays === 0) {
    return {
      code: "today",
      label: `Scade oggi (${formatted})`,
      sortRank: 1,
      isUrgent: true,
    };
  }
  if (diffDays === 1) {
    return {
      code: "soon",
      label: `Domani (${formatted})`,
      sortRank: 2,
      isUrgent: false,
    };
  }
  if (diffDays <= 7) {
    return {
      code: "soon",
      label: `Tra ${diffDays} giorni (${formatted})`,
      sortRank: 2,
      isUrgent: false,
    };
  }
  return {
    code: "scheduled",
    label: formatted,
    sortRank: 2,
    isUrgent: false,
  };
}

function sortReminders(list) {
  const prioWeight = { Alta: 0, Normale: 1, Bassa: 2 };
  return [...list].sort((a, b) => {
    const sa = getReminderDueStatus(a);
    const sb = getReminderDueStatus(b);
    if (sa.sortRank !== sb.sortRank) return sa.sortRank - sb.sortRank;
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    const pa = prioWeight[a.priority] ?? 1;
    const pb = prioWeight[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    return b.id - a.id;
  });
}

function updateRemindersBadge() {
  const activeCount = remindersList.filter((r) => !r.completed).length;
  remindersBadge.textContent = activeCount;
  remindersBadge.style.display = activeCount > 0 ? "inline-block" : "none";
}

function resetReminderFormMode() {
  reminderEditIdInput.value = "";
  reminderFormTitle.textContent = "Nuovo Promemoria / Scadenza";
  reminderSubmitBtn.textContent = "Salva Promemoria / Scadenza";
  reminderCancelEditBtn.style.display = "none";
  reminderForm.reset();
  reminderTypeSelect.value = "Scadenza";
  reminderPrioritySelect.value = "Normale";
  reminderRecurrenceSelect.value = "Nessuna";
}

reminderCancelEditBtn.addEventListener("click", resetReminderFormMode);

function renderReminders() {
  const activeItems = remindersList.filter((r) => !r.completed);
  const urgentItems = activeItems.filter((r) => getReminderDueStatus(r).isUrgent);
  const completedCount = remindersList.filter((r) => r.completed).length;

  remindersActiveCountEl.textContent = activeItems.length;
  remindersUrgentCountEl.textContent = urgentItems.length;
  clearCompletedRemindersBtn.style.display = completedCount > 0 ? "inline-block" : "none";

  let filtered = sortReminders(remindersList);

  if (reminderStatusFilter === "PENDING") {
    filtered = filtered.filter((r) => !r.completed);
  } else if (reminderStatusFilter === "URGENT") {
    filtered = filtered.filter((r) => {
      if (r.completed) return false;
      const st = getReminderDueStatus(r);
      return st.code === "overdue" || st.code === "today" || st.code === "soon";
    });
  } else if (reminderStatusFilter === "COMPLETED") {
    filtered = filtered.filter((r) => r.completed);
  }

  if (reminderTypeFilter !== "ALL") {
    filtered = filtered.filter((r) => r.type === reminderTypeFilter);
  }

  remindersListEl.innerHTML = "";

  if (filtered.length === 0) {
    remindersEmptyState.style.display = "block";
    if (remindersList.length === 0) {
      remindersEmptyText.textContent = "Nessun promemoria o scadenza registrata. Aggiungine una sopra!";
    } else {
      remindersEmptyText.textContent = "Nessun elemento corrisponde ai filtri selezionati.";
    }
  } else {
    remindersEmptyState.style.display = "none";

    filtered.forEach((rem) => {
      const status = getReminderDueStatus(rem);
      const li = document.createElement("li");
      let statusClass = "";
      if (rem.completed) statusClass = "completed";
      else if (status.code === "overdue") statusClass = "is-overdue";
      else if (status.code === "today") statusClass = "is-today";

      li.className = `reminder-item ${statusClass}`;

      const timeStr = rem.dueTime ? ` alle ${escapeHtml(rem.dueTime)}` : "";
      const amountStr = rem.amount && rem.amount > 0 ? `€ ${Number(rem.amount).toFixed(2)}` : "";
      const recurrenceStr = rem.recurrence && rem.recurrence !== "Nessuna" ? `Ricorrenza: ${escapeHtml(rem.recurrence)}` : "";
      const prioStr = rem.priority && rem.priority !== "Normale" ? `Priorità ${escapeHtml(rem.priority)}` : "";

      const metaParts = [
        escapeHtml(rem.type),
        escapeHtml(rem.category),
        `<span class="reminder-status-label ${status.code}">${escapeHtml(status.label)}${timeStr}</span>`,
      ];
      if (amountStr) metaParts.push(`<strong>${amountStr}</strong>`);
      if (prioStr) metaParts.push(prioStr);
      if (recurrenceStr) metaParts.push(recurrenceStr);

      const convertBtnHtml = !rem.completed
        ? `<button type="button" class="btn-convert-expense" title="Registra nelle spese" onclick="convertReminderToExpense(${rem.id})">💰 Registra</button>`
        : "";

      li.innerHTML = `
        <div class="reminder-left">
          <input type="checkbox" class="reminder-checkbox" ${rem.completed ? "checked" : ""} onchange="toggleReminder(${rem.id})" aria-label="Segna completato">
          <div class="reminder-info">
            <span class="reminder-title-text">${escapeHtml(rem.title)}</span>
            <div class="reminder-meta-line">${metaParts.join(" · ")}</div>
            ${rem.note ? `<div class="reminder-note-text">${escapeHtml(rem.note)}</div>` : ""}
          </div>
        </div>
        <div class="reminder-right">
          ${convertBtnHtml}
          <button type="button" class="btn-icon-action" title="Modifica" onclick="editReminder(${rem.id})">✏️</button>
          <button type="button" class="btn-delete" title="Elimina" onclick="deleteReminder(${rem.id})">✕</button>
        </div>
      `;

      remindersListEl.appendChild(li);
    });
  }

  updateRemindersBadge();
  renderIndexOverview();
}

reminderForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const title = reminderTitleInput.value.trim();
  if (!title) {
    showToast("Inserisci un titolo per il promemoria o la scadenza.");
    return;
  }

  const editId = reminderEditIdInput.value ? Number(reminderEditIdInput.value) : null;
  const amountVal = parseFloat(reminderAmountInput.value);

  const payload = {
    title,
    type: reminderTypeSelect.value || "Scadenza",
    category: reminderCategorySelect.value || "Altro",
    dueDate: reminderDateInput.value || "",
    dueTime: reminderTimeInput.value || "",
    priority: reminderPrioritySelect.value || "Normale",
    amount: !isNaN(amountVal) && amountVal > 0 ? amountVal : null,
    recurrence: reminderRecurrenceSelect.value || "Nessuna",
    note: reminderNoteInput.value.trim(),
  };

  if (editId) {
    remindersList = remindersList.map((r) =>
      r.id === editId ? { ...r, ...payload } : r
    );
    showToast("Promemoria aggiornato.");
  } else {
    const newReminder = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      ...payload,
      completed: false,
      createdAt: Date.now(),
    };
    remindersList.unshift(newReminder);
    showToast(`${payload.type} salvata.`);
  }

  saveReminders();
  resetReminderFormMode();
  renderReminders();
});

window.toggleReminder = function (id) {
  let spawnedNextDate = "";
  remindersList = remindersList.map((r) => {
    if (r.id !== id) return r;
    const nextCompleted = !r.completed;

    // Se si completa una scadenza ricorrente con data, genera automaticamente la successiva
    if (nextCompleted && r.dueDate && r.recurrence && r.recurrence !== "Nessuna" && !r.nextSpawned) {
      const nextDate = addRecurrenceToDate(r.dueDate, r.recurrence);
      if (nextDate) {
        spawnedNextDate = nextDate;
        remindersList.push({
          ...r,
          id: Date.now() + Math.floor(Math.random() * 1000) + 1,
          dueDate: nextDate,
          completed: false,
          nextSpawned: false,
          createdAt: Date.now(),
        });
      }
      return { ...r, completed: true, nextSpawned: true };
    }

    return { ...r, completed: nextCompleted };
  });

  saveReminders();
  renderReminders();

  if (spawnedNextDate) {
    showToast(`Completato! Prossima ricorrenza fissata al ${formatItalianDate(spawnedNextDate)}.`);
  }
};

window.editReminder = function (id) {
  const rem = remindersList.find((r) => r.id === id);
  if (!rem) return;

  reminderEditIdInput.value = String(rem.id);
  reminderTitleInput.value = rem.title;
  reminderTypeSelect.value = rem.type || "Scadenza";
  reminderCategorySelect.value = rem.category || "Altro";
  reminderDateInput.value = rem.dueDate || "";
  reminderTimeInput.value = rem.dueTime || "";
  reminderPrioritySelect.value = rem.priority || "Normale";
  reminderAmountInput.value = rem.amount ? String(rem.amount) : "";
  reminderRecurrenceSelect.value = rem.recurrence || "Nessuna";
  reminderNoteInput.value = rem.note || "";

  reminderFormTitle.textContent = "Modifica Promemoria / Scadenza";
  reminderSubmitBtn.textContent = "Salva Modifiche";
  reminderCancelEditBtn.style.display = "inline-block";

  switchTab("reminders");
  setTimeout(() => reminderTitleInput.focus(), 120);
};

window.deleteReminder = function (id) {
  showConfirm("Vuoi eliminare questo promemoria/scadenza?", () => {
    remindersList = remindersList.filter((r) => r.id !== id);
    if (Number(reminderEditIdInput.value) === id) {
      resetReminderFormMode();
    }
    saveReminders();
    renderReminders();
    showToast("Elemento eliminato.");
  });
};

window.convertReminderToExpense = function (id) {
  const rem = remindersList.find((r) => r.id === id);
  if (!rem) return;

  switchTab("expenses");
  descriptionInput.value = rem.title;
  const validCategories = ["Alimentari", "Trasporti", "Svago", "Casa", "Altro"];
  categorySelect.value = validCategories.includes(rem.category) ? rem.category : "Altro";
  quantityInput.value = 1;
  amountInput.value = rem.amount && rem.amount > 0 ? Number(rem.amount).toFixed(2) : "";
  setTimeout(() => (amountInput.value ? descriptionInput.focus() : amountInput.focus()), 120);

  if (!rem.completed) {
    window.toggleReminder(id);
  }
};

reminderFilterStatusSelect.addEventListener("change", (e) => {
  reminderStatusFilter = e.target.value;
  renderReminders();
});

reminderFilterTypeSelect.addEventListener("change", (e) => {
  reminderTypeFilter = e.target.value;
  renderReminders();
});

clearCompletedRemindersBtn.addEventListener("click", () => {
  showConfirm("Vuoi eliminare tutti i promemoria e le scadenze completati?", () => {
    remindersList = remindersList.filter((r) => !r.completed);
    saveReminders();
    renderReminders();
    showToast("Completati rimossi.");
  });
});

// ==============================================================================
// 9. GESTIONE NOTE E APPUNTI (SCHEDA 4)
// ==============================================================================
function saveNotes() {
  localStorage.setItem("notes_list", JSON.stringify(notesList));
}

function resetNoteFormMode() {
  noteEditIdInput.value = "";
  noteFormTitle.textContent = "Nuova Nota";
  noteSubmitBtn.textContent = "Salva Nota";
  noteCancelEditBtn.style.display = "none";
  noteForm.reset();
  noteCategorySelect.value = "Generale";
  notePinnedCheckbox.checked = false;
}

noteCancelEditBtn.addEventListener("click", resetNoteFormMode);

function renderNotes() {
  notesTotalCountEl.textContent = notesList.length;

  const q = noteSearchQuery.trim().toLowerCase();
  let filtered = [...notesList].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return (b.updatedAt || b.id) - (a.updatedAt || a.id);
  });

  if (noteCategoryFilter !== "ALL") {
    filtered = filtered.filter((n) => n.category === noteCategoryFilter);
  }

  if (q) {
    filtered = filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    );
  }

  notesListEl.innerHTML = "";

  if (filtered.length === 0) {
    notesEmptyState.style.display = "block";
    notesEmptyText.textContent =
      notesList.length === 0
        ? "Nessuna nota salvata. Scrivi il tuo primo appunto sopra!"
        : "Nessuna nota trovata con i filtri attuali.";
  } else {
    notesEmptyState.style.display = "none";

    filtered.forEach((note) => {
      const li = document.createElement("li");
      li.className = `note-card ${note.pinned ? "pinned" : ""}`;

      const dateStr = new Date(note.updatedAt || note.createdAt || note.id).toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const pinLabel = note.pinned ? "📌 Fissata · " : "";

      li.innerHTML = `
        <div class="note-card-header">
          <div>
            <div class="note-title-text">${escapeHtml(note.title)}</div>
            <div class="note-meta-line">${pinLabel}${escapeHtml(note.category)} · Aggiornata il ${escapeHtml(dateStr)}</div>
          </div>
          <div class="note-actions">
            <button type="button" class="btn-icon-action" title="${note.pinned ? "Rimuovi fissaggio" : "Fissa in alto"}" onclick="togglePinNote(${note.id})">📌</button>
            <button type="button" class="btn-icon-action" title="Modifica nota" onclick="editNote(${note.id})">✏️</button>
            <button type="button" class="btn-delete" title="Elimina nota" onclick="deleteNote(${note.id})">✕</button>
          </div>
        </div>
        <div class="note-body-text">${escapeHtml(note.content)}</div>
      `;

      notesListEl.appendChild(li);
    });
  }

  renderIndexOverview();
}

noteForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();
  const category = noteCategorySelect.value || "Generale";
  const pinned = notePinnedCheckbox.checked;

  if (!title || !content) {
    showToast("Inserisci sia un titolo che il testo della nota.");
    return;
  }

  const editId = noteEditIdInput.value ? Number(noteEditIdInput.value) : null;
  const now = Date.now();

  if (editId) {
    notesList = notesList.map((n) =>
      n.id === editId
        ? { ...n, title, content, category, pinned, updatedAt: now }
        : n
    );
    showToast("Nota aggiornata.");
  } else {
    notesList.unshift({
      id: now + Math.floor(Math.random() * 1000),
      title,
      category,
      content,
      pinned,
      createdAt: now,
      updatedAt: now,
    });
    showToast("Nota salvata.");
  }

  saveNotes();
  resetNoteFormMode();
  renderNotes();
});

window.togglePinNote = function (id) {
  notesList = notesList.map((n) =>
    n.id === id ? { ...n, pinned: !n.pinned } : n
  );
  saveNotes();
  renderNotes();
};

window.editNote = function (id) {
  const note = notesList.find((n) => n.id === id);
  if (!note) return;

  noteEditIdInput.value = String(note.id);
  noteTitleInput.value = note.title;
  noteCategorySelect.value = note.category || "Generale";
  noteContentInput.value = note.content;
  notePinnedCheckbox.checked = Boolean(note.pinned);

  noteFormTitle.textContent = "Modifica Nota";
  noteSubmitBtn.textContent = "Salva Modifiche";
  noteCancelEditBtn.style.display = "inline-block";

  switchTab("notes");
  setTimeout(() => noteTitleInput.focus(), 120);
};

window.deleteNote = function (id) {
  showConfirm("Vuoi eliminare questa nota definitivamente?", () => {
    notesList = notesList.filter((n) => n.id !== id);
    if (Number(noteEditIdInput.value) === id) {
      resetNoteFormMode();
    }
    saveNotes();
    renderNotes();
    showToast("Nota eliminata.");
  });
};

noteSearchInput.addEventListener("input", (e) => {
  noteSearchQuery = e.target.value;
  renderNotes();
});

noteFilterCategorySelect.addEventListener("change", (e) => {
  noteCategoryFilter = e.target.value;
  renderNotes();
});

// ==============================================================================
// 10. INDICE GENERALE (SCHEDA 0)
// ==============================================================================
function renderIndexOverview() {
  if (!indexTodayDate) return;

  const now = new Date();
  const formattedToday = now.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  indexTodayDate.textContent = formattedToday.charAt(0).toUpperCase() + formattedToday.slice(1);

  // 1. Directory Lista Spesa
  const pendingShopping = shoppingList.filter((i) => !i.checked);
  idxShoppingCount.textContent =
    pendingShopping.length === 1 ? "1 da comprare" : `${pendingShopping.length} da comprare`;
  if (pendingShopping.length === 0) {
    idxShoppingPreview.textContent = "Nessun articolo in attesa";
  } else {
    const names = pendingShopping.slice(0, 3).map((i) => i.name).join(", ");
    idxShoppingPreview.textContent = pendingShopping.length > 3 ? `${names}…` : names;
  }

  // 2. Directory Spese Correnti
  const currentTotal = expenses.reduce((acc, c) => acc + Number(c.amount || 0), 0);
  idxExpensesTotal.textContent = `€ ${currentTotal.toFixed(2)}`;
  idxExpensesSub.textContent =
    expenses.length === 1 ? "1 spesa nella sessione" : `${expenses.length} spese nella sessione`;

  // 3. Directory Promemoria & Scadenze
  const activeReminders = sortReminders(remindersList.filter((r) => !r.completed));
  const urgentReminders = activeReminders.filter((r) => getReminderDueStatus(r).isUrgent);
  idxRemindersCount.textContent =
    activeReminders.length === 1 ? "1 attivo" : `${activeReminders.length} attivi`;
  if (urgentReminders.length > 0) {
    idxRemindersSub.textContent = `${urgentReminders.length} scaduti o in scadenza oggi`;
    idxRemindersSub.classList.add("urgent-text");
  } else if (activeReminders.length > 0) {
    const first = activeReminders[0];
    idxRemindersSub.textContent = `Prossimo: ${first.title}`;
    idxRemindersSub.classList.remove("urgent-text");
  } else {
    idxRemindersSub.textContent = "Nessuna scadenza imminente";
    idxRemindersSub.classList.remove("urgent-text");
  }

  // 4. Directory Note
  const pinnedNotes = notesList.filter((n) => n.pinned);
  idxNotesCount.textContent = notesList.length === 1 ? "1 nota" : `${notesList.length} note`;
  if (notesList.length === 0) {
    idxNotesSub.textContent = "Nessuna nota salvata";
  } else if (pinnedNotes.length > 0) {
    idxNotesSub.textContent = `${pinnedNotes.length} in evidenza nell'indice`;
  } else {
    idxNotesSub.textContent = `Ultima: ${notesList[0].title}`;
  }

  // 5. Prossime Scadenze & Promemoria nel pannello Indice
  indexUpcomingReminders.innerHTML = "";
  const topReminders = activeReminders.slice(0, 5);
  if (topReminders.length === 0) {
    indexRemindersEmpty.style.display = "block";
  } else {
    indexRemindersEmpty.style.display = "none";
    topReminders.forEach((rem) => {
      const st = getReminderDueStatus(rem);
      const li = document.createElement("li");
      li.className = "compact-item";
      const metaClass =
        st.code === "overdue"
          ? "status-overdue-text"
          : st.code === "today"
          ? "status-today-text"
          : "";
      const amountBadge = rem.amount ? ` · € ${Number(rem.amount).toFixed(2)}` : "";

      li.innerHTML = `
        <div class="compact-item-main">
          <div class="compact-item-title">${escapeHtml(rem.title)}</div>
          <div class="compact-item-meta ${metaClass}">${escapeHtml(rem.type)} · ${escapeHtml(st.label)}${amountBadge}</div>
        </div>
        <button type="button" class="compact-action-btn" onclick="toggleReminder(${rem.id})" title="Segna come completato">✓ Fatto</button>
      `;
      indexUpcomingReminders.appendChild(li);
    });
  }

  // 6. Note in Evidenza nel pannello Indice
  indexPinnedNotes.innerHTML = "";
  const featuredNotes = (pinnedNotes.length > 0 ? pinnedNotes : notesList).slice(0, 5);
  if (featuredNotes.length === 0) {
    indexNotesEmpty.style.display = "block";
  } else {
    indexNotesEmpty.style.display = "none";
    featuredNotes.forEach((note) => {
      const li = document.createElement("li");
      li.className = "compact-item";
      const snippet = note.content.replace(/\s+/g, " ").trim();
      const shortSnippet = snippet.length > 58 ? `${snippet.slice(0, 58)}…` : snippet;

      li.innerHTML = `
        <div class="compact-item-main">
          <div class="compact-item-title">${note.pinned ? "📌 " : ""}${escapeHtml(note.title)}</div>
          <div class="compact-item-meta">${escapeHtml(note.category)} · ${escapeHtml(shortSnippet)}</div>
        </div>
        <button type="button" class="compact-action-btn" onclick="editNote(${note.id})">Apri</button>
      `;
      indexPinnedNotes.appendChild(li);
    });
  }

  // 7. Riepilogo Mese Corrente nello Storico
  const currYearStr = String(now.getFullYear());
  const currMonthKey = `${currYearStr}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${currYearStr}`;
  const monthExpenses = expenseHistory.filter((exp) => getExpenseDateInfo(exp).monthKey === currMonthKey);
  const monthTotal = monthExpenses.reduce((acc, c) => acc + Number(c.amount || 0), 0);

  idxMonthTitle.textContent = `Riepilogo ${monthLabel}`;
  idxMonthDetail.textContent =
    monthExpenses.length === 1
      ? "1 spesa registrata nello storico questo mese"
      : `${monthExpenses.length} spese registrate nello storico questo mese`;
  idxMonthTotal.textContent = `€ ${monthTotal.toFixed(2)}`;
}

// Ricerca globale nell'Indice Generale
indexGlobalSearch.addEventListener("input", function () {
  const query = this.value.trim().toLowerCase();
  if (!query) {
    indexSearchResults.style.display = "none";
    indexSearchResults.innerHTML = "";
    return;
  }

  const results = [];

  shoppingList.forEach((item) => {
    if (item.name.toLowerCase().includes(query) || (item.category || "").toLowerCase().includes(query)) {
      results.push({
        title: item.name,
        meta: `${item.category}${item.quantity ? ` · ${item.quantity}` : ""}${item.checked ? " · Spuntato" : ""}`,
        section: "🛒 Lista",
        target: "shopping",
      });
    }
  });

  remindersList.forEach((rem) => {
    if (
      rem.title.toLowerCase().includes(query) ||
      (rem.note || "").toLowerCase().includes(query) ||
      (rem.category || "").toLowerCase().includes(query)
    ) {
      const st = getReminderDueStatus(rem);
      results.push({
        title: rem.title,
        meta: `${rem.type} · ${st.label}`,
        section: "⏰ Scadenze",
        target: "reminders",
      });
    }
  });

  notesList.forEach((note) => {
    if (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      (note.category || "").toLowerCase().includes(query)
    ) {
      results.push({
        title: note.title,
        meta: `${note.category} · ${note.content.slice(0, 45)}`,
        section: "📝 Note",
        target: "notes",
      });
    }
  });

  expenseHistory.forEach((exp) => {
    const expTags = Array.isArray(exp.tags) ? exp.tags : [];
    const tagsMatch = expTags.some((t) => t.toLowerCase().includes(query));
    if (
      exp.description.toLowerCase().includes(query) ||
      (exp.store || "").toLowerCase().includes(query) ||
      (exp.category || "").toLowerCase().includes(query) ||
      (exp.note || "").toLowerCase().includes(query) ||
      tagsMatch
    ) {
      const tagsPreview = expTags.length ? ` · ${expTags.map((t) => `#${t}`).join(" ")}` : "";
      const notePreview = exp.note ? ` · 📝 ${exp.note}` : "";
      results.push({
        title: `${exp.description} (€ ${Number(exp.amount).toFixed(2)})`,
        meta: `${exp.category}${exp.store ? ` · ${exp.store}` : ""}${tagsPreview}${notePreview} · ${exp.date}`,
        section: "📊 Storico",
        target: "reports",
      });
    }
  });

  indexSearchResults.style.display = "flex";
  indexSearchResults.innerHTML = "";

  if (results.length === 0) {
    indexSearchResults.innerHTML = `<div class="section-hint">Nessun risultato trovato per "${escapeHtml(this.value.trim())}".</div>`;
    return;
  }

  results.slice(0, 12).forEach((res) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "search-result-item";
    btn.innerHTML = `
      <div>
        <div class="search-result-title">${escapeHtml(res.title)}</div>
        <div class="search-result-meta">${escapeHtml(res.meta)}</div>
      </div>
      <span class="search-result-section">${escapeHtml(res.section)} →</span>
    `;
    btn.addEventListener("click", () => switchTab(res.target));
    indexSearchResults.appendChild(btn);
  });
});

// ==============================================================================
// 11. SCHEDA 5: STORICO E REPORT MENSILE / ANNUALE
// ==============================================================================
btnModeMonthly.addEventListener("click", function () {
  reportMode = "monthly";
  btnModeMonthly.classList.add("active");
  btnModeYearly.classList.remove("active");
  sectionSelectMonth.style.display = "block";
  sectionSelectYear.style.display = "none";
  yearlyBreakdownSection.style.display = "none";
  renderReports();
});

btnModeYearly.addEventListener("click", function () {
  reportMode = "yearly";
  btnModeYearly.classList.add("active");
  btnModeMonthly.classList.remove("active");
  sectionSelectMonth.style.display = "none";
  sectionSelectYear.style.display = "block";
  yearlyBreakdownSection.style.display = "block";
  renderReports();
});

reportMonthSelect.addEventListener("change", function () {
  selectedReportMonth = this.value;
  renderReportsData();
});

reportYearSelect.addEventListener("change", function () {
  selectedReportYear = this.value;
  renderReportsData();
});

function populateReportSelectors() {
  const monthsMap = new Map();
  const yearsSet = new Set();

  const now = new Date();
  const currentYearStr = String(now.getFullYear());
  const currentMonthPadded = String(now.getMonth() + 1).padStart(2, "0");
  const currentMonthKey = `${currentYearStr}-${currentMonthPadded}`;
  monthsMap.set(currentMonthKey, `${MONTH_NAMES[now.getMonth()]} ${currentYearStr}`);
  yearsSet.add(currentYearStr);

  expenseHistory.forEach((exp) => {
    const info = getExpenseDateInfo(exp);
    monthsMap.set(info.monthKey, `${info.monthName} ${info.year}`);
    yearsSet.add(info.year);
  });

  const sortedMonthKeys = Array.from(monthsMap.keys()).sort().reverse();
  reportMonthSelect.innerHTML = "";
  sortedMonthKeys.forEach((key) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = monthsMap.get(key);
    reportMonthSelect.appendChild(opt);
  });

  if (!selectedReportMonth || !monthsMap.has(selectedReportMonth)) {
    selectedReportMonth = sortedMonthKeys[0] || currentMonthKey;
  }
  reportMonthSelect.value = selectedReportMonth;

  const sortedYears = Array.from(yearsSet).sort().reverse();
  reportYearSelect.innerHTML = "";
  sortedYears.forEach((yr) => {
    const opt = document.createElement("option");
    opt.value = yr;
    opt.textContent = `Anno ${yr}`;
    reportYearSelect.appendChild(opt);
  });

  if (!selectedReportYear || !yearsSet.has(selectedReportYear)) {
    selectedReportYear = sortedYears[0] || currentYearStr;
  }
  reportYearSelect.value = selectedReportYear;
}

function renderReports() {
  populateReportSelectors();
  renderReportsData();
}

const reportsChartTitleEl = document.getElementById("reports-chart-title");
const reportsChartSubtitleEl = document.getElementById("reports-chart-subtitle");

function renderReportsData() {
  reportExpenseList.innerHTML = "";
  const baseCategories = ["Alimentari", "Trasporti", "Svago", "Casa", "Altro"];

  if (reportMode === "monthly") {
    reportSummaryLabel.textContent = "Totale Mese";

    const filtered = expenseHistory.filter((exp) => {
      const info = getExpenseDateInfo(exp);
      return info.monthKey === selectedReportMonth;
    });

    const monthLabel = reportMonthSelect.options[reportMonthSelect.selectedIndex]?.text || "Selezionato";
    reportListTitle.textContent = `Spese di ${monthLabel}`;

    const total = filtered.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    reportTotalAmount.textContent = `€ ${total.toFixed(2)}`;
    reportTotalCount.textContent = filtered.length;

    // Aggrega spese mensili per categoria per il grafico Recharts
    const catTotals = new Map();
    baseCategories.forEach((c) => catTotals.set(c, { category: c, amount: 0, count: 0 }));
    filtered.forEach((exp) => {
      const cat = exp.category || "Altro";
      const prev = catTotals.get(cat) || { category: cat, amount: 0, count: 0 };
      prev.amount = Number((prev.amount + Number(exp.amount || 0)).toFixed(2));
      prev.count += 1;
      catTotals.set(cat, prev);
    });
    const monthlyChartData = Array.from(catTotals.values());

    if (reportsChartTitleEl) reportsChartTitleEl.textContent = `Spese per Categoria — ${monthLabel}`;
    if (reportsChartSubtitleEl) reportsChartSubtitleEl.textContent = "Ripartizione delle spese mensili per categoria";
    if (typeof window.renderReportsChart === "function") {
      requestAnimationFrame(() => {
        window.renderReportsChart({
          mode: "monthly",
          monthlyData: monthlyChartData,
        });
      });
    }

    if (filtered.length === 0) {
      reportEmptyState.style.display = "block";
    } else {
      reportEmptyState.style.display = "none";
      filtered.forEach((exp) => renderReportItem(exp));
    }
  } else {
    reportSummaryLabel.textContent = `Totale Anno ${selectedReportYear}`;

    const filtered = expenseHistory.filter((exp) => {
      const info = getExpenseDateInfo(exp);
      return info.year === selectedReportYear;
    });

    reportListTitle.textContent = `Tutte le spese dell'Anno ${selectedReportYear}`;

    const total = filtered.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    reportTotalAmount.textContent = `€ ${total.toFixed(2)}`;
    reportTotalCount.textContent = filtered.length;

    const usedCategoriesSet = new Set(baseCategories);
    filtered.forEach((exp) => usedCategoriesSet.add(exp.category || "Altro"));
    const allCategories = Array.from(usedCategoriesSet);

    yearlyMonthsGrid.innerHTML = "";
    const yearlyChartData = MONTH_NAMES.map((mName, mIdx) => {
      const monthExp = filtered.filter((exp) => getExpenseDateInfo(exp).monthIndex === mIdx);
      const mTotal = monthExp.reduce((a, c) => a + Number(c.amount || 0), 0);

      const card = document.createElement("div");
      card.className = `month-summary-card ${mTotal > 0 ? "has-expenses" : ""}`;
      card.innerHTML = `
        <span class="m-name">${mName}</span>
        <span class="m-amount">€ ${mTotal.toFixed(2)}</span>
      `;
      yearlyMonthsGrid.appendChild(card);

      const row = {
        month: mName.slice(0, 3),
        total: Number(mTotal.toFixed(2)),
      };
      allCategories.forEach((cat) => {
        row[cat] = 0;
      });
      monthExp.forEach((exp) => {
        const cat = exp.category || "Altro";
        row[cat] = Number((row[cat] + Number(exp.amount || 0)).toFixed(2));
      });
      return row;
    });

    if (reportsChartTitleEl) reportsChartTitleEl.textContent = `Spese Mensili per Categoria — Anno ${selectedReportYear}`;
    if (reportsChartSubtitleEl) reportsChartSubtitleEl.textContent = "Confronto mese per mese suddiviso per categoria";
    if (typeof window.renderReportsChart === "function") {
      requestAnimationFrame(() => {
        window.renderReportsChart({
          mode: "yearly",
          yearlyData: yearlyChartData,
          categories: allCategories,
        });
      });
    }

    if (filtered.length === 0) {
      reportEmptyState.style.display = "block";
    } else {
      reportEmptyState.style.display = "none";
      filtered.forEach((exp) => renderReportItem(exp));
    }
  }
}

function renderReportItem(expense) {
  const li = document.createElement("li");
  li.className = "expense-item";

  const qtyBadge = expense.quantity && expense.quantity > 1
    ? `<span class="badge-qty">Qtà: ${expense.quantity}</span>`
    : "";

  const storeBadge = expense.store
    ? `<span class="badge-store">🏬 ${escapeHtml(expense.store)}</span>`
    : "";

  const tagsHtml = formatTagsInlineHtml(expense.tags);
  const recHtml = expense.recurrence
    ? `<span class="expense-recurrence-label">🔄 ${escapeHtml(getExpenseRecurrenceLabel(expense.recurrence))}</span>`
    : "";
  const noteHtml = expense.note
    ? `<div class="expense-note-text">📝 ${escapeHtml(expense.note)}</div>`
    : "";

  li.innerHTML = `
    <div class="expense-info">
      <span class="expense-desc">${escapeHtml(expense.description)}</span>
      ${noteHtml}
      <div class="expense-meta">
        <span class="badge-tag">${escapeHtml(expense.category)}</span>
        ${storeBadge}
        ${qtyBadge}
        ${recHtml}
        ${tagsHtml}
        <span>📅 ${escapeHtml(expense.date)}</span>
      </div>
    </div>
    <div class="expense-right">
      <span class="expense-amount">€ ${Number(expense.amount).toFixed(2)}</span>
      <button type="button" class="btn-delete" title="Elimina dallo storico" onclick="deleteHistoryExpense(${expense.id})">✕</button>
    </div>
  `;

  reportExpenseList.appendChild(li);
}

const btnExportReportPdf = document.getElementById("btn-export-report-pdf");

if (btnExportReportPdf) {
  btnExportReportPdf.addEventListener("click", async () => {
    if (typeof window.exportReportPdf !== "function") {
      showToast("Generatore PDF non disponibile.");
      return;
    }

    const baseCategories = ["Alimentari", "Trasporti", "Svago", "Casa", "Altro"];
    const originalLabel = btnExportReportPdf.textContent;
    btnExportReportPdf.disabled = true;
    btnExportReportPdf.textContent = "Generazione PDF...";

    try {
      if (reportMode === "monthly") {
        const monthLabel = reportMonthSelect.options[reportMonthSelect.selectedIndex]?.text || selectedReportMonth || "Mese";
        const filtered = expenseHistory.filter((exp) => getExpenseDateInfo(exp).monthKey === selectedReportMonth);
        const total = filtered.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

        const mappedExpenses = filtered.map((exp) => ({
          ...exp,
          dateFormatted: getExpenseDateInfo(exp).dateFormatted,
          recurrenceLabel: exp.recurrence ? getExpenseRecurrenceLabel(exp.recurrence) : "",
        }));

        await window.exportReportPdf({
          mode: "monthly",
          periodTitle: `Report Spese — ${monthLabel}`,
          periodSubtitle: "Riepilogo mensile per categoria ed elenco dettagliato",
          totalAmount: total,
          totalCount: mappedExpenses.length,
          categories: baseCategories,
          yearlySummary: [],
          expenses: mappedExpenses,
          fileName: `report-spese-${selectedReportMonth || getTodayDateString()}.pdf`,
        });
      } else {
        const yearStr = selectedReportYear || String(new Date().getFullYear());
        const filtered = expenseHistory.filter((exp) => getExpenseDateInfo(exp).year === yearStr);
        const total = filtered.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

        const usedCategoriesSet = new Set(baseCategories);
        filtered.forEach((exp) => usedCategoriesSet.add(exp.category || "Altro"));
        const allCategories = Array.from(usedCategoriesSet);

        const yearlySummary = MONTH_NAMES.map((mName, mIdx) => {
          const monthExp = filtered.filter((exp) => getExpenseDateInfo(exp).monthIndex === mIdx);
          const mTotal = monthExp.reduce((a, c) => a + Number(c.amount || 0), 0);
          return { name: mName, total: Number(mTotal.toFixed(2)) };
        });

        const mappedExpenses = filtered.map((exp) => ({
          ...exp,
          dateFormatted: getExpenseDateInfo(exp).dateFormatted,
          recurrenceLabel: exp.recurrence ? getExpenseRecurrenceLabel(exp.recurrence) : "",
        }));

        await window.exportReportPdf({
          mode: "yearly",
          periodTitle: `Report Spese — Anno ${yearStr}`,
          periodSubtitle: "Riepilogo annuale mese per mese, grafico ed elenco spese",
          totalAmount: total,
          totalCount: mappedExpenses.length,
          categories: allCategories,
          yearlySummary,
          expenses: mappedExpenses,
          fileName: `report-spese-anno-${yearStr}.pdf`,
        });
      }

      showToast("Report PDF scaricato.");
    } catch {
      showToast("Errore durante la generazione del report PDF.");
    } finally {
      btnExportReportPdf.disabled = false;
      btnExportReportPdf.textContent = originalLabel;
    }
  });
}

// ==============================================================================
// 12. BACKUP ESPORTAZIONE / IMPORTAZIONE DATI (.JSON)
// ==============================================================================
const btnExportBackup = document.getElementById("btn-export-backup");
const btnImportBackup = document.getElementById("btn-import-backup");
const importBackupInput = document.getElementById("import-backup-input");

if (btnExportBackup) {
  btnExportBackup.addEventListener("click", () => {
    const backup = {
      version: 4,
      exportedAt: new Date().toISOString(),
      current_expenses: expenses,
      expense_history: expenseHistory,
      frequent_items: frequentItems,
      shopping_list: shoppingList,
      reminders_list: remindersList,
      notes_list: notesList,
      custom_tags: customTags,
      recurring_expenses: recurringExpenses,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gestore-spese-backup-${getTodayDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Backup esportato con successo.");
  });
}

if (btnImportBackup && importBackupInput) {
  btnImportBackup.addEventListener("click", () => importBackupInput.click());

  importBackupInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || "{}"));
        if (!parsed || typeof parsed !== "object") {
          showToast("File di backup non valido.");
          return;
        }

        showConfirm(
          "Vuoi ripristinare i dati dal backup selezionato? I dati attuali verranno sostituiti.",
          () => {
            if (Array.isArray(parsed.current_expenses)) {
              expenses = parsed.current_expenses;
              saveExpenses();
            }
            if (Array.isArray(parsed.expense_history)) {
              expenseHistory = parsed.expense_history;
              saveExpenseHistory();
            }
            if (Array.isArray(parsed.frequent_items)) {
              frequentItems = parsed.frequent_items;
              saveFrequentItems();
            }
            if (Array.isArray(parsed.shopping_list)) {
              shoppingList = parsed.shopping_list;
              saveShoppingList();
            }
            if (Array.isArray(parsed.reminders_list)) {
              remindersList = parsed.reminders_list;
              saveReminders();
            }
            if (Array.isArray(parsed.notes_list)) {
              notesList = parsed.notes_list;
              saveNotes();
            }
            if (Array.isArray(parsed.custom_tags)) {
              customTags = parsed.custom_tags;
              localStorage.setItem("custom_tags", JSON.stringify(customTags));
            }
            if (Array.isArray(parsed.recurring_expenses)) {
              recurringExpenses = parsed.recurring_expenses;
              saveRecurringExpenses();
            }

            processRecurringExpenses();
            renderFrequentDropdowns();
            renderShoppingList();
            renderExpenses();
            renderReminders();
            renderNotes();
            renderReports();
            renderIndexOverview();
            showToast("Backup ripristinato con successo!");
          }
        );
      } catch {
        showToast("Impossibile leggere il file di backup.");
      } finally {
        importBackupInput.value = "";
      }
    };
    reader.readAsText(file);
  });
}

// ==============================================================================
// 13. PULSANTE FLOTTANTE & OVERLAY SPESA RAPIDA DALL'INDICE
// ==============================================================================
const fabQuickExpense = document.getElementById("fab-quick-expense");
const quickExpenseOverlay = document.getElementById("quick-expense-overlay");
const quickExpenseForm = document.getElementById("quick-expense-form");
const quickExpenseCloseBtn = document.getElementById("quick-expense-close-btn");
const quickExpenseCancelBtn = document.getElementById("quick-expense-cancel-btn");
const quickExpenseFrequent = document.getElementById("quick-expense-frequent");
const quickExpenseDesc = document.getElementById("quick-expense-desc");
const quickExpenseAmount = document.getElementById("quick-expense-amount");
const quickExpenseCategory = document.getElementById("quick-expense-category");
const quickExpenseQty = document.getElementById("quick-expense-qty");
const quickExpenseStore = document.getElementById("quick-expense-store");
const quickExpenseTags = document.getElementById("quick-expense-tags");
const quickExpenseTagSuggestions = document.getElementById("quick-expense-tag-suggestions");
const quickExpenseNote = document.getElementById("quick-expense-note");
const quickExpenseRecurringToggle = document.getElementById("quick-expense-recurring-toggle");
const quickExpenseRecurrenceGroup = document.getElementById("quick-expense-recurrence-group");
const quickExpenseRecurrenceFreq = document.getElementById("quick-expense-recurrence-freq");

if (quickExpenseTags) {
  quickExpenseTags.addEventListener("input", () =>
    renderTagSuggestionsFor(quickExpenseTags, quickExpenseTagSuggestions)
  );
}

if (quickExpenseRecurringToggle && quickExpenseRecurrenceGroup) {
  quickExpenseRecurringToggle.addEventListener("change", () => {
    quickExpenseRecurrenceGroup.style.display = quickExpenseRecurringToggle.checked ? "flex" : "none";
  });
}

function openQuickExpenseOverlay() {
  if (!quickExpenseOverlay) return;
  quickExpenseForm.reset();
  quickExpenseQty.value = 1;
  quickExpenseFrequent.value = "";
  if (quickExpenseTags) quickExpenseTags.value = "";
  if (quickExpenseNote) quickExpenseNote.value = "";
  if (quickExpenseRecurringToggle) quickExpenseRecurringToggle.checked = false;
  if (quickExpenseRecurrenceGroup) quickExpenseRecurrenceGroup.style.display = "none";
  if (quickExpenseRecurrenceFreq) quickExpenseRecurrenceFreq.value = "monthly";
  renderTagSuggestionsFor(quickExpenseTags, quickExpenseTagSuggestions);
  quickExpenseOverlay.style.display = "flex";
  setTimeout(() => quickExpenseDesc.focus(), 60);
}

function closeQuickExpenseOverlay() {
  if (!quickExpenseOverlay) return;
  quickExpenseOverlay.style.display = "none";
}

if (fabQuickExpense) {
  fabQuickExpense.addEventListener("click", openQuickExpenseOverlay);
}
if (quickExpenseCloseBtn) {
  quickExpenseCloseBtn.addEventListener("click", closeQuickExpenseOverlay);
}
if (quickExpenseCancelBtn) {
  quickExpenseCancelBtn.addEventListener("click", closeQuickExpenseOverlay);
}
if (quickExpenseOverlay) {
  quickExpenseOverlay.addEventListener("click", (e) => {
    if (e.target === quickExpenseOverlay) closeQuickExpenseOverlay();
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && quickExpenseOverlay && quickExpenseOverlay.style.display === "flex") {
    closeQuickExpenseOverlay();
  }
});

if (quickExpenseFrequent) {
  quickExpenseFrequent.addEventListener("change", function () {
    const idx = this.value;
    if (idx === "") return;
    const item = frequentItems[idx];
    if (item) {
      quickExpenseDesc.value = item.desc;
      quickExpenseCategory.value = item.cat || "Alimentari";
      quickExpenseStore.value = item.store || "";
      if (quickExpenseTags) {
        quickExpenseTags.value = Array.isArray(item.tags) ? item.tags.join(", ") : "";
        renderTagSuggestionsFor(quickExpenseTags, quickExpenseTagSuggestions);
      }
      quickExpenseQty.value = 1;
      quickExpenseAmount.value = "";
      quickExpenseAmount.focus();
    }
  });
}

if (quickExpenseForm) {
  quickExpenseForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const description = quickExpenseDesc.value.trim();
    const amount = parseFloat(quickExpenseAmount.value);
    const category = quickExpenseCategory.value || "Alimentari";
    const quantity = parseInt(quickExpenseQty.value, 10) || 1;
    const store = quickExpenseStore.value.trim();
    const tags = parseTagsInput(quickExpenseTags ? quickExpenseTags.value : "");
    const note = quickExpenseNote ? quickExpenseNote.value.trim() : "";
    const isRecurring = Boolean(quickExpenseRecurringToggle && quickExpenseRecurringToggle.checked);
    const frequency = isRecurring && quickExpenseRecurrenceFreq ? quickExpenseRecurrenceFreq.value : "";

    if (!description || isNaN(amount) || amount <= 0) {
      showToast("Inserisci una descrizione e un importo valido!");
      return;
    }

    registerCustomTags(tags);

    const alreadyExists = frequentItems.some(
      (item) => item.desc.toLowerCase() === description.toLowerCase()
    );
    if (!alreadyExists) {
      frequentItems.push({ desc: description, cat: category, store, tags });
      saveFrequentItems();
      renderFrequentDropdowns();
    }

    const newExpense = {
      id: Date.now(),
      description,
      quantity,
      store,
      amount,
      category,
      tags,
      note: note || undefined,
      recurrence: frequency || undefined,
      date: new Date().toLocaleDateString("it-IT"),
    };

    expenses.unshift(newExpense);
    saveExpenses();

    expenseHistory.unshift(newExpense);
    saveExpenseHistory();

    if (isRecurring && frequency) {
      createRecurringRuleFromExpense(newExpense, frequency);
    }

    renderExpenses();
    if (tabReportsView.classList.contains("active")) {
      renderReports();
    }

    closeQuickExpenseOverlay();
    showToast(
      isRecurring
        ? `Spesa salvata con ricorrenza ${getExpenseRecurrenceLabel(frequency).toLowerCase()}.`
        : "Spesa salvata nel registro."
    );
  });
}

// ==============================================================================
// 14. AVVIO INIZIALE
// ==============================================================================
const autoGeneratedRecurring = processRecurringExpenses();
renderFrequentDropdowns();
renderShoppingList();
renderExpenses();
renderReminders();
renderNotes();
renderIndexOverview();
if (autoGeneratedRecurring > 0) {
  showToast(
    autoGeneratedRecurring === 1
      ? "🔄 Registrata 1 spesa ricorrente automatica."
      : `🔄 Registrate ${autoGeneratedRecurring} spese ricorrenti automatiche.`
  );
}


