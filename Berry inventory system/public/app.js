// ==========================================
// Berry Berry PRO - Backend Connected Version
// ==========================================

// Polyfill for CanvasRenderingContext2D.roundRect if not available
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
        const r = typeof radii === 'number' ? radii : (radii || 0);
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        return this;
    };
}

// ===== IMPORTANT: CHANGE THIS TO YOUR VERCEL BACKEND URL =====
const API_URL = 'https://berry-backend.vercel.app/api';
// ==============================================================

let authToken = localStorage.getItem('token') || null;
let currentUser = null;

const app = {
    data: {
        products: [],
        sales: [],
        purchases: [],
        customers: [],
        suppliers: [],
        activities: [],
        settings: {
            companyName: 'Berry Berry Foods & Beverages',
            companyAddress: 'Sukkur, Sindh, Pakistan',
            companyPhone: '+92-XXX-XXXXXXX',
            lowStockAlert: true,
            salesAlert: true,
            stockThreshold: 20
        }
    },

    // ---------- AUTH ----------
    async login(username, password) {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                authToken = data.token;
                currentUser = data.user;
                document.getElementById('loginOverlay').style.display = 'none';
                document.getElementById('currentUserName').textContent = data.user.username;
                document.getElementById('currentUserRole').textContent = data.user.role;
                this.showToast('Logged in successfully!', 'success');
                this.loadData();
                this.renderAll();
                this.updateDashboard();
                return true;
            } else {
                this.showToast(data.msg || 'Login failed', 'error');
                return false;
            }
        } catch (e) {
            this.showToast('Server error. Please try again.', 'error');
            return false;
        }
    },

    logout() {
        localStorage.removeItem('token');
        authToken = null;
        currentUser = null;
        document.getElementById('loginOverlay').style.display = 'flex';
        this.showToast('Logged out successfully', 'warning');
    },

    // ---------- API Helpers ----------
    async fetchAPI(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'x-auth-token': authToken
        };
        try {
            const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
            if (res.status === 401) {
                this.showToast('Session expired, please login again', 'error');
                localStorage.removeItem('token');
                authToken = null;
                document.getElementById('loginOverlay').style.display = 'flex';
                return null;
            }
            return await res.json();
        } catch (e) {
            this.showToast('Network error. Please check your connection.', 'error');
            return null;
        }
    },

    // ---------- Load Data from Server ----------
    async loadData() {
        if (!authToken) {
            document.getElementById('loginOverlay').style.display = 'flex';
            return;
        }
        try {
            const [products, customers, sales, stats] = await Promise.all([
                this.fetchAPI('/products'),
                this.fetchAPI('/customers'),
                this.fetchAPI('/sales'),
                this.fetchAPI('/stats')
            ]);
            if (products) this.data.products = products;
            if (customers) this.data.customers = customers;
            if (sales) this.data.sales = sales;
            if (stats) {
                document.getElementById('totalProducts').textContent = stats.totalProducts || 0;
                document.getElementById('totalStock').textContent = (stats.totalStock || 0).toLocaleString();
                document.getElementById('lowStockCount').textContent = stats.lowStock || 0;
                document.getElementById('todaySales').textContent = 'Rs. ' + (stats.todaySales || 0).toLocaleString();
            }
            this.renderAll();
            this.updateDashboard();
        } catch (e) {
            this.showToast('Error loading data', 'error');
        }
    },

    // ---------- INIT Override ----------
    init() {
        this.loadTheme();
        this.setupEventListeners();
        this.setupNavigation();
        
        // Check if user is already logged in
        if (authToken) {
            document.getElementById('loginOverlay').style.display = 'none';
            this.loadData();
        } else {
            document.getElementById('loginOverlay').style.display = 'flex';
        }
        
        document.getElementById('saleDate').valueAsDate = new Date();
        document.getElementById('purchaseDate').valueAsDate = new Date();
    },

    setupNavigation() {
        // Navigation is handled by navClick() onclick in HTML
    },

    navClick(li, page) {
        this.goToPage(page);
        document.querySelectorAll('.nav-links li').forEach(item => item.classList.remove('active'));
        li.classList.add('active');
    },

    goToPage(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page).classList.add('active');
        if (window.innerWidth <= 1024) {
            document.getElementById('sidebar').classList.remove('active');
        }
        this.renderAll();
    },

    setupEventListeners() {
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });

        document.getElementById('modalOverlay').addEventListener('click', () => {
            this.closeAllModals();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
                this.closeNotifications();
            }
        });

        document.addEventListener('click', (e) => {
            const wrapper = document.querySelector('.notification-wrapper');
            const panel = document.getElementById('notificationPanel');
            if (wrapper && panel && panel.classList.contains('active') && !wrapper.contains(e.target)) {
                this.closeNotifications();
            }
        });

        // Enter key on login
        document.getElementById('loginPass').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const username = document.getElementById('loginUser').value;
                const password = document.getElementById('loginPass').value;
                this.login(username, password);
            }
        });
        document.getElementById('loginUser').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('loginPass').focus();
            }
        });

        document.getElementById('addProductForm').addEventListener('submit', (e) => this.handleAddProduct(e));
        document.getElementById('addStockForm').addEventListener('submit', (e) => this.handleAddStock(e));
        document.getElementById('addSaleForm').addEventListener('submit', (e) => this.handleAddSale(e));
        document.getElementById('addPurchaseForm').addEventListener('submit', (e) => this.handleAddPurchase(e));
        document.getElementById('addCustomerForm').addEventListener('submit', (e) => this.handleAddCustomer(e));
        document.getElementById('addSupplierForm').addEventListener('submit', (e) => this.handleAddSupplier(e));
        document.getElementById('companyForm').addEventListener('submit', (e) => this.handleCompanySettings(e));
        document.getElementById('notificationForm').addEventListener('submit', (e) => this.handleNotificationSettings(e));

        document.getElementById('inventorySearch').addEventListener('input', () => this.renderInventory());
        document.getElementById('inventoryFilter').addEventListener('change', () => this.renderInventory());
        document.getElementById('globalSearch').addEventListener('input', (e) => this.globalSearch(e.target.value));

        const purchaseQty = document.querySelector('#addPurchaseForm [name="quantity"]');
        const purchaseCost = document.querySelector('#addPurchaseForm [name="unitCost"]');
        if (purchaseQty && purchaseCost) {
            purchaseQty.addEventListener('input', () => this.calcPurchaseTotal());
            purchaseCost.addEventListener('input', () => this.calcPurchaseTotal());
        }
    },

    openModal(modalId) {
        document.getElementById('modalOverlay').classList.add('active');
        document.getElementById(modalId).classList.add('active');
        this.populateSelects();
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        document.getElementById('modalOverlay').classList.remove('active');
    },

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        document.getElementById('modalOverlay').classList.remove('active');
    },

    populateSelects() {
        const productOptions = this.data.products.map(p => '<option value="' + p._id + '">' + p.name + ' - ' + p.size + '</option>').join('');
        const customerOptions = this.data.customers.map(c => '<option value="' + c._id + '">' + c.name + '</option>').join('');
        const supplierOptions = this.data.suppliers.map(s => '<option value="' + s.id + '">' + s.companyName + '</option>').join('');

        const stockSelect = document.getElementById('stockProductSelect');
        if (stockSelect) stockSelect.innerHTML = '<option value="">Select Product</option>' + productOptions;

        const saleSelect = document.getElementById('saleCustomerSelect');
        if (saleSelect) saleSelect.innerHTML = '<option value="">Select Customer</option>' + customerOptions;

        const purchaseSupplier = document.getElementById('purchaseSupplierSelect');
        if (purchaseSupplier) purchaseSupplier.innerHTML = '<option value="">Select Supplier</option>' + supplierOptions;

        const purchaseProduct = document.getElementById('purchaseProductSelect');
        if (purchaseProduct) purchaseProduct.innerHTML = '<option value="">Select Product</option>' + productOptions;

        document.querySelectorAll('.sale-product').forEach(sel => {
            sel.innerHTML = '<option value="">Select Product</option>' + productOptions;
        });
    },

    updateDashboard() {
        const totalProducts = this.data.products.length;
        const totalStock = this.data.products.reduce((sum, p) => sum + p.stock, 0);
        const lowStock = this.data.products.filter(p => p.stock <= p.minStock).length;

        const today = new Date().toISOString().split('T')[0];
        const todaySales = this.data.sales
            .filter(s => s.date === today)
            .reduce((sum, s) => sum + s.grandTotal, 0);

        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('totalStock').textContent = totalStock.toLocaleString();
        document.getElementById('lowStockCount').textContent = lowStock;
        document.getElementById('todaySales').textContent = 'Rs. ' + todaySales.toLocaleString();

        this.renderLowStockTable();
        this.renderActivityList();
        this.drawStockChart();
    },

    renderLowStockTable() {
        const tbody = document.getElementById('lowStockTable');
        const lowItems = this.data.products.filter(p => p.stock <= p.minStock);
        tbody.innerHTML = lowItems.map(p => {
            const status = p.stock === 0 ? 'out-stock' : 'low-stock';
            const statusText = p.stock === 0 ? 'Out of Stock' : 'Low Stock';
            return '<tr><td><strong>' + p.name + '</strong></td><td>' + p.size + '</td><td>' + p.stock + '</td><td>' + p.minStock + '</td><td><span class="status-badge ' + status + '">' + statusText + '</span></td></tr>';
        }).join('');
        if (lowItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-light)">All stock levels are healthy!</td></tr>';
        }
    },

    renderActivityList() {
        const container = document.getElementById('activityList');
        container.innerHTML = this.data.activities.slice(0, 6).map(a => {
            const icons = { sale: 'fa-cart-shopping', stock: 'fa-box', purchase: 'fa-truck', alert: 'fa-triangle-exclamation' };
            return '<div class="activity-item"><div class="activity-icon ' + a.type + '"><i class="fas ' + icons[a.type] + '"></i></div><div class="activity-details"><p>' + a.message + '</p><span>' + a.time + '</span></div></div>';
        }).join('');
    },

    drawStockChart() {
        const canvas = document.getElementById('stockChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const w = rect.width, h = rect.height;
        const padding = 40;
        const chartW = w - padding * 2;
        const chartH = h - padding * 2;

        const products = this.data.products.slice(0, 6);
        const maxStock = Math.max(...products.map(p => p.stock), 1);
        const barWidth = chartW / products.length * 0.6;
        const gap = chartW / products.length;

        ctx.clearRect(0, 0, w, h);

        products.forEach((p, i) => {
            const barH = (p.stock / maxStock) * chartH;
            const x = padding + i * gap + (gap - barWidth) / 2;
            const y = padding + chartH - barH;

            const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
            gradient.addColorStop(0, '#0ea5e9');
            gradient.addColorStop(1, '#0284c7');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barH, 6);
            ctx.fill();

            ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#f1f5f9' : '#1e293b';
            ctx.font = 'bold 12px Poppins';
            ctx.textAlign = 'center';
            ctx.fillText(p.stock, x + barWidth / 2, y - 8);

            ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#94a3b8' : '#64748b';
            ctx.font = '10px Poppins';
            ctx.fillText(p.size, x + barWidth / 2, h - 10);
        });
    },

    renderInventory() {
        const tbody = document.getElementById('inventoryTable');
        const filter = document.getElementById('inventoryFilter').value;
        const search = document.getElementById('inventorySearch').value.toLowerCase();

        let filtered = this.data.products;
        if (filter === 'low') filtered = filtered.filter(p => p.stock <= p.minStock);
        if (filter === 'out') filtered = filtered.filter(p => p.stock === 0);
        if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || p.brand.toLowerCase().includes(search));

        tbody.innerHTML = filtered.map(p => {
            let status = 'in-stock';
            let statusText = 'In Stock';
            if (p.stock === 0) { status = 'out-stock'; statusText = 'Out of Stock'; }
            else if (p.stock <= p.minStock) { status = 'low-stock'; statusText = 'Low Stock'; }

            const expiryDate = p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : 'N/A';
            return '<tr><td>#' + p.id + '</td><td><strong>' + p.name + '</strong></td><td>' + p.size + '</td><td>' + p.category + '</td><td>' + p.stock + '</td><td>' + p.minStock + '</td><td>Rs. ' + p.price + '</td><td>' + expiryDate + '</td><td><span class="status-badge ' + status + '">' + statusText + '</span></td><td><button class="btn btn-icon" onclick="app.editProduct(' + p.id + ')" title="Edit"><i class="fas fa-pen"></i></button><button class="btn btn-icon btn-danger" onclick="app.deleteProduct(\'' + p._id + '\')" title="Delete"><i class="fas fa-trash"></i></button></td></tr>';
        }).join('');
    },

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        grid.innerHTML = this.data.products.map(p => {
            let badgeClass = 'success';
            let badgeText = 'In Stock';
            if (p.stock === 0) { badgeClass = 'danger'; badgeText = 'Out of Stock'; }
            else if (p.stock <= p.minStock) { badgeClass = 'warning'; badgeText = 'Low Stock'; }

            return '<div class="product-card"><div class="product-image"><i class="fas fa-bottle-water"></i><span class="product-badge status-badge ' + (badgeClass === 'success' ? 'in-stock' : badgeClass === 'warning' ? 'low-stock' : 'out-stock') + '">' + badgeText + '</span></div><div class="product-info"><h4>' + p.name + '</h4><p class="brand">' + p.brand + ' | ' + p.category + '</p><p style="font-size:12px;color:var(--text-light)">' + p.size + ' | ' + p.description + '</p><div class="product-meta"><span class="price">Rs. ' + p.price + '</span><span class="stock">' + p.stock + ' in stock</span></div></div><div class="product-actions"><button onclick="app.editProduct(' + p.id + ')"><i class="fas fa-pen"></i> Edit</button><button onclick="app.deleteProduct(\'' + p._id + '\')"><i class="fas fa-trash"></i> Delete</button></div></div>';
        }).join('');
    },

    renderSales() {
        const tbody = document.getElementById('salesTable');
        tbody.innerHTML = this.data.sales.map(s => {
            const customer = this.data.customers.find(c => c._id === s.customerId);
            const customerName = customer ? customer.name : 'Unknown';
            const statusClass = s.status === 'paid' ? 'paid' : s.status === 'credit' ? 'credit' : 'pending';
            return `<tr><td><strong>${s.id}</strong></td><td>${s.date}</td><td>${customerName}</td><td>${s.items.length} item(s)</td><td>Rs. ${s.grandTotal.toLocaleString()}</td><td>${s.paymentMethod}</td><td><span class="status-badge ${statusClass}">${s.status.toUpperCase()}</span></td><td><button class="btn btn-icon" onclick="app.viewSale('${s.id}')" title="View"><i class="fas fa-eye"></i></button><button class="btn btn-icon" onclick="app.printInvoice('${s.id}')" title="Print"><i class="fas fa-print"></i></button></td></tr>`;
        }).join('');
    },

    renderPurchases() {
        const tbody = document.getElementById('purchasesTable');
        tbody.innerHTML = this.data.purchases.map(p => {
            const supplier = this.data.suppliers.find(s => s.id === p.supplierId);
            const product = this.data.products.find(pr => pr.id === p.productId);
            return `<tr><td><strong>${p.id}</strong></td><td>${p.date}</td><td>${supplier ? supplier.companyName : 'Unknown'}</td><td>${product ? product.name + ' x' + p.quantity : 'Unknown'}</td><td>Rs. ${p.totalCost.toLocaleString()}</td><td><span class="status-badge active">${p.status.toUpperCase()}</span></td><td><button class="btn btn-icon" onclick="app.viewPurchase('${p.id}')" title="View"><i class="fas fa-eye"></i></button></td></tr>`;
        }).join('');
    },

    renderCustomers() {
        const tbody = document.getElementById('customersTable');
        tbody.innerHTML = this.data.customers.map(c => {
            const status = c.balance > c.creditLimit ? 'over-limit' : 'good';
            const statusText = c.balance > c.creditLimit ? '⚠️ Over Limit' : '✅ Good';
            return '<tr><td><strong>' + c.name + '</strong></td><td>' + c.phone + '</td><td>' + c.orders + '</td><td>Rs. ' + c.balance.toLocaleString() + '</td><td>Rs. ' + c.creditLimit + '</td><td><span class="customer-status ' + status + '">' + statusText + '</span></td><td><button class="btn btn-icon" onclick="app.editCustomer(' + c.id + ')" title="Edit"><i class="fas fa-pen"></i></button><button class="btn btn-icon btn-danger" onclick="app.deleteCustomer(\'' + c._id + '\')" title="Delete"><i class="fas fa-trash"></i></button></td></tr>';
        }).join('');
    },

    renderSuppliers() {
        const tbody = document.getElementById('suppliersTable');
        tbody.innerHTML = this.data.suppliers.map(s => {
            const productCount = this.data.products.filter(p => p.brand.toLowerCase().includes(s.companyName.toLowerCase().split(' ')[0])).length;
            return '<tr><td>#' + s.id + '</td><td><strong>' + s.companyName + '</strong></td><td>' + s.contactPerson + '</td><td>' + s.phone + '</td><td>' + productCount + '</td><td><span class="status-badge active">' + s.status.toUpperCase() + '</span></td><td><button class="btn btn-icon" onclick="app.editSupplier(' + s.id + ')" title="Edit"><i class="fas fa-pen"></i></button><button class="btn btn-icon btn-danger" onclick="app.deleteSupplier(' + s.id + ')" title="Delete"><i class="fas fa-trash"></i></button></td></tr>';
        }).join('');
    },

    renderAll() {
        this.renderInventory();
        this.renderProducts();
        this.renderSales();
        this.renderPurchases();
        this.renderCustomers();
        this.renderSuppliers();
    },

    // ---------- CRUD Operations (Backend Connected) ----------
    async handleAddProduct(e) {
        e.preventDefault();
        const form = e.target;
        const newProduct = {
            name: form.name.value,
            brand: form.brand.value || 'Berry Berry',
            size: form.size.value,
            category: form.category.value,
            price: parseFloat(form.price.value),
            costPrice: parseFloat(form.costPrice.value) || 0,
            stock: parseInt(form.stock.value),
            minStock: parseInt(form.minStock.value),
            expiryDate: form.expiryDate.value || null,
            description: form.description.value
        };
        const result = await this.fetchAPI('/products', {
            method: 'POST',
            body: JSON.stringify(newProduct)
        });
        if (result) {
            this.data.products.push(result);
            this.renderAll();
            this.updateDashboard();
            this.closeModal('addProductModal');
            form.reset();
            this.showToast('Product added successfully!', 'success');
        }
    },

    async handleAddStock(e) {
        e.preventDefault();
        const form = e.target;
        const productId = form.productId.value;
        const qty = parseInt(form.quantity.value);
        const product = this.data.products.find(p => p._id === productId);
        if (product) {
            product.stock += qty;
            // Update in backend
            await this.fetchAPI('/products/' + productId, {
                method: 'PUT',
                body: JSON.stringify(product)
            });
            this.addActivity('stock', 'Stock added: ' + product.name + ' +' + qty + ' bottles');
            this.renderAll();
            this.updateDashboard();
            this.closeModal('addStockModal');
            form.reset();
            this.showToast('Added ' + qty + ' bottles to ' + product.name, 'success');
        }
    },

    async handleAddSale(e) {
        e.preventDefault();
        const form = e.target;
        const items = [];
        let subtotal = 0;

        document.querySelectorAll('.sale-item-row').forEach(row => {
            const productId = row.querySelector('.sale-product').value;
            const qty = parseInt(row.querySelector('.sale-qty').value);
            const price = parseFloat(row.querySelector('.sale-price').value);
            if (productId && qty && price) {
                const total = qty * price;
                items.push({ productId, qty, price, total });
                subtotal += total;
            }
        });

        const discount = parseFloat(document.getElementById('saleDiscount').value) || 0;
        const grandTotal = subtotal - discount;
        const amountPaid = parseFloat(document.getElementById('saleAmountPaid').value) || 0;
        const balance = grandTotal - amountPaid;

        const saleData = {
            id: 'INV-' + String(this.data.sales.length + 1).padStart(3, '0'),
            date: form.date.value,
            customerId: form.customerId.value,
            items,
            subtotal,
            discount,
            grandTotal,
            paymentMethod: form.paymentMethod.value,
            amountPaid,
            balance,
            status: balance > 0 ? 'credit' : 'paid'
        };

        const result = await this.fetchAPI('/sales', {
            method: 'POST',
            body: JSON.stringify(saleData)
        });

        if (result) {
            const customer = this.data.customers.find(c => c._id === saleData.customerId);
            if (customer) {
                customer.balance += balance;
                customer.orders += 1;
            }
            // Update local stock
            items.forEach(item => {
                const p = this.data.products.find(pr => pr._id === item.productId);
                if (p) p.stock -= item.qty;
            });
            this.data.sales.push(result);
            this.addActivity('sale', 'New sale: ' + (customer ? customer.name : 'Unknown') + ' - Rs. ' + grandTotal.toLocaleString());
            this.renderAll();
            this.updateDashboard();
            this.closeModal('addSaleModal');
            form.reset();
            this.resetSaleItems();
            this.showToast('Sale completed successfully!', 'success');
            
            // WhatsApp integration
            if (customer && customer.phone) {
                const msg = `Dear ${customer.name}, your invoice ${saleData.id} for Rs. ${grandTotal} is ready. Balance: Rs. ${balance}. Thank you!`;
                const url = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
                window.open(url, '_blank');
            }
        }
    },

    async handleAddPurchase(e) {
        e.preventDefault();
        const form = e.target;
        const productId = form.productId.value;
        const qty = parseInt(form.quantity.value);
        const unitCost = parseFloat(form.unitCost.value);
        const totalCost = qty * unitCost;

        const product = this.data.products.find(p => p._id === productId);
        if (product) {
            product.stock += qty;
            product.costPrice = unitCost;
            await this.fetchAPI('/products/' + productId, {
                method: 'PUT',
                body: JSON.stringify(product)
            });
        }

        const purchase = {
            id: 'PO-' + String(this.data.purchases.length + 1).padStart(3, '0'),
            date: form.date.value,
            supplierId: parseInt(form.supplierId.value),
            productId: productId,
            quantity: qty,
            unitCost,
            totalCost,
            notes: form.notes.value,
            status: 'completed'
        };

        this.data.purchases.push(purchase);
        this.addActivity('purchase', 'Purchase: ' + qty + ' bottles from supplier - Rs. ' + totalCost.toLocaleString());
        this.renderAll();
        this.updateDashboard();
        this.closeModal('addPurchaseModal');
        form.reset();
        this.showToast('Purchase recorded successfully!', 'success');
    },

    async handleAddCustomer(e) {
        e.preventDefault();
        const form = e.target;
        const customer = {
            name: form.name.value,
            phone: form.phone.value,
            address: form.address.value,
            balance: parseFloat(form.balance.value) || 0,
            creditLimit: parseFloat(form.creditLimit.value) || 5000,
            orders: 0
        };
        const result = await this.fetchAPI('/customers', {
            method: 'POST',
            body: JSON.stringify(customer)
        });
        if (result) {
            this.data.customers.push(result);
            this.renderCustomers();
            this.closeModal('addCustomerModal');
            form.reset();
            this.showToast('Customer added successfully!', 'success');
        }
    },

    handleAddSupplier(e) {
        e.preventDefault();
        const form = e.target;
        const supplier = {
            id: Date.now(),
            companyName: form.companyName.value,
            contactPerson: form.contactPerson.value,
            phone: form.phone.value,
            email: form.email.value,
            address: form.address.value,
            status: 'active'
        };
        this.data.suppliers.push(supplier);
        this.saveData();
        this.renderSuppliers();
        this.closeModal('addSupplierModal');
        form.reset();
        this.showToast('Supplier added successfully!', 'success');
    },

    handleCompanySettings(e) {
        e.preventDefault();
        this.data.settings.companyName = document.getElementById('companyName').value;
        this.data.settings.companyAddress = document.getElementById('companyAddress').value;
        this.data.settings.companyPhone = document.getElementById('companyPhone').value;
        this.saveData();
        this.showToast('Company settings saved!', 'success');
    },

    handleNotificationSettings(e) {
        e.preventDefault();
        this.data.settings.lowStockAlert = document.getElementById('lowStockAlert').checked;
        this.data.settings.salesAlert = document.getElementById('salesAlert').checked;
        this.data.settings.stockThreshold = parseInt(document.getElementById('stockThreshold').value);
        this.saveData();
        this.showToast('Notification settings saved!', 'success');
    },

    // ---------- UI Helpers ----------
    addSaleItem() {
        const container = document.getElementById('saleItems');
        const productOptions = this.data.products.map(p => '<option value="' + p._id + '">' + p.name + ' - ' + p.size + '</option>').join('');
        const row = document.createElement('div');
        row.className = 'sale-item-row';
        row.innerHTML = '<div class="form-group"><label>Product</label><select class="sale-product" required onchange="app.updateSalePrice(this)"><option value="">Select Product</option>' + productOptions + '</select></div><div class="form-group"><label>Qty</label><input type="number" class="sale-qty" min="1" value="1" required onchange="app.calculateSaleTotal()"></div><div class="form-group"><label>Unit Price (Rs)</label><input type="number" class="sale-price" readonly></div><div class="form-group"><label>Total (Rs)</label><input type="number" class="sale-total" readonly></div><button type="button" class="btn btn-icon btn-danger" onclick="app.removeSaleItem(this)"><i class="fas fa-trash"></i></button>';
        container.appendChild(row);
    },

    removeSaleItem(btn) {
        const rows = document.querySelectorAll('.sale-item-row');
        if (rows.length > 1) {
            btn.closest('.sale-item-row').remove();
            this.calculateSaleTotal();
        } else {
            this.showToast('At least one item is required', 'warning');
        }
    },

    resetSaleItems() {
        document.getElementById('saleItems').innerHTML = '<div class="sale-item-row"><div class="form-group"><label>Product</label><select class="sale-product" required onchange="app.updateSalePrice(this)"><option value="">Select Product</option></select></div><div class="form-group"><label>Qty</label><input type="number" class="sale-qty" min="1" value="1" required onchange="app.calculateSaleTotal()"></div><div class="form-group"><label>Unit Price (Rs)</label><input type="number" class="sale-price" readonly></div><div class="form-group"><label>Total (Rs)</label><input type="number" class="sale-total" readonly></div><button type="button" class="btn btn-icon btn-danger" onclick="app.removeSaleItem(this)"><i class="fas fa-trash"></i></button></div>';
        this.populateSelects();
    },

    updateSalePrice(select) {
        const productId = select.value;
        const product = this.data.products.find(p => p._id === productId);
        const row = select.closest('.sale-item-row');
        if (product) {
            row.querySelector('.sale-price').value = product.price;
        }
        this.calculateSaleTotal();
    },

    calculateSaleTotal() {
        let subtotal = 0;
        document.querySelectorAll('.sale-item-row').forEach(row => {
            const qty = parseInt(row.querySelector('.sale-qty').value) || 0;
            const price = parseFloat(row.querySelector('.sale-price').value) || 0;
            const total = qty * price;
            row.querySelector('.sale-total').value = total;
            subtotal += total;
        });
        const discount = parseFloat(document.getElementById('saleDiscount').value) || 0;
        const grandTotal = subtotal - discount;
        document.getElementById('saleSubtotal').value = subtotal;
        document.getElementById('saleGrandTotal').value = grandTotal;
        this.calculateSaleBalance();
    },

    calculateSaleBalance() {
        const grandTotal = parseFloat(document.getElementById('saleGrandTotal').value) || 0;
        const amountPaid = parseFloat(document.getElementById('saleAmountPaid').value) || 0;
        document.getElementById('saleBalance').value = grandTotal - amountPaid;
    },

    calcPurchaseTotal() {
        const qty = parseInt(document.querySelector('#addPurchaseForm [name="quantity"]').value) || 0;
        const cost = parseFloat(document.querySelector('#addPurchaseForm [name="unitCost"]').value) || 0;
        document.getElementById('purchaseTotalCost').value = qty * cost;
    },

    async deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            const result = await this.fetchAPI('/products/' + id, { method: 'DELETE' });
            if (result) {
                this.data.products = this.data.products.filter(p => p._id !== id);
                this.renderAll();
                this.updateDashboard();
                this.showToast('Product deleted', 'success');
            }
        }
    },

    async deleteCustomer(id) {
        if (confirm('Are you sure you want to delete this customer?')) {
            const result = await this.fetchAPI('/customers/' + id, { method: 'DELETE' });
            if (result) {
                this.data.customers = this.data.customers.filter(c => c._id !== id);
                this.renderCustomers();
                this.showToast('Customer deleted', 'success');
            }
        }
    },

    deleteSupplier(id) {
        if (confirm('Are you sure you want to delete this supplier?')) {
            this.data.suppliers = this.data.suppliers.filter(s => s.id !== id);
            this.saveData();
            this.renderSuppliers();
            this.showToast('Supplier deleted', 'success');
        }
    },

    editProduct(id) {
        this.showToast('Edit feature - connect to backend API', 'warning');
    },

    editCustomer(id) {
        this.showToast('Edit feature - connect to backend API', 'warning');
    },

    editSupplier(id) {
        this.showToast('Edit feature - connect to backend API', 'warning');
    },

    viewSale(id) {
        const sale = this.data.sales.find(s => s.id === id);
        if (sale) {
            const customer = this.data.customers.find(c => c._id === sale.customerId);
            let itemsHtml = sale.items.map(item => {
                const product = this.data.products.find(p => p._id === item.productId);
                return (product ? product.name : 'Unknown') + ' x ' + item.qty + ' = Rs. ' + item.total;
            }).join('\n');
            alert('Invoice: ' + sale.id + '\nCustomer: ' + (customer ? customer.name : 'Unknown') + '\nDate: ' + sale.date + '\n\nItems:\n' + itemsHtml + '\n\nSubtotal: Rs. ' + sale.subtotal + '\nDiscount: Rs. ' + sale.discount + '\nGrand Total: Rs. ' + sale.grandTotal + '\nPayment: ' + sale.paymentMethod + '\nStatus: ' + sale.status);
        }
    },

    viewPurchase(id) {
        const purchase = this.data.purchases.find(p => p.id === id);
        if (purchase) {
            const supplier = this.data.suppliers.find(s => s.id === purchase.supplierId);
            const product = this.data.products.find(p => p._id === purchase.productId);
            alert('PO: ' + purchase.id + '\nSupplier: ' + (supplier ? supplier.companyName : 'Unknown') + '\nProduct: ' + (product ? product.name : 'Unknown') + '\nQty: ' + purchase.quantity + '\nTotal: Rs. ' + purchase.totalCost + '\nStatus: ' + purchase.status);
        }
    },

    printInvoice(id) {
        this.showToast('Print feature - connect to backend API', 'warning');
    },

    generateReport(type) {
        const resultDiv = document.getElementById('reportResult');
        const title = document.getElementById('reportTitle');
        const content = document.getElementById('reportContent');
        resultDiv.style.display = 'block';

        if (type === 'stock') {
            title.textContent = 'Stock Report';
            const totalValue = this.data.products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
            const totalRetail = this.data.products.reduce((sum, p) => sum + (p.stock * p.price), 0);
            content.innerHTML = '<div style="padding:20px"><div class="stats-grid" style="margin-bottom:20px"><div class="stat-card blue"><div class="stat-info"><h3>' + this.data.products.length + '</h3><p>Total Products</p></div></div><div class="stat-card green"><div class="stat-info"><h3>Rs. ' + totalValue.toLocaleString() + '</h3><p>Total Cost Value</p></div></div><div class="stat-card purple"><div class="stat-info"><h3>Rs. ' + totalRetail.toLocaleString() + '</h3><p>Total Retail Value</p></div></div></div><table class="data-table"><thead><tr><th>Product</th><th>Size</th><th>Stock</th><th>Cost Value</th><th>Retail Value</th></tr></thead><tbody>' + this.data.products.map(p => '<tr><td>' + p.name + '</td><td>' + p.size + '</td><td>' + p.stock + '</td><td>Rs. ' + (p.stock * p.costPrice).toLocaleString() + '</td><td>Rs. ' + (p.stock * p.price).toLocaleString() + '</td></tr>').join('') + '</tbody></table></div>';
        } else if (type === 'sales') {
            title.textContent = 'Sales Report';
            const totalSales = this.data.sales.reduce((sum, s) => sum + s.grandTotal, 0);
            const totalCredit = this.data.sales.reduce((sum, s) => sum + s.balance, 0);
            content.innerHTML = '<div style="padding:20px"><div class="stats-grid" style="margin-bottom:20px"><div class="stat-card blue"><div class="stat-info"><h3>' + this.data.sales.length + '</h3><p>Total Invoices</p></div></div><div class="stat-card green"><div class="stat-info"><h3>Rs. ' + totalSales.toLocaleString() + '</h3><p>Total Sales</p></div></div><div class="stat-card orange"><div class="stat-info"><h3>Rs. ' + totalCredit.toLocaleString() + '</h3><p>Total Credit</p></div></div></div><table class="data-table"><thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Total</th><th>Paid</th><th>Balance</th></tr></thead><tbody>' + this.data.sales.map(s => { const c = this.data.customers.find(cust => cust._id === s.customerId); return '<tr><td>' + s.id + '</td><td>' + s.date + '</td><td>' + (c ? c.name : 'Unknown') + '</td><td>Rs. ' + s.grandTotal.toLocaleString() + '</td><td>Rs. ' + s.amountPaid.toLocaleString() + '</td><td>Rs. ' + s.balance.toLocaleString() + '</td></tr>'; }).join('') + '</tbody></table></div>';
        } else if (type === 'profit') {
            title.textContent = 'Profit & Loss Report';
            const totalRevenue = this.data.sales.reduce((sum, s) => sum + s.grandTotal, 0);
            const totalCost = this.data.purchases.reduce((sum, p) => sum + p.totalCost, 0);
            const profit = totalRevenue - totalCost;
            content.innerHTML = '<div style="padding:20px"><div class="stats-grid" style="margin-bottom:20px"><div class="stat-card green"><div class="stat-info"><h3>Rs. ' + totalRevenue.toLocaleString() + '</h3><p>Total Revenue</p></div></div><div class="stat-card orange"><div class="stat-info"><h3>Rs. ' + totalCost.toLocaleString() + '</h3><p>Total Cost</p></div></div><div class="stat-card ' + (profit >= 0 ? 'blue' : 'danger') + '"><div class="stat-info"><h3>Rs. ' + profit.toLocaleString() + '</h3><p>' + (profit >= 0 ? 'Net Profit' : 'Net Loss') + '</p></div></div></div></div>';
        } else if (type === 'customer') {
            title.textContent = 'Customer Report';
            content.innerHTML = '<div style="padding:20px"><table class="data-table"><thead><tr><th>Customer</th><th>Phone</th><th>Orders</th><th>Balance</th></tr></thead><tbody>' + this.data.customers.map(c => '<tr><td>' + c.name + '</td><td>' + c.phone + '</td><td>' + c.orders + '</td><td>Rs. ' + c.balance.toLocaleString() + '</td></tr>').join('') + '</tbody></table></div>';
        }
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    },

    exportReport() {
        this.showToast('Export feature - connect to backend API', 'warning');
    },

    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'berry_berry_inventory_data.json';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Data exported successfully!', 'success');
    },

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    this.data = JSON.parse(event.target.result);
                    this.saveData();
                    this.renderAll();
                    this.updateDashboard();
                    this.showToast('Data imported successfully!', 'success');
                } catch (err) {
                    this.showToast('Invalid file format', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    clearData() {
        if (confirm('WARNING: This will delete ALL data. Are you sure?')) {
            localStorage.removeItem('berryBerryData');
            this.seedData();
            this.renderAll();
            this.updateDashboard();
            this.showToast('All data cleared and reset', 'warning');
        }
    },

    addActivity(type, message) {
        this.data.activities.unshift({
            type,
            message,
            time: 'Just now'
        });
        if (this.data.activities.length > 50) this.data.activities.pop();
    },

    showToast(message, type) {
        type = type || 'success';
        const container = document.getElementById('toastContainer');
        const icons = { success: 'fa-check-circle', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation' };
        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.innerHTML = '<i class="fas ' + icons[type] + '"></i><div class="toast-content"><p>' + message + '</p></div>';
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    globalSearch(query) {
        if (!query) return;
        query = query.toLowerCase();
        const results = this.data.products.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.brand.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query)
        );
        if (results.length > 0) {
            this.goToPage('products');
            this.showToast('Found ' + results.length + ' product(s) matching "' + query + '"', 'success');
        }
    },

    filterSales() {
        const from = document.getElementById('salesDateFrom').value;
        const to = document.getElementById('salesDateTo').value;
        if (!from && !to) {
            this.renderSales();
            return;
        }
        const tbody = document.getElementById('salesTable');
        const filtered = this.data.sales.filter(s => {
            if (from && s.date < from) return false;
            if (to && s.date > to) return false;
            return true;
        });
        tbody.innerHTML = filtered.map(s => {
            const customer = this.data.customers.find(c => c._id === s.customerId);
            const statusClass = s.status === 'paid' ? 'paid' : s.status === 'credit' ? 'credit' : 'pending';
            return `<tr><td><strong>${s.id}</strong></td><td>${s.date}</td><td>${customer ? customer.name : 'Unknown'}</td><td>${s.items.length} item(s)</td><td>Rs. ${s.grandTotal.toLocaleString()}</td><td>${s.paymentMethod}</td><td><span class="status-badge ${statusClass}">${s.status.toUpperCase()}</span></td><td><button class="btn btn-icon" onclick="app.viewSale('${s.id}')" title="View"><i class="fas fa-eye"></i></button></td></tr>`;
        }).join('');
    },

    // ===== Notifications =====
    toggleNotifications() {
        const panel = document.getElementById('notificationPanel');
        if (panel.classList.contains('active')) {
            this.closeNotifications();
        } else {
            this.renderNotifications();
            panel.classList.add('active');
        }
    },

    closeNotifications() {
        const panel = document.getElementById('notificationPanel');
        if (panel) panel.classList.remove('active');
    },

    renderNotifications() {
        const list = document.getElementById('notificationList');
        const lowStock = this.data.products.filter(p => p.stock <= p.minStock);
        let notifs = [];

        lowStock.forEach(p => {
            notifs.push({
                type: 'alert',
                icon: 'fa-triangle-exclamation',
                message: p.name + ' (' + p.size + ') is running low - ' + p.stock + ' left',
                time: 'Just now'
            });
        });

        this.data.sales.slice(0, 3).forEach(s => {
            const customer = this.data.customers.find(c => c._id === s.customerId);
            notifs.push({
                type: 'sale',
                icon: 'fa-cart-shopping',
                message: 'New sale to ' + (customer ? customer.name : 'Unknown') + ' - Rs. ' + s.grandTotal.toLocaleString(),
                time: s.date
            });
        });

        this.data.activities.slice(0, 2).forEach(a => {
            if (a.type === 'stock') {
                notifs.push({
                    type: 'stock',
                    icon: 'fa-box',
                    message: a.message,
                    time: a.time
                });
            }
        });

        if (notifs.length === 0) {
            list.innerHTML = '<div class="notification-empty"><i class="fas fa-bell-slash" style="font-size:24px;margin-bottom:8px;display:block"></i>No notifications</div>';
        } else {
            list.innerHTML = notifs.map(n => {
                return '<div class="notification-item ' + n.type + '"><i class="fas ' + n.icon + '"></i><div><p>' + n.message + '</p><span>' + n.time + '</span></div></div>';
            }).join('');
        }

        const badge = document.getElementById('notifBadge');
        if (badge) {
            const count = lowStock.length;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    },

    clearNotifications() {
        const list = document.getElementById('notificationList');
        list.innerHTML = '<div class="notification-empty"><i class="fas fa-check-circle" style="font-size:24px;margin-bottom:8px;display:block;color:var(--success)"></i>All notifications cleared</div>';
        const badge = document.getElementById('notifBadge');
        if (badge) {
            badge.style.display = 'none';
        }
    },

    // ===== Theme Toggle =====
    toggleTheme() {
        const body = document.body;
        const icon = document.getElementById('themeIcon');
        const isDark = body.classList.toggle('dark-mode');

        if (isDark) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('berryBerryTheme', 'dark');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('berryBerryTheme', 'light');
        }

        if (document.getElementById('dashboard').classList.contains('active')) {
            this.drawStockChart();
        }
    },

    loadTheme() {
        const saved = localStorage.getItem('berryBerryTheme');
        const icon = document.getElementById('themeIcon');
        if (saved === 'dark') {
            document.body.classList.add('dark-mode');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
