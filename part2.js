/* ======================================================================
   PART 2 — Expenses, Auto-split, Payments, and Budget Tools
====================================================================== */

/* ---------------- MONTHLY EXPENSES ---------------- */

var editingExpenseId = null;

function renderExpensesPage() {
    var user = getCurrentUser();
    var mess = getCurrentMess();
    var content = document.getElementById("pageContent");

    if (!mess) {
        content.innerHTML = "<h1>Monthly Expenses</h1>" + needMessMessage("add expenses");
        return;
    }

    var expenses = getData("expenses");
    var messExpenses = [];
    for (var i = 0; i < expenses.length; i++) {
        if (expenses[i].messId === mess.id) messExpenses.push(expenses[i]);
    }

    var users = getData("users");
    var members = [];
    for (var i = 0; i < users.length; i++) {
        if (users[i].messId === mess.id) members.push(users[i]);
    }

    var total = 0;
    for (var i = 0; i < messExpenses.length; i++) total += messExpenses[i].amount;
    var share = members.length ? (total / members.length) : 0;

    var currentEditObj = null;
    if (editingExpenseId) {
        for (var i = 0; i < messExpenses.length; i++) {
            if (messExpenses[i].id === editingExpenseId) {
                currentEditObj = messExpenses[i];
                break;
            }
        }
        if (!currentEditObj) editingExpenseId = null;
    }

    var rows = "";
    var isAdmin = (user.role === "admin");

    for (var i = 0; i < messExpenses.length; i++) {
        var e = messExpenses[i];
        var actionBtns = "";
        if (isAdmin) {
            actionBtns = "<td>" +
                "<button class='btn btn-outline' style='padding:4px 8px; font-size:12px; margin-right:4px;' onclick=\"openEditExpense('" + e.id + "')\">Edit</button>" +
                "<button class='btn btn-outline' style='padding:4px 8px; font-size:12px; color:red; border-color:red;' onclick=\"deleteExpense('" + e.id + "')\">Delete</button>" +
                "</td>";
        }
        rows += "<tr><td>" + e.date + "</td><td>" + e.category + "</td><td>" + e.amount.toFixed(0) + " Tk</td>" + actionBtns + "</tr>";
    }

    var colSpan = isAdmin ? 4 : 3;
    if (rows === "") rows = "<tr><td colspan='" + colSpan + "'>No expenses added yet.</td></tr>";

    var tableHeaders = "<tr><th>Date</th><th>Category</th><th>Amount</th>" + (isAdmin ? "<th>Actions</th>" : "") + "</tr>";

    var addForm = "";
    if (isAdmin) {
        var isEdit = !!currentEditObj;
        var catVal = isEdit ? currentEditObj.category : "Rent";
        var amtVal = isEdit ? currentEditObj.amount : "";
        var dateVal = isEdit ? currentEditObj.date : new Date().toISOString().slice(0, 10);

        var categories = ["Rent", "Grocery", "Electricity", "Other"];
        var catOptions = "";
        for (var c = 0; c < categories.length; c++) {
            var selected = (categories[c] === catVal) ? " selected" : "";
            catOptions += "<option" + selected + ">" + categories[c] + "</option>";
        }

        var titleText = isEdit ? "Edit Expense" : "Add Expense";
        var iconClass = isEdit ? "fa-pen" : "fa-plus";
        var submitBtn = isEdit ?
            "<button class='btn' onclick='saveExpense()'>Update & Auto-Split</button> <button class='btn btn-outline' onclick='cancelEditExpense()' style='margin-left:8px;'>Cancel</button>" :
            "<button class='btn' onclick='addExpense()'>Add & Auto-Split</button>";

        addForm =
            "<div class='card'>" +
            "<h3><i class='fa-solid " + iconClass + "'></i> " + titleText + " <span class='tag'>Admin only</span></h3>" +
            "<div class='row'>" +
            "<div class='field'><label>Category</label><select id='expCat'>" + catOptions + "</select></div>" +
            "<div class='field'><label>Amount (Tk)</label><input type='number' id='expAmt' value='" + amtVal + "'></div>" +
            "<div class='field'><label>Date</label><input type='date' id='expDate' value='" + dateVal + "'></div>" +
            "</div>" +
            submitBtn +
            "<div class='msg' id='expMsg' style='color:red; margin-top:8px;'></div>" +
            "</div>";
    } else {
        addForm = "<div class='card'><p>Only the admin can add or edit expenses. You can see the list and your share below.</p></div>";
    }

    content.innerHTML =
        "<h1>Monthly Expenses</h1>" +
        addForm +
        "<div class='card'><h3><i class='fa-solid fa-receipt'></i> Expense History</h3><table>" + tableHeaders + rows + "</table></div>" +
        "<div class='statgrid'>" +
        "<div class='statbox'><div class='label'>Total</div><div class='value'>" + total.toFixed(0) + " Tk</div></div>" +
        "<div class='statbox'><div class='label'>Members</div><div class='value'>" + members.length + "</div></div>" +
        "<div class='statbox'><div class='label'>Share / Member</div><div class='value'>" + share.toFixed(0) + " Tk</div></div>" +
        "</div>";
}

