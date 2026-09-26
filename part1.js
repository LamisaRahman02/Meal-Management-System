/* ======================================================================
   PART 1 — Data Storage, Auth, Mess Management, Meal Plan, Attendance, Profile
====================================================================== */

/* ---------------- STORAGE HELPERS ---------------- */

function getData(key) {
    var value = localStorage.getItem(key);
    if (value === null) return [];
    return JSON.parse(value);
}

function setData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function makeId() {
    return Math.random().toString(36).substring(2, 9);
}

/* ---------------- SESSION ---------------- */

function getCurrentUser() {
    var userId = localStorage.getItem("currentUserId");
    if (!userId) return null;
    var users = getData("users");
    for (var i = 0; i < users.length; i++) {
        if (users[i].id === userId) return users[i];
    }
    return null;
}

function getCurrentMess() {
    var user = getCurrentUser();
    if (!user || !user.messId) return null;
    var messes = getData("messes");
    for (var i = 0; i < messes.length; i++) {
        if (messes[i].id === user.messId) return messes[i];
    }
    return null;
}

/* ---------------- LOGIN / REGISTER / LOGOUT ---------------- */

function showTab(tab) {
    document.getElementById("loginForm").style.display = tab === "login" ? "block" : "none";
    document.getElementById("registerForm").style.display = tab === "register" ? "block" : "none";
    document.getElementById("forgotForm").style.display = tab === "forgot" ? "block" : "none";
}

function resetPassword() {
    var email = document.getElementById("forgotEmail").value.trim().toLowerCase();
    var newPassword = document.getElementById("forgotNewPassword").value;
    var msg = document.getElementById("forgotMsg");

    if (!email || !newPassword) {
        msg.textContent = "Please fill in both fields.";
        return;
    }
    if (newPassword.length < 4) {
        msg.textContent = "New password is too short.";
        return;
    }

    var users = getData("users");
    var found = false;

    for (var i = 0; i < users.length; i++) {
        if (users[i].email === email) {
            users[i].password = newPassword;
            found = true;
        }
    }

    if (!found) {
        msg.textContent = "No account found with that email.";
        return;
    }

    setData("users", users);
    msg.style.color = "green";
    msg.textContent = "Password reset! You can log in now with your new password.";
    document.getElementById("forgotEmail").value = "";
    document.getElementById("forgotNewPassword").value = "";
}

function registerUser() {
    var name = document.getElementById("regName").value.trim();
    var email = document.getElementById("regEmail").value.trim().toLowerCase();
    var password = document.getElementById("regPassword").value;
    var role = document.getElementById("regRole").value;
    var msg = document.getElementById("regMsg");

    if (!name || !email || !password) {
        msg.textContent = "Please fill in every field.";
        return;
    }

    var users = getData("users");
    for (var i = 0; i < users.length; i++) {
        if (users[i].email === email) {
            msg.textContent = "This email is already registered.";
            return;
        }
    }

    var newUser = {
        id: makeId(),
        name: name,
        email: email,
        password: password,
        role: role,
        messId: null
    };
    users.push(newUser);
    setData("users", users);

    localStorage.setItem("currentUserId", newUser.id);
    enterApp();
}

function loginUser() {
    var email = document.getElementById("loginEmail").value.trim().toLowerCase();
    var password = document.getElementById("loginPassword").value;
    var msg = document.getElementById("loginMsg");

    var users = getData("users");
    var found = null;
    for (var i = 0; i < users.length; i++) {
        if (users[i].email === email && users[i].password === password) {
            found = users[i];
        }
    }

    if (!found) {
        msg.textContent = "Wrong email or password.";
        return;
    }

    localStorage.setItem("currentUserId", found.id);
    enterApp();
}

function logoutUser() {
    localStorage.removeItem("currentUserId");

    // Clear input fields and error messages upon logout
    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";
    document.getElementById("loginMsg").textContent = "";

    document.getElementById("regName").value = "";
    document.getElementById("regEmail").value = "";
    document.getElementById("regPassword").value = "";
    document.getElementById("regRole").value = "member";
    document.getElementById("regMsg").textContent = "";

    document.getElementById("forgotEmail").value = "";
    document.getElementById("forgotNewPassword").value = "";
    document.getElementById("forgotMsg").textContent = "";

    showTab("login");

    document.getElementById("appPage").style.display = "none";
    document.getElementById("authPage").style.display = "flex";
}

