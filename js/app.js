/**
 * Expense & Budget Visualizer — app.js
 * Vanilla JS, no framework. All state in module-level variables.
 */

/* ============================================================
   StorageService — all localStorage I/O
   ============================================================ */
const StorageService = {
  read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? null : JSON.parse(raw);
    } catch (_) { return null; }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (_) { /* swallow */ }
  },
  isAvailable() {
    try {
      const k = '__ebv_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch (_) { return false; }
  }
};

/* ============================================================
   Validator — pure validation, returns error string or null
   ============================================================ */
const Validator = {
  validateName(v) {
    const s = typeof v === 'string' ? v.trim() : '';
    if (!s) return 'Item name is required.';
    if (s.length > 100) return 'Item name must not exceed 100 characters.';
    return null;
  },
  validateAmount(v) {
    if (v === '' || v === null || v === undefined) return 'Amount is required.';
    const n = Number(v);
    if (isNaN(n) || !isFinite(n)) return 'Amount must be a valid number.';
    if (n < 0.01) return 'Amount must be at least 0.01.';
    if (n > 999_999_999.99) return 'Amount must not exceed 999,999,999.99.';
    return null;
  },
  validateCategory(v) {
    if (typeof v !== 'string' || !v.trim()) return 'Please select a category.';
    return null;
  },
  validateCategoryLabel(label, existing) {
    const s = typeof label === 'string' ? label.trim() : '';
    if (!s) return 'Category name is required.';
    if (s.length > 50) return 'Category name must not exceed 50 characters.';
    if (!/^[a-zA-Z0-9 ]+$/.test(s)) return 'Only letters, numbers, and spaces are allowed.';
    const dup = (existing || []).some(e => e.trim().toLowerCase() === s.toLowerCase());
    if (dup) return 'A category with that name already exists.';
    return null;
  }
};

/* ============================================================
   TransactionService — owns the in-memory transaction array
   ============================================================ */
const TransactionService = (() => {
  let _list = [];

  return {
    init(arr) { _list = Array.isArray(arr) ? [...arr] : []; },
    getAll()  { return [..._list]; },
    add(name, amount, category) {
      const tx = {
        id:        crypto.randomUUID(),
        name:      name.trim(),
        amount:    Math.round(Number(amount) * 100) / 100,
        category,
        timestamp: new Date().toISOString()
      };
      _list.push(tx);
      StorageService.write('ebv_transactions', _list);
      return tx;
    },
    remove(id) {
      const i = _list.findIndex(t => t.id === id);
      if (i === -1) return false;
      _list.splice(i, 1);
      StorageService.write('ebv_transactions', _list);
      return true;
    },
    getCategoryTotals() {
      const totals = {};
      for (const tx of _list) {
        totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
      }
      // Remove zero-value entries
      Object.keys(totals).forEach(k => { if (totals[k] <= 0) delete totals[k]; });
      return totals;
    }
  };
})();

/* ============================================================
   CategoryService — default + custom categories
   ============================================================ */
const CategoryService = (() => {
  const DEFAULTS = ['Food', 'Transport', 'Fun'];
  let _custom = [];

  return {
    init(fromStorage) { _custom = Array.isArray(fromStorage) ? [...fromStorage] : []; },
    getAll()   { return [...DEFAULTS, ..._custom]; },
    getCustom(){ return [..._custom]; },
    isDefault(label) { return DEFAULTS.some(d => d.toLowerCase() === label.toLowerCase()); },
    add(label) {
      const all = this.getAll();
      const err = Validator.validateCategoryLabel(label, all);
      if (err) return { ok: false, error: err };
      if (_custom.length >= 20) return { ok: false, error: 'Maximum of 20 custom categories reached.' };
      _custom.push(label.trim());
      StorageService.write('ebv_categories', _custom);
      return { ok: true };
    },
    remove(label) {
      if (this.isDefault(label)) return { ok: false, error: 'Default categories cannot be deleted.' };
      if (TransactionService.getCategoryTotals()[label]) {
        return { ok: false, error: `"${label}" is used by existing transactions and cannot be deleted.` };
      }
      _custom = _custom.filter(c => c.toLowerCase() !== label.toLowerCase());
      StorageService.write('ebv_categories', _custom);
      return { ok: true };
    }
  };
})();

/* ============================================================
   BalanceService — compute & format total
   ============================================================ */