function addExpense() {
    var user = getCurrentUser();
    if (user.role !== "admin") return;

    var mess = getCurrentMess();
    var category = document.getElementById("expCat").value;
    var amount = parseFloat(document.getElementById("expAmt").value);
    var date = document.getElementById("expDate").value || new Date().toISOString().slice(0, 10);
    var msg = document.getElementById("expMsg");

    if (!amount || amount <= 0) {
        if (msg) msg.textContent = "Please enter a valid amount.";
        return;
    }

    var inputMonth = date.slice(0, 7); // Format: "YYYY-MM"
    var expenses = getData("expenses");

    // Check for duplicate category in the same month
    for (var i = 0; i < expenses.length; i++) {
        if (expenses[i].messId === mess.id &&
            expenses[i].category === category &&
            expenses[i].date.slice(0, 7) === inputMonth) {
            if (msg) msg.textContent = "Expense for '" + category + "' in " + inputMonth + " already exists. Use the Edit button below to change it.";
            return;
        }
    }

    expenses.push({ id: makeId(), messId: mess.id, category: category, amount: amount, date: date });
    setData("expenses", expenses);

    autoSplitExpenses();
    renderExpensesPage();
}

function openEditExpense(id) {
    editingExpenseId = id;
    renderExpensesPage();
}

function saveExpense() {
    var user = getCurrentUser();
    if (user.role !== "admin" || !editingExpenseId) return;

    var mess = getCurrentMess();
    var category = document.getElementById("expCat").value;
    var amount = parseFloat(document.getElementById("expAmt").value);
    var date = document.getElementById("expDate").value || new Date().toISOString().slice(0, 10);
    var msg = document.getElementById("expMsg");

    if (!amount || amount <= 0) {
        if (msg) msg.textContent = "Please enter a valid amount.";
        return;
    }

    var inputMonth = date.slice(0, 7);
    var expenses = getData("expenses");

    // Validate that the new category & month don't conflict with another existing expense
    for (var i = 0; i < expenses.length; i++) {
        if (expenses[i].id !== editingExpenseId &&
            expenses[i].messId === mess.id &&
            expenses[i].category === category &&
            expenses[i].date.slice(0, 7) === inputMonth) {
            if (msg) msg.textContent = "Another record for '" + category + "' in " + inputMonth + " already exists.";
            return;
        }
    }

    for (var i = 0; i < expenses.length; i++) {
        if (expenses[i].id === editingExpenseId) {
            expenses[i].category = category;
            expenses[i].amount = amount;
            expenses[i].date = date;
            break;
        }
    }

    setData("expenses", expenses);
    editingExpenseId = null;
    autoSplitExpenses();
    renderExpensesPage();
}

function cancelEditExpense() {
    editingExpenseId = null;
    renderExpensesPage();
}

function deleteExpense(expenseId) {
    var user = getCurrentUser();
    if (user.role !== "admin") return;

    if (!confirm("Are you sure you want to delete this expense?")) return;

    var expenses = getData("expenses");
    var filtered = [];
    for (var i = 0; i < expenses.length; i++) {
        if (expenses[i].id !== expenseId) {
            filtered.push(expenses[i]);
        }
    }
    setData("expenses", filtered);

    if (editingExpenseId === expenseId) editingExpenseId = null;

    autoSplitExpenses();
    renderExpensesPage();
}

