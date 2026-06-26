# Medical ERP - Reverse Engineering Documentation

Medical ERP (Enterprise Resource Planning) codebase ki reverse engineering aur understanding documents ka yeh central repository hai. Yaha hum is project ke structure, flow, aur code logic ko detail me samjhenge.

---

## 📂 Codebase Structure (High-Level)

### 1. Root Folders & Files
* **`src/`**: Pure application ka main source code yahi hai.
* **`public/`**: Static assets jaise images, icons, custom SVGs.
* **`docs/`**: Yeh folder (jo abhi humne banaya hai) saare reverse engineering aur understanding docs ke liye hai.
* **Configuration Files**: `.env`, `package.json`, `tailwind.config.js`, `next.config.mjs`, `jsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`.

### 2. `src/` Folder Breakdown
* **`src/app/`**: Next.js App Router folders aur page components.
  * **`(dashboard)`**: Dashboard features (e.g. bills, main panels, statistics).
  * **`api/`**: Backend API endpoints.
  * **`distributors/`**: Distributor management pages.
  * **`inventory/`**: Medicine/Stock inventory management pages.
  * **`khata/`**: Ledgers/Credit accounts management.
  * **`login/` / `signup/`**: Authentication pages.
  * **`paused/`**: Subscription suspension screen (license validation).
  * **`purchase/`**: Purchases/Bills intake from distributors.
  * **`reports/`**: Analytics, Excel/PDF exports.
  * **`sell/`**: Point-of-Sale (POS) component/billing mechanism.
  * **`superadmin/`**: Super admin controls for license keys, database resets.
* **`src/components/`**: Reusable UI components.
* **`src/lib/`**: Helper utilities (MongoDB client instance, Encryption/Decryption, Mailer, standard date formats).
* **`src/models/`**: MongoDB Database Schemas (Mongoose models).

---

## 🗄️ Database Schema & Models
Humare paas following database models hain (`src/models/`):
1. **`User`**: ERP users (Pharmacies, Admin, Employees) ki information.
2. **`ActiveSession`**: Current user sessions tracking.
3. **`Customer`**: Sales ke customers aur credit (udhaar/khata) records.
4. **`Distributor`**: Suppliers jinse medicines/inventory kharidi jati hai.
5. **`Medicine`**: Stock details, batch numbers, expiries, quantities, locations.
6. **`Sale`**: Sales history, billing transactions, invoice logs.
7. **`Otp`**: Verification aur Password Reset/Signup ke liye.

---

## 🛠️ Technology Stack
* **Framework**: Next.js (App Router)
* **CSS Styling**: Tailwind CSS
* **Database**: MongoDB (Mongoose ORM)
* **Auth**: NextAuth.js
* **Icons**: Lucide React
* **Email**: NodeMailer / Custom mailer helper

---

## 📝 Document Index
* [x] [01_Database_Models.md](file:///d:/Working%20Client/medical-erp/docs/01_Database_Models.md) - Detailed study of all Mongoose schemas.
* [ ] **02_Authentication_Flow.md** - Middleware, NextAuth config, Signup & Verification processes.
* [ ] **03_Inventory_Management.md** - Add, edit, bulk import medicines, and stock calculations.
* [ ] **04_Billing_And_Sales_Flow.md** - POS interface, bill generation, inventory deduction, and customer khata updates.
* [ ] **05_Superadmin_And_Licensing.md** - License activation, page suspension logic, and dashboard lockouts.

