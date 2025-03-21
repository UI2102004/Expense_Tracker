// Global Variables
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let tempTransactions = [...transactions];
let categories = JSON.parse(localStorage.getItem("categories")) || {
  income: ["Salary", "Freelance", "Investments", "Rental", "Other Income"],
  expense: ["Food & Dining", "Transportation", "Utilities", "Housing", "Entertainment", "Healthcare", "Shopping", "Education", "Other Expense"]
};

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "INR",
  signDisplay: "always",
});

// DOM Elements
const darkModeToggle = document.getElementById("darkModeToggle");
const list = document.getElementById("transactionlist");
const form = document.getElementById("transactionform");
const status = document.getElementById("status");
const balance = document.getElementById("total-Bal");
const income = document.getElementById("total-inc");
const expense = document.getElementById("total-exp");
const typeToggle = document.getElementById("type");
const categorySelect = document.getElementById("category");
const addIncomeCategoryForm = document.getElementById("addIncomeCategoryForm");
const addExpenseCategoryForm = document.getElementById("addExpenseCategoryForm");
const incomeCategoriesList = document.getElementById("incomeCategoriesList");
const expenseCategoriesList = document.getElementById("expenseCategoriesList");

// Scroll to top functionality
const scrollTop = document.querySelector('.scroll-top');

window.addEventListener('scroll', () => {
  if (window.pageYOffset > 200) {
    scrollTop.classList.add('visible');
  } else {
    scrollTop.classList.remove('visible');
  }
});

scrollTop.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// Add loading states
function showLoading(element) {
  element.classList.add('loading');
}

function hideLoading(element) {
  element.classList.remove('loading');
}

// Category Management
function updateCategoryVisibility() {
  const isIncome = typeToggle.checked;
  const incomeCategories = categorySelect.querySelector('.income-categories');
  const expenseCategories = categorySelect.querySelector('.expense-categories');
  
  // Clear existing options
  incomeCategories.innerHTML = '';
  expenseCategories.innerHTML = '';
  
  // Add current categories
  categories.income.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.toLowerCase().replace(/\s+/g, '-');
    option.textContent = cat;
    incomeCategories.appendChild(option);
  });
  
  categories.expense.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.toLowerCase().replace(/\s+/g, '-');
    option.textContent = cat;
    expenseCategories.appendChild(option);
  });
  
  if (isIncome) {
    incomeCategories.style.display = '';
    expenseCategories.style.display = 'none';
    categorySelect.value = categories.income[0].toLowerCase().replace(/\s+/g, '-');
  } else {
    incomeCategories.style.display = 'none';
    expenseCategories.style.display = '';
    categorySelect.value = categories.expense[0].toLowerCase().replace(/\s+/g, '-');
  }
}

function updateCategoryFilter() {
  const categoryFilter = document.getElementById("categoryFilter");
  if (!categoryFilter) return;
  
  const incomeCategories = categoryFilter.querySelector('.income-categories');
  const expenseCategories = categoryFilter.querySelector('.expense-categories');
  
  // Clear existing options
  incomeCategories.innerHTML = '';
  expenseCategories.innerHTML = '';
  
  // Add current categories
  categories.income.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.toLowerCase().replace(/\s+/g, '-');
    option.textContent = cat;
    incomeCategories.appendChild(option);
  });
  
  categories.expense.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.toLowerCase().replace(/\s+/g, '-');
    option.textContent = cat;
    expenseCategories.appendChild(option);
  });
}

function renderCategoriesLists() {
  if (!incomeCategoriesList || !expenseCategoriesList) return;
  
  // Render income categories
  incomeCategoriesList.innerHTML = '';
  categories.income.forEach(category => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      ${category}
      <button class="btn btn-sm btn-danger" onclick="deleteCategory('income', '${category}')">
        <i class="ri-delete-bin-line"></i>
      </button>
    `;
    incomeCategoriesList.appendChild(li);
  });
  
  // Render expense categories
  expenseCategoriesList.innerHTML = '';
  categories.expense.forEach(category => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      ${category}
      <button class="btn btn-sm btn-danger" onclick="deleteCategory('expense', '${category}')">
        <i class="ri-delete-bin-line"></i>
      </button>
    `;
    expenseCategoriesList.appendChild(li);
  });
}