const BalanceService = {
  compute(txs) {
    if (!Array.isArray(txs) || !txs.length) return 0;
    const sum = txs.reduce((a, t) => a + (typeof t.amount === 'number' ? t.amount : 0), 0);
    return Math.round(sum * 100) / 100;
  },
  format(n) {
    const num = typeof n === 'number' ? n : 0;
    const abs = Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return num < 0 ? `-Rp ${abs}` : `Rp ${abs}`;
  }
};

/* ============================================================
   SortService
   ============================================================ */
const SortService = {
  sort(txs, option) {
    const arr = [...txs];
    if (!option) {
      // Default: newest first
      return arr.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
    return arr.sort((a, b) => {
      if (option === 'amount-asc')    { const d = a.amount - b.amount; return d !== 0 ? d : b.timestamp.localeCompare(a.timestamp); }
      if (option === 'amount-desc')   { const d = b.amount - a.amount; return d !== 0 ? d : b.timestamp.localeCompare(a.timestamp); }
      if (option === 'category-asc')  { const d = a.category.localeCompare(b.category); return d !== 0 ? d : b.timestamp.localeCompare(a.timestamp); }
      if (option === 'category-desc') { const d = b.category.localeCompare(a.category); return d !== 0 ? d : b.timestamp.localeCompare(a.timestamp); }
      return 0;
    });
  }
};

/* ============================================================
   ThemeService
   ============================================================ */
const ThemeService = {
  _current: 'light',
  init() {
    const stored = StorageService.read('ebv_theme');
    this._current = (stored === 'dark') ? 'dark' : 'light';
    this._apply();
  },
  toggle() {
    this._current = this._current === 'light' ? 'dark' : 'light';
    StorageService.write('ebv_theme', this._current);
    this._apply();
  },
  getCurrent() { return this._current; },
  _apply() {
    document.documentElement.setAttribute('data-theme', this._current);
    const btn  = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');
    if (btn)  btn.setAttribute('aria-label', this._current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    if (icon) icon.textContent = this._current === 'dark' ? '☀️' : '🌙';
  }
};

/* ============================================================
   ChartService — wraps Chart.js
   ============================================================ */
const ChartService = (() => {
  const PALETTE = [
    '#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6',
    '#a855f7','#14b8a6','#f97316','#ec4899','#84cc16',
    '#06b6d4','#f43f5e','#8b5cf6','#22c55e','#0ea5e9',
    '#d97706','#7c3aed','#059669','#dc2626','#2563eb'
  ];
  let _chart = null;

  function assignColours(cats) {
    return cats.map((_, i) => {
      if (i < PALETTE.length) return PALETTE[i];
      const hue = Math.round((i * 360) / cats.length);
      return `hsl(${hue},65%,55%)`;
    });
  }

  return {
    init(canvas) {
      if (typeof Chart === 'undefined' || window.__chartJsFailed) {
        const msg = document.getElementById('chartEmpty');
        if (msg) { msg.style.position = 'static'; msg.textContent = '⚠️ Chart could not be loaded. All other features remain available.'; }
        return;
      }
      if (_chart) { _chart.destroy(); _chart = null; }
      _chart = new Chart(canvas, {
        type: 'pie',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { position: 'bottom', labels: { padding: 14, boxWidth: 14, font: { size: 12 } } },
            tooltip: {
              callbacks: {
                label(ctx) {
                  const v = ctx.parsed;
                  const abs = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  return ` Rp ${abs}`;
                }
              }
            }
          }
        }
      });
    },
    update(totals) {
      const emptyEl = document.getElementById('chartEmpty');
      const labels = Object.keys(totals);
      if (!labels.length) {
        if (emptyEl) emptyEl.style.display = 'flex';
        if (_chart) { _chart.data.labels = []; _chart.data.datasets[0].data = []; _chart.data.datasets[0].backgroundColor = []; _chart.update(); }
        return;
      }
      if (emptyEl) emptyEl.style.display = 'none';
      if (!_chart) return;
      _chart.data.labels = labels;
      _chart.data.datasets[0].data = labels.map(l => totals[l]);
      _chart.data.datasets[0].backgroundColor = assignColours(labels);
      _chart.update();
    }
  };
})();

/* ============================================================
   UIRenderer — DOM updates only, no business logic
   ============================================================ */
