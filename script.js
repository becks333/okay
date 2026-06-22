// ==========================================
// 1. LOAD DATA AS SOON AS THE PAGE OPENS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    loadDashboardData();
});

function loadDashboardData() {
    // Pull production, sales, and expenses arrays from browser storage
    // If nothing is stored yet, default to an empty array []
    const productions = JSON.parse(localStorage.getItem("productions")) || [];
    const sales = JSON.parse(localStorage.getItem("sales")) || [];
    const expenses = JSON.parse(localStorage.getItem("expenses")) || [];

    // Calculate totals
    const totalBlocks = productions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalSales = sales.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalProfit = totalSales - totalExpenses;

    // Update your dashboard cards on the HTML screen
    if(document.getElementById("productionTotal")) {
        document.getElementById("productionTotal").innerText = `${totalBlocks} Blocks`;
    }
    if(document.getElementById("salesTotal")) {
        document.getElementById("salesTotal").innerText = `GH₵ ${totalSales.toFixed(2)}`;
    }
    if(document.getElementById("expensesTotal")) {
        document.getElementById("expensesTotal").innerText = `GH₵ ${totalExpenses.toFixed(2)}`;
    }
    if(document.getElementById("profitTotal")) {
        document.getElementById("profitTotal").innerText = `GH₵ ${totalProfit.toFixed(2)}`;
    }

    // Combine everything into a "Recent Activities" list
    const combinedActivities = [
        ...productions.map(p => ({ date: p.date, activity: `Produced ${p.amount} blocks`, amount: "-" })),
        ...sales.map(s => ({ date: s.date, activity: `Sale: ${s.description || 'Blocks'}`, amount: `GH₵ ${s.amount}` })),
        ...expenses.map(e => ({ date: e.date, activity: `Expense: ${e.description || 'Materials'}`, amount: `GH₵ ${e.amount}` }))
    ];

    // Sort by date (newest first)
    combinedActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Display them inside your HTML table
    const tableBody = document.querySelector("#recentActivitiesTable tbody");
    if (tableBody) {
        tableBody.innerHTML = ""; // Clear old rows
        combinedActivities.forEach(act => {
            const row = `<tr>
                <td>${act.date}</td>
                <td>${act.activity}</td>
                <td>${act.amount}</td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    }
}

// ==========================================
// 2. HOW TO SAVE NEW DATA (Call this when forms submit)
// ==========================================
function saveNewTransaction(type, dataObject) {
    // 'type' will be 'sales', 'expenses', or 'productions'
    // Get existing data array
    let currentData = JSON.parse(localStorage.getItem(type)) || [];
    
    // Add the new record
    currentData.push(dataObject);
    
    // Save it back to the browser storage
    localStorage.setItem(type, JSON.stringify(currentData));
    
    // Refresh the dashboard display data
    loadDashboardData();
}
