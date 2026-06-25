// =========================================================================
// 1. FIREBASE CONFIGURATION & SECURITY GATEWAY
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, onSnapshot, query, orderBy, getDocs, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
    getAuth, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBXRkfeV2yfGukkzTxR2SdNF-T1W6c3hcE",
    authDomain: "habib-blocks.firebaseapp.com",
    projectId: "habib-blocks",
    storageBucket: "habib-blocks.firebasestorage.app",
    messagingSenderId: "648682421423",
    appId: "1:648682421423:web:346671280bbeda2c37e85a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Global data caches for real-time memory rendering
let productionsList = [];
let salesList = [];
let expensesList = [];
let casualtiesList = []; 
let reportData = []; 

let currentPage = 1;

// =========================================================================
// 2. LIVE REAL-TIME SYNC ENGINE (AUTO-ROUTING DATABASE UPDATE WATCHERS)
// =========================================================================
onSnapshot(query(collection(db, "productions"), orderBy("date", "desc")), (snapshot) => {
    productionsList = snapshot.docs.map(doc => doc.data());
    handleDataUpdate();
});

onSnapshot(query(collection(db, "sales"), orderBy("date", "desc")), (snapshot) => {
    salesList = snapshot.docs.map(doc => doc.data());
    handleDataUpdate();
});

onSnapshot(query(collection(db, "expenses"), orderBy("date", "desc")), (snapshot) => {
    expensesList = snapshot.docs.map(doc => doc.data());
    handleDataUpdate();
});

onSnapshot(query(collection(db, "casualties"), orderBy("date", "desc")), (snapshot) => {
    casualtiesList = snapshot.docs.map(doc => doc.data());
    handleDataUpdate();
});

function handleDataUpdate() {
    // Dashboard validation layout elements
    if (document.getElementById("productionTotal") || document.getElementById("stockTableBody") || document.getElementById("salesChart")) {
        calculateAndPopulateDashboard();
    }
    // Casualties dedicated log list table view
    if (document.getElementById("casualtiesTableBody")) {
        populateCasualtiesSpreadsheetTable();
    }
    // Expense management spreadsheet view
    if (document.getElementById("expensesTableBody")) {
        populateExpensesSpreadsheetTable();
    }
    // Dynamic structural report sheets
    if (document.getElementById("reportsTable")) {
        buildCombinedReportData();
        applyReportFilters();
    }
}