function addCategory(type, category) {
  if (!category || categories[type].includes(category)) return false;
  categories[type].push(category);
  saveCategories();
  updateCategoryVisibility();
  updateCategoryFilter();
  renderCategoriesLists();
  return true;
}

function deleteCategory(type, category) {
  if (!confirm(`Are you sure you want to delete the "${category}" category?`)) return;
  
  const index = categories[type].indexOf(category);
  if (index === -1) return;
  
  // Check if category is in use
  const inUse = transactions.some(t => t.category.toLowerCase().replace(/\s+/g, '-') === category.toLowerCase().replace(/\s+/g, '-'));
  if (inUse) {
    alert("Cannot delete category that is being used in transactions!");
    return;
  }
  
  categories[type].splice(index, 1);
  saveCategories();
  updateCategoryVisibility();
  updateCategoryFilter();
  renderCategoriesLists();
}

function saveCategories() {
  localStorage.setItem("categories", JSON.stringify(categories));
}

// Page Navigation
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(pageId).classList.add('active');

  // Update content based on page
  if (pageId === 'transactions') {
    renderTransactionsTable();
  } else if (pageId === 'categories') {
    renderCategoriesLists();
  }
}

// Dark Mode
function initializeDarkMode() {
  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
    darkModeToggle.checked = true;
  }
}

function setupDarkModeToggle() {
  darkModeToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem(
      "darkMode",
      document.body.classList.contains("dark-mode") ? "enabled" : "disabled"
    );
  });
}

// Transaction Management
function addTransaction(e) {
  e.preventDefault();

  try {
    const formData = new FormData(form);
    const type = document.getElementById("type").checked ? "income" : "expense";
    const amount = parseFloat(formData.get("amount"));
    const name = formData.get("name").trim();
    const date = formData.get("date");
    const categoryValue = formData.get("category");
    
    // Enhanced input validation
    if (!name) {
      throw new Error("Please enter a transaction name");
    }
    if (name.length > 100) {
      throw new Error("Transaction name is too long (max 100 characters)");
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error("Please enter a valid positive amount");
    }
    if (amount > 999999999) {
      throw new Error("Amount is too large (max 999,999,999)");
    }
    if (!date) {
      throw new Error("Please select a date");
    }
    if (!categoryValue) {
      throw new Error("Please select a category");
    }

    // Get category display name from value
    const categoryList = type === "income" ? categories.income : categories.expense;
    const category = categoryList.find(cat => cat.toLowerCase().replace(/\s+/g, '-') === categoryValue);

    if (!category) {
      throw new Error("Invalid category selected");
    }

    const newTransaction = {
      id: Date.now(),
      name,
      amount,
      date: new Date(date).toISOString(),
      type,
      category
    };

    transactions.unshift(newTransaction);
    tempTransactions = [...transactions];
    
    saveTransactions();
    renderList();
    updateTotal();
    form.reset();
    updateCategoryVisibility();
    showAlert("Transaction added successfully!", "success");
  } catch (error) {
    showAlert(error.message, "danger");
  }
}

function deleteTransaction(id) {
  if (!confirm("Are you sure you want to delete this transaction?")) return;
  
  transactions = transactions.filter(t => t.id !== id);
  tempTransactions = [...transactions];
  
  saveTransactions();
  updateTotal();
  renderList();
  renderTransactionsTable();
  showAlert("Transaction deleted successfully!", "success");
}

function editTransaction(id) {
  const transaction = transactions.find(t => t.id === id);
  if (!transaction) return;

  // Populate form with transaction data
  document.getElementById("type").checked = transaction.type === "income";
  updateCategoryVisibility();
  form.elements.name.value = transaction.name;
  form.elements.category.value = transaction.category.toLowerCase().replace(/\s+/g, '-');
  form.elements.amount.value = transaction.amount;
  form.elements.date.value = transaction.date.split('T')[0];

  // Remove old transaction
  transactions = transactions.filter(t => t.id !== id);
  tempTransactions = [...transactions];
  
  saveTransactions();
  updateTotal();
  renderList();
  renderTransactionsTable();
  
  window.scrollTo({ top: form.offsetTop, behavior: 'smooth' });
}

