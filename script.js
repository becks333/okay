async function sendFormData(url, data, formElement) {
    try {
        console.log(`Sending data to ${url}:`, data);

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            alert(`✅ ${result.message}`);
            formElement.reset();
            return true;
        }

        alert(`❌ ${result.message}`);
        return false;
    } catch (error) {
        console.error("Error:", error);
        alert("❌ Failed to save: " + error.message);
        return false;
    }
}

const productionForm = document.getElementById("productionForm");
if (productionForm) {
    productionForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const data = {
            productionDate: document.getElementById("productionDate").value,
            cementBagsUsed: document.getElementById("cementBagsUsed").value,
            blockType: document.getElementById("blockType").value,
            quantityProduced: document.getElementById("quantityProduced").value,
            remarks: document.getElementById("remarks").value
        };

        await sendFormData("http://localhost:3000/production", data, productionForm);
    });
}

const salesForm = document.getElementById("salesForm");
if (salesForm) {
    const quantityInput = document.getElementById("quantity");
    const priceInput = document.getElementById("price");
    const totalInput = document.getElementById("total");

    function updateTotal() {
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        totalInput.value = (quantity * price).toFixed(2);
    }

    if (quantityInput && priceInput && totalInput) {
        quantityInput.addEventListener("input", updateTotal);
        priceInput.addEventListener("input", updateTotal);
    }

    salesForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const data = {
            saleDate: document.getElementById("saleDate").value,
            customerName: document.getElementById("customerName").value,
            blockType: document.getElementById("blockType").value,
            quantity: document.getElementById("quantity").value,
            unitPrice: document.getElementById("price").value,
            totalAmount: document.getElementById("total").value
        };

        await sendFormData("http://localhost:3000/sales", data, salesForm);
    });
}

const expensesForm = document.getElementById("expensesForm");
if (expensesForm) {
    expensesForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const data = {
            expenseDate: document.getElementById("expenseDate").value,
            expenseType: document.getElementById("expenseType").value,
            description: document.getElementById("description").value,
            amount: document.getElementById("amount").value,
            paymentType: document.getElementById("paymentType").value
        };

        await sendFormData("http://localhost:3000/expenses", data, expensesForm);
    });
}

const productionTotalEl = document.getElementById("productionTotal");
const salesTotalEl = document.getElementById("salesTotal");
const expensesTotalEl = document.getElementById("expensesTotal");
const profitTotalEl = document.getElementById("profitTotal");
const recentActivitiesTable = document.getElementById("recentActivitiesTable");
const salesChartCanvas = document.getElementById("salesChart");
const expensesChartCanvas = document.getElementById("expensesChart");

