# Olarvo One (olarvoone.com)

> **AI-Powered Business Assistant for African SMBs & Retail Shop Owners**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Complete](https://img.shields.io/badge/Status-Complete-emerald.svg)]()
[![Platform: 100% Offline-Ready](https://img.shields.io/badge/Offline--First-Supported-purple.svg)]()

**Olarvo One** is an AI-powered retail and shop management platform designed specifically for small and medium-sized businesses across Africa. It equips merchants with Point-of-Sale (POS) capabilities, live inventory monitoring with low-stock alerts, digital WhatsApp receipt and invoice creation, localized AI business advisory, debtor management, and financial reporting with CSV export—operating 100% offline with zero advertising trackers.

---

## 🚀 Key Features

- **⚡ Lightning-Fast POS & Sales Log:** Record transactions with item search or quick custom entries. Supports Cash, Bank Transfer, POS Machine, and Mobile Money channels.
- **📦 Smart Stock & Inventory Management:** Live catalog tracking, margin calculations, low-stock reorder thresholds, and a complete audit log of all stock intake, sales, and fixes.
- **🧾 Instant WhatsApp Receipts & Invoices:** Print standard 80mm thermal receipts or send formatted, itemized digital receipts straight to customers via WhatsApp in one click.
- **🤖 Contextual AI Business Advisor Studio:** Intelligent advice tailored to African consumer behavior (Lagos/Nairobi peak shopping hours, payday surges, bundle suggestions, and reorder alerts).
- **👥 Customer CRM & Debt Tracking:** Monitor customer lifetime value, store credit balances, and generate polite WhatsApp debt reminder messages.
- **📊 Financial Analytics & Export:** 7-day revenue trend charts, category breakdown visualization, and full export to CSV / PDF.
- **🛡️ 100% Offline-First & Privacy-Focused:** Stores all data locally on the user's device using LocalStorage/IndexedDB. Zero advertising trackers.
- **🌍 Multi-Currency Support:** Seamlessly switch between Nigerian Naira (₦ NGN), Kenyan Shilling (KSh KES), Ghanaian Cedi (GH₵ GHS), South African Rand (R ZAR), US Dollars ($), and Euros (€).

---

## 📁 Repository Structure

```
olarvoone/
├── index.html                 # Complete Marketing & Landing Website
├── app.html                   # "My Shop" Full Web Application Platform (SPA)
├── privacy.html               # Privacy Policy (Offline & Zero-Tracker Commitment)
├── terms.html                 # Terms of Service
├── README.md                  # Project Documentation
├── .gitignore                 # Standard Web Git Ignore
└── assets/
    ├── css/
    │   └── styles.css         # Design Tokens, Animations & Thermal Print Styles
    ├── js/
    │   ├── db.js              # Offline Storage Layer & Demo Data Seeder
    │   ├── app.js             # Core App Controller, Routing, Theme & Toasts
    │   ├── sales.js           # POS Checkout, Sales Table, Receipts & WhatsApp Share
    │   ├── inventory.js       # Product Catalog, Restocks & Adjustment Audit Logs
    │   ├── invoices.js        # Invoice Builder, Tax Calculation & Print View
    │   ├── customers.js       # Customer CRM & WhatsApp Debt Reminder Generator
    │   ├── ai-advisor.js      # Contextual AI Advisor & African Retail Logic Engine
    │   └── reports.js         # Chart.js Visualizations & CSV Export Engine
    └── images/
        └── logo.svg           # Brand Logo (SVG)
```

---

## 🛠️ Getting Started & Local Development

No heavy build steps or npm packages are required. The application runs natively in modern browsers.

### Option 1: Direct File Preview
Simply open `index.html` (for the landing page) or `app.html` (for the web application) in any modern web browser (Chrome, Safari, Firefox, Edge).

### Option 2: Local HTTP Server (Recommended)
Run a lightweight web server from the repository root:

```bash
# Using Python 3
python3 -m http.server 8080

# Or using Node.js npx
npx serve .
```

Then visit [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🌐 Free Static Deployment Options

Because Olarvo One is built with clean static standards and client-side offline storage, it can be deployed to any static host in seconds:

- **GitHub Pages:** Push the repository to GitHub, go to `Settings -> Pages`, and select the `main` branch.
- **Vercel:** Run `vercel` or connect your GitHub repository.
- **Netlify:** Drag and drop the `olarvoone` directory into Netlify Drop.
- **Cloudflare Pages:** Connect Git repo with no build command (`Output: /`).

---

## 📄 License & Attribution

Designed and developed by the **Olarvo LTD** team (Lagos, Nigeria).
Licensed under the MIT License.