function enterApp() {
    document.getElementById("authPage").style.display = "none";
    document.getElementById("appPage").style.display = "flex";
    document.getElementById("topUserName").textContent = getCurrentUser().name;
    showPage("dashboard");
}

/* ---------------- PAGE NAVIGATION ---------------- */

var PAGE_TITLES = {
    dashboard: "Dashboard",
    mess: "Create / Join Mess",
    mealplan: "Weekly Meal Plan",
    attendance: "Daily Attendance",
    expenses: "Monthly Expenses",
    payments: "Payments",
    budget: "Budget Tools",
    profile: "Your Profile"
};

function showPage(page) {
    var links = document.querySelectorAll(".sidebar nav a");
    for (var i = 0; i < links.length; i++) {
        links[i].className = links[i].getAttribute("data-page") === page ? "active" : "";
    }

    document.getElementById("pageTitle").textContent = PAGE_TITLES[page] || "";

    if (page === "dashboard") renderDashboard();
    else if (page === "mess") renderMessPage();
    else if (page === "mealplan") renderMealPlanPage();
    else if (page === "attendance") renderAttendancePage();
    else if (page === "profile") renderProfilePage();
    else if (page === "expenses") renderExpensesPage();
    else if (page === "payments") renderPaymentsPage();
    else if (page === "budget") renderBudgetPage();
}

function needMessMessage(action) {
    return "<div class='card'><h3><i class='fa-solid fa-circle-exclamation'></i> Join a mess first</h3>" +
        "<p>You need to create or join a mess before you can " + action + ".</p>" +
        "<button class='btn' onclick=\"showPage('mess')\">Go to Create/Join Mess</button></div>";
}

/* ---------------- DASHBOARD ---------------- */

function renderDashboard() {
    var user = getCurrentUser();
    var mess = getCurrentMess();
    var content = document.getElementById("pageContent");

    if (!mess) {
        content.innerHTML =
            "<h1>Welcome, " + user.name + "</h1>" +
            "<p class='sub'>Let's set up your mess first.</p>" +
            needMessMessage("see your meals and expenses");
        return;
    }

    var users = getData("users");
    var members = [];
    for (var i = 0; i < users.length; i++) {
        if (users[i].messId === mess.id) members.push(users[i]);
    }

    var expenses = getData("expenses");
    var total = 0;
    for (var i = 0; i < expenses.length; i++) {
        if (expenses[i].messId === mess.id) total += expenses[i].amount;
    }

    var share = members.length ? (total / members.length) : 0;

    content.innerHTML =
        "<h1>Welcome, " + user.name + "</h1>" +
        "<p class='sub'>" + mess.name + " &middot; " + members.length + " member(s) &middot; Role: " + user.role + "</p>" +

        "<div class='statgrid'>" +
        "<div class='statbox'><div class='label'>Total Expenses</div><div class='value'>" + total.toFixed(0) + " Tk</div></div>" +
        "<div class='statbox'><div class='label'>Equal Share / Member</div><div class='value'>" + share.toFixed(0) + " Tk</div></div>" +
        "<div class='statbox'><div class='label'>Members</div><div class='value'>" + members.length + "</div></div>" +
        "</div>" +

        "<div class='card'>" +
        "<h3><i class='fa-solid fa-key'></i> Mess Invite Code</h3>" +
        "<div class='code'>" + mess.code + "</div>" +
        "</div>";
}

/* ---------------- CREATE / JOIN MESS ---------------- */