function autoSplitExpenses() {
    var mess = getCurrentMess();
    var users = getData("users");
    var members = [];
    for (var i = 0; i < users.length; i++) {
        if (users[i].messId === mess.id) members.push(users[i]);
    }
    if (members.length === 0) return;

    var expenses = getData("expenses");
    var total = 0;
    for (var i = 0; i < expenses.length; i++) {
        if (expenses[i].messId === mess.id) total += expenses[i].amount;
    }
    var share = total / members.length;

    var payments = getData("payments");

    for (var i = 0; i < members.length; i++) {
        var member = members[i];

        var paidSoFar = 0;
        var dueRecord = null;
        for (var j = 0; j < payments.length; j++) {
            var p = payments[j];
            if (p.messId === mess.id && p.userId === member.id && p.kind === "share") {
                if (p.status === "paid") paidSoFar += p.amount;
                if (p.status === "due") dueRecord = p;
            }
        }

        var remaining = share - paidSoFar;
        if (remaining < 0) remaining = 0;

        if (dueRecord) {
            dueRecord.amount = remaining;
        } else if (remaining > 0) {
            payments.push({
                id: makeId(), messId: mess.id, userId: member.id,
                amount: remaining, status: "due", kind: "share",
                date: new Date().toISOString().slice(0, 10)
            });
        }
    }

    setData("payments", payments);
}

/* ---------------- PAYMENTS PAGE ---------------- */

function renderPaymentsPage() {
    var user = getCurrentUser();
    var mess = getCurrentMess();
    var content = document.getElementById("pageContent");

    if (!mess) {
        content.innerHTML = "<h1>Payments</h1>" + needMessMessage("track payments");
        return;
    }

    var payments = getData("payments");
    var messPayments = [];
    for (var i = 0; i < payments.length; i++) {
        if (payments[i].messId === mess.id) messPayments.push(payments[i]);
    }

    var users = getData("users");
    var members = [];
    for (var i = 0; i < users.length; i++) {
        if (users[i].messId === mess.id) members.push(users[i]);
    }

    function nameOf(userId) {
        for (var i = 0; i < members.length; i++) {
            if (members[i].id === userId) return members[i].name;
        }
        return "-";
    }

    var myDues = [];
    for (var i = 0; i < messPayments.length; i++) {
        var p = messPayments[i];
        if (p.userId === user.id && p.status === "due" && p.amount > 0) myDues.push(p);
    }
    var myDuesRows = "";
    for (var i = 0; i < myDues.length; i++) {
        var p = myDues[i];
        myDuesRows += "<tr><td>" + p.kind + "</td><td>" + p.date + "</td><td>" + p.amount.toFixed(0) + " Tk</td>" +
            "<td><button class='btn btn-outline' onclick=\"markPaid('" + p.id + "')\">Mark Paid</button></td></tr>";
    }
    if (myDuesRows === "") myDuesRows = "<tr><td colspan='4'>You have no dues right now.</td></tr>";

    content.innerHTML =
        "<h1>Payments</h1>" +
        "<div class='card'><h3><i class='fa-solid fa-wallet'></i> Your Dues</h3><table><tr><th>Type</th><th>Date</th><th>Amount</th><th></th></tr>" + myDuesRows + "</table></div>";

    if (user.role !== "admin") {
        content.innerHTML += "<div class='restricted-note'><i class='fa-solid fa-lock'></i> Only the mess admin can view everyone's payment status.</div>";
        return;
    }

    // Call Quick Sort from algorithms.js
    var nameArr = [];
    var dueArr = [];
    for (var i = 0; i < members.length; i++) {
        var m = members[i];
        var totalDue = 0;
        for (var j = 0; j < messPayments.length; j++) {
            if (messPayments[j].userId === m.id && messPayments[j].status === "due") {
                totalDue += messPayments[j].amount;
            }
        }
        nameArr.push(m.name);
        dueArr.push(totalDue);
    }
    if (nameArr.length > 0) {
        quickSort(nameArr, dueArr, 0, nameArr.length - 1);
    }

    var rankedRows = "";
    for (var i = 0; i < nameArr.length; i++) {
        var cls = dueArr[i] > 0 ? "due" : "paid";
        var text = dueArr[i] > 0 ? dueArr[i].toFixed(0) + " Tk" : "Settled";
        rankedRows += "<tr><td>" + nameArr[i] + "</td><td><span class='status " + cls + "'>" + text + "</span></td></tr>";
    }

    // Call Merge Sort from algorithms.js
    var dateArr = [];
    var idArr = [];
    for (var i = 0; i < messPayments.length; i++) {
        dateArr.push(messPayments[i].date);
        idArr.push(messPayments[i].id);
    }
    if (dateArr.length > 0) {
        mergeSort(dateArr, idArr, 0, dateArr.length - 1);
    }
    idArr.reverse();

    var ledgerRows = "";
    for (var i = 0; i < idArr.length; i++) {
        var record = null;
        for (var j = 0; j < messPayments.length; j++) {
            if (messPayments[j].id === idArr[i]) record = messPayments[j];
        }
        ledgerRows += "<tr><td>" + record.date + "</td><td>" + nameOf(record.userId) + "</td><td>" + record.amount.toFixed(0) + " Tk</td>" +
            "<td><span class='status " + record.status + "'>" + record.status + "</span></td></tr>";
    }
    if (ledgerRows === "") ledgerRows = "<tr><td colspan='4'>No payment records yet.</td></tr>";

    content.innerHTML +=
        "<div class='card'><h3><i class='fa-solid fa-ranking-star'></i> Dues Leaderboard <span class='tag'>Quick Sort</span></h3>" +
        "<p>Members ranked by total amount due, highest first.</p>" +
        "<table><tr><th>Member</th><th>Total Due</th></tr>" + rankedRows + "</table></div>" +
        "<div class='card'><h3><i class='fa-solid fa-list'></i> Transaction Ledger <span class='tag'>Merge Sort</span></h3>" +
        "<p>All payment records, newest first.</p>" +
        "<table><tr><th>Date</th><th>Member</th><th>Amount</th><th>Status</th></tr>" + ledgerRows + "</table></div>";
}

