// =========================================================================
// 1. FIREBASE CONFIGURATION (Using standard Web Modules via CDN)
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, onSnapshot, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
    if (document.getElementById("productionTotal") || document.querySelector("#recentActivitiesTable tbody")) {
        calculateAndPopulateDashboard();
    }
    // If user is on Reports page
    if (document.getElementById("reportsTable")) {
        buildCombinedReportData();
        applyReportFilters();
    }
}

function calculateAndPopulateDashboard() {
    const totalBlocks = productionsList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalSales = salesList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalExpenses = expensesList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalProfit = totalSales - totalExpenses;

    if (document.getElementById("productionTotal")) document.getElementById("productionTotal").innerText = `${totalBlocks} Blocks`;
    if (document.getElementById("salesTotal")) document.getElementById("salesTotal").innerText = `GH₵ ${totalSales.toFixed(2)}`;
    if (document.getElementById("expensesTotal")) document.getElementById("expensesTotal").innerText = `GH₵ ${totalExpenses.toFixed(2)}`;
    if (document.getElementById("profitTotal")) document.getElementById("profitTotal").innerText = `GH₵ ${totalProfit.toFixed(2)}`;

    const combinedActivities = [
        ...productionsList.map(p => ({ date: p.date, activity: `Produced ${p.amount} x ${p.type}`, amount: "-" })),
        ...salesList.map(s => ({ date: s.date, activity: `Sale to ${s.customer} (${s.quantity} x ${s.type})`, amount: `GH₵ ${s.amount}` })),
        ...expensesList.map(e => ({ date: e.date, activity: `Expense: [${e.type}] ${e.description}`, amount: `GH₵ ${e.amount}` }))
    ];

    combinedActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tableBody = document.querySelector("#recentActivitiesTable tbody");
    if (tableBody) {
        tableBody.innerHTML = "";
        combinedActivities.slice(0, 15).forEach(act => {
            tableBody.innerHTML += `<tr>
                <td>${act.date}</td>
                <td>${act.activity}</td>
                <td>${act.amount}</td>
            </tr>`;
        });
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
            details: `${p.amount} blocks (${p.type || 'Standard'}). Bags used: ${p.cementBags || 0}. ${p.remarks || ''}`,
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
    
    // Sort all records chronologically by default (Newest First)
    reportData.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function applyReportFilters() {
    const typeFilter = document.getElementById("reportType").value;
    const dateFrom = document.getElementById("dateFrom").value;
    const dateTo = document.getElementById("dateTo").value;
    const searchQuery = document.getElementById("q").value.toLowerCase().trim();
    const pageSize = Number(document.getElementById("pageSize").value) || 50;

    // Filter by Entry Type
    let filtered = reportData;
    if (typeFilter !== "all" && typeFilter !== "activities") {
        filtered = filtered.filter(item => item.rawType === typeFilter);
    }

    // Filter by Date Ranges
    if (dateFrom) {
        filtered = filtered.filter(item => item.date >= dateFrom);
    }
    if (dateTo) {
        filtered = filtered.filter(item => item.date <= dateTo);
    }

    // Filter by Search Query matching text inside details
    if (searchQuery) {
        filtered = filtered.filter(item => item.details.toLowerCase().includes(searchQuery));
    }

    // Paginate results block
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const pageData = filtered.slice(startIdx, endIdx);

    // Render to page table body
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

    // Update Pagination Indicators
    const pageInfo = document.getElementById("pageInfo");
    if (pageInfo) {
        pageInfo.innerText = `Page ${currentPage} of ${totalPages} (${totalItems} total entries)`;
    }
}

// =========================================================================
// 4. FORMS SUBMISSIONS & EVENT LISTENERS
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Interactive sales amount counter
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

    // Reports Interface Buttons Event Bindings
    const applyBtn = document.getElementById("applyFilters");
    if (applyBtn) {
        applyBtn.addEventListener("click", () => {
            currentPage = 1; // Reset to page 1 upon search filter execution
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

    // Entry Submissions Code
    const prodForm = document.getElementById("productionForm");
    if (prodForm) {
        prodForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = prodForm.querySelector("button");
            btn.disabled = true;
            try {
                await addDoc(collection(db, "productions"), {
                    date: document.getElementById("productionDate").value,
                    type: document.getElementById("blockType").value,
                    amount: Number(document.getElementById("quantityProduced").value),
                    cementBags: Number(document.getElementById("cementBagsUsed").value),
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
                await addDoc(collection(db, "expenses"), {
                    date: document.getElementById("expenseDate").value,
                    type: document.getElementById("expenseType").value,
                    description: document.getElementById("description").value,
                    amount: Number(document.getElementById("amount").value),
                    paymentMethod: document.getElementById("paymentType").value
                });
                alert("📉 Expense recorded successfully!");
                expForm.reset();
            } catch (err) { alert("Error saving data: " + err.message); }
            btn.disabled = false;
        });
    }
});