function renderMessPage() {
    var user = getCurrentUser();
    var mess = getCurrentMess();
    var content = document.getElementById("pageContent");

    if (mess) {
        var users = getData("users");
        var members = [];
        for (var i = 0; i < users.length; i++) {
            if (users[i].messId === mess.id) members.push(users[i]);
        }

        var totalSeats = mess.totalSeats || 0;
        var filled = members.length;
        var available = totalSeats - filled;
        if (available < 0) available = 0;

        var rows = "";
        for (var i = 0; i < members.length; i++) {
            var youTag = members[i].id === user.id ? " (You)" : "";
            rows += "<tr><td>" + members[i].name + youTag + "</td><td>" + members[i].role + "</td></tr>";
        }

        var seatStatus = available > 0
            ? "<span class='status paid'>" + available + " seat(s) available</span>"
            : "<span class='status due'>Mess is full</span>";

        content.innerHTML =
            "<h1>" + mess.name + "</h1>" +

            "<div class='statgrid'>" +
            "<div class='statbox'><div class='label'>Total Seats</div><div class='value'>" + totalSeats + "</div></div>" +
            "<div class='statbox'><div class='label'>Filled</div><div class='value'>" + filled + "</div></div>" +
            "<div class='statbox'><div class='label'>Available</div><div class='value'>" + (available > 0 ? available : 0) + "</div></div>" +
            "</div>" +

            "<div class='card'><h3><i class='fa-solid fa-users'></i> Members " + seatStatus + "</h3>" +
            "<table><tr><th>Name</th><th>Role</th></tr>" + rows + "</table></div>" +
            "<div class='card'><h3><i class='fa-solid fa-key'></i> Invite Code</h3><div class='code'>" + mess.code + "</div></div>";
        return;
    }

    // Only Admin can view the Create Mess form
    var createMessCard = "";
    if (user.role === "admin") {
        createMessCard =
            "<div class='card'>" +
            "<h3><div class='fa-solid fa-plus'></div> Create a New Mess <span class='tag'>Admin only</span></h3>" +
            "<div class='row'>" +
            "<div class='field'><label>Mess Name</label><input id='newMessName'></div>" +
            "<div class='field'><label>Total Seats</label><input type='number' id='newMessSeats' min='1' value='4'></div>" +
            "</div>" +
            "<button class='btn' onclick='createMess()'>Create</button>" +
            "<div class='msg' id='createMsg'></div>" +
            "</div>";
    } else {
        createMessCard =
            "<div class='card'>" +
            "<h3><i class='fa-solid fa-lock'></i> Create a New Mess</h3>" +
            "<p style='color:#777; font-size:13px;'>Only registered <b>Admin</b> accounts can create a mess. As a Member, please join an existing mess using an invite code below.</p>" +
            "</div>";
    }

    content.innerHTML =
        "<h1>Create or Join a Mess</h1>" +
        createMessCard +
        "<div class='card'>" +
        "<h3><i class='fa-solid fa-door-open'></i> Join with a Code</h3>" +
        "<div class='field'><label>Invite Code</label><input id='joinCode'></div>" +
        "<button class='btn btn-outline' onclick='joinMess()'>Join</button>" +
        "<div class='msg' id='joinMsg'></div>" +
        "</div>";
}

function createMess() {
    var user = getCurrentUser();
    var msg = document.getElementById("createMsg");

    if (user.role !== "admin") {
        if (msg) msg.textContent = "Only admin accounts can create a mess.";
        return;
    }

    var name = document.getElementById("newMessName").value.trim();
    var seats = parseInt(document.getElementById("newMessSeats").value);

    if (!name) {
        msg.textContent = "Enter a mess name.";
        return;
    }
    if (!seats || seats < 1) {
        msg.textContent = "Enter a valid number of seats (at least 1).";
        return;
    }

    var messes = getData("messes");
    var code = Math.random().toString(36).substring(2, 8).toUpperCase();
    var mess = { id: makeId(), name: name, code: code, totalSeats: seats };
    messes.push(mess);
    setData("messes", messes);

    var users = getData("users");
    for (var i = 0; i < users.length; i++) {
        if (users[i].id === user.id) {
            users[i].messId = mess.id;
        }
    }
    setData("users", users);
    showPage("dashboard");
}

