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

// Global lists to store cloud data locally for filtering
let productionsList = [];
let salesList = [];
let expensesList = [];
let reportData = []; // Combined formatted records for the reports page

let currentPage = 1;

// =========================================================================
// 2. LIVE REAL-TIME SYNC (DASHBOARD & REPORTS INITIALIZATION)
// =========================================================================
// Trigger real-time streaming listeners
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

// Runs whenever database updates to refresh whichever page is open
function handleDataUpdate() {
    // If user is on Dashboard page
    if (document.getElementById("productionTotal") || document.querySelector("#recentActivitiesTable tbody") || document.getElementById("stockTableBody")) {
        calculateAndPopulateDashboard();
    }
    // If user is on Reports page
    if (document.getElementById("reportsTable")) {
        buildCombinedReportData();
        applyReportFilters();
    }
}

function calculateAndPopulateDashboard() {
    // 1. Calculate base aggregate production, sales, and operational expenses
    const totalBlocks = productionsList.length > 0 ? productionsList.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
    const totalSales = salesList.length > 0 ? salesList.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
    const totalExpenses = expensesList.length > 0 ? expensesList.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
    
    // 2. FIXED MARGIN PROFIT ENGINE: Calculate true net profit based on product categories sold
    let totalProfit = 0;
    
    salesList.forEach(sale => {
        const quantity = Number(sale.quantity || 0);
        const blockType = sale.type;

        if (blockType === "Solid 6 inches") {
            totalProfit += (quantity * 1.50);
        } else if (blockType === "Solid 5 inches") {
            totalProfit += (quantity * 2.00);
        } else if (blockType === "Hollow 5 inches") {
            totalProfit += (quantity * 2.40);
        }
    });

    // 3. Populate metrics elements smoothly onto the Dashboard UI
    if (document.getElementById("productionTotal")) document.getElementById("productionTotal").innerText = `${totalBlocks} Blocks`;
    if (document.getElementById("salesTotal")) document.getElementById("salesTotal").innerText = `GH₵ ${totalSales.toFixed(2)}`;
    if (document.getElementById("expensesTotal")) document.getElementById("expensesTotal").innerText = `GH₵ ${totalExpenses.toFixed(2)}`;
    if (document.getElementById("profitTotal")) document.getElementById("profitTotal").innerText = `GH₵ ${totalProfit.toFixed(2)}`;

    // =========================================================================
    // FIXED METRIC STOCK INVENTORY CALCULATION ENGINE (WITH CASUALTIES)
    // =========================================================================
    const stockTableBody = document.getElementById("stockTableBody");
    if (stockTableBody) {
        stockTableBody.innerHTML = ""; // Clear old loops
        
        const standardYardProducts = [
            "Hollow 5 inches",
            "Solid 5 inches",
            "Solid 6 inches"
        ];

        standardYardProducts.forEach(blockType => {
            const producedForType = productionsList.length > 0 ? productionsList
                .filter(p => p.type === blockType)
                .reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;

            const soldForType = salesList.length > 0 ? salesList
                .filter(s => s.type === blockType)
                .reduce((sum, item) => sum + Number(item.quantity || 0), 0) : 0;

            // Track casualties / broken counts per type
            const casualtiesForType = productionsList.length > 0 ? productionsList
                .filter(p => p.type === blockType)
                .reduce((sum, item) => sum + Number(item.casualties || 0), 0) : 0;

            // Balanced Formula: Stock = Produced - Sold - Casualties
            const currentStock = producedForType - soldForType - casualtiesForType;
            const stockColor = currentStock < 0 ? "#dc2626" : (currentStock < 100 ? "#d97706" : "#16a34a");

            stockTableBody.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px;"><b>${blockType}</b></td>
                    <td style="padding: 12px; color: #2563eb; font-weight: 500;">+ ${producedForType.toLocaleString()} pcs</td>
                    <td style="padding: 12px; color: #dc2626; font-weight: 500;">- ${soldForType.toLocaleString()} pcs</td>
                    <td style="padding: 12px; color: #d97706; font-weight: 500;">- ${casualtiesForType.toLocaleString()} pcs</td>
                    <td style="padding: 12px; color: ${stockColor}; font-weight: bold;">${currentStock.toLocaleString()} left</td>
                </tr>
            `;
        });
    }

    // =========================================================================
    // LIVE CEMENT STOCK CALCULATION ENGINE
    // =========================================================================
    const cementTableBody = document.getElementById("cementTableBody");
    if (cementTableBody) {
        cementTableBody.innerHTML = "";

        // Sum total bags used in factory batches
        const totalBagsUsed = productionsList.length > 0 ? productionsList
            .reduce((sum, item) => sum + Number(item.cementBags || 0), 0) : 0;

        // Sum total bags purchased via expenses page
        const totalBagsPurchased = expensesList.length > 0 ? expensesList
            .filter(e => e.type === "Cement" || (e.description && e.description.toLowerCase().includes("cement")))
            .reduce((sum, item) => sum + Number(item.bagsPurchased || item.quantity || 0), 0) : 0;

        const cementLeft = totalBagsPurchased - totalBagsUsed;
        const cementColor = cementLeft < 10 ? "#dc2626" : (cementLeft < 40 ? "#d97706" : "#16a34a");

        cementTableBody.innerHTML = `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px;"><b>Standard Cement Bags</b></td>
                <td style="padding: 12px; color: #16a34a; font-weight: 500;">+ ${totalBagsPurchased.toLocaleString()} bags</td>
                <td style="padding: 12px; color: #dc2626; font-weight: 500;">- ${totalBagsUsed.toLocaleString()} bags</td>
                <td style="padding: 12px; color: ${cementColor}; font-weight: bold;">${cementLeft.toLocaleString()} bags left</td>
            </tr>
        `;
    }

    // Recent Activities population
    const tableBody = document.querySelector("#recentActivitiesTable tbody");
    if (tableBody) {
        tableBody.innerHTML = "";
        
        const combinedActivities = [
            ...productionsList.map(p => ({ date: p.date, activity: `Produced ${p.amount} x ${p.type} (Bags Used: ${p.cementBags || 0})`, amount: "-" })),
            ...salesList.map(s => ({ date: s.date, activity: `Sale to ${s.customer} (${s.quantity} x ${s.type})`, amount: `GH₵ ${s.amount}` })),
            ...expensesList.map(e => ({ date: e.date, activity: `Expense: [${e.type}] ${e.description}`, amount: `GH₵ ${e.amount}` }))
        ];

        if (combinedActivities.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:15px; color:#888;">No historical activities logged yet. Database clean.</td></tr>`;
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
// 3. REPORTS GENERATION & FILTERING ENGINE
// =========================================================================
function buildCombinedReportData() {
    reportData = [
        ...productionsList.map(p => ({
            date: p.date,
            rawType: "production",
            typeDisplay: "🏭 Production",
            details: `${p.amount} blocks (${p.type || 'Standard'}). Bags used: ${p.cementBags || 0}. Breakage: ${p.casualties || 0}. ${p.remarks || ''}`,
            amountDisplay: "-",
            numericAmount: 0
        })),
        ...salesList.map(s => ({
            date: s.date,
            rawType: "sales",
            typeDisplay: "💰 Sale",
            details: `Customer: ${s.customer} | ${s.quantity} x ${s.type} @ GH₵ ${s.unitPrice}`,
            amountDisplay: `GH₵ ${Number(s.amount).toFixed(2)}`,
            numericAmount: Number(s.amount || 0)
        })),
        ...expensesList.map(e => ({
            date: e.date,
            rawType: "expenses",
            typeDisplay: "📉 Expense",
            details: `[${e.type}] ${e.description} (${e.paymentMethod || 'Cash'})`,
            amountDisplay: `GH₵ ${Number(e.amount).toFixed(2)}`,
            numericAmount: Number(e.amount || 0)
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

    if (searchQuery) {
        filtered = filtered.filter(item => item.details.toLowerCase().includes(searchQuery));
    }

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const pageData = filtered.slice(startIdx, endIdx);

    const tbody = document.getElementById("reportsBody");
    if (tbody) {
        tbody.innerHTML = "";
        if (pageData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#6b7280;">No data found matching current criteria.</td></tr>`;
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

    const pageInfo = document.getElementById("pageInfo");
    if (pageInfo) {
        pageInfo.innerText = `Page ${currentPage} of ${totalPages} (${totalItems} total entries)`;
    }
}

// =========================================================================
// 4. FORMS SUBMISSIONS & EVENT LISTENERS
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const qtyInput = document.getElementById("quantity");
    const priceInput = document.getElementById("price");
    const totalInput = document.getElementById("total");

    if (qtyInput && priceInput && totalInput) {
        const updateTotal = () => {
            const qty = Number(qtyInput.value) || 0;
            const price = Number(priceInput.value) || 0;
            totalInput.value = (qty * price).toFixed(2);
        };
        qtyInput.addEventListener("input", updateTotal);
        priceInput.addEventListener("input", updateTotal);
    }

    const applyBtn = document.getElementById("applyFilters");
    if (applyBtn) {
        applyBtn.addEventListener("click", () => {
            currentPage = 1;
            applyReportFilters();
        });
    }

    const prevBtn = document.getElementById("prevPage");
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                applyReportFilters();
            }
        });
    }

    const nextBtn = document.getElementById("nextPage");
    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            const pageSize = Number(document.getElementById("pageSize").value) || 50;
            const totalPages = Math.ceil(reportData.length / pageSize) || 1;
            if (currentPage < totalPages) {
                currentPage++;
                applyReportFilters();
            }
        });
    }

    // =========================================================================
    // SYSTEM SETTINGS DROPDOWN ACCORDION TOGGLE
    // =========================================================================
    const toggleSettingsBtn = document.getElementById("toggleSettingsBtn");
    const settingsPanel = document.getElementById("settingsPanel");
    const dropdownArrow = document.getElementById("dropdownArrow");

    if (toggleSettingsBtn && settingsPanel) {
        toggleSettingsBtn.addEventListener("click", () => {
            if (settingsPanel.style.display === "none") {
                settingsPanel.style.display = "block";
                if (dropdownArrow) dropdownArrow.innerText = "▲";
                toggleSettingsBtn.style.color = "#ffffff";
            } else {
                settingsPanel.style.display = "none";
                if (dropdownArrow) dropdownArrow.innerText = "▼";
                toggleSettingsBtn.style.color = "#9ca3af";
            }
        });
    }

    // =========================================================================
    // SECURE SIDEBAR LOGOUT ACTION HANDLER
    // =========================================================================
    const logoutBtn = document.getElementById("sidebarLogoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                window.location.href = "index.html";
            }).catch((err) => {
                alert("Error logging out: " + err.message);
            });
        });
    }

    // =========================================================================
    // DANGER ZONE: DATABASE DELETION ENGINE
    // =========================================================================
    const resetDbBtn = document.getElementById("resetDbBtn");
    if (resetDbBtn) {
        resetDbBtn.addEventListener("click", async () => {
            const firstWarning = confirm("⚠️ WARNING: You are about to completely wipe the factory database. This will delete all Production logs, Sales sheets, and Expense reports. Proceed?");
            if (!firstWarning) return;

            const finalConfirmation = prompt("To confirm absolute destruction of all records, type 'DELETE' below:");
            if (finalConfirmation !== "DELETE") {
                alert("Wipe canceled. Security phrase incorrect.");
                return;
            }

            resetDbBtn.disabled = true;
            resetDbBtn.innerText = "⏳ Purging Cloud...";

            try {
                const collectionsToClear = ["productions", "sales", "expenses"];
                
                for (const colName of collectionsToClear) {
                    const querySnapshot = await getDocs(collection(db, colName));
                    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
                    await Promise.all(deletePromises);
                }

                alert("🗑️ Database successfully purged! The system has reset back to clean slate settings.");
                window.location.reload();
            } catch (err) {
                alert("Error during system purge: " + err.message);
                resetDbBtn.disabled = false;
                resetDbBtn.innerText = "🗑️ Clear Live Data";
            }
        });
    }

    const prodForm = document.getElementById("productionForm");
    if (prodForm) {
        prodForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = prodForm.querySelector("button");
            btn.disabled = true;
            try {
                // Captures casualties field seamlessly if added to the form layout
                const casualtiesInput = document.getElementById("quantityCasualties");
                const casualtiesValue = casualtiesInput ? Number(casualtiesInput.value) : 0;

                await addDoc(collection(db, "productions"), {
                    date: document.getElementById("productionDate").value,
                    type: document.getElementById("blockType").value,
                    amount: Number(document.getElementById("quantityProduced").value),
                    cementBags: Number(document.getElementById("cementBagsUsed").value),
                    casualties: casualtiesValue, 
                    remarks: document.getElementById("remarks").value
                });
                alert("🏭 Production batch saved to cloud!");
                prodForm.reset();
            } catch (err) { alert("Error saving data: " + err.message); }
            btn.disabled = false;
        });
    }

    const salesForm = document.getElementById("salesForm");
    if (salesForm) {
        salesForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = salesForm.querySelector("button");
            btn.disabled = true;
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
                alert("💰 Sale receipt logged successfully!");
                salesForm.reset();
            } catch (err) { alert("Error saving data: " + err.message); }
            btn.disabled = false;
        });
    }

    const expForm = document.getElementById("expensesForm");
    if (expForm) {
        expForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = expForm.querySelector("button");
            btn.disabled = true;
            try {
                // Checks for bagsPurchased or quantity inputs on your expenses form
                const bagsInput = document.getElementById("bagsPurchased") || document.getElementById("expenseQuantity");
                const bagsValue = bagsInput ? Number(bagsInput.value) : 0;

                await addDoc(collection(db, "expenses"), {
                    date: document.getElementById("expenseDate").value,
                    type: document.getElementById("expenseType").value,
                    description: document.getElementById("description").value,
                    amount: Number(document.getElementById("amount").value),
                    paymentMethod: document.getElementById("paymentType").value,
                    bagsPurchased: bagsValue
                });
                alert("📉 Expense recorded successfully!");
                expForm.reset();
            } catch (err) { alert("Error saving data: " + err.message); }
            btn.disabled = false;
        });
    }
});
