// ===== Berry Berry Foods & Beverages - Inventory Management System =====
// Water Bottle Supply Company - Sukkur, Pakistan

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

    init() {
        this.loadData();
        this.loadTheme();
        this.setupEventListeners();
        this.setupNavigation();
        this.renderAll();
        this.updateDashboard();
        document.getElementById('saleDate').valueAsDate = new Date();
        document.getElementById('purchaseDate').valueAsDate = new Date();
    },

    loadData() {
        const saved = localStorage.getItem('berryBerryData');
        if (saved) {
            this.data = JSON.parse(saved);
        } else {
            this.seedData();
        }
    },

    saveData() {
        localStorage.setItem('berryBerryData', JSON.stringify(this.data));
    },

    seedData() {
        this.data.products = [
            { id: 1, name: 'Hispar Mineral Water', brand: 'Hispar', size: '250ml', category: 'Mineral Water', price: 30, costPrice: 20, stock: 500, minStock: 100, description: 'Premium mineral water 250ml bottle' },
            { id: 2, name: 'Hispar Mineral Water', brand: 'Hispar', size: '500ml', category: 'Mineral Water', price: 50, costPrice: 35, stock: 800, minStock: 150, description: 'Premium mineral water 500ml bottle' },
            { id: 3, name: 'Hispar Mineral Water', brand: 'Hispar', size: '1L', category: 'Mineral Water', price: 80, costPrice: 55, stock: 600, minStock: 120, description: 'Premium mineral water 1 litre bottle' },
            { id: 4, name: 'Hispar Mineral Water', brand: 'Hispar', size: '1.5L', category: 'Mineral Water', price: 110, costPrice: 75, stock: 400, minStock: 80, description: 'Premium mineral water 1.5 litre bottle' },
            { id: 5, name: 'Hispar Mineral Water', brand: 'Hispar', size: '5L', category: 'Mineral Water', price: 250, costPrice: 180, stock: 200, minStock: 40, description: 'Premium mineral water 5 litre bottle' },
            { id: 6, name: 'Hispar Dispenser Bottle', brand: 'Hispar', size: '19L', category: 'Dispenser Bottle', price: 400, costPrice: 300, stock: 50, minStock: 15, description: '19 litre dispenser bottle for home/office' },
            { id: 7, name: 'Berry Berry Drinking Water', brand: 'Berry Berry', size: '500ml', category: 'Drinking Water', price: 35, costPrice: 22, stock: 1000, minStock: 200, description: 'Clean drinking water 500ml' },
            { id: 8, name: 'Berry Berry Drinking Water', brand: 'Berry Berry', size: '1L', category: 'Drinking Water', price: 60, costPrice: 40, stock: 750, minStock: 150, description: 'Clean drinking water 1 litre' },
            { id: 9, name: 'Berry Berry Lemon Water', brand: 'Berry Berry', size: '500ml', category: 'Flavored Water', price: 55, costPrice: 35, stock: 300, minStock: 60, description: 'Lemon flavored water 500ml' },
            { id: 10, name: 'Berry Berry Peach Water', brand: 'Berry Berry', size: '500ml', category: 'Flavored Water', price: 55, costPrice: 35, stock: 250, minStock: 50, description: 'Peach flavored water 500ml' }
        ];

        this.data.customers = [
            { id: 1, name: 'Ahmed General Store', phone: '0301-2345678', address: 'Main Bazaar, Sukkur', balance: 0, orders: 0 },
            { id: 2, name: 'Sukkur Medical Store', phone: '0302-3456789', address: 'Hospital Road, Sukkur', balance: 0, orders: 0 },
            { id: 3, name: 'City Mart', phone: '0303-4567890', address: 'Shalimar Chowk, Sukkur', balance: 0, orders: 0 },
            { id: 4, name: 'Rahim Traders', phone: '0304-5678901', address: 'New Market, Sukkur', balance: 0, orders: 0 },
            { id: 5, name: 'Sukkur Public School', phone: '0305-6789012', address: 'Defence Road, Sukkur', balance: 0, orders: 0 }
        ];

        this.data.suppliers = [
            { id: 1, companyName: 'Hispar Water Company', contactPerson: 'Mr. Ali Khan', phone: '0321-1112223', email: 'ali@hispar.pk', address: 'Karachi, Sindh', status: 'active' },
            { id: 2, companyName: 'Pakistan Bottling Co.', contactPerson: 'Mr. Imran', phone: '0322-2223334', email: 'imran@pbc.pk', address: 'Lahore, Punjab', status: 'active' },
            { id: 3, companyName: 'Sindh Mineral Water', contactPerson: 'Mr. Farooq', phone: '0323-3334445', email: 'farooq@smw.pk', address: 'Hyderabad, Sindh', status: 'active' }
        ];

        this.data.sales = [
            { id: 'INV-001', date: new Date().toISOString().split('T')[0], customerId: 1, items: [{productId: 2, qty: 50, price: 50, total: 2500}], subtotal: 2500, discount: 0, grandTotal: 2500, paymentMethod: 'Cash', amountPaid: 2500, balance: 0, status: 'paid' },
            { id: 'INV-002', date: new Date().toISOString().split('T')[0], customerId: 2, items: [{productId: 3, qty: 30, price: 80, total: 2400}, {productId: 7, qty: 40, price: 35, total: 1400}], subtotal: 3800, discount: 100, grandTotal: 3700, paymentMethod: 'Credit', amountPaid: 0, balance: 3700, status: 'credit' },
            { id: 'INV-003', date: new Date().toISOString().split('T')[0], customerId: 3, items: [{productId: 5, qty: 20, price: 250, total: 5000}], subtotal: 5000, discount: 0, grandTotal: 5000, paymentMethod: 'JazzCash', amountPaid: 5000, balance: 0, status: 'paid' }
        ];

        this.data.purchases = [
            { id: 'PO-001', date: new Date().toISOString().split('T')[0], supplierId: 1, productId: 2, quantity: 500, unitCost: 35, totalCost: 17500, notes: 'Regular stock', status: 'completed' },
            { id: 'PO-002', date: new Date().toISOString().split('T')[0], supplierId: 1, productId: 3, quantity: 300, unitCost: 55, totalCost: 16500, notes: 'Regular stock', status: 'completed' }
        ];

        this.data.activities = [
            { type: 'sale', message: 'New sale to Ahmed General Store - Rs. 2,500', time: '2 hours ago' },
            { type: 'stock', message: 'Stock updated for Hispar 500ml - +500 bottles', time: '5 hours ago' },
            { type: 'purchase', message: 'Purchase from Hispar Water Company - Rs. 17,500', time: '1 day ago' },
            { type: 'alert', message: 'Berry Berry Peach Water is running low (250 left)', time: '1 day ago' }
        ];

        this.saveData();
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
        const productOptions = this.data.products.map(p => '<option value="' + p.id + '">' + p.name + ' - ' + p.size + '</option>').join('');
        const customerOptions = this.data.customers.map(c => '<option value="' + c.id + '">' + c.name + '</option>').join('');
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

            return '<tr><td>#' + p.id + '</td><td><strong>' + p.name + '</strong></td><td>' + p.size + '</td><td>' + p.category + '</td><td>' + p.stock + '</td><td>' + p.minStock + '</td><td>Rs. ' + p.price + '</td><td><span class="status-badge ' + status + '">' + statusText + '</span></td><td><button class="btn btn-icon" onclick="app.editProduct(' + p.id + ')" title="Edit"><i class="fas fa-pen"></i></button><button class="btn btn-icon btn-danger" onclick="app.deleteProduct(' + p.id + ')" title="Delete"><i class="fas fa-trash"></i></button></td></tr>';
        }).join('');
    },

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        grid.innerHTML = this.data.products.map(p => {
            let badgeClass = 'success';
            let badgeText = 'In Stock';
            if (p.stock === 0) { badgeClass = 'danger'; badgeText = 'Out of Stock'; }
            else if (p.stock <= p.minStock) { badgeClass = 'warning'; badgeText = 'Low Stock'; }

            return '<div class="product-card"><div class="product-image"><i class="fas fa-bottle-water"></i><span class="product-badge status-badge ' + (badgeClass === 'success' ? 'in-stock' : badgeClass === 'warning' ? 'low-stock' : 'out-stock') + '">' + badgeText + '</span></div><div class="product-info"><h4>' + p.name + '</h4><p class="brand">' + p.brand + ' | ' + p.category + '</p><p style="font-size:12px;color:var(--text-light)">' + p.size + ' | ' + p.description + '</p><div class="product-meta"><span class="price">Rs. ' + p.price + '</span><span class="stock">' + p.stock + ' in stock</span></div></div><div class="product-actions"><button onclick="app.editProduct(' + p.id + ')"><i class="fas fa-pen"></i> Edit</button><button onclick="app.deleteProduct(' + p.id + ')"><i class="fas fa-trash"></i> Delete</button></div></div>';
        }).join('');
    },

    renderSales() {
        const tbody = document.getElementById('salesTable');
        tbody.innerHTML = this.data.sales.map(s => {
            const customer = this.data.customers.find(c => c.id === s.customerId);
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
            return '<tr><td>#' + c.id + '</td><td><strong>' + c.name + '</strong></td><td>' + c.phone + '</td><td>' + c.address + '</td><td>' + c.orders + '</td><td>Rs. ' + c.balance.toLocaleString() + '</td><td><button class="btn btn-icon" onclick="app.editCustomer(' + c.id + ')" title="Edit"><i class="fas fa-pen"></i></button><button class="btn btn-icon btn-danger" onclick="app.deleteCustomer(' + c.id + ')" title="Delete"><i class="fas fa-trash"></i></button></td></tr>';
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

    handleAddProduct(e) {
        e.preventDefault();
        const form = e.target;
        const newProduct = {
            id: Date.now(),
            name: form.name.value,
            brand: form.brand.value || 'Berry Berry',
            size: form.size.value,
            category: form.category.value,
            price: parseFloat(form.price.value),
            costPrice: parseFloat(form.costPrice.value) || 0,
            stock: parseInt(form.stock.value),
            minStock: parseInt(form.minStock.value),
            description: form.description.value
        };
        this.data.products.push(newProduct);
        this.addActivity('stock', 'New product added: ' + newProduct.name + ' (' + newProduct.size + ')');
        this.saveData();
        this.renderAll();
        this.updateDashboard();
        this.closeModal('addProductModal');
        form.reset();
        this.showToast('Product added successfully!', 'success');
    },

    handleAddStock(e) {
        e.preventDefault();
        const form = e.target;
        const productId = parseInt(form.productId.value);
        const qty = parseInt(form.quantity.value);
        const product = this.data.products.find(p => p.id === productId);
        if (product) {
            product.stock += qty;
            this.addActivity('stock', 'Stock added: ' + product.name + ' +' + qty + ' bottles');
            this.saveData();
            this.renderAll();
            this.updateDashboard();
            this.closeModal('addStockModal');
            form.reset();
            this.showToast('Added ' + qty + ' bottles to ' + product.name, 'success');
        }
    },

    handleAddSale(e) {
        e.preventDefault();
        const form = e.target;
        const items = [];
        let subtotal = 0;

        document.querySelectorAll('.sale-item-row').forEach(row => {
            const productId = parseInt(row.querySelector('.sale-product').value);
            const qty = parseInt(row.querySelector('.sale-qty').value);
            const price = parseFloat(row.querySelector('.sale-price').value);
            if (productId && qty && price) {
                const total = qty * price;
                items.push({ productId, qty, price, total });
                subtotal += total;

                const product = this.data.products.find(p => p.id === productId);
                if (product) product.stock -= qty;
            }
        });

        const discount = parseFloat(document.getElementById('saleDiscount').value) || 0;
        const grandTotal = subtotal - discount;
        const amountPaid = parseFloat(document.getElementById('saleAmountPaid').value) || 0;
        const balance = grandTotal - amountPaid;

        const sale = {
            id: 'INV-' + String(this.data.sales.length + 1).padStart(3, '0'),
            date: form.date.value,
            customerId: parseInt(form.customerId.value),
            items,
            subtotal,
            discount,
            grandTotal,
            paymentMethod: form.paymentMethod.value,
            amountPaid,
            balance,
            status: balance > 0 ? 'credit' : 'paid'
        };

        const customer = this.data.customers.find(c => c.id === sale.customerId);
        if (customer) {
            customer.balance += balance;
            customer.orders += 1;
        }

        this.data.sales.push(sale);
        this.addActivity('sale', 'New sale: ' + (customer ? customer.name : 'Unknown') + ' - Rs. ' + grandTotal.toLocaleString());
        this.saveData();
        this.renderAll();
        this.updateDashboard();
        this.closeModal('addSaleModal');
        form.reset();
        this.resetSaleItems();
        this.showToast('Sale completed successfully!', 'success');
    },

    handleAddPurchase(e) {
        e.preventDefault();
        const form = e.target;
        const productId = parseInt(form.productId.value);
        const qty = parseInt(form.quantity.value);
        const unitCost = parseFloat(form.unitCost.value);
        const totalCost = qty * unitCost;

        const product = this.data.products.find(p => p.id === productId);
        if (product) {
            product.stock += qty;
            product.costPrice = unitCost;
        }

        const purchase = {
            id: 'PO-' + String(this.data.purchases.length + 1).padStart(3, '0'),
            date: form.date.value,
            supplierId: parseInt(form.supplierId.value),
            productId,
            quantity: qty,
            unitCost,
            totalCost,
            notes: form.notes.value,
            status: 'completed'
        };

        this.data.purchases.push(purchase);
        this.addActivity('purchase', 'Purchase: ' + qty + ' bottles from supplier - Rs. ' + totalCost.toLocaleString());
        this.saveData();
        this.renderAll();
        this.updateDashboard();
        this.closeModal('addPurchaseModal');
        form.reset();
        this.showToast('Purchase recorded successfully!', 'success');
    },

    handleAddCustomer(e) {
        e.preventDefault();
        const form = e.target;
        const customer = {
            id: Date.now(),
            name: form.name.value,
            phone: form.phone.value,
            address: form.address.value,
            balance: parseFloat(form.balance.value) || 0,
            orders: 0
        };
        this.data.customers.push(customer);
        this.saveData();
        this.renderCustomers();
        this.closeModal('addCustomerModal');
        form.reset();
        this.showToast('Customer added successfully!', 'success');
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

    addSaleItem() {
        const container = document.getElementById('saleItems');
        const productOptions = this.data.products.map(p => '<option value="' + p.id + '">' + p.name + ' - ' + p.size + '</option>').join('');
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
        const productId = parseInt(select.value);
        const product = this.data.products.find(p => p.id === productId);
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

    deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            this.data.products = this.data.products.filter(p => p.id !== id);
            this.saveData();
            this.renderAll();
            this.updateDashboard();
            this.showToast('Product deleted', 'success');
        }
    },

    deleteCustomer(id) {
        if (confirm('Are you sure you want to delete this customer?')) {
            this.data.customers = this.data.customers.filter(c => c.id !== id);
            this.saveData();
            this.renderCustomers();
            this.showToast('Customer deleted', 'success');
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
            const customer = this.data.customers.find(c => c.id === sale.customerId);
            let itemsHtml = sale.items.map(item => {
                const product = this.data.products.find(p => p.id === item.productId);
                return (product ? product.name : 'Unknown') + ' x ' + item.qty + ' = Rs. ' + item.total;
            }).join('\n');
            alert('Invoice: ' + sale.id + '\nCustomer: ' + (customer ? customer.name : 'Unknown') + '\nDate: ' + sale.date + '\n\nItems:\n' + itemsHtml + '\n\nSubtotal: Rs. ' + sale.subtotal + '\nDiscount: Rs. ' + sale.discount + '\nGrand Total: Rs. ' + sale.grandTotal + '\nPayment: ' + sale.paymentMethod + '\nStatus: ' + sale.status);
        }
    },

    viewPurchase(id) {
        const purchase = this.data.purchases.find(p => p.id === id);
        if (purchase) {
            const supplier = this.data.suppliers.find(s => s.id === purchase.supplierId);
            const product = this.data.products.find(p => p.id === purchase.productId);
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
            content.innerHTML = '<div style="padding:20px"><div class="stats-grid" style="margin-bottom:20px"><div class="stat-card blue"><div class="stat-info"><h3>' + this.data.sales.length + '</h3><p>Total Invoices</p></div></div><div class="stat-card green"><div class="stat-info"><h3>Rs. ' + totalSales.toLocaleString() + '</h3><p>Total Sales</p></div></div><div class="stat-card orange"><div class="stat-info"><h3>Rs. ' + totalCredit.toLocaleString() + '</h3><p>Total Credit</p></div></div></div><table class="data-table"><thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Total</th><th>Paid</th><th>Balance</th></tr></thead><tbody>' + this.data.sales.map(s => { const c = this.data.customers.find(cust => cust.id === s.customerId); return '<tr><td>' + s.id + '</td><td>' + s.date + '</td><td>' + (c ? c.name : 'Unknown') + '</td><td>Rs. ' + s.grandTotal.toLocaleString() + '</td><td>Rs. ' + s.amountPaid.toLocaleString() + '</td><td>Rs. ' + s.balance.toLocaleString() + '</td></tr>'; }).join('') + '</tbody></table></div>';
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
            const customer = this.data.customers.find(c => c.id === s.customerId);
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
            const customer = this.data.customers.find(c => c.id === s.customerId);
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