// Rendering Functions
function updateTotal() {
  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === "income") {
        acc.income += t.amount;
      } else {
        acc.expense += t.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const balanceTotal = totals.income - totals.expense;

  balance.textContent = formatter.format(balanceTotal);
  income.textContent = formatter.format(totals.income);
  expense.textContent = formatter.format(totals.expense);
}

function renderList() {
  if (!list || !status) return;
  
  list.innerHTML = "";

  if (transactions.length === 0) {
    status.textContent = "No Transactions Yet!";
    return;
  }
  
  status.textContent = "";

  transactions.slice(0, 5).forEach(transaction => {
    const li = document.createElement("li");
    li.className = "list-group-item fade-in";
    
    li.innerHTML = `
      <div class="transaction-name">
        <h5 class="mb-1">${transaction.name}</h5>
        <small>${new Date(transaction.date).toLocaleDateString("en-GB")} - ${transaction.category}</small>
      </div>
      <span class="transaction-amount ${transaction.type}">
        ${formatter.format(transaction.type === "income" ? transaction.amount : -transaction.amount)}
      </span>
      <div class="transaction-actions">
        <button class="btn btn-sm btn-outline-primary" onclick="editTransaction(${transaction.id})">
          <i class="ri-edit-line"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction(${transaction.id})">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>
    `;

    list.appendChild(li);
  });
}