// =========================================================================
// 3. CORE ANALYTICS ENGINE & CHART INSTANTIATOR
// =========================================================================
function calculateAndPopulateDashboard() {
    // Base macro summary calculations
    const totalBlocks = productionsList.length > 0 ? productionsList.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
    const totalSales = salesList.length > 0 ? salesList.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
    const totalExpenses = expensesList.length > 0 ? expensesList.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
    
    const startingCapital = parseFloat(localStorage.getItem('startingCapital')) || 0;
    const netCashBalanceLeft = startingCapital + totalSales - totalExpenses;

    // Display summary data cleanly 
    if (document.getElementById("productionTotal")) document.getElementById("productionTotal").innerText = `${totalBlocks.toLocaleString()} Blocks`;
    if (document.getElementById("salesTotal")) document.getElementById("salesTotal").innerText = `GH₵ ${totalSales.toFixed(2)}`;
    if (document.getElementById("expensesTotal")) document.getElementById("expensesTotal").innerText = `GH₵ ${totalExpenses.toFixed(2)}`;
    
    if (document.getElementById("profitTotal")) {
        document.getElementById("profitTotal").innerText = `GH₵ ${netCashBalanceLeft.toFixed(2)}`;
        document.getElementById("profitTotal").style.color = netCashBalanceLeft < 0 ? "#dc2626" : "#16a34a";
    }

    // -------------------------------------------------------------------------
    // LIVE YARD STOCK LEVELS GRID CALCULATION
    // -------------------------------------------------------------------------
    const stockTableBody = document.getElementById("stockTableBody");
    if (stockTableBody) {
        stockTableBody.innerHTML = "";
        const standardYardProducts = ["Hollow 5 inches", "Solid 5 inches", "Solid 6 inches"];

        standardYardProducts.forEach(blockType => {
            const producedForType = productionsList.filter(p => p.type === blockType).reduce((sum, item) => sum + Number(item.amount || 0), 0);
            const soldForType = salesList.filter(s => s.type === blockType).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            
            // Unifies legacy production inline damage variables along with separate standalone casualties log sheets
            const legacyCasualties = productionsList.filter(p => p.type === blockType).reduce((sum, item) => sum + Number(item.casualties || 0), 0);
            const explicitCasualties = casualtiesList.filter(c => c.type === blockType).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            const totalCasualties = legacyCasualties + explicitCasualties;

            const currentStock = producedForType - soldForType - totalCasualties;
            const stockColor = currentStock < 0 ? "#dc2626" : (currentStock < 100 ? "#d97706" : "#16a34a");

            stockTableBody.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px;"><b>${blockType}</b></td>
                    <td style="padding: 12px; color: #2563eb; font-weight: 500;">+ ${producedForType.toLocaleString()} pcs</td>
                    <td style="padding: 12px; color: #dc2626; font-weight: 500;">- ${soldForType.toLocaleString()} pcs</td>
                    <td style="padding: 12px; color: #d97706; font-weight: 500;">- ${totalCasualties.toLocaleString()} pcs</td>
                    <td style="padding: 12px; color: ${stockColor}; font-weight: bold;">${currentStock.toLocaleString()} left</td>
                </tr>`;
        });
    }

    // -------------------------------------------------------------------------
    // CEMENT INVENTORY BINDINGS
    // -------------------------------------------------------------------------
    const cementTableBody = document.getElementById("cementTableBody");
    if (cementTableBody) {
        const totalBagsUsed = productionsList.reduce((sum, item) => sum + Number(item.cementBags || 0), 0);
        const totalBagsPurchased = expensesList
            .filter(e => e.type === "Cement" || (e.description && e.description.toLowerCase().includes("cement")))
            .reduce((sum, item) => sum + Number(item.bagsPurchased || item.quantity || 0), 0);

        const cementLeft = totalBagsPurchased - totalBagsUsed;
        const cementColor = cementLeft < 10 ? "#dc2626" : (cementLeft < 40 ? "#d97706" : "#16a34a");

        cementTableBody.innerHTML = `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px;"><b>Standard Cement Bags</b></td>
                <td style="padding: 12px; color: #16a34a; font-weight: 500;">+ ${totalBagsPurchased.toLocaleString()} bags</td>
                <td style="padding: 12px; color: #dc2626; font-weight: 500;">- ${totalBagsUsed.toLocaleString()} bags</td>
                <td style="padding: 12px; color: ${cementColor}; font-weight: bold;">${cementLeft.toLocaleString()} bags left</td>
            </tr>`;
    }

    // -------------------------------------------------------------------------
    // ROLLING 7-DAY TIME-SERIES CHART DATA MATRIX GENERATION
    // -------------------------------------------------------------------------
    const last7DaysStrings = [];
    const last7DaysLabels = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        
        last7DaysStrings.push(`${yyyy}-${mm}-${dd}`); // Pure text keys match database standard
        last7DaysLabels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }

    const dailySalesData = last7DaysStrings.map(dateStr => {
        return salesList.filter(s => s.date === dateStr).reduce((sum, s) => sum + Number(s.amount || 0), 0);
    });

    const dailyExpensesData = last7DaysStrings.map(dateStr => {
        return expensesList.filter(e => e.date === dateStr).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    });

    // Sales Chart Binding
    const salesCtx = document.getElementById('salesChart');
    if (salesCtx) {
        if (window.mySalesChartInstance) window.mySalesChartInstance.destroy();
        window.mySalesChartInstance = new Chart(salesCtx, {
            type: 'bar',
            data: {
                labels: last7DaysLabels,
                datasets: [{
                    label: 'Sales Revenue (GH₵)',
                    data: dailySalesData,
                    backgroundColor: '#16a34a',
                    borderColor: '#15803d',
                    borderWidth: 1
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }

    // Expenses Chart Binding
    const expensesCtx = document.getElementById('expensesChart');
    if (expensesCtx) {
        if (window.myExpensesChartInstance) window.myExpensesChartInstance.destroy();
        window.myExpensesChartInstance = new Chart(expensesCtx, {
            type: 'line',
            data: {
                labels: last7DaysLabels,
                datasets: [{
                    label: 'Operational Spend (GH₵)',
                    data: dailyExpensesData,
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    borderColor: '#dc2626',
                    borderWidth: 2,
                    tension: 0.15,
                    fill: true
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }

    // -------------------------------------------------------------------------
    // COMBINED RECENT REAL-TIME ACTIVITY LOGGER
    // -------------------------------------------------------------------------
    const tableBody = document.querySelector("#recentActivitiesTable tbody");
    if (tableBody) {
        tableBody.innerHTML = "";
        const combinedActivities = [
            ...productionsList.map(p => ({ date: p.date, activity: `Produced ${p.amount} x ${p.type}`, amount: "-" })),
            ...salesList.map(s => ({ date: s.date, activity: `Sale to ${s.customer} (${s.quantity} x ${s.type})`, amount: `GH₵ ${s.amount}` })),
            ...expensesList.map(e => ({ date: e.date, activity: `Expense: [${e.type}] ${e.description}`, amount: `GH₵ ${e.amount}` })),
            ...casualtiesList.map(c => ({ date: c.date, activity: `💥 Damage: ${c.quantity} x ${c.type} (${c.reason})`, amount: "-" }))
        ];

        if (combinedActivities.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:15px; color:#888;">No historical data entries logged.</td></tr>`;
        } else {
            combinedActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
            combinedActivities.slice(0, 15).forEach(act => {
                tableBody.innerHTML += `<tr>
                    <td style="padding: 12px;">${act.date}</td>
                    <td style="padding: 12px;">${act.activity}</td>
                    <td style="padding: 12px;">${act.amount}</td>
                </tr>`;
            });
        }
    }
}

// =========================================================================
// 4. SUB-PAGE SPREADSHEET BUILDERS
// =========================================================================
function populateCasualtiesSpreadsheetTable() {
    const tbody = document.getElementById("casualtiesTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (casualtiesList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#6b7280;">No breakage logs recorded yet.</td></tr>`;
        return;
    }

    casualtiesList.forEach(item => {
        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px; color: #1e293b;">${item.date}</td>
                <td style="padding: 12px; font-weight: 600;">${item.type}</td>
                <td style="padding: 12px; color: #475569;"><span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${item.reason}</span></td>
                <td style="padding: 12px; font-weight: bold; color: #b45309;">- ${Number(item.quantity).toLocaleString()} pcs</td>
            </tr>`;
    });
}

