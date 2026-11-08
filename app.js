// ==============================================================================
// 1. STATO DELL'APPLICAZIONE
// ==============================================================================
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let currentFilter = "ALL";

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

// LISTA DELLA SPESA (Nuova funzionalità)
let shoppingList = JSON.parse(localStorage.getItem("shopping_list")) || [];

// ==============================================================================
// 2. SELEZIONE DEGLI ELEMENTI HTML
// ==============================================================================
// Schede (Tabs)
const tabExpensesBtn = document.getElementById("tab-expenses-btn");
const tabShoppingBtn = document.getElementById("tab-shopping-btn");
const tabExpensesView = document.getElementById("tab-expenses-view");
const tabShoppingView = document.getElementById("tab-shopping-view");
const shoppingBadge = document.getElementById("shopping-badge");

// Form Spese
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

// Form Lista della Spesa
const shoppingForm = document.getElementById("shopping-form");
const shoppingItemNameInput = document.getElementById("shopping-item-name");
const shoppingQuantityInput = document.getElementById("shopping-quantity");
const shoppingCategorySelect = document.getElementById("shopping-category");
const shoppingQuickSelect = document.getElementById("shopping-quick-select");
const shoppingListElement = document.getElementById("shopping-list");
const shoppingEmptyState = document.getElementById("shopping-empty-state");
const clearCheckedShoppingBtn = document.getElementById("clear-checked-shopping-btn");

// ==============================================================================
// 3. GESTIONE CAMBIO SCHEDA (TABS)
// ==============================================================================
function switchTab(target) {
  if (target === "expenses") {
    tabExpensesBtn.classList.add("active");
    tabShoppingBtn.classList.remove("active");
    tabExpensesView.classList.add("active");
    tabShoppingView.classList.remove("active");
  } else {
    tabShoppingBtn.classList.add("active");
    tabExpensesBtn.classList.remove("active");
    tabShoppingView.classList.add("active");
    tabExpensesView.classList.remove("active");
  }
}

tabExpensesBtn.addEventListener("click", () => switchTab("expenses"));
tabShoppingBtn.addEventListener("click", () => switchTab("shopping"));

// ==============================================================================
// 4. GESTIONE ELENCHI A DISCESA ACQUISTI FREQUENTI
// ==============================================================================
function renderFrequentDropdowns() {
  // Menu nella schermata spese
  quickSelect.innerHTML = '<option value="">-- Seleziona o inserisci una nuova spesa sotto --</option>';
  // Menu rapido nella lista della spesa
  shoppingQuickSelect.innerHTML = '<option value="">-- Seleziona un articolo da inserire in lista --</option>';

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
}

function saveFrequentItems() {
  localStorage.setItem("frequent_items", JSON.stringify(frequentItems));
}

// Quando si seleziona un acquisto frequente nel modulo spese:
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

// Eliminare un acquisto frequente dall'elenco a discesa
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

// Quando si seleziona un articolo frequente dalla lista della spesa:
shoppingQuickSelect.addEventListener("change", function () {
  const selectedIndex = this.value;
  if (selectedIndex === "") return;

  const item = frequentItems[selectedIndex];
  if (item) {
    addShoppingItem(item.desc, "1", item.cat);
    this.value = "";
  }
});

// ==============================================================================
// 5. GESTIONE DELLA LISTA DELLA SPESA
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
        <button class="btn-convert-expense" title="Registra come spesa pagata" onclick="convertShoppingItemToExpense(${item.id})">
          💰 Registra
        </button>
        <button class="btn-delete" title="Elimina dalla lista" onclick="deleteShoppingItem(${item.id})">✕</button>
      </div>
    `;

    shoppingListElement.appendChild(li);
  });

  updateShoppingBadge();
}

function addShoppingItem(name, quantity, category) {
  const newItem = {
    id: Date.now() + Math.random(),
    name: name,
    quantity: quantity || "",
    category: category || "Alimentari",
    checked: false,
  };

  shoppingList.unshift(newItem);
  saveShoppingList();
  renderShoppingList();
}

shoppingForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const name = shoppingItemNameInput.value.trim();
  const quantity = shoppingQuantityInput.value.trim();
  const category = shoppingCategorySelect.value;

  if (!name) return;

  addShoppingItem(name, quantity, category);

  shoppingForm.reset();
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

// CONVERTI ARTICOLO DELLA SPESA IN SPESA REGISTRATA
window.convertShoppingItemToExpense = function (id) {
  const item = shoppingList.find((i) => i.id === id);
  if (!item) return;

  // Passa alla scheda "Registro Spese"
  switchTab("expenses");

  // Precompila i campi
  descriptionInput.value = item.name;
  categorySelect.value = item.category || "Alimentari";
  quantityInput.value = 1;
  amountInput.value = "";
  amountInput.focus();

  // Spunta l'articolo nella lista della spesa come completato
  item.checked = true;
  saveShoppingList();
  renderShoppingList();
};

// ==============================================================================
// 6. GESTIONE SPESE (REGISTRO)
// ==============================================================================
function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function renderExpenses() {
  expenseList.innerHTML = "";

  const displayedExpenses = currentFilter === "ALL"
    ? expenses
    : expenses.filter((e) => e.category === currentFilter);

  const total = displayedExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  totalLabelElement.textContent = currentFilter === "ALL" ? "Totale Speso" : `Totale (${currentFilter})`;
  totalAmountElement.textContent = `€ ${total.toFixed(2)}`;
  totalCountElement.textContent = displayedExpenses.length;

  if (displayedExpenses.length === 0) {
    emptyStateElement.style.display = "block";
    emptyStateText.textContent = currentFilter === "ALL"
      ? "Nessuna spesa registrata. Aggiungine una dal modulo sopra!"
      : `Nessuna spesa trovata nella categoria "${currentFilter}".`;
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
        <button class="btn-delete" title="Elimina spesa" onclick="deleteExpense(${expense.id})">✕</button>
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

  // Auto-apprendimento negli acquisti frequenti
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

  expenses.unshift(newExpense);
  saveExpenses();
  renderExpenses();

  expenseForm.reset();
  quantityInput.value = 1;
  quickSelect.value = "";
  deleteFrequentBtn.disabled = true;
  descriptionInput.focus();
});

window.deleteExpense = function (id) {
  expenses = expenses.filter((expense) => expense.id !== id);
  saveExpenses();
  renderExpenses();
};

clearAllBtn.addEventListener("click", function () {
  if (confirm("Sei sicuro di voler cancellare tutte le spese registrate?")) {
    expenses = [];
    saveExpenses();
    renderExpenses();
  }
});

// ==============================================================================
// 7. AVVIO INIZIALE
// ==============================================================================
renderFrequentDropdowns();
renderExpenses();
renderShoppingList();