function renderTransactionsTable() {
  const tableBody = document.getElementById("transactionsTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  tempTransactions.forEach(transaction => {
    const tr = document.createElement("tr");
    tr.className = "fade-in";
    
    tr.innerHTML = `
      <td>${new Date(transaction.date).toLocaleDateString("en-GB")}</td>
      <td>${transaction.name}</td>
      <td>${transaction.category}</td>
      <td class="${transaction.type}">
        ${formatter.format(transaction.type === "income" ? transaction.amount : -transaction.amount)}
      </td>
      <td>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editTransaction(${transaction.id})">
          <i class="ri-edit-line"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction(${transaction.id})">
          <i class="ri-delete-bin-line"></i>
        </button>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

// Filter Functions
function setupFilters() {
  const dateFilter = document.getElementById("dateFilter");
  const categoryFilter = document.getElementById("categoryFilter");
  const minAmountFilter = document.getElementById("minAmountFilter");
  const maxAmountFilter = document.getElementById("maxAmountFilter");
  const searchFilter = document.getElementById("searchFilter");

  const applyFilters = () => {
    tempTransactions = transactions.filter(t => {
      const matchesDate = !dateFilter.value || t.date.startsWith(dateFilter.value);
      const matchesCategory = !categoryFilter.value || t.category.toLowerCase().replace(/\s+/g, '-') === categoryFilter.value;
      const matchesMinAmount = !minAmountFilter.value || t.amount >= parseFloat(minAmountFilter.value);
      const matchesMaxAmount = !maxAmountFilter.value || t.amount <= parseFloat(maxAmountFilter.value);
      const matchesSearch = !searchFilter.value || 
        t.name.toLowerCase().includes(searchFilter.value.toLowerCase());

      return matchesDate && matchesCategory && matchesMinAmount && matchesMaxAmount && matchesSearch;
    });

    renderTransactionsTable();
  };

  [dateFilter, categoryFilter, minAmountFilter, maxAmountFilter, searchFilter].forEach(filter => {
    if (filter) {
      filter.addEventListener("input", applyFilters);
    }
  });
}

//Export & Backup Functions
function exportData(format) {
  try {
    if (!transactions || transactions.length === 0) {
      throw new Error("No transactions available to export");
    }

    if (format === 'csv') {
      exportToCSV();
    } else if (format === 'pdf') {
      exportToPDF();
    } else {
      throw new Error("Invalid export format");
    }
  } catch (error) {
    showAlert(error.message, "danger");
  }
}

function getFilteredTransactions() {
  const startDate = document.getElementById("exportStartDate").value;
  const endDate = document.getElementById("exportEndDate").value;
  
  let filteredTransactions = [...transactions];
  
  if (startDate) {
    filteredTransactions = filteredTransactions.filter(t => 
      new Date(t.date) >= new Date(startDate)
    );
  }
  
  if (endDate) {
    filteredTransactions = filteredTransactions.filter(t => 
      new Date(t.date) <= new Date(endDate)
    );
  }
  
  return filteredTransactions;
}

async function exportToCSV() {
  try {
    const filteredTransactions = getFilteredTransactions();
    
    if (filteredTransactions.length === 0) {
      throw new Error("No transactions found for the selected date range");
    }

    const headers = ['Date', 'Name', 'Category', 'Amount', 'Type'];
    const rows = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.name,
      t.category,
      t.amount.toFixed(2),
      t.type
    ]);

    // Add quotes around fields that might contain commas
    const processRow = row => row.map(field => {
      field = field.toString();
      return field.includes(',') ? `"${field}"` : field;
    }).join(',');

    const csv = [
      processRow(headers),
      ...rows.map(processRow)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    showAlert(error.message, "danger");
  }
}

async function exportToPDF() {
  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      throw new Error("PDF export library not loaded");
    }

    const filteredTransactions = getFilteredTransactions();
    
    if (filteredTransactions.length === 0) {
      throw new Error("No transactions found for the selected date range");
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Report Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 102, 204);
    doc.text('EXPENSE TRACKER REPORT', 105, 20, { align: 'center' });

    let currentY = 35;

    // Date Range Info - Only show if dates are selected
    const startDate = document.getElementById("exportStartDate").value;
    const endDate = document.getElementById("exportEndDate").value;
    
    if (startDate || endDate) {
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      const dateRangeText = `Date Range: ${startDate ? new Date(startDate).toLocaleDateString("en-GB") : 'Start'} to ${endDate ? new Date(endDate).toLocaleDateString("en-GB") : 'End'}`;
      doc.text(dateRangeText, 20, currentY);
      currentY += 10;
    }

    // Summary Section
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Summary', 20, currentY);

    doc.setFont("times", "normal");
    doc.setFontSize(12);
    currentY += 8;

    const totals = filteredTransactions.reduce(
      (acc, t) => {
        if (t.type === "income") acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );

    // Print Summary Details
    doc.text(`Generated on: ${new Date().toLocaleDateString("en-GB")}`, 20, currentY);
    currentY += 7;
    doc.text(`Total Income: Rs. ${totals.income}`, 20, currentY);
    currentY += 7;
    doc.text(`Total Expenses: Rs. ${totals.expense}`, 20, currentY);
    currentY += 7;
    doc.text(`Net Balance: Rs. ${totals.income - totals.expense}`, 20, currentY);

    currentY += 15;

    // Sort Transactions by Date
    const sortedTransactions = [...filteredTransactions].sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    const income = sortedTransactions.filter(t => t.type === 'income');
    const expenses = sortedTransactions.filter(t => t.type === 'expense');

    // Function to format rows with DD/MM/YYYY date format
    const formatRows = transactions => transactions.map(t => [
      new Date(t.date).toLocaleDateString("en-GB"), // This will format as DD/MM/YYYY
      t.name,
      t.category,
      `Rs. ${t.amount}`
    ]);

    // Income Transactions Table (Blue Header)
    if (income.length > 0) {
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 102, 204);
      doc.text('Income Transactions', 20, currentY);
      currentY += 10;
      doc.autoTable({
        theme: 'grid',
        startY: currentY,
        headStyles: {
          fillColor: [0, 102, 204],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: { textColor: [0, 0, 0], halign: 'center' },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 60 },
          2: { cellWidth: 50 },
          3: { cellWidth: 30 }
        },
        head: [['Date', 'Name', 'Category', 'Amount (Rs)']],
        body: formatRows(income)
      });
      currentY = doc.lastAutoTable.finalY + 15;
    }

    // Expense Transactions Table (Orange Header)
    if (expenses.length > 0) {
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 102, 0);
      doc.text('Expense Transactions', 20, currentY);
      currentY += 10;
      doc.autoTable({
        theme: 'grid',
        startY: currentY,
        headStyles: {
          fillColor: [255, 102, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: { textColor: [0, 0, 0], halign: 'center' },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 60 },
          2: { cellWidth: 50 },
          3: { cellWidth: 30 }
        },
        head: [['Date', 'Name', 'Category', 'Amount (Rs)']],
        body: formatRows(expenses)
      });
    }

    // Footer with Page Numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    doc.save(`expense_tracker_report_${new Date().toISOString("en-GB").split('T')[0]}.pdf`);
  } catch (error) {
    showAlert(error.message, "danger");
  }
}

async function backupData() {
  try {
    if (!transactions || transactions.length === 0) {
      throw new Error("No transactions available to backup");
    }

    const data = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      transactions,
      categories
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_tracker_backup_${new Date().toISOString("en-GB").split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showAlert("Backup created successfully!", "success");
  } catch (error) {
    showAlert(error.message, "danger");
  }
}

async function restoreData(event) {
  try {
    const fileInput = event.target;
    const file = fileInput.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      showAlert("Backup file is too large!", "danger");
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate backup data structure
        if (!data.transactions || !Array.isArray(data.transactions)) {
          throw new Error("Invalid backup file: missing transactions data");
        }
        if (!data.categories || !data.categories.income || !data.categories.expense) {
          throw new Error("Invalid backup file: missing categories data");
        }

        // Validate each transaction
        data.transactions.forEach((t, index) => {
          if (!t.id || !t.name || !t.amount || !t.date || !t.type || !t.category) {
            throw new Error(`Invalid transaction data at index ${index}`);
          }
          if (t.type !== "income" && t.type !== "expense") {
            throw new Error(`Invalid transaction type at index ${index}`);
          }
          if (typeof t.amount !== "number" || t.amount <= 0) {
            throw new Error(`Invalid transaction amount at index ${index}`);
          }
        });

        // If all validation passes, restore the data
        transactions = data.transactions;
        categories = data.categories;
        tempTransactions = [...transactions];
        
        saveTransactions();
        saveCategories();
        updateTotal();
        renderList();
        renderTransactionsTable();
        updateCategoryVisibility();
        updateCategoryFilter();
        renderCategoriesLists();
        
        showAlert("Data restored successfully!", "success");
        fileInput.value = ''; // Reset file input
      } catch (error) {
        showAlert(`Failed to restore backup: ${error.message}`, "danger");
        fileInput.value = ''; // Reset file input
      }
    };
    
    reader.onerror = function() {
      showAlert("Error reading backup file!", "danger");
      fileInput.value = ''; // Reset file input
    };
    
    reader.readAsText(file);
  } catch (error) {
    showAlert(error.message, "danger");
  }
}

function clearData() {
  if (!confirm("Are you sure you want to clear all data? This action cannot be undone!")) return;
  
  transactions = [];
  tempTransactions = [];
  categories = {
    income: ["Salary", "Freelance", "Investments", "Rental", "Other Income"],
    expense: ["Food & Dining", "Transportation", "Utilities", "Housing", "Entertainment", "Healthcare", "Shopping", "Education", "Other Expense"]
  };
  localStorage.removeItem("transactions");
  saveCategories();
  updateTotal();
  renderList();
  renderTransactionsTable();
  updateCategoryVisibility();
  updateCategoryFilter();
  renderCategoriesLists();
  showAlert("All data cleared successfully!", "success");
}

// Utility Functions
function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function showAlert(message, type) {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
}

// Initialize Application
function initialize() {
  initializeDarkMode();
  setupDarkModeToggle();
  setupFilters();
  updateCategoryVisibility();
  updateCategoryFilter();
  renderCategoriesLists();
  renderList();
  updateTotal();
  
  // Set up category form handlers
  if (addIncomeCategoryForm) {
    addIncomeCategoryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = e.target.querySelector('input');
      const category = input.value.trim();
      if (addCategory('income', category)) {
        input.value = '';
        showAlert('Income category added successfully!', 'success');
      } else {
        showAlert('Category already exists or is invalid!', 'danger');
      }
    });
  }
  
  if (addExpenseCategoryForm) {
    addExpenseCategoryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = e.target.querySelector('input');
      const category = input.value.trim();
      if (addCategory('expense', category)) {
        input.value = '';
        showAlert('Expense category added successfully!', 'success');
      } else {
        showAlert('Category already exists or is invalid!', 'danger');
      }
    });
  }
  
  typeToggle.addEventListener('change', updateCategoryVisibility);
  form.addEventListener("submit", addTransaction);
}

// Start the application
initialize();