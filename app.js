// ==============================================================================
// 1. STATO DELL'APPLICAZIONE (I dati del programma)
// ==============================================================================
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let currentFilter = "ALL"; // Memorizza la categoria attualmente filtrata ("ALL" o specifica)

// Lista predefinita delle spese più frequenti (Scorciatoie)
const QUICK_EXPENSES = [
  { desc: "Pane fresco", amount: 1.50, cat: "Alimentari", icon: "🥖" },
  { desc: "Pasta", amount: 1.20, cat: "Alimentari", icon: "🍝" },
  { desc: "Frutta e Verdura", amount: 4.00, cat: "Alimentari", icon: "🍎" },
  { desc: "Latte e Uova", amount: 2.80, cat: "Alimentari", icon: "🥛" },
  { desc: "Caffè al bar", amount: 1.20, cat: "Svago", icon: "☕" },
  { desc: "Biglietto Bus / Metro", amount: 1.70, cat: "Trasporti", icon: "🚌" },
  { desc: "Rifornimento Benzina", amount: 25.00, cat: "Trasporti", icon: "⛽" },
  { desc: "Pizza", amount: 8.50, cat: "Svago", icon: "🍕" },
];

// ==============================================================================
// 2. SELEZIONE DEGLI ELEMENTI HTML
// ==============================================================================
const form = document.getElementById("expense-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const expenseList = document.getElementById("expense-list");
const totalAmountElement = document.getElementById("total-amount");
const totalCountElement = document.getElementById("total-count");
const totalLabelElement = document.getElementById("total-label");
const emptyStateElement = document.getElementById("empty-state");
const emptyStateText = document.getElementById("empty-state-text");
const clearAllBtn = document.getElementById("clear-all-btn");
const quickTagsContainer = document.getElementById("quick-tags");
const filterCategorySelect = document.getElementById("filter-category");

// ==============================================================================
// 3. GENERAZIONE SCORCIATOIE FREQUENTI
// ==============================================================================
// Questa funzione crea i bottoni per ogni spesa frequente
function renderQuickTags() {
  quickTagsContainer.innerHTML = "";

  QUICK_EXPENSES.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quick-tag-btn";
    btn.innerHTML = `${item.icon} ${item.desc} <strong>€${item.amount.toFixed(2)}</strong>`;

    // Cliccando sulla scorciatoia, compiliamo automaticamente i campi del form!
    btn.addEventListener("click", () => {
      descriptionInput.value = item.desc;
      amountInput.value = item.amount;
      categorySelect.value = item.cat;

      // Sposta il cursore direttamente sull'importo se vuoi modificarlo prima di salvare
      amountInput.focus();
      amountInput.select();
    });

    quickTagsContainer.appendChild(btn);
  });
}

// ==============================================================================
// 4. FUNZIONE DI SALVATAGGIO
// ==============================================================================
function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

// ==============================================================================
// 5. FUNZIONE DI VISUALIZZAZIONE E FILTRAGGIO (Rendering)
// ==============================================================================
function renderExpenses() {
  expenseList.innerHTML = "";

  // 1. FILTRAGGIO: Selezioniamo solo le spese corrispondenti al filtro scelto
  const displayedExpenses = currentFilter === "ALL"
    ? expenses
    : expenses.filter((e) => e.category === currentFilter);

  // 2. CALCOLO TOTALE: Sommiamo solo le spese visibili a schermo
  const total = displayedExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Aggiorniamo le etichette delle statistiche in alto
  if (currentFilter === "ALL") {
    totalLabelElement.textContent = "Totale Speso";
  } else {
    totalLabelElement.textContent = `Totale (${currentFilter})`;
  }
  totalAmountElement.textContent = `€ ${total.toFixed(2)}`;
  totalCountElement.textContent = displayedExpenses.length;

  // Gestione lista vuota
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

  // 3. DISEGNO ELEMENTI: Creiamo la riga per ogni spesa filtrata
  displayedExpenses.forEach((expense) => {
    const li = document.createElement("li");
    li.className = "expense-item";

    li.innerHTML = `
      <div class="expense-info">
        <span class="expense-desc">${expense.description}</span>
        <span class="expense-meta">${expense.category} • ${expense.date}</span>
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
// 6. EVENTO FILTRO PER CATEGORIA
// ==============================================================================
filterCategorySelect.addEventListener("change", function (event) {
  currentFilter = event.target.value;
  renderExpenses(); // Ridisegna la lista applicando il nuovo filtro
});

// ==============================================================================
// 7. AGGIUNGERE UNA SPESA
// ==============================================================================
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;

  if (!description || isNaN(amount) || amount <= 0) {
    alert("Inserisci una descrizione e un importo valido!");
    return;
  }

  const newExpense = {
    id: Date.now(),
    description: description,
    amount: amount,
    category: category,
    date: new Date().toLocaleDateString("it-IT"),
  };

  expenses.unshift(newExpense);
  saveExpenses();
  renderExpenses();

  // Reset del modulo
  form.reset();
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
renderQuickTags();
renderExpenses();