function populateExpensesSpreadsheetTable() {
    const tableBody = document.getElementById("expensesTableBody");
    const totalFooterDisplay = document.getElementById("tableExpensesTotal");
    const netBalanceDisplay = document.getElementById("tableNetBalanceTotal");
    if (!tableBody) return;
    
    tableBody.innerHTML = "";
    let totalAccumulatedSpent = 0;

    const totalSalesRevenue = salesList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const startingCapital = parseFloat(localStorage.getItem('startingCapital')) || 0;

    if (expensesList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#6b7280;">No structural operational expenses found.</td></tr>`;
        if (totalFooterDisplay) totalFooterDisplay.innerText = "GH₵ 0.00";
        if (netBalanceDisplay) netBalanceDisplay.innerText = `GH₵ ${(startingCapital + totalSalesRevenue).toFixed(2)}`;
        return;
    }

    expensesList.forEach(expense => {
        const numericAmount = Number(expense.amount || 0);
        totalAccumulatedSpent += numericAmount;

        tableBody.innerHTML += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px;">${expense.date}</td>
                <td style="padding: 12px; color: #1e40af; font-weight: 600;">${expense.type}</td>
                <td style="padding: 12px; color: #475569;">${expense.description}</td>
                <td style="padding: 12px;"><span style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 13px;">${expense.paymentMethod || 'Cash'}</span></td>
                <td style="padding: 12px; font-weight: bold; color: #dc2626;">GH₵ ${numericAmount.toFixed(2)}</td>
            </tr>`;
    });

    const netBalanceLeft = startingCapital + totalSalesRevenue - totalAccumulatedSpent;
    if (totalFooterDisplay) totalFooterDisplay.innerText = `GH₵ ${totalAccumulatedSpent.toFixed(2)}`;
    if (netBalanceDisplay) {
        netBalanceDisplay.innerText = `GH₵ ${netBalanceLeft.toFixed(2)}`;
        netBalanceDisplay.style.color = netBalanceLeft < 0 ? "#dc2626" : "#16a34a";
    }
}

// =========================================================================
// 5. GLOBAL AUDIT REPORT FILTERS GENERATOR
// =========================================================================
function buildCombinedReportData() {
    reportData = [
        ...productionsList.map(p => ({
            date: p.date, rawType: "production", typeDisplay: "🏭 Production",
            details: `${p.amount} blocks (${p.type || 'Standard'}). Bags used: ${p.cementBags || 0}. ${p.remarks || ''}`,
            amountDisplay: "-", numericAmount: 0
        })),
        ...salesList.map(s => ({
            date: s.date, rawType: "sales", typeDisplay: "💰 Sale",
            details: `Customer: ${s.customer} | ${s.quantity} x ${s.type} @ GH₵ ${s.unitPrice}`,
            amountDisplay: `GH₵ ${Number(s.amount).toFixed(2)}`, numericAmount: Number(s.amount || 0)
        })),
        ...expensesList.map(e => ({
            date: e.date, rawType: "expenses", typeDisplay: "📉 Expense",
            details: `[${e.type}] ${e.description} (${e.paymentMethod || 'Cash'})`,
            amountDisplay: `GH₵ ${Number(e.amount).toFixed(2)}`, numericAmount: Number(e.amount || 0)
        })),
        ...casualtiesList.map(c => ({
            date: c.date, rawType: "casualties", typeDisplay: "💥 Casualty Log",
            details: `Damaged/Broken Stock: ${c.quantity} x ${c.type} | Reason: ${c.reason}`,
            amountDisplay: "-", numericAmount: 0
        }))
    ];
    reportData.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function applyReportFilters() {
    const typeFilter = document.getElementById("reportType").value;
    const dateFrom = document.getElementById("dateFrom").value;
    const dateTo = document.getElementById("dateTo").value;
    const searchQuery = document.getElementById("q").value.toLowerCase().trim();
    const pageSize = Number(document.getElementById("pageSize").value) || 50;

    let filtered = reportData;
    if (typeFilter !== "all" && typeFilter !== "activities") {
        filtered = filtered.filter(item => item.rawType === typeFilter);
    }

    if (dateFrom) filtered = filtered.filter(item => item.date >= dateFrom);
    if (dateTo) filtered = filtered.filter(item => item.date <= dateTo);
    if (searchQuery) filtered = filtered.filter(item => item.details.toLowerCase().includes(searchQuery));

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * pageSize;
    const pageData = filtered.slice(startIdx, startIdx + pageSize);

    const tbody = document.getElementById("reportsBody");
    if (tbody) {
        tbody.innerHTML = "";
        if (pageData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#6b7280;">No data fits selected criteria.</td></tr>`;
        } else {
            pageData.forEach(item => {
                tbody.innerHTML += `<tr>
                    <td>${item.date}</td>
                    <td><b>${item.typeDisplay}</b></td>
                    <td>${item.details}</td>
                    <td>${item.amountDisplay}</td>
                </tr>`;
            });
        }
    }

    if (document.getElementById("pageInfo")) {
        document.getElementById("pageInfo").innerText = `Page ${currentPage} of ${totalPages} (${totalItems} entries total)`;
    }
}