const UIRenderer = {
  /** Format a name for display — truncate at 50 chars */
  _displayName(name) {
    return name.length > 50 ? name.slice(0, 50) + '…' : name;
  },

  /** Get initials for the badge */
  _initials(name) {
    const words = name.trim().split(/\s+/).slice(0, 2);
    return words.map(w => w[0]).join('').toUpperCase() || '?';
  },

  /** Build a single <li> for a transaction */
  _buildRow(tx) {
    const li = document.createElement('li');
    li.className = 'tx-item';
    li.dataset.id = tx.id;

    const date = new Date(tx.timestamp);
    const dateStr = isNaN(date) ? '' : date.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });

    li.innerHTML = `
      <div class="tx-badge" aria-hidden="true">${this._initials(tx.name)}</div>
      <div class="tx-body">
        <div class="tx-name" title="${tx.name.replace(/"/g,'&quot;')}">${this._displayName(tx.name)}</div>
        <div class="tx-meta">
          <span class="tx-category">${tx.category}</span>
          <span>${dateStr}</span>
        </div>
      </div>
      <div class="tx-amount">${BalanceService.format(tx.amount)}</div>
      <div class="tx-actions">
        <button class="btn btn--danger" data-action="delete" data-id="${tx.id}" aria-label="Delete transaction ${tx.name}">
          🗑
        </button>
      </div>`;
    return li;
  },

  renderList(txs) {
    const ul = document.getElementById('transactionList');
    const empty = document.getElementById('emptyState');
    ul.innerHTML = '';
    if (!txs.length) {
      const li = document.createElement('li');
      li.id = 'emptyState';
      li.className = 'empty-state';
      li.textContent = 'No transactions yet. Add one above!';
      ul.appendChild(li);
      return;
    }
    txs.forEach(tx => ul.appendChild(this._buildRow(tx)));
  },

  prependRow(tx) {
    const ul = document.getElementById('transactionList');
    // Remove empty state if present
    const empty = ul.querySelector('.empty-state');
    if (empty) ul.removeChild(empty);
    ul.insertBefore(this._buildRow(tx), ul.firstChild);
  },

  removeRow(id) {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) el.remove();
    const ul = document.getElementById('transactionList');
    if (!ul.children.length) {
      const li = document.createElement('li');
      li.id = 'emptyState';
      li.className = 'empty-state';
      li.textContent = 'No transactions yet. Add one above!';
      ul.appendChild(li);
    }
  },

  updateBalance(total) {
    const el = document.getElementById('balanceDisplay');
    if (el) el.textContent = BalanceService.format(total);
  },

  updateCategoryDropdown(cats) {
    const sel = document.getElementById('category');
    const prev = sel.value;
    sel.innerHTML = '<option value="">-- Select category --</option>';
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      sel.appendChild(opt);
    });
    if (prev && cats.includes(prev)) sel.value = prev;

    const submitBtn = document.getElementById('submitBtn');
    const noMsg     = document.getElementById('noCategoryMsg');
    if (!cats.length) {
      submitBtn.disabled = true;
      noMsg.hidden = false;
    } else {
      submitBtn.disabled = false;
      noMsg.hidden = true;
    }
  },

  renderCustomCategories(custom) {
    const ul = document.getElementById('customCategoryList');
    ul.innerHTML = '';
    custom.forEach(c => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="tag">
          ${c}
          <button class="tag-remove" data-action="remove-cat" data-cat="${c}" aria-label="Remove category ${c}" title="Remove">×</button>
        </span>`;
      ul.appendChild(li);
    });
  },

  showFieldError(fieldId, msg) {
    const el = document.getElementById(fieldId + 'Error');
    if (el) { el.textContent = msg || ''; }
    const input = document.getElementById(fieldId);
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  },

  clearErrors(formEl) {
    formEl.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
    formEl.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  },

  resetForm(formEl) {
    formEl.reset();
    this.clearErrors(formEl);
  }
};

/* ============================================================
   App — bootstraps everything on DOMContentLoaded
   ============================================================ */
const App = {
  _sortOption: null,

  init() {
    // Check localStorage availability
    if (!StorageService.isAvailable()) {
      document.getElementById('storageWarning').hidden = false;
    }

    // Load transactions
    let rawTxs = StorageService.read('ebv_transactions');
    if (rawTxs !== null && !Array.isArray(rawTxs)) {
      // Malformed
      StorageService.remove('ebv_transactions');
      rawTxs = [];
      document.getElementById('dataError').hidden = false;
    }
    TransactionService.init(rawTxs || []);

    // Load custom categories
    const rawCats = StorageService.read('ebv_categories');
    CategoryService.init(Array.isArray(rawCats) ? rawCats : []);

    // Init UI
    const allCats = CategoryService.getAll();
    UIRenderer.updateCategoryDropdown(allCats);
    UIRenderer.renderCustomCategories(CategoryService.getCustom());

    const txs = TransactionService.getAll();
    const sorted = SortService.sort(txs, this._sortOption);
    UIRenderer.renderList(sorted);
    UIRenderer.updateBalance(BalanceService.compute(txs));

    // Init chart
    const canvas = document.getElementById('spendingChart');
    ChartService.init(canvas);
    ChartService.update(TransactionService.getCategoryTotals());

    // Init theme
    ThemeService.init();

    // ── Event listeners ──

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => ThemeService.toggle());

    // Transaction form submit
    document.getElementById('transactionForm').addEventListener('submit', e => {
      e.preventDefault();
      this._handleAddTransaction();
    });

    // Delete transaction (event delegation on list)
    document.getElementById('transactionList').addEventListener('click', e => {
      const btn = e.target.closest('[data-action="delete"]');
      if (btn) this._handleDeleteTransaction(btn.dataset.id);
    });

    // Sort control
    document.getElementById('sortControl').addEventListener('change', e => {
      this._sortOption = e.target.value || null;
      const sorted = SortService.sort(TransactionService.getAll(), this._sortOption);
      UIRenderer.renderList(sorted);
    });

    // Add custom category form
    document.getElementById('categoryForm').addEventListener('submit', e => {
      e.preventDefault();
      this._handleAddCategory();
    });

    // Remove custom category (event delegation)
    document.getElementById('customCategoryList').addEventListener('click', e => {
      const btn = e.target.closest('[data-action="remove-cat"]');
      if (btn) this._handleRemoveCategory(btn.dataset.cat);
    });
  },

  _handleAddTransaction() {
    const form     = document.getElementById('transactionForm');
    const nameVal  = document.getElementById('itemName').value;
    const amtVal   = document.getElementById('amount').value;
    const catVal   = document.getElementById('category').value;

    const nameErr = Validator.validateName(nameVal);
    const amtErr  = Validator.validateAmount(amtVal);
    const catErr  = Validator.validateCategory(catVal);

    UIRenderer.showFieldError('itemName', nameErr);
    UIRenderer.showFieldError('amount',   amtErr);
    UIRenderer.showFieldError('category', catErr);

    if (nameErr || amtErr || catErr) return;

    const tx = TransactionService.add(nameVal, amtVal, catVal);

    if (this._sortOption) {
      // Re-render whole list to respect sort order
      UIRenderer.renderList(SortService.sort(TransactionService.getAll(), this._sortOption));
    } else {
      UIRenderer.prependRow(tx);
    }

    UIRenderer.updateBalance(BalanceService.compute(TransactionService.getAll()));
    ChartService.update(TransactionService.getCategoryTotals());
    UIRenderer.resetForm(form);
  },

  _handleDeleteTransaction(id) {
    if (!id) return;
    TransactionService.remove(id);
    UIRenderer.removeRow(id);
    UIRenderer.updateBalance(BalanceService.compute(TransactionService.getAll()));
    ChartService.update(TransactionService.getCategoryTotals());
  },

  _handleAddCategory() {
    const input = document.getElementById('newCategory');
    const label = input.value;
    const result = CategoryService.add(label);
    if (!result.ok) {
      UIRenderer.showFieldError('newCategory', result.error);
      return;
    }
    UIRenderer.showFieldError('newCategory', null);
    input.value = '';
    UIRenderer.updateCategoryDropdown(CategoryService.getAll());
    UIRenderer.renderCustomCategories(CategoryService.getCustom());
  },

  _handleRemoveCategory(label) {
    const result = CategoryService.remove(label);
    if (!result.ok) {
      // Show a brief alert (no dedicated error el for this)
      alert(result.error);
      return;
    }
    UIRenderer.updateCategoryDropdown(CategoryService.getAll());
    UIRenderer.renderCustomCategories(CategoryService.getCustom());
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
