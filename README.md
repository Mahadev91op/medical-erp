# 🏥 Medical ERP & Barcode Management System

![Next.js](https://img.shields.io/badge/Next.js-16.1--black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Ready-green?style=for-the-badge&logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

A premium, high-performance, and secure **Medical ERP & Barcode POS System** built specifically for modern pharmacies, chemists, and medical retail shops. This documentation serves as a comprehensive guide for both **human developers** and **AI models** to quickly understand the user-facing features, technical design, database schemas, and algorithms used in the codebase.

---

## 📖 Table of Contents
1. [✨ Key Features & User Benefits (Hinglish/English)](#-key-features--user-benefits-hinglishenglish)
2. [📂 Project Structure & Directory Layout](#-project-structure--directory-layout)
3. [⚙️ Database Schemas & Data Model](#️-database-schemas--data-model)
4. [🛠️ Technical Architecture & Core Algorithms](#️-technical-architecture--core-algorithms)
5. [🔐 Security, Authentication & Role Restricts](#-security-authentication--role-restricts)
6. [🚀 Quick Start & Installation Guide](#-quick-start--installation-guide)
7. [📈 Performance Seeding & Production Build](#-performance-seeding--production-build)

---

## ✨ Key Features & User Benefits (Hinglish/English)

These are the core user-facing features implemented for shopkeepers, chemists, and billing staff:

### 1. 📊 Command Cockpit (Dashboard)
* **Live Revenue Tracker**: Today's sales cash inflow is updated in real time. Chemist ko din-bhar ki kamai dekhne ke liye bar-bar calculator lekar baithne ki zaroorat nahi hai.
* **Total Stock Valuation**: Instant calculation of the estimated MRP value of all medicines in stock. It gives the shop owner an immediate overview of inventory asset value.
* **Last 7 Days Sales Trend Graph**: Responsive visual charts to review performance over the week, making it easy to identify peak sales days.
* **Payment Method Breakdown**: Clear segregation of Cash, UPI, and Card transactions on the dashboard, making cash counter tallying simple at closing time.

### 2. 🏷️ Smart Purchase & Barcode Stickers
* **Smart Purchase Entry**: Easily record name, batch number, expiry date, distributor, MRP, purchase rate, and supplier bill number for incoming stock.
* **Auto Barcoding**: The system automatically assigns a unique barcode ID to every new batch entered.
* **Direct Label Printing (50mm x 25mm)**: Fully compatible with thermal printers. Shopkeepers can print a single label with one click, or select multiple medicines to print barcodes in bulk with custom label copy counts.

### 3. 🛒 Point of Sale (POS) Billing
* **Barcode Scanner Ready**: Focus on the input box and scan to add items instantly to the cart. Zero manual entry mistakes, keeping lines moving fast.
* **Webcam/Mobile Camera Scanner**: Uses the system webcam or phone camera as a backup scanner (powered by `html5-qrcode`), saving extra hardware setup costs.
* **Expired Stock Block**: Checks expiry dates on checkout. If a batch is expired, the system blocks the sale to protect customer safety and avoid regulatory issues.
* **Shelf Location Tracker**: Shows medicine rack and shelf locations (`rackNumber`) directly in search and cart, helping helpers fetch medicines instantly.
* **Custom Discounts & GST Breakdown**: Allows setting individual discounts (%) and tax slabs (0%, 5%, 12%, 18%) per item, with automated SGST/CGST splits.
* **Cart Pause & Resume**: Allows staff to pause a customer's cart (e.g. if they forget their wallet), serve next customers, and resume the transaction later.

### 4. 📓 Advanced Customer Credit (Khata Book)
* **Trust Stars Rating**: Computes a customer trust rating (1 to 5 stars) based on outstanding dues age, credit limits, and payment habits.
* **Auto-Lock Rules**: Automatically locks a customer's credit account if dues are older than 60 days, or if they miss a promise date by more than 7 days, preventing bad debts.
* **WhatsApp Due Reminders & Receipts**: Generates automated, pre-formatted messages with transaction history breakdown to send dues reminders or payment receipts directly via WhatsApp.

### 5. 📦 Expiry Returns & Directory
* **90-Day Expiry Alerts**: Automatically lists all medicine batches expiring in the next 3 months.
* **Distributor Returns Tracker**: Groups expired medicines by supplier. Staff can select items, print a clean **Debit Note**, and confirm return, which automatically deducts items from inventory.

### 6. 📶 Offline PWA Billing (Offline Resiliency)
* **Local Storage Queue**: Offline sales are saved locally in the client queue if the internet goes down.
* **Background Worker Sync**: A background process monitors connection status and automatically syncs all offline sales to the database the moment the device reconnects.

---

## 📂 Project Structure & Directory Layout

```
medical-erp/
├── public/                       # Static assets and PWA icons
├── src/
│   ├── app/                      # Next.js App Router Pages
│   │   ├── (dashboard)/          # Dashboard sub-routes
│   │   ├── api/                  # API Endpoints
│   │   │   ├── backup/route.js   # DB JSON Backup endpoint
│   │   │   ├── customer/route.js # Khata Book management APIs
│   │   │   ├── dashboard/route.js# Live overview telemetry APIs
│   │   │   ├── medicine/route.js # Inventory and search APIs
│   │   │   ├── restore/route.js  # DB Restore endpoint
│   │   │   ├── returns/route.js  # Distributor return tracker APIs
│   │   │   └── sell/route.js     # POS checkout APIs
│   │   ├── distributors/         # Distributors sub-panel
│   │   ├── inventory/            # Inventory list and sticker manager
│   │   ├── khata/                # Khata Book Customer Ledger UI
│   │   ├── login/                # Authentication screen
│   │   ├── paused/               # License / subscription suspended route
│   │   ├── profile/              # Shop / User details profile UI
│   │   ├── purchase/             # Purchase entry form UI
│   │   ├── reports/              # Advanced sales & analytics UI
│   │   ├── returns/              # Expiry returns and directory ledger UI
│   │   └── sell/                 # POS fast billing terminal UI
│   ├── components/               # Modular UI Elements (StatCards, Scanner, etc.)
│   ├── lib/                      # Helper methods (dates formatting, DB connections)
│   ├── models/                   # Mongoose Database Schemas
│   └── middleware.js             # Route guards, roles system & subscription checks
├── seed.mjs                      # Sample data seeder
├── seed_performance.mjs          # High-Performance seeder (seeds 50k+ records)
├── start_erp.bat                 # One-click startup windows desktop app shortcut
└── package.json                  # Dependencies & script configs
```

---

## ⚙️ Database Schemas & Data Model

Here is how the data structures are defined in Mongoose (located under `src/models/`):

### 1. `Medicine`
Tracks all products and batches in inventory.
* `name` (String): Medicine name (e.g. "Paracetamol 500mg").
* `batch` (String): Unique manufacturer batch code.
* `expiryDate` (Date): Product expiry timestamp.
* `quantity` (Number): Current stock count.
* `mrp` (Number): Maximum retail price.
* `purchasePrice` (Number): Cost price from distributor.
* `distributor` (String): Wholesale supplier name.
* `billNumber` (String): Invoice number from the distributor purchase.
* `purchaseDate` (Date): Date stock was bought.
* `barcodeId` (String): Unique identifier printed as a barcode.
* `rackNumber` (String): Shelf location.
* `userId` (ObjectId): Links to the shop owner user account.

### 2. `Sale`
Tracks POS sales and items billed.
* `billNumber` (String): Unique billing identifier.
* `customerName` / `customerPhone` (String).
* `items` (Array): Sub-document matching:
  - `medicineId` (ObjectId)
  - `name`, `quantity`, `mrp`, `batch`, `expiryDate` (String/Number)
  - `discountPercent`, `gstPercent` (Number)
* `totalAmount` (Number): Grand total.
* `paymentMethod` (String): "Cash", "UPI", or "Card".
* `date` (Date): Timestamp of transaction.
* `prescriptionDetail` (Sub-document):
  - `doctorName` / `doctorRegNo` (String)
  - `patientAge` (Number) / `patientGender` (String)
* `userId` (ObjectId): Billed by.

### 3. `Customer`
Tracks credit accounts for the Khata ledger.
* `name` / `phone` (String).
* `balance` (Number): Current unpaid balance (debt).
* `creditLimit` (Number): Maximum allowed unpaid credit limit.
* `promiseDate` (Date): Deadline date for repayment.
* `transactions` (Array):
  - `type` (String: "Sale", "Payment", "Debt")
  - `amount` (Number)
  - `date` (Date)
  - `note` (String)
  - `saleId` (String/ObjectId)
* `userId` (ObjectId).

---

## 🛠️ Technical Architecture & Core Algorithms

### 1. Thermal Sticker Printing Logic
Barcode stickers are printed using thermal label printers (size 50mm x 25mm). 
* **Engine**: The system uses `react-barcode` to generate dynamic SVG/canvas elements using the **Code128** standard.
* **Print Hook**: `react-to-print` targets specific DOM components styled with custom CSS (`@media print`) to apply CSS page-breaks (`page-break-after: always`). This ensures that each sticker aligns perfectly on continuous rolls without overlaps.

### 2. Offline Mode Queue Reconciliation
* **Save State**: POS uses a `try-catch` wrapper during checkout. If the network request fails, the invoice is saved to a `localStorage` key named `offline_sales_queue` with a prefixed offline invoice ID (`OFF-XXXXXX`).
* **Sync Engine**: A React `useEffect` runs on the client. It listens to the window `online` event and runs an interval worker every 10 seconds. When a connection is restored, it iterates through the offline sales array, makes a POST request to `/api/sell` for each transaction, and clears successful entries from local storage.

### 3. Customer Khata Dues Lock Logic
Located in `khata/page.js` (`getCustomerStatusDetails`):
```javascript
// Calculate oldest debt age
const debts = transactions.filter(tx => tx.type === "Sale" || tx.type === "Debt");
const oldestDebtDate = debts.sort((a,b) => new Date(a.date) - new Date(b.date))[0]?.date;
const oldestDebtDays = Math.ceil((new Date() - new Date(oldestDebtDate)) / (1000 * 60 * 60 * 24));

// Calculate repayment delay
const promiseOverdueDays = promiseDate && (new Date(promiseDate) < new Date()) 
  ? Math.ceil((new Date() - new Date(promiseDate)) / (1000 * 60 * 60 * 24)) 
  : 0;

// Credit is locked if:
const isLocked = oldestDebtDays > 60 || promiseOverdueDays > 7;
```

### 4. Backup & Restore Pipelines
* **Backup**: `/api/backup` runs a Mongoose query to fetch all collections matching the user's data scope, formats it as JSON, and triggers a local file download (`backup_timestamp.json`).
* **Restore**: `/api/restore` reads the backup file from system paths, uses a transaction block to safely clear out old collections, and rewrites the database with the backup records.

---

## 🔐 Security, Authentication & Role Restricts

Authentication is handled by **Next-Auth** using JSON Web Tokens (JWT) stored in secure cookies.
* **Super Admin**: Access to system billing statistics, database tools, global performance metrics, and user licensing settings.
* **Admin (Shop Owner)**: Access to Dashboard, Purchase Entry, Inventory, Reports, Khata Book, and Distributor Returns.
* **Staff (Billing Operator)**: Restricted access. Any attempts to visit `/purchase`, `/reports`, `/distributors`, or their matching APIs are redirected to `/sell` (POS) and `/inventory`.
* **License Expiry Security**: If the user's subscription expires (`subscriptionEnd` < `Date.now()`), middleware intercepts all requests and redirects the session to `/paused`, blocking all POS checkout and data modification operations.

---

## 🚀 Quick Start & Installation Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root folder:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/medical-erp
NEXTAUTH_SECRET=generate_a_random_jwt_secret_key_here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. One-Click Desktop Mode (Windows)
For pharmacy owners on Windows, run the `start_erp.bat` script. It automatically:
1. Starts the Next.js server in the background.
2. Waits for connection readiness.
3. Opens Google Chrome in standalone **App mode** (`--app=http://localhost:3000`), giving users a borderless desktop software experience.

---

## 📈 Performance Seeding & Production Build

### Developer Mock Seeder
To seed basic test data (approx 2,000 medicines and 500 sales logs):
```bash
node seed.mjs
```

### Performance Benchmarking Seeder
To test database queries and search limits with massive datasets (seeds 50,000+ medicines and 10,000+ sales logs distributed across active database users):
```bash
# Seed default performance set (50k meds, 10k sales)
node seed_performance.mjs

# Customize seeder numbers and clear previous collection
node seed_performance.mjs --meds 100000 --sales 25000 --clear
```

### Compile Production Build
```bash
npm run build
npm run start
```

---
*Developed & Maintained with care for modern medical retail operations.*