// =========================================================================
// 6. LIFE CYCLE FORM EVENTS & WINDOW LISTENERS
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Synchronize opening capital configuration options
    const capitalInput = document.getElementById('startingCapital');
    const saveCapitalBtn = document.getElementById('saveCapitalBtn');
    
    if (capitalInput && localStorage.getItem('startingCapital')) {
        capitalInput.value = localStorage.getItem('startingCapital');
    }

    if (saveCapitalBtn) {
        saveCapitalBtn.addEventListener('click', () => {
            localStorage.setItem('startingCapital', parseFloat(capitalInput.value) || 0);
            alert('🚀 Opening Capital Balance updated securely!');
            handleDataUpdate();
        });
    }

    // Mathematical dynamic calculations for the Sales form interface multiplier
    const qtyInput = document.getElementById("quantity");
    const priceInput = document.getElementById("price");
    const totalInput = document.getElementById("total");

    if (qtyInput && priceInput && totalInput) {
        const updateTotal = () => {
            totalInput.value = ((Number(qtyInput.value) || 0) * (Number(priceInput.value) || 0)).toFixed(2);
        };
        qtyInput.addEventListener("input", updateTotal);
        priceInput.addEventListener("input", updateTotal);
    }

    // Pagination Listeners
    if (document.getElementById("applyFilters")) {
        document.getElementById("applyFilters").addEventListener("click", () => { currentPage = 1; applyReportFilters(); });
    }
    if (document.getElementById("prevPage")) {
        document.getElementById("prevPage").addEventListener("click", () => { if (currentPage > 1) { currentPage--; applyReportFilters(); } });
    }
    if (document.getElementById("nextPage")) {
        document.getElementById("nextPage").addEventListener("click", () => {
            const pageSize = Number(document.getElementById("pageSize").value) || 50;
            if (currentPage < Math.ceil(reportData.length / pageSize)) { currentPage++; applyReportFilters(); }
        });
    }

    // Drawer settings panel logic toggle UI
    const toggleSettingsBtn = document.getElementById("toggleSettingsBtn");
    const settingsPanel = document.getElementById("settingsPanel");
    if (toggleSettingsBtn && settingsPanel) {
        toggleSettingsBtn.addEventListener("click", () => {
            const isHidden = settingsPanel.style.display === "none";
            settingsPanel.style.display = isHidden ? "block" : "none";
            document.getElementById("dropdownArrow").innerText = isHidden ? "▲" : "▼";
            toggleSettingsBtn.style.color = isHidden ? "#ffffff" : "#9ca3af";
        });
    }

    // Danger Zone database wiper tool
    const resetDbBtn = document.getElementById("resetDbBtn");
    if (resetDbBtn) {
        resetDbBtn.addEventListener("click", async () => {
            if (!confirm("⚠️ Proceeding will completely wipe all production logs, sales records, casualties and expenses. Continue?")) return;
            if (prompt("Type 'DELETE' to confirm storage purge:") !== "DELETE") { alert("Action aborted."); return; }

            resetDbBtn.disabled = true;
            resetDbBtn.innerText = "⏳ Purging Data Sheets...";

            try {
                const targets = ["productions", "sales", "expenses", "casualties"];
                for (const col of targets) {
                    const snap = await getDocs(collection(db, col));
                    await Promise.all(snap.docs.map(doc => deleteDoc(doc.ref)));
                }
                localStorage.removeItem('startingCapital');
                alert("🗑️ Live system data completely cleared.");
                window.location.reload();
            } catch (err) { alert("Error: " + err.message); resetDbBtn.disabled = false; }
        });
    }

    // Production log form submission
    const prodForm = document.getElementById("productionForm");
    if (prodForm) {
        prodForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = prodForm.querySelector("button"); btn.disabled = true;
            try {
                await addDoc(collection(db, "productions"), {
                    date: document.getElementById("productionDate").value,
                    type: document.getElementById("blockType").value,
                    amount: Number(document.getElementById("quantityProduced").value),
                    cementBags: Number(document.getElementById("cementBagsUsed").value),
                    casualties: document.getElementById("quantityCasualties") ? Number(document.getElementById("quantityCasualties").value) : 0,
                    remarks: document.getElementById("remarks").value
                });
                alert("🏭 Production log entry submitted!"); prodForm.reset();
            } catch (err) { alert("Save Error: " + err.message); }
            btn.disabled = false;
        });
    }

    // Standalone Casualty Log submission handler
    const casualtiesForm = document.getElementById("casualtiesForm");
    if (casualtiesForm) {
        casualtiesForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = casualtiesForm.querySelector("button"); btn.disabled = true;
            try {
                await addDoc(collection(db, "casualties"), {
                    date: document.getElementById("casualtyDate").value,
                    type: document.getElementById("casualtyBlockType").value,
                    quantity: Number(document.getElementById("quantityBroken").value),
                    reason: document.getElementById("damageReason").value
                });
                alert("💥 Breakage logged successfully!"); casualtiesForm.reset();
            } catch (err) { alert("Casualty Logging Error: " + err.message); }
            btn.disabled = false;
        });
    }

    // Invoice sales form submission
    const salesForm = document.getElementById("salesForm");
    if (salesForm) {
        salesForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = salesForm.querySelector("button"); btn.disabled = true;
            try {
                const qty = Number(document.getElementById("quantity").value);
                const price = Number(document.getElementById("price").value);
                await addDoc(collection(db, "sales"), {
                    date: document.getElementById("saleDate").value,
                    customer: document.getElementById("customerName").value,
                    type: document.getElementById("blockType").value,
                    quantity: qty,
                    unitPrice: price,
                    amount: qty * price
                });
                alert("💰 Sale invoice added successfully!"); salesForm.reset();
            } catch (err) { alert("Save Error: " + err.message); }
            btn.disabled = false;
        });
    }

    // Business operational spending balance sheet form submission
    const expForm = document.getElementById("expensesForm");
    if (expForm) {
        expForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = expForm.querySelector("button"); btn.disabled = true;
            try {
                const bagsInput = document.getElementById("bagsPurchased") || document.getElementById("expenseQuantity");
                await addDoc(collection(db, "expenses"), {
                    date: document.getElementById("expenseDate").value,
                    type: document.getElementById("expenseType").value,
                    description: document.getElementById("description").value,
                    amount: Number(document.getElementById("amount").value),
                    paymentMethod: document.getElementById("paymentType").value,
                    bagsPurchased: bagsInput ? Number(bagsInput.value) : 0
                });
                alert("📉 Operational expense sheet modified!"); expForm.reset();
            } catch (err) { alert("Save Error: " + err.message); }
            btn.disabled = false;
        });
    }
});
