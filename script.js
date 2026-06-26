// =========================================================================
// 1. FIREBASE CONFIGURATION, SECURITY GATEWAY & MODIFICATION IMPORTS
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, onSnapshot, query, orderBy, getDocs, deleteDoc, doc, updateDoc
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

// Global data caches for real-time memory rendering (Now tracking document IDs)
let productionsList = [];
let salesList = [];
let expensesList = [];
let casualtiesList = []; 
let reportData = []; 

let currentPage = 1;

// =========================================================================
// 2. LIVE REAL-TIME SYNC ENGINE (CAPTURE DOC IDs FOR EDIT/DELETE CONTROLS)
// =========================================================================
onSnapshot(query(collection(db, "productions"), orderBy("date", "desc")), (snapshot) => {
    productionsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    handleDataUpdate();
});

onSnapshot(query(collection(db, "sales"), orderBy("date", "desc")), (snapshot) => {
    salesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    handleDataUpdate();
});

onSnapshot(query(collection(db, "expenses"), orderBy("date", "desc")), (snapshot) => {
    expensesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    handleDataUpdate();
});

onSnapshot(query(collection(db, "casualties"), orderBy("date", "desc")), (snapshot) => {
    casualtiesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
// 3. CORE ANALYTICS ENGINE & CHART INSTANTIATOR (UPDATED FOR DEBT TRACKING)
// =========================================================================
function calculateAndPopulateDashboard() {
    // Base macro summary calculations
    const totalBlocks = productionsList.length > 0 ? productionsList.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
    const totalExpenses = expensesList.length > 0 ? expensesList.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
    
    // Split total sales volume vs cash actually collected in hand
    const totalSalesRevenueReceived = salesList.filter(s => s.status !== "Unpaid").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalUnpaidCredit = salesList.filter(s => s.status === "Unpaid").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    
    const startingCapital = parseFloat(localStorage.getItem('startingCapital')) || 0;
    
    // Core accounting split: Physical cash balance in hand skips unpaid sales invoices
    const netCashBalanceLeft = startingCapital + totalSalesRevenueReceived - totalExpenses;

    const today = new Date();
    const oneWeekAgo = new Date(); oneWeekAgo.setDate(today.getDate() - 7);
    const oneMonthAgo = new Date(); oneMonthAgo.setDate(today.getDate() - 30);

    const profitMargins = {
        "Solid 5 inches": 2.00,
        "Hollow 5 inches": 2.40,
        "Solid 6 inches": 1.50
    };

    let totalSalesProfit = 0;
    let weeklyProfit = 0;
    let monthlyProfit = 0;

    salesList.forEach(s => {
        if (!s.type || !s.quantity) return;
        
        const profitPerBlock = profitMargins[s.type] || 0;
        const profitOnThisSale = Number(s.quantity) * profitPerBlock;
        
        totalSalesProfit += profitOnThisSale;

        if (s.date) {
            const logDate = new Date(s.date);
            if (logDate >= oneWeekAgo && logDate <= today) weeklyProfit += profitOnThisSale;
            if (logDate >= oneMonthAgo && logDate <= today) monthlyProfit += profitOnThisSale;
        }
    });

    // Display basic counters
    if (document.getElementById("productionTotal")) document.getElementById("productionTotal").innerText = `${totalBlocks.toLocaleString()} Blocks`;
    if (document.getElementById("expensesTotal")) document.getElementById("expensesTotal").innerText = `GH₵ ${totalExpenses.toFixed(2)}`;
    
    if (document.getElementById("salesTotal")) {
        document.getElementById("salesTotal").innerText = `GH₵ ${totalSalesRevenueReceived.toFixed(2)}`;
    }
    if (document.getElementById("unpaidCreditTotal")) {
        document.getElementById("unpaidCreditTotal").innerText = `GH₵ ${totalUnpaidCredit.toFixed(2)}`;
    }
    
    if (document.getElementById("salesProfitTotal")) {
        document.getElementById("salesProfitTotal").innerText = `GH₵ ${totalSalesProfit.toFixed(2)}`;
        document.getElementById("salesProfitTotal").style.color = totalSalesProfit <= 0 ? "#dc2626" : "#16a34a";
    }
    if (document.getElementById("weeklyProfitTotal")) {
        document.getElementById("weeklyProfitTotal").innerText = `GH₵ ${weeklyProfit.toFixed(2)}`;
        document.getElementById("weeklyProfitTotal").style.color = weeklyProfit < 0 ? "#dc2626" : "#16a34a";
    }
    if (document.getElementById("monthlyProfitTotal")) {
        document.getElementById("monthlyProfitTotal").innerText = `GH₵ ${monthlyProfit.toFixed(2)}`;
        document.getElementById("monthlyProfitTotal").style.color = monthlyProfit < 0 ? "#dc2626" : "#16a34a";
    }
    if (document.getElementById("profitTotal")) {
        document.getElementById("profitTotal").innerText = `GH₵ ${netCashBalanceLeft.toFixed(2)}`;
        document.getElementById("profitTotal").style.color = netCashBalanceLeft < 0 ? "#dc2626" : "#2563eb";
    }

    // Yard Inventory Deductions (Still deducts blocks out of inventory automatically regardless of pay status)
    const stockTableBody = document.getElementById("stockTableBody");
    if (stockTableBody) {
        stockTableBody.innerHTML = "";
        const standardYardProducts = ["Hollow 5 inches", "Solid 5 inches", "Solid 6 inches"];

        standardYardProducts.forEach(blockType => {
            const producedForType = productionsList.filter(p => p.type === blockType).reduce((sum, item) => sum + Number(item.amount || 0), 0);
            const soldForType = salesList.filter(s => s.type === blockType).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            
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

    // Cement Inventory Logs
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

    // Chart Time-Series Setup
    const last7DaysStrings = []; const last7DaysLabels = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        last7DaysStrings.push(`${yyyy}-${mm}-${dd}`);
        last7DaysLabels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }

    const dailySalesData = last7DaysStrings.map(dateStr => {
        return salesList.filter(s => s.date === dateStr && s.status !== "Unpaid").reduce((sum, s) => sum + Number(s.amount || 0), 0);
    });
    const dailyExpensesData = last7DaysStrings.map(dateStr => {
        return expensesList.filter(e => e.date === dateStr).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    });

    const salesCtx = document.getElementById('salesChart');
    if (salesCtx) {
        if (window.mySalesChartInstance) window.mySalesChartInstance.destroy();
        window.mySalesChartInstance = new Chart(salesCtx, {
            type: 'bar',
            data: {
                labels: last7DaysLabels,
                datasets: [{ label: 'Collected Revenue (GH₵)', data: dailySalesData, backgroundColor: '#16a34a', borderColor: '#15803d', borderWidth: 1 }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }

    const expensesCtx = document.getElementById('expensesChart');
    if (expensesCtx) {
        if (window.myExpensesChartInstance) window.myExpensesChartInstance.destroy();
        window.myExpensesChartInstance = new Chart(expensesCtx, {
            type: 'line',
            data: {
                labels: last7DaysLabels,
                datasets: [{ label: 'Operational Spend (GH₵)', data: dailyExpensesData, backgroundColor: 'rgba(220, 38, 38, 0.1)', borderColor: '#dc2626', borderWidth: 2, tension: 0.15, fill: true }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }

    // Recent Activity Feed
    const tableBody = document.querySelector("#recentActivitiesTable tbody");
    if (tableBody) {
        tableBody.innerHTML = "";
        const combinedActivities = [
            ...productionsList.map(p => ({ date: p.date, activity: `Produced ${p.amount} x ${p.type}`, amount: "-" })),
            ...salesList.map(s => ({ date: s.date, activity: `Sale to ${s.customer} (${s.quantity} x ${s.type}) ${s.status === 'Unpaid' ? '🔴 [CREDIT]' : '🟢'}`, amount: `GH₵ ${s.amount}` })),
            ...expensesList.map(e => ({ date: e.date, activity: `Expense: [${e.type}] ${e.description}`, amount: `GH₵ ${e.amount}` })),
            ...casualtiesList.map(c => ({ date: c.date, activity: `💥 Damage: ${c.quantity} x ${c.type}`, amount: "-" }))
        ];

        if (combinedActivities.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:15px; color:#888;">No entries found.</td></tr>`;
        } else {
            combinedActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
            combinedActivities.slice(0, 15).forEach(act => {
                tableBody.innerHTML += `<tr><td>${act.date}</td><td>${act.activity}</td><td>${act.amount}</td></tr>`;
            });
        }
    }
}

// =========================================================================
// 4. SUB-PAGE TABLES POPULATOR
// =========================================================================
function populateCasualtiesSpreadsheetTable() {
    const tbody = document.getElementById("casualtiesTableBody"); if (!tbody) return; tbody.innerHTML = "";
    if (casualtiesList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#6b7280;">No data logged.</td></tr>`; return;
    }
    casualtiesList.forEach(item => {
        tbody.innerHTML += `<tr><td>${item.date}</td><td><b>${item.type}</b></td><td>${item.reason}</td><td>- ${Number(item.quantity).toLocaleString()} pcs</td></tr>`;
    });
}

function populateExpensesSpreadsheetTable() {
    const tableBody = document.getElementById("expensesTableBody"); if (!tableBody) return; tableBody.innerHTML = "";
    let totalSpent = 0;
    const totalSalesRevenueReceived = salesList.filter(s => s.status !== "Unpaid").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const startingCapital = parseFloat(localStorage.getItem('startingCapital')) || 0;

    expensesList.forEach(expense => {
        totalSpent += Number(expense.amount || 0);
        tableBody.innerHTML += `<tr><td>${expense.date}</td><td>${expense.type}</td><td>${expense.description}</td><td>${expense.paymentMethod || 'Cash'}</td><td>GH₵ ${Number(expense.amount).toFixed(2)}</td></tr>`;
    });

    if (document.getElementById("tableExpensesTotal")) document.getElementById("tableExpensesTotal").innerText = `GH₵ ${totalSpent.toFixed(2)}`;
    if (document.getElementById("tableNetBalanceTotal")) document.getElementById("tableNetBalanceTotal").innerText = `GH₵ ${(startingCapital + totalSalesRevenueReceived - totalSpent).toFixed(2)}`;
}

// =========================================================================
// 5. GLOBAL AUDIT REPORTE & LIVE RECORD MODIFICATION LINKS
// =========================================================================
function buildCombinedReportData() {
    reportData = [
        ...productionsList.map(p => ({
            id: p.id, date: p.date, rawType: "production", typeDisplay: "🏭 Production",
            details: `${p.amount} blocks (${p.type || 'Standard'}). Bags used: ${p.cementBags || 0}. ${p.remarks || ''}`, amountDisplay: "-", numericAmount: 0
        })),
        ...salesList.map(s => ({
            id: s.id, date: s.date, rawType: "sales", typeDisplay: s.status === "Unpaid" ? "🔴 Sale [UNPAID]" : "💰 Sale [PAID]",
            details: `Customer: ${s.customer} | ${s.quantity} x ${s.type} @ GH₵ ${s.unitPrice}`, amountDisplay: `GH₵ ${Number(s.amount).toFixed(2)}`, numericAmount: Number(s.amount || 0)
        })),
        ...expensesList.map(e => ({
            id: e.id, date: e.date, rawType: "expenses", typeDisplay: "📉 Expense",
            details: `[${e.type}] ${e.description}`, amountDisplay: `GH₵ ${Number(e.amount).toFixed(2)}`, numericAmount: Number(e.amount || 0)
        })),
        ...casualtiesList.map(c => ({
            id: c.id, date: c.date, rawType: "casualties", typeDisplay: "💥 Casualty Log",
            details: `Damaged Stock: ${c.quantity} x ${c.type} | Reason: ${c.reason}`, amountDisplay: "-", numericAmount: 0
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
    if (typeFilter !== "all" && typeFilter !== "activities") filtered = filtered.filter(item => item.rawType === typeFilter);
    if (dateFrom) filtered = filtered.filter(item => item.date >= dateFrom);
    if (dateTo) filtered = filtered.filter(item => item.date <= dateTo);
    if (searchQuery) filtered = filtered.filter(item => item.details.toLowerCase().includes(searchQuery));

    const totalItems = filtered.length; const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const pageData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const tbody = document.getElementById("reportsBody");
    if (tbody) {
        tbody.innerHTML = "";
        pageData.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.date}</td>
                    <td><b>${item.typeDisplay}</b></td>
                    <td>${item.details}</td>
                    <td>${item.amountDisplay}</td>
                    <td>
                        <button onclick="window.loadRecordToForm('${item.rawType}', '${item.id}')" style="background:#ef444400; border:none; color:#2563eb; cursor:pointer; font-weight:bold; margin-right:8px;">✏️ Edit</button>
                        <button onclick="window.deleteRecord('${item.rawType}', '${item.id}')" style="background:#ef444400; border:none; color:#dc2626; cursor:pointer; font-weight:bold;">❌ Del</button>
                    </td>
                </tr>`;
        });
    }
    if (document.getElementById("pageInfo")) document.getElementById("pageInfo").innerText = `Page ${currentPage} of ${totalPages} (${totalItems} items)`;
}

// =========================================================================
// 6. DYNAMIC EDIT LOADER & DELETE ENGINE INTERFACES (ATTACHED GLOBALLY)
// =========================================================================
window.deleteRecord = async function(collectionName, docId) {
    if (!confirm("⚠️ Permanent action! Delete this record from data metrics?")) return;
    try {
        await deleteDoc(doc(db, collectionName, docId));
        alert("🗑️ Record cleared from database successfully.");
    } catch (err) { alert("Delete Error: " + err.message); }
};

window.loadRecordToForm = function(collectionName, docId) {
    let item;
    if (collectionName === "sales") item = salesList.find(x => x.id === docId);
    if (collectionName === "productions") item = productionsList.find(x => x.id === docId);

    if (!item) return alert("Please find your form inside its dedicated view tab sheet.");
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (collectionName === "sales") {
        document.getElementById("saleDate").value = item.date || "";
        document.getElementById("customerName").value = item.customer || "";
        document.getElementById("blockType").value = item.type || "Solid 5 inches";
        document.getElementById("quantity").value = item.quantity || "";
        document.getElementById("price").value = item.unitPrice || "";
        if (document.getElementById("paymentStatus")) document.getElementById("paymentStatus").value = item.status || "Paid";
        document.getElementById("total").value = (Number(item.quantity) * Number(item.unitPrice)).toFixed(2);
        
        const btn = document.querySelector("#salesForm button");
        btn.innerText = "💾 Save Sales Changes"; btn.style.background = "#2563eb";
        btn.dataset.editId = docId;
    }
    if (collectionName === "productions") {
        document.getElementById("productionDate").value = item.date || "";
        document.getElementById("blockType").value = item.type || "Solid 5 inches";
        document.getElementById("quantityProduced").value = item.amount || "";
        document.getElementById("cementBagsUsed").value = item.cementBags || "";
        document.getElementById("remarks").value = item.remarks || "";
        
        const btn = document.querySelector("#productionForm button");
        btn.innerText = "💾 Save Production Changes"; btn.style.background = "#2563eb";
        btn.dataset.editId = docId;
    }
};

// =========================================================================
// 7. LIFE CYCLE FORM EVENTS & WINDOW LISTENERS
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Opening capital management listeners
    const capitalInput = document.getElementById('startingCapital');
    const saveCapitalBtn = document.getElementById('saveCapitalBtn');
    if (capitalInput && localStorage.getItem('startingCapital')) capitalInput.value = localStorage.getItem('startingCapital');
    if (saveCapitalBtn) {
        saveCapitalBtn.addEventListener('click', () => {
            localStorage.setItem('startingCapital', parseFloat(capitalInput.value) || 0);
            alert('🚀 Opening Capital Balance updated!'); handleDataUpdate();
        });
    }

    // Dynamic Multipliers Interface
    const qtyInput = document.getElementById("quantity"); const priceInput = document.getElementById("price");
    if (qtyInput && priceInput) {
        const updateT = () => { document.getElementById("total").value = ((Number(qtyInput.value) || 0) * (Number(priceInput.value) || 0)).toFixed(2); };
        qtyInput.addEventListener("input", updateT); priceInput.addEventListener("input", updateT);
    }

    // Pagination Click Engines
    if (document.getElementById("applyFilters")) document.getElementById("applyFilters").addEventListener("click", () => { currentPage = 1; applyReportFilters(); });
    if (document.getElementById("prevPage")) document.getElementById("prevPage").addEventListener("click", () => { if (currentPage > 1) { currentPage--; applyReportFilters(); } });
    if (document.getElementById("nextPage")) document.getElementById("nextPage").addEventListener("click", () => {
        if (currentPage < Math.ceil(reportData.length / (Number(document.getElementById("pageSize").value) || 50))) { currentPage++; applyReportFilters(); }
    });

    // Production log form submission (ADAPTED FOR EDIT SUPPORT OVERWRITING)
    const prodForm = document.getElementById("productionForm");
    if (prodForm) {
        prodForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = prodForm.querySelector("button"); const editId = btn.dataset.editId; btn.disabled = true;
            try {
                const payload = {
                    date: document.getElementById("productionDate").value,
                    type: document.getElementById("blockType").value,
                    amount: Number(document.getElementById("quantityProduced").value),
                    cementBags: Number(document.getElementById("cementBagsUsed").value),
                    casualties: document.getElementById("quantityCasualties") ? Number(document.getElementById("quantityCasualties").value) : 0,
                    remarks: document.getElementById("remarks").value
                };
                if (editId) {
                    await updateDoc(doc(db, "productions", editId), payload);
                    alert("🏭 Production log entry adjusted successfully!");
                    btn.innerText = "Submit Production"; delete btn.dataset.editId;
                } else {
                    await addDoc(collection(db, "productions"), payload);
                    alert("🏭 Production log entry submitted!");
                }
                prodForm.reset();
            } catch (err) { alert("Save Error: " + err.message); }
            btn.disabled = false;
        });
    }

    // Invoice sales form submission (ADAPTED FOR DEBT TAGGING + EDIT OVERWRITING)
    const salesForm = document.getElementById("salesForm");
    if (salesForm) {
        salesForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = salesForm.querySelector("button"); const editId = btn.dataset.editId; btn.disabled = true;
            try {
                const qty = Number(document.getElementById("quantity").value);
                const price = Number(document.getElementById("price").value);
                const statusElement = document.getElementById("paymentStatus");
                const currentStatus = statusElement ? statusElement.value : "Paid";

                const payload = {
                    date: document.getElementById("saleDate").value,
                    customer: document.getElementById("customerName").value,
                    type: document.getElementById("blockType").value, 
                    quantity: qty,
                    unitPrice: price,
                    amount: qty * price,
                    status: currentStatus
                };

                if (editId) {
                    await updateDoc(doc(db, "sales", editId), payload);
                    alert("🔄 Invoice updated perfectly!");
                    btn.innerText = "Submit Sale"; delete btn.dataset.editId;
                } else {
                    await addDoc(collection(db, "sales"), payload);
                    alert(`💰 Sale added successfully as [${currentStatus.toUpperCase()}]!`);
                }
                salesForm.reset();
            } catch (err) { alert("Save Error: " + err.message); }
            btn.disabled = false;
        });
    }

    // Operational expenses form submission handler
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