async function fetchDashboardData() {
    try {
        const [summaryResp, activitiesResp, salesChartResp, expensesChartResp] = await Promise.all([
            fetch("http://localhost:3000/dashboard-summary"),
            fetch("http://localhost:3000/dashboard-activities"),
            fetch("http://localhost:3000/chart-sales"),
            fetch("http://localhost:3000/chart-expenses")
        ]);

        const summary = await summaryResp.json();
        const activities = await activitiesResp.json();
        const salesChartData = await salesChartResp.json();
        const expensesChartData = await expensesChartResp.json();

        if (summary.productionCount !== undefined) {
            productionTotalEl.textContent = summary.productionCount;
            salesTotalEl.textContent = `GH₵ ${summary.totalSales.toFixed(2)}`;
            expensesTotalEl.textContent = `GH₵ ${summary.totalExpenses.toFixed(2)}`;
            profitTotalEl.textContent = `GH₵ ${summary.profit.toFixed(2)}`;
        }

        if (activities.activities && recentActivitiesTable) {
            activities.activities.forEach((item) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${new Date(item.ActivityDate).toLocaleDateString()}</td>
                    <td>${item.Activity}</td>
                    <td>${item.Amount !== null ? `GH₵ ${parseFloat(item.Amount).toFixed(2)}` : "-"}</td>
                `;
                recentActivitiesTable.appendChild(tr);
            });
        }

        if (salesChartCanvas && salesChartData.data) {
            new Chart(salesChartCanvas.getContext("2d"), {
                type: "line",
                data: {
                    labels: salesChartData.data.map((row) => row.Day),
                    datasets: [{
                        label: "Sales",
                        data: salesChartData.data.map((row) => row.TotalSales),
                        backgroundColor: "rgba(54, 162, 235, 0.2)",
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 2,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true }
                    }
                }
            });
        }

        if (expensesChartCanvas && expensesChartData.data) {
            new Chart(expensesChartCanvas.getContext("2d"), {
                type: "line",
                data: {
                    labels: expensesChartData.data.map((row) => row.Day),
                    datasets: [{
                        label: "Expenses",
                        data: expensesChartData.data.map((row) => row.TotalExpenses),
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        borderColor: "rgba(255, 99, 132, 1)",
                        borderWidth: 2,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true }
                    }
                }
            });
        }
    } catch (error) {
        console.error("Dashboard load error:", error);
    }
}

if (productionTotalEl && salesTotalEl && expensesTotalEl && profitTotalEl && recentActivitiesTable) {
    fetchDashboardData();
}

// Reports page logic
const reportTypeEl = document.getElementById('reportType');
const dateFromEl = document.getElementById('dateFrom');
const dateToEl = document.getElementById('dateTo');
const qEl = document.getElementById('q');
const pageSizeEl = document.getElementById('pageSize');
const applyFiltersBtn = document.getElementById('applyFilters');
const exportCsvBtn = document.getElementById('exportCsv');
const exportAllCsvBtn = document.getElementById('exportAllCsv');
const reportsBody = document.getElementById('reportsBody');
const pageInfo = document.getElementById('pageInfo');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const reportsHeadTr = document.getElementById('reportsHead');

let reportsPage = 1;
let reportsSort = 'DateCol DESC';

function setSortIndicators() {
    if (!reportsHeadTr) return;
    const headers = reportsHeadTr.querySelectorAll('th[data-sort]');
    headers.forEach(h => {
        const field = h.getAttribute('data-sort');
        const indicator = h.querySelector('.sort-indicator');
        if (!indicator) return;
        
        if (reportsSort.startsWith(field)) {
            indicator.textContent = reportsSort.includes('DESC') ? '🔽' : '🔼';
        } else {
            indicator.textContent = '';
        }
    });
}

async function fetchReports(page = 1) {
    try {
        const type = reportTypeEl ? reportTypeEl.value : 'all';
        const dateFrom = dateFromEl ? dateFromEl.value : '';
        const dateTo = dateToEl ? dateToEl.value : '';
        const q = qEl ? qEl.value : '';
        const pageSize = pageSizeEl ? pageSizeEl.value : 50;

        const params = new URLSearchParams({ type, dateFrom, dateTo, q, page, pageSize, sort: reportsSort });
        const res = await fetch(`/reports?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load reports');
        const data = await res.json();
        renderReports(data.rows || []);
        pageInfo.textContent = `Page ${data.page} of ${Math.ceil((data.total || 0) / data.pageSize)} — ${data.total || 0} rows`;
        reportsPage = data.page;
        prevPageBtn.disabled = data.page <= 1;
        nextPageBtn.disabled = (data.page * data.pageSize) >= (data.total || 0);
        setSortIndicators();
    } catch (err) {
        console.error('Reports fetch error:', err);
        alert('Failed to load reports: ' + err.message);
    }
}

function renderReports(rows) {
    if (!reportsBody) return;
    reportsBody.innerHTML = '';
    rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.DateCol ? new Date(r.DateCol).toLocaleString() : ''}</td>
            <td>${r.TypeText || ''}</td>
            <td>${r.Details || ''}</td>
            <td>${r.Amount !== null && r.Amount !== undefined ? `GH₵ ${parseFloat(r.Amount).toFixed(2)}` : '-'}</td>
        `;
        reportsBody.appendChild(tr);
    });
}

// Sorting: click column header to toggle sort
if (reportsHeadTr) {
    reportsHeadTr.addEventListener('click', (e) => {
        const header = e.target.closest('th[data-sort]');
        if (!header) return;
        const field = header.getAttribute('data-sort');
        
        // Toggle sort direction if same field, else reset to ASC
        if (reportsSort.startsWith(field)) {
            reportsSort = reportsSort.includes('DESC') ? `${field} ASC` : `${field} DESC`;
        } else {
            reportsSort = `${field} DESC`;
        }
        
        reportsPage = 1;
        fetchReports(1);
    });
}

if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', () => { reportsPage = 1; fetchReports(1); });
if (prevPageBtn) prevPageBtn.addEventListener('click', () => { if (reportsPage > 1) fetchReports(--reportsPage); });
if (nextPageBtn) nextPageBtn.addEventListener('click', () => { fetchReports(++reportsPage); });
if (exportCsvBtn) exportCsvBtn.addEventListener('click', () => {
    const type = reportTypeEl ? reportTypeEl.value : 'all';
    const dateFrom = dateFromEl ? dateFromEl.value : '';
    const dateTo = dateToEl ? dateToEl.value : '';
    const q = qEl ? qEl.value : '';
    const pageSize = pageSizeEl ? pageSizeEl.value : 50;
    const params = new URLSearchParams({ type, dateFrom, dateTo, q, page: reportsPage, pageSize, sort: reportsSort, format: 'csv' });
    window.open('/reports?' + params.toString(), '_blank');
});
if (exportAllCsvBtn) exportAllCsvBtn.addEventListener('click', () => {
    const type = reportTypeEl ? reportTypeEl.value : 'all';
    const dateFrom = dateFromEl ? dateFromEl.value : '';
    const dateTo = dateToEl ? dateToEl.value : '';
    const q = qEl ? qEl.value : '';
    const params = new URLSearchParams({ type, dateFrom, dateTo, q, page: 1, pageSize: 999999, sort: reportsSort, format: 'csv' });
    window.open('/reports?' + params.toString(), '_blank');
});

// Auto-init if on reports page
if (reportTypeEl || dateFromEl || qEl) {
    fetchReports(1);
}
