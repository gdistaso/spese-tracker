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
  // Assicuriamoci che tutte le eventuali spese pregresse siano presenti nello storico
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

// 'expenses' gestisce la sessione corrente per la Scheda 2
let expenses = currentExpenses;
let currentFilter = "ALL";

// Nomi dei mesi in italiano
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

// ==============================================================================
// 2. SELEZIONE DEGLI ELEMENTI HTML
// ==============================================================================
// Schede Principali
const tabShoppingBtn = document.getElementById("tab-shopping-btn");
const tabExpensesBtn = document.getElementById("tab-expenses-btn");
const tabReportsBtn = document.getElementById("tab-reports-btn");
const tabShoppingView = document.getElementById("tab-shopping-view");
const tabExpensesView = document.getElementById("tab-expenses-view");
const tabReportsView = document.getElementById("tab-reports-view");
const shoppingBadge = document.getElementById("shopping-badge");

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
const expenseList = document.getElementById("expense-list");
const totalAmountElement = document.getElementById("total-amount");
const totalCountElement = document.getElementById("total-count");
const totalLabelElement = document.getElementById("total-label");
const emptyStateElement = document.getElementById("empty-state");
const emptyStateText = document.getElementById("empty-state-text");
const clearAllBtn = document.getElementById("clear-all-btn");
const filterCategorySelect = document.getElementById("filter-category");

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
function switchTab(target) {
  // Rimuovi classe active da tutti i bottoni e viste
  [tabShoppingBtn, tabExpensesBtn, tabReportsBtn].forEach(b => b.classList.remove("active"));
  [tabShoppingView, tabExpensesView, tabReportsView].forEach(v => v.classList.remove("active"));

  if (target === "shopping") {
    tabShoppingBtn.classList.add("active");
    tabShoppingView.classList.add("active");
  } else if (target === "expenses") {
    tabExpensesBtn.classList.add("active");
    tabExpensesView.classList.add("active");
  } else if (target === "reports") {
    tabReportsBtn.classList.add("active");
    tabReportsView.classList.add("active");
    renderReports();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

tabShoppingBtn.addEventListener("click", () => switchTab("shopping"));
tabExpensesBtn.addEventListener("click", () => switchTab("expenses"));
tabReportsBtn.addEventListener("click", () => switchTab("reports"));

// ==============================================================================
// 4. FUNZIONE HELPER PER DATE SPESE
// ==============================================================================
// Ricava con certezza anno e mese da una spesa (sia dall'ID che dalla stringa data)
function getExpenseDateInfo(expense) {
  let dateObj = null;

  if (expense.id && expense.id > 1000000000000) {
    const d = new Date(expense.id);
    if (!isNaN(d.getTime())) {
      dateObj = d;
    }
  }

  if (!dateObj && expense.date) {
    const parts = expense.date.split('/');
    if (parts.length === 3) {
      dateObj = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  const year = dateObj.getFullYear();
  const month = dateObj.getMonth(); // 0..11
  const monthPadded = String(month + 1).padStart(2, "0");
  const monthKey = `${year}-${monthPadded}`;

  return {
    year: String(year),
    monthIndex: month,
    monthKey: monthKey,
    monthName: MONTH_NAMES[month],
    dateFormatted: expense.date || dateObj.toLocaleDateString("it-IT")
  };
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

    const qtyBadge = item.quantity ? `<span class="badge-qty">${item.quantity}</span>` : "";
    const catBadge = item.category ? `<span class="badge-tag">${item.category}</span>` : "";

    li.innerHTML = `
      <div class="shopping-left">
        <input type="checkbox" class="shopping-checkbox" ${item.checked ? "checked" : ""} onchange="toggleShoppingItem(${item.id})">
        <div class="shopping-info">
          <span class="shopping-item-name">${item.name}</span>
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
});

window.convertShoppingItemToExpense = function (id) {
  const item = shoppingList.find((i) => i.id === id);
  if (!item) return;

  switchTab("expenses");

  descriptionInput.value = item.name;
  categorySelect.value = item.category || "Alimentari";
  quantityInput.value = 1;
  amountInput.value = "";
  amountInput.focus();

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

  if (confirm(`Vuoi rimuovere "${itemToDelete.desc}" dall'elenco degli acquisti frequenti?`)) {
    frequentItems.splice(selectedIndex, 1);
    saveFrequentItems();
    renderFrequentDropdowns();

    if (shoppingItemNameInput.value === itemToDelete.desc) {
      shoppingItemNameInput.value = "";
      shoppingQuantityInput.value = "";
    }
  }
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

  if (confirm(`Vuoi rimuovere "${itemToDelete.desc}" dall'elenco degli acquisti frequenti?`)) {
    frequentItems.splice(selectedIndex, 1);
    saveFrequentItems();
    renderFrequentDropdowns();

    if (descriptionInput.value === itemToDelete.desc) {
      descriptionInput.value = "";
      storeInput.value = "";
      amountInput.value = "";
      quantityInput.value = 1;
    }
  }
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

function renderExpenses() {
  expenseList.innerHTML = "";

  const displayedExpenses = currentFilter === "ALL"
    ? expenses
    : expenses.filter((e) => e.category === currentFilter);

  const total = displayedExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  totalLabelElement.textContent = currentFilter === "ALL" ? "Totale Spesa Corrente" : `Totale (${currentFilter})`;
  totalAmountElement.textContent = `€ ${total.toFixed(2)}`;
  totalCountElement.textContent = displayedExpenses.length;

  if (displayedExpenses.length === 0) {
    emptyStateElement.style.display = "block";
    if (currentFilter === "ALL") {
      if (expenseHistory && expenseHistory.length > 0) {
        emptyStateText.innerHTML = "Nessuna spesa nella lista corrente.<br><small style='color: #6b7280; display: inline-block; margin-top: 6px;'>💡 Le spese precedenti rimangono registrate nella scheda <strong>📊 Storico</strong>.</small>";
      } else {
        emptyStateText.textContent = "Nessuna spesa registrata. Aggiungine una dal modulo sopra!";
      }
    } else {
      emptyStateText.textContent = `Nessuna spesa trovata nella categoria "${currentFilter}".`;
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
      ? `<span class="badge-store">🏬 ${expense.store}</span>`
      : "";

    li.innerHTML = `
      <div class="expense-info">
        <span class="expense-desc">${expense.description}</span>
        <div class="expense-meta">
          <span class="badge-tag">${expense.category}</span>
          ${storeBadge}
          ${qtyBadge}
          <span>📅 ${expense.date}</span>
        </div>
      </div>
      <div class="expense-right">
        <span class="expense-amount">€ ${expense.amount.toFixed(2)}</span>
        <button type="button" class="btn-delete" title="Elimina spesa" onclick="deleteExpense(${expense.id})">✕</button>
      </div>
    `;

    expenseList.appendChild(li);
  });
}

filterCategorySelect.addEventListener("change", function (event) {
  currentFilter = event.target.value;
  renderExpenses();
});

expenseForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const quantity = parseInt(quantityInput.value, 10) || 1;
  const store = storeInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;

  if (!description || isNaN(amount) || amount <= 0) {
    alert("Inserisci una descrizione e un importo valido!");
    return;
  }

  const alreadyExists = frequentItems.some(
    (item) => item.desc.toLowerCase() === description.toLowerCase()
  );

  if (!alreadyExists) {
    frequentItems.push({
      desc: description,
      cat: category,
      store: store,
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
    date: new Date().toLocaleDateString("it-IT"),
  };

  // Salva nella sessione corrente
  expenses.unshift(newExpense);
  saveExpenses();
  renderExpenses();

  // Salva permanentemente nello Storico
  expenseHistory.unshift(newExpense);
  saveExpenseHistory();
  if (tabReportsView.classList.contains("active")) {
    renderReports();
  }

  expenseForm.reset();
  quantityInput.value = 1;
  quickSelect.value = "";
  deleteFrequentBtn.disabled = true;
  descriptionInput.focus();
});

window.deleteExpense = function (id) {
  if (confirm("Vuoi eliminare questa spesa? Verrà rimossa anche dallo storico.")) {
    expenses = expenses.filter((expense) => expense.id !== id);
    expenseHistory = expenseHistory.filter((expense) => expense.id !== id);
    saveExpenses();
    saveExpenseHistory();
    renderExpenses();
    if (tabReportsView.classList.contains("active")) {
      renderReports();
    }
  }
};

clearAllBtn.addEventListener("click", function () {
  if (expenses.length === 0) return;

  if (confirm("Vuoi azzerare le spese registrate per iniziare una nuova lista?\n\nTranquillo: tutte le spese rimarranno salvate al sicuro nello Storico!")) {
    // Azzera solo le spese correnti per prepararsi alla prossima spesa
    expenses = [];
    saveExpenses();
    renderExpenses();
    // Lo storico (expenseHistory) NON viene toccato e rimane intatto!
  }
});

// Eliminazione mirata di una spesa dallo storico
window.deleteHistoryExpense = function (id) {
  if (confirm("Vuoi eliminare definitivamente questa spesa dallo storico?")) {
    expenseHistory = expenseHistory.filter((e) => e.id !== id);
    expenses = expenses.filter((e) => e.id !== id);
    saveExpenseHistory();
    saveExpenses();
    renderReports();
    renderExpenses();
  }
};

// ==============================================================================
// 8. SCHEDA 3: STORICO E REPORT MENSILE / ANNUALE
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
  // Ricaviamo tutti i mesi e gli anni presenti nello storico spese
  const monthsMap = new Map();
  const yearsSet = new Set();

  // Aggiungi sempre mese e anno correnti
  const now = new Date();
  const currentYearStr = String(now.getFullYear());
  const currentMonthPadded = String(now.getMonth() + 1).padStart(2, "0");
  const currentMonthKey = `${currentYearStr}-${currentMonthPadded}`;
  monthsMap.set(currentMonthKey, `${MONTH_NAMES[now.getMonth()]} ${currentYearStr}`);
  yearsSet.add(currentYearStr);

  expenseHistory.forEach(exp => {
    const info = getExpenseDateInfo(exp);
    monthsMap.set(info.monthKey, `${info.monthName} ${info.year}`);
    yearsSet.add(info.year);
  });

  // Ordina i mesi dal più recente al più vecchio
  const sortedMonthKeys = Array.from(monthsMap.keys()).sort().reverse();
  reportMonthSelect.innerHTML = "";
  sortedMonthKeys.forEach(key => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = monthsMap.get(key);
    reportMonthSelect.appendChild(opt);
  });

  if (!selectedReportMonth || !monthsMap.has(selectedReportMonth)) {
    selectedReportMonth = sortedMonthKeys[0] || currentMonthKey;
  }
  reportMonthSelect.value = selectedReportMonth;

  // Ordina gli anni dal più recente al più vecchio
  const sortedYears = Array.from(yearsSet).sort().reverse();
  reportYearSelect.innerHTML = "";
  sortedYears.forEach(yr => {
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

function renderReportsData() {
  reportExpenseList.innerHTML = "";

  if (reportMode === "monthly") {
    // FILTRO MENSILE
    reportSummaryLabel.textContent = "Totale Mese";

    const filtered = expenseHistory.filter(exp => {
      const info = getExpenseDateInfo(exp);
      return info.monthKey === selectedReportMonth;
    });

    const monthLabel = reportMonthSelect.options[reportMonthSelect.selectedIndex]?.text || "Selezionato";
    reportListTitle.textContent = `Spese di ${monthLabel}`;

    const total = filtered.reduce((acc, curr) => acc + curr.amount, 0);
    reportTotalAmount.textContent = `€ ${total.toFixed(2)}`;
    reportTotalCount.textContent = filtered.length;

    if (filtered.length === 0) {
      reportEmptyState.style.display = "block";
    } else {
      reportEmptyState.style.display = "none";
      filtered.forEach(exp => renderReportItem(exp));
    }

  } else {
    // FILTRO ANNUALE
    reportSummaryLabel.textContent = `Totale Anno ${selectedReportYear}`;

    const filtered = expenseHistory.filter(exp => {
      const info = getExpenseDateInfo(exp);
      return info.year === selectedReportYear;
    });

    reportListTitle.textContent = `Tutte le spese dell'Anno ${selectedReportYear}`;

    const total = filtered.reduce((acc, curr) => acc + curr.amount, 0);
    reportTotalAmount.textContent = `€ ${total.toFixed(2)}`;
    reportTotalCount.textContent = filtered.length;

    // Calcolo ripartizione per ciascun mese dell'anno
    yearlyMonthsGrid.innerHTML = "";
    MONTH_NAMES.forEach((mName, mIdx) => {
      const monthExp = filtered.filter(exp => getExpenseDateInfo(exp).monthIndex === mIdx);
      const mTotal = monthExp.reduce((a, c) => a + c.amount, 0);

      const card = document.createElement("div");
      card.className = `month-summary-card ${mTotal > 0 ? "has-expenses" : ""}`;
      card.innerHTML = `
        <span class="m-name">${mName}</span>
        <span class="m-amount">€ ${mTotal.toFixed(2)}</span>
      `;
      yearlyMonthsGrid.appendChild(card);
    });

    if (filtered.length === 0) {
      reportEmptyState.style.display = "block";
    } else {
      reportEmptyState.style.display = "none";
      filtered.forEach(exp => renderReportItem(exp));
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
    ? `<span class="badge-store">🏬 ${expense.store}</span>`
    : "";

  li.innerHTML = `
    <div class="expense-info">
      <span class="expense-desc">${expense.description}</span>
      <div class="expense-meta">
        <span class="badge-tag">${expense.category}</span>
        ${storeBadge}
        ${qtyBadge}
        <span>📅 ${expense.date}</span>
      </div>
    </div>
    <div class="expense-right">
      <span class="expense-amount">€ ${expense.amount.toFixed(2)}</span>
      <button type="button" class="btn-delete" title="Elimina dallo storico" onclick="deleteHistoryExpense(${expense.id})">✕</button>
    </div>
  `;

  reportExpenseList.appendChild(li);
}

// ==============================================================================
// 9. AVVIO INIZIALE
// ==============================================================================
renderFrequentDropdowns();
renderShoppingList();
renderExpenses();