function markPaid(paymentId) {
    var user = getCurrentUser();
    var payments = getData("payments");

    for (var i = 0; i < payments.length; i++) {
        if (payments[i].id === paymentId) {
            if (payments[i].userId !== user.id && user.role !== "admin") {
                alert("You can only mark your own dues as paid.");
                return;
            }
            payments[i].status = "paid";
            payments[i].date = new Date().toISOString().slice(0, 10);
        }
    }
    setData("payments", payments);
    renderPaymentsPage();
}


/* ---------------- BUDGET TOOLS PAGE ---------------- */

var groceryItems = [
    { name: "Rice (per kg)", cost: 70, priority: 9 },
    { name: "Lentils (per kg)", cost: 120, priority: 7 },
    { name: "Cooking Oil (per litre)", cost: 180, priority: 6 },
    { name: "Vegetables (per kg)", cost: 60, priority: 8 }
];

function renderBudgetPage() {
    var user = getCurrentUser();
    var mess = getCurrentMess();
    var content = document.getElementById("pageContent");

    if (!mess) {
        content.innerHTML = "<h1>Budget Tools</h1>" + needMessMessage("use the budget tools");
        return;
    }

    if (user.role !== "admin") {
        content.innerHTML =
            "<h1>Budget Tools</h1>" +
            "<div class='restricted-note'><i class='fa-solid fa-lock'></i> Only the mess admin can access the budget tools.</div>";
        return;
    }

    var itemRows = "";
    for (var i = 0; i < groceryItems.length; i++) {
        var it = groceryItems[i];
        itemRows += "<div class='knap-item' style='display:flex; align-items:center; gap:12px; margin-bottom:10px; flex-wrap:wrap;'>" +
            "<span style='flex:1; min-width:150px; font-weight:bold;'>" + it.name + "</span>" +
            "<div><label>Cost (Tk): </label><input type='number' class='fk-cost' value='" + it.cost + "' style='width:80px; padding:4px;'></div>" +
            "<div><label>Priority: </label><input type='number' class='fk-priority' value='" + it.priority + "' style='width:80px; padding:4px;'></div>" +
            "</div>";
    }

    content.innerHTML =
        "<h1>Budget Tools</h1>" +
        "<div class='card'>" +
        "<h3><i class='fa-solid fa-cart-shopping'></i> Grocery Budget Optimizer <span class='tag'>Fractional Knapsack</span></h3>" +
        "<p>Grocery items can be bought in partial amounts, so items are picked greedily by best value-per-taka ratio.</p>" +
        "<div class='field' style='max-width:220px; margin-bottom:15px;'><label><b>Grocery Budget (Tk)</b></label><input type='number' id='fkBudget' value='500' style='padding:6px;'></div>" +
        "<div id='fkItems'>" + itemRows + "</div>" +
        "<button class='btn' style='margin-top:10px;' onclick='runFractionalKnapsack()'>Optimize</button>" +
        "<div id='fkResult'></div>" +
        "</div>";
}