function joinMess() {
    var code = document.getElementById("joinCode").value.trim().toUpperCase();
    var msg = document.getElementById("joinMsg");

    var messes = getData("messes");
    var found = null;
    for (var i = 0; i < messes.length; i++) {
        if (messes[i].code === code) found = messes[i];
    }

    if (!found) {
        msg.textContent = "No mess found with that code.";
        return;
    }

    var users = getData("users");
    var currentMembers = 0;
    for (var i = 0; i < users.length; i++) {
        if (users[i].messId === found.id) currentMembers++;
    }
    if (currentMembers >= found.totalSeats) {
        msg.textContent = "No seats available in this mess. It is full (" + found.totalSeats + "/" + found.totalSeats + ").";
        return;
    }

    var user = getCurrentUser();
    for (var i = 0; i < users.length; i++) {
        if (users[i].id === user.id) {
            users[i].messId = found.id;
        }
    }
    setData("users", users);
    showPage("dashboard");
}

/* ---------------- WEEKLY MEAL PLAN ---------------- */

var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function renderMealPlanPage() {
    var user = getCurrentUser();
    var mess = getCurrentMess();
    var content = document.getElementById("pageContent");
    if (!mess) {
        content.innerHTML = "<h1>Weekly Meal Plan</h1>" + needMessMessage("view the meal plan");
        return;
    }

    var plans = getData("plans");

    var dayBoxes = "";
    for (var d = 0; d < DAYS.length; d++) {
        var day = DAYS[d];
        var lines = "";
        for (var i = 0; i < plans.length; i++) {
            if (plans[i].messId === mess.id && plans[i].day === day) {
                lines += plans[i].mealType + ": " + plans[i].desc + "<br>";
            }
        }
        if (lines === "") lines = "-";
        dayBoxes += "<div class='daybox'><b>" + day + "</b>" + lines + "</div>";
    }

    var addForm = "";
    if (user.role === "admin") {
        addForm =
            "<div class='card'>" +
            "<h3><i class='fa-solid fa-plus'></i> Add a Meal <span class='tag'>Admin only</span></h3>" +
            "<div class='row'>" +
            "<div class='field'><label>Day</label><select id='mpDay'>" +
            DAYS.map(function (d) { return "<option>" + d + "</option>"; }).join("") +
            "</select></div>" +
            "<div class='field'><label>Meal</label><select id='mpType'><option>Breakfast</option><option>Lunch</option><option>Dinner</option></select></div>" +
            "<div class='field'><label>Description</label><input id='mpDesc'></div>" +
            "</div>" +
            "<button class='btn' onclick='addMealPlan()'>Add</button>" +
            "</div>";
    } else {
        addForm = "<div class='card'><p>Only the mess admin can update the weekly menu. You can view the plan below.</p></div>";
    }

    content.innerHTML =
        "<h1>Weekly Meal Plan</h1>" +
        addForm +
        "<div class='daygrid'>" + dayBoxes + "</div>";
}

function addMealPlan() {
    var user = getCurrentUser();
    if (user.role !== "admin") return;

    var mess = getCurrentMess();
    var day = document.getElementById("mpDay").value;
    var mealType = document.getElementById("mpType").value;
    var desc = document.getElementById("mpDesc").value.trim();
    if (!desc) return;

    var plans = getData("plans");
    plans.push({ id: makeId(), messId: mess.id, day: day, mealType: mealType, desc: desc });
    setData("plans", plans);
    renderMealPlanPage();
}

/* ---------------- DAILY ATTENDANCE (ALPHABETICAL SORTING) ---------------- */

// Selection Sort algorithm to sort members alphabetically by name
function sortMembersAlphabetically(members) {
    for (var i = 0; i < members.length - 1; i++) {
        var minIdx = i;
        for (var j = i + 1; j < members.length; j++) {
            if (members[j].name.toLowerCase() < members[minIdx].name.toLowerCase()) {
                minIdx = j;
            }
        }
        if (minIdx !== i) {
            var temp = members[i];
            members[i] = members[minIdx];
            members[minIdx] = temp;
        }
    }
    return members;
}

