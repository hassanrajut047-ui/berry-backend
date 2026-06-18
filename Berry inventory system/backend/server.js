const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());

// ---------- MongoDB Connection ----------
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('MongoDB Error:', err));

// ---------- Models ----------
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'cashier'], default: 'cashier' }
});
const User = mongoose.model('User', UserSchema);

const ProductSchema = new mongoose.Schema({
  name: String,
  brand: String,
  size: String,
  category: String,
  price: Number,
  costPrice: Number,
  stock: Number,
  minStock: Number,
  expiryDate: Date,
  description: String
});
const Product = mongoose.model('Product', ProductSchema);

const CustomerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  balance: { type: Number, default: 0 },
  creditLimit: { type: Number, default: 5000 },
  orders: { type: Number, default: 0 }
});
const Customer = mongoose.model('Customer', CustomerSchema);

const SaleSchema = new mongoose.Schema({
  id: String,
  date: Date,
  customerId: mongoose.Types.ObjectId,
  items: [{ productId: mongoose.Types.ObjectId, qty: Number, price: Number, total: Number }],
  subtotal: Number,
  discount: Number,
  grandTotal: Number,
  paymentMethod: String,
  amountPaid: Number,
  balance: Number,
  status: { type: String, enum: ['paid', 'credit', 'pending'], default: 'paid' }
});
const Sale = mongoose.model('Sale', SaleSchema);

// ---------- Middleware: Auth ----------
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, auth denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

// ---------- AUTH Routes ----------
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- PRODUCT Routes ----------
app.get('/api/products', auth, async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', auth, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', auth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- CUSTOMER Routes ----------
app.get('/api/customers', auth, async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', auth, async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', auth, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- SALE Routes (with Credit Limit Check) ----------
app.post('/api/sales', auth, async (req, res) => {
  try {
    const saleData = req.body;
    const customer = await Customer.findById(saleData.customerId);
    
    // Check Credit Limit
    if (customer && (customer.balance + saleData.balance) > customer.creditLimit) {
      return res.status(400).json({ 
        msg: `Credit limit exceeded! Current balance: ${customer.balance}. Limit: ${customer.creditLimit}`
      });
    }
    
    // Deduct Stock
    for (let item of saleData.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.qty } });
    }
    
    // Update Customer Balance
    if (saleData.balance > 0) {
      customer.balance += saleData.balance;
      await customer.save();
    }
    
    const sale = new Sale(saleData);
    await sale.save();
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sales', auth, async (req, res) => {
  try {
    const sales = await Sale.find().populate('customerId');
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Dashboard Stats ----------
app.get('/api/stats', auth, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalStockResult = await Product.aggregate([{ $group: { _id: null, total: { $sum: "$stock" } } }]);
    const totalStock = totalStockResult[0]?.total || 0;
    const lowStock = await Product.countDocuments({ $expr: { $lte: ["$stock", "$minStock"] } });
    const today = new Date();
    today.setHours(0,0,0,0);
    const todaySalesResult = await Sale.aggregate([
      { $match: { date: { $gte: today } } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } }
    ]);
    const todaySales = todaySalesResult[0]?.total || 0;
    res.json({ totalProducts, totalStock, lowStock, todaySales });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- SEED ADMIN (First Time Setup) ----------
const initAdmin = async () => {
  try {
    const exists = await User.findOne({ username: 'admin' });
    if (!exists) {
      const hashed = await bcrypt.hash('admin123', 10);
      await new User({ username: 'admin', password: hashed, role: 'admin' }).save();
      console.log('👑 Admin user created: admin / admin123');
    }
  } catch (err) {
    console.error('Admin init error:', err);
  }
};
initAdmin();

// ---------- For Vercel (Serverless) ----------
module.exports = app;

// ---------- For Local Testing ----------
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}