function runFractionalKnapsack() {
    var budgetInput = document.getElementById("fkBudget");
    var budget = parseFloat(budgetInput ? budgetInput.value : 0);

    if (isNaN(budget) || budget <= 0) {
        document.getElementById("fkResult").innerHTML = "<div style='color:red; margin-top:12px;'>Please enter a valid budget greater than 0.</div>";
        return;
    }

    var costInputs = document.querySelectorAll(".fk-cost");
    var priorityInputs = document.querySelectorAll(".fk-priority");

    var nameArr = [];
    var val = [];
    var wt = [];

    for (var i = 0; i < groceryItems.length; i++) {
        var costVal = parseFloat(costInputs[i] ? costInputs[i].value : groceryItems[i].cost);
        var prioVal = parseFloat(priorityInputs[i] ? priorityInputs[i].value : groceryItems[i].priority);

        if (isNaN(costVal) || costVal <= 0) costVal = 1; // Prevent division by zero
        if (isNaN(prioVal) || prioVal < 0) prioVal = 0;

        nameArr.push(groceryItems[i].name);
        val.push(prioVal);
        wt.push(costVal);
    }

    // Call algorithms.js if present, otherwise use local fallback
    var result;
    if (typeof fractionalKnapsack === "function") {
        result = fractionalKnapsack(nameArr, val, wt, nameArr.length, budget);
    } else {
        result = localKnapsackFallback(nameArr, val, wt, nameArr.length, budget);
    }

    var resDiv = document.getElementById("fkResult");
    if (resDiv) {
        resDiv.innerHTML =
            "<div class='result' style='margin-top:15px; padding:12px; background:#f0f4f8; border-left:4px solid #007bff; border-radius:4px;'>" +
            "<b>Suggested basket for " + budget.toFixed(0) + " Tk:</b><br><br>" +
            result.lines.join("<br>") +
            "<br><br><b>Spent:</b> " + result.spent.toFixed(0) + " Tk &nbsp;|&nbsp; <b>Leftover:</b> " + result.leftover.toFixed(0) + " Tk" +
            "</div>";
    }
}

// Fallback algorithm execution if algorithms.js is not loaded
function localKnapsackFallback(nameArr, val, wt, n, capacity) {
    var ratio = [];
    for (var i = 0; i < n; i++) ratio[i] = val[i] / wt[i];

    for (var i = 0; i < n - 1; i++) {
        var maxIndex = i;
        for (var j = i + 1; j < n; j++) {
            if (ratio[j] > ratio[maxIndex]) maxIndex = j;
        }
        var tempRatio = ratio[i]; ratio[i] = ratio[maxIndex]; ratio[maxIndex] = tempRatio;
        var tempVal = val[i]; val[i] = val[maxIndex]; val[maxIndex] = tempVal;
        var tempWt = wt[i]; wt[i] = wt[maxIndex]; wt[maxIndex] = tempWt;
        var tempName = nameArr[i]; nameArr[i] = nameArr[maxIndex]; nameArr[maxIndex] = tempName;
    }

    var totalProfit = 0, currentCapacity = capacity, lines = [];
    for (var i = 0; i < n; i++) {
        if (currentCapacity <= 0) break;
        if (wt[i] <= currentCapacity) {
            totalProfit += val[i];
            currentCapacity -= wt[i];
            lines.push(nameArr[i] + " - buy 100% (" + wt[i].toFixed(0) + " Tk)");
        } else {
            var fraction = currentCapacity / wt[i];
            totalProfit += ratio[i] * currentCapacity;
            lines.push(nameArr[i] + " - buy " + (fraction * 100).toFixed(0) + "% (" + currentCapacity.toFixed(0) + " Tk)");
            currentCapacity = 0;
        }
    }
    return { totalProfit: totalProfit, lines: lines, spent: capacity - currentCapacity, leftover: currentCapacity };
}