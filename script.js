// =========================================================================
// 1. FIREBASE CONFIGURATION (Using standard Web Modules via CDN)
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, onSnapshot, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// !!! Paste your actual Firebase configuration keys inside this object !!!
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase & Cloud Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =========================================================================
// 2. LIVE REAL-TIME DASHBOARD DATA SYNC
// =========================================================================
let productionsList = [];
let salesList = [];
let expensesList = [];

if (document.getElementById("productionTotal") || document.querySelector("#recentActivitiesTable tbody")) {
    // Listen for live changes to Production entries
    onSnapshot(query(collection(db, "productions"), orderBy("date", "desc")), (snapshot) => {
        productionsList = snapshot.docs.map(doc => doc.data());
        calculateAndPopulateDashboard();
    });

    // Listen for live changes to Sales entries
    onSnapshot(query(collection(db, "sales"), orderBy("date", "desc")), (snapshot) => {
        salesList = snapshot.docs.map(doc => doc.data());
        calculateAndPopulateDashboard();
    });

    // Listen for live changes to Expenses entries
    onSnapshot(query(collection(db, "expenses"), orderBy("date", "desc")), (snapshot) => {
        expensesList = snapshot.docs.map(doc => doc.data());
        calculateAndPopulateDashboard();
    });
}

function calculateAndPopulateDashboard() {
    // Totals calculations
    const totalBlocks = productionsList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalSales = salesList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalExpenses = expensesList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalProfit = totalSales - totalExpenses;

    // Push calculations to the UI if elements exist
    if (document.getElementById("productionTotal")) document.getElementById("productionTotal").innerText = `${totalBlocks} Blocks`;
    if (document.getElementById("salesTotal")) document.getElementById("salesTotal").innerText = `GH₵ ${totalSales.toFixed(2)}`;
    if (document.getElementById("expensesTotal")) document.getElementById("expensesTotal").innerText = `GH₵ ${totalExpenses.toFixed(2)}`;
    if (document.getElementById("profitTotal")) document.getElementById("profitTotal").innerText = `GH₵ ${totalProfit.toFixed(2)}`;

    // Build Recent Activities feed
    const combinedActivities = [
        ...productionsList.map(p => ({ date: p.date, activity: `Produced ${p.amount} x ${p.type}`, amount: "-" })),
        ...salesList.map(s => ({ date: s.date, activity: `Sale to ${s.customer} (${s.quantity} x ${s.type})`, amount: `GH₵ ${s.amount}` })),
        ...expensesList.map(e => ({ date: e.date, activity: `Expense: [${e.type}] ${e.description}`, amount: `GH₵ ${e.amount}` }))
    ];

    // Sort by date (newest first)
    combinedActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tableBody = document.querySelector("#recentActivitiesTable tbody");
    if (tableBody) {
        tableBody.innerHTML = "";
        combinedActivities.slice(0, 15).forEach(act => { // Cap display at latest 15 records
            tableBody.innerHTML += `<tr>
                <td>${act.date}</td>
                <td>${act.activity}</td>
                <td>${act.amount}</td>
            </tr>`;
        });
    }
}

// =========================================================================
// 3. CAPTURING FORM INPUTS AND WRITING TO THE CLOUD
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // AUTO-CALCULATE SALES TOTAL AMOUNT IN INTERFACE
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

    // INTERCEPT PRODUCTION FORM SUBMISSION
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

    // INTERCEPT SALES FORM SUBMISSION
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

    // INTERCEPT EXPENSES FORM SUBMISSION
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
