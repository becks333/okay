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

// GLOBAL SECURITY ACTION: Protect operational sheets from external URLs
onAuthStateChanged(auth, (user) => {
    // If the user isn't logged in, instantly kick them back to index.html
    if (!user) {
        window.location.href = "index.html";
    }
});

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
    // FIXED METRIC STOCK INVENTORY CALCULATION ENGINE
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

            const currentStock = producedForType - soldForType;
            const stockColor = currentStock < 0 ? "#dc2626" : (currentStock < 100 ? "#d97706" : "#16a34a");

            stockTableBody.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px;"><b>${blockType}</b></td>
                    <td style="padding: 12px; color: #2563eb; font-weight: 500;">+ ${producedForType.toLocaleString()} pcs</td>
                    <td style="padding: 12px; color: #dc2626; font-weight: 500;">- ${soldForType.toLocaleString()} pcs</td>
                    <td style="padding: 12px; color: ${stockColor}; font-weight: bold;">${currentStock.toLocaleString()} left</td>
                </tr>
            `;
        });
    }

    // Recent Activities population
    const tableBody = document.querySelector("#recentActivitiesTable tbody");
    if (tableBody) {
        tableBody.innerHTML = "";
        
        const combinedActivities = [
            ...productionsList.map(p => ({ date: p.date, activity: `Produced ${p.amount} x ${p.type}`, amount: "-" })),
            ...salesList.map(s => ({ date: s.date, activity: `Sale to ${s.customer} (${s.quantity} x ${s.type})`, amount: `GH₵ ${s.amount}` })),
            ...expensesList.map(e => ({ date: e.date, activity: `Expense: [${e.type}] ${e.description}`, amount: `GH₵ ${e.amount}` }))
        ];

        if (combinedActivities.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:15px; color:#88
