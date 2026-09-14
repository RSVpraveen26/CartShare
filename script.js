let currentUser = "";
let currentRoom = "";
const channel = new BroadcastChannel('cartshare_sync_channel');

// Listen for cross-tab or multi-user sync events
channel.onmessage = function (event) {
    if (event.data.room === currentRoom) {
        loadCartData();
        addLog(event.data.message);
    }
};

function joinRoom() {
    const nameInput = document.getElementById('userName').value.trim();
    const roomInput = document.getElementById('roomCode').value.trim();

    if (!nameInput || !roomInput) {
        alert("Please enter both your name and a room code!");
        return;
    }

    currentUser = nameInput;
    currentRoom = roomInput;

    document.getElementById('displayUser').innerText = currentUser;
    document.getElementById('displayRoom').innerText = currentRoom;

    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    loadCartData();
    addLog(`${currentUser} joined room '${currentRoom}'.`);
}

function leaveRoom() {
    if (confirm("Are you sure you want to leave the room?")) {
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('authSection').style.display = 'block';
        document.getElementById('roomCode').value = '';
    }
}

function getStorageKey() {
    return `cartshare_${currentRoom}`;
}

function getLogsKey() {
    return `cartshare_logs_${currentRoom}`;
}

function addItem() {
    const name = document.getElementById('itemName').value.trim();
    const qty = parseInt(document.getElementById('itemQty').value) || 1;
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;

    if (!name) {
        alert("Please enter an item name!");
        return;
    }

    let cart = JSON.parse(localStorage.getItem(getStorageKey())) || [];
    cart.push({ id: Date.now(), name, qty, price, addedBy: currentUser });
    localStorage.setItem(getStorageKey(), JSON.stringify(cart));

    const logMsg = `${currentUser} added ${qty}x ${name}`;
    saveLog(logMsg);

    channel.postMessage({ room: currentRoom, message: logMsg });

    // Reset inputs
    document.getElementById('itemName').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemQty').value = '1';

    loadCartData();
}

function removeItem(id) {
    let cart = JSON.parse(localStorage.getItem(getStorageKey())) || [];
    const item = cart.find(i => i.id === id);
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem(getStorageKey(), JSON.stringify(cart));

    const logMsg = `${currentUser} removed ${item ? item.name : 'an item'}`;
    saveLog(logMsg);

    channel.postMessage({ room: currentRoom, message: logMsg });
    loadCartData();
}

function loadCartData() {
    const cart = JSON.parse(localStorage.getItem(getStorageKey())) || [];
    const tbody = document.getElementById('cartTableBody');
    tbody.innerHTML = '';

    let total = 0;
    let itemCount = cart.length;

    if (itemCount === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4"><i class="bi bi-cart-x fs-3 d-block mb-2"></i>Your shared cart is empty</td></tr>`;
    }

    cart.forEach(item => {
        const itemTotal = item.qty * item.price;
        total += itemTotal;
        tbody.innerHTML += `
            <tr>
                <td class="fw-semibold text-dark">${item.name}</td>
                <td><span class="badge bg-light text-dark border px-2 py-1">${item.qty}</span></td>
                <td>₹${itemTotal.toFixed(2)} <small class="text-muted">(${item.price}/u)</small></td>
                <td><span class="badge bg-primary-subtle text-primary border border-primary-subtle">${item.addedBy}</span></td>
                <td class="text-end no-print">
                    <button class="btn btn-outline-danger btn-sm rounded-pill px-2 py-1" onclick="removeItem(${item.id})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    });

    // Update Dashboard Metrics
    document.getElementById('cartTotal').innerText = total.toFixed(2);
    document.getElementById('metricTotalAmount').innerText = total.toFixed(2);
    document.getElementById('metricItemCount').innerText = itemCount;

    loadLogs();
}

function saveLog(msg) {
    let logs = JSON.parse(localStorage.getItem(getLogsKey())) || [];
    logs.unshift(msg);
    if (logs.length > 10) logs.pop();
    localStorage.setItem(getLogsKey(), JSON.stringify(logs));
}

function loadLogs() {
    const logs = JSON.parse(localStorage.getItem(getLogsKey())) || [];
    const logList = document.getElementById('activityLog');
    logList.innerHTML = '';

    document.getElementById('metricActivityCount').innerText = logs.length;

    if (logs.length === 0) {
        logList.innerHTML = `<li class="list-group-item text-muted small border-0 bg-light rounded-3 mb-1">No activity recorded yet...</li>`;
        return;
    }

    logs.forEach(log => {
        logList.innerHTML += `<li class="list-group-item small border-0 bg-light rounded-3 mb-1 py-2"><i class="bi bi-dot text-primary"></i> ${log}</li>`;
    });
}