function renderAttendancePage() {
    var user = getCurrentUser();
    var mess = getCurrentMess();
    var content = document.getElementById("pageContent");
    if (!mess) {
        content.innerHTML = "<h1>Daily Attendance</h1>" + needMessMessage("track attendance");
        return;
    }

    var users = getData("users");
    var members = [];
    for (var i = 0; i < users.length; i++) {
        if (users[i].messId === mess.id) members.push(users[i]);
    }

    // Sort member list alphabetically by name
    sortMembersAlphabetically(members);

    var today = new Date().toISOString().slice(0, 10);
    var attendance = getData("attendance");

    function ate(userId, mealType) {
        for (var i = 0; i < attendance.length; i++) {
            var a = attendance[i];
            if (a.messId === mess.id && a.date === today && a.userId === userId && a.mealType === mealType) {
                return a.ate;
            }
        }
        return false;
    }

    var rows = "";
    for (var i = 0; i < members.length; i++) {
        var m = members[i];
        var isMe = (m.id === user.id);
        var nameLabel = isMe ? m.name + " (You)" : m.name;

        rows += "<div class='attrow'><span>" + nameLabel + "</span><span>";
        var meals = ["Breakfast", "Lunch", "Dinner"];
        for (var j = 0; j < meals.length; j++) {
            var checked = ate(m.id, meals[j]) ? "checked" : "";
            var disabled = isMe ? "" : "disabled";
            rows += "<label><input type='checkbox' " + checked + " " + disabled +
                " onchange=\"toggleAttendance('" + m.id + "','" + meals[j] + "', this.checked)\"> " + meals[j] + "</label> ";
        }
        rows += "</span></div>";
    }

    content.innerHTML =
        "<h1>Daily Attendance</h1>" +
        "<p class='sub'>" + today + " &middot; Members sorted alphabetically &middot; Mark your own meals</p>" +
        "<div class='card'>" + rows + "</div>";
}

function toggleAttendance(userId, mealType, checked) {
    var user = getCurrentUser();

    if (userId !== user.id) {
        alert("You can only mark your own attendance.");
        renderAttendancePage();
        return;
    }

    var mess = getCurrentMess();
    var today = new Date().toISOString().slice(0, 10);
    var attendance = getData("attendance");

    var found = null;
    for (var i = 0; i < attendance.length; i++) {
        var a = attendance[i];
        if (a.messId === mess.id && a.date === today && a.userId === userId && a.mealType === mealType) {
            found = a;
        }
    }

    if (found) {
        found.ate = checked;
    } else {
        attendance.push({ id: makeId(), messId: mess.id, date: today, userId: userId, mealType: mealType, ate: checked });
    }
    setData("attendance", attendance);
}

/* ---------------- PROFILE ---------------- */

function renderProfilePage() {
    var user = getCurrentUser();
    var mess = getCurrentMess();
    var content = document.getElementById("pageContent");

    content.innerHTML =
        "<h1>Your Profile</h1>" +
        "<div class='card'>" +
        "<h3><i class='fa-solid fa-id-card'></i> Details</h3>" +
        "<p>Name: <b>" + user.name + "</b></p>" +
        "<p>Email: <b>" + user.email + "</b></p>" +
        "<p>Role: <b>" + user.role + "</b></p>" +
        "<p>Mess: <b>" + (mess ? mess.name : "Not joined") + "</b></p>" +
        "</div>" +
        "<div class='card'>" +
        "<h3><i class='fa-solid fa-lock'></i> Change Password</h3>" +
        "<div class='field'><label>Current Password</label><input type='password' id='curPass'></div>" +
        "<div class='field'><label>New Password</label><input type='password' id='newPass'></div>" +
        "<button class='btn btn-outline' onclick='changePassword()'>Update Password</button>" +
        "<div class='msg' id='passMsg'></div>" +
        "</div>";
}

function changePassword() {
    var user = getCurrentUser();
    var cur = document.getElementById("curPass").value;
    var next = document.getElementById("newPass").value;
    var msg = document.getElementById("passMsg");

    if (cur !== user.password) {
        msg.textContent = "Current password is wrong.";
        return;
    }
    if (next.length < 4) {
        msg.textContent = "New password is too short.";
        return;
    }

    var users = getData("users");
    for (var i = 0; i < users.length; i++) {
        if (users[i].id === user.id) users[i].password = next;
    }
    setData("users", users);

    msg.style.color = "green";
    msg.textContent = "Password updated.";
}

/* ---------------- START UP ---------------- */

window.onload = function () {
    if (getCurrentUser()) {
        enterApp();
    }
};