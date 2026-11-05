// ==============================================================================
// 1. STATO DELL'APPLICAZIONE (I dati del programma)
// ==============================================================================
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let currentFilter = "ALL";

// Lista iniziale degli acquisti frequenti (SENZA PREZZI PREFISSATI)
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

// Recuperiamo la lista degli acquisti frequenti salvata o usiamo quella di default
let frequentItems = JSON.parse(localStorage.getItem("frequent_items")) || DEFAULT_FREQUENT_ITEMS;

// ==============================================================================
// 2. SELEZIONE DEGLI ELEMENTI HTML
// ==============================================================================
const form = document.getElementById("expense-form");
const quickSelect = document.getElementById("quick-select");
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

// ==============================================================================
// 3. GESTIONE ELENCO A DISCESA ACQUISTI FREQUENTI
// ==============================================================================
function renderFrequentDropdown() {
  quickSelect.innerHTML = '<option value="">-- Seleziona o inserisci una nuova spesa sotto --</option>';

  frequentItems.forEach((item, index) => {
    const opt = document.createElement("option");
    opt.value = index;
    const storeInfo = item.store ? ` (${item.store})` : "";
    opt.textContent = `${item.desc}${storeInfo} [${item.cat}]`;
    quickSelect.appendChild(opt);
  });
}

function saveFrequentItems() {
  localStorage.setItem("frequent_items", JSON.stringify(frequentItems));
}

// Quando l'utente seleziona una voce dall'elenco a discesa:
quickSelect.addEventListener("change", function () {
  const selectedIndex = this.value;
  if (selectedIndex === "") {
    return;
  }

  const selectedItem = frequentItems[selectedIndex];
  if (selectedItem) {
    // Compila automaticamente descrizione, categoria e negozio
    descriptionInput.value = selectedItem.desc;
    categorySelect.value = selectedItem.cat;
    storeInput.value = selectedItem.store || "";
    quantityInput.value = 1;

    // Lascia vuoto l'importo e posiziona il cursore subito sul campo del prezzo!
    amountInput.value = "";
    amountInput.focus();
  }
});

// ==============================================================================
// 4. SALVATAGGIO SPESE NEL BROWSER
// ==============================================================================
function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

// ==============================================================================
// 5. VISUALIZZAZIONE DELLE SPESE (Rendering)
// ==============================================================================
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

// ==============================================================================
// 6. EVENTO FILTRO CATEGORIA
// ==============================================================================
filterCategorySelect.addEventListener("change", function (event) {
  currentFilter = event.target.value;
  renderExpenses();
});

// ==============================================================================
// 7. AGGIUNGERE UNA SPESA E AUTO-APPRENDIMENTO ACQUISTI FREQUENTI
// ==============================================================================
form.addEventListener("submit", function (event) {
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

  // AUTO-APPRENDIMENTO: Controlliamo se questa spesa è già nell'elenco a discesa
  const alreadyExists = frequentItems.some(
    (item) => item.desc.toLowerCase() === description.toLowerCase()
  );

  if (!alreadyExists) {
    // Si inserisce automaticamente nell'elenco a discesa per le prossime volte!
    frequentItems.push({
      desc: description,
      cat: category,
      store: store,
    });
    saveFrequentItems();
    renderFrequentDropdown();
  }

  // Creazione della nuova spesa registrata
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

  // Reset del modulo
  form.reset();
  quantityInput.value = 1;
  quickSelect.value = "";
  descriptionInput.focus();
});

// ==============================================================================
// 8. ELIMINARE UNA SPESA
// ==============================================================================
window.deleteExpense = function (id) {
  expenses = expenses.filter((expense) => expense.id !== id);
  saveExpenses();
  renderExpenses();
};

// ==============================================================================
// 9. SVUOTARE TUTTO
// ==============================================================================
clearAllBtn.addEventListener("click", function () {
  if (confirm("Sei sicuro di voler cancellare tutte le spese registrate?")) {
    expenses = [];
    saveExpenses();
    renderExpenses();
  }
});

// ==============================================================================
// 10. AVVIO INIZIALE
// ==============================================================================
renderFrequentDropdown();
renderExpenses();
