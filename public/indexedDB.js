let db;
const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

const request = indexedDB.open("budget_tracker", 1);

request.onupgradeneeded = function(e) {
    const db = e.target.result;
    db.createObjectStore("updated_balance", { autoIncrement: true });
};

request.onsuccess = function(e) {
    db = e.target.result;

    if (navigator.onLine) {
        checkDatabase();
    }

};

request.onerror = function(e) {
    console.log(e.target.errorCode);
};

function checkDB() {
    const transaction = db.transaction(["updated_balance"], "readwrite");
    const storeBudget = transaction.objectStore("updated_balance");
    const getAll = storeBudget.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then(() => {
                const transaction = db.transaction(["updated_balance"], "readwrite");
                const storeBudget = transaction.objectStore("updated_balance");

                storeBudget.clear();

            });
        }
    };
}

function saveRecord(record) {
    const transaction = db.transaction(["updated_balance"], "readwrite");
    const storeBudget = transaction.objectStore("updated_balance");

    storeBudget.add(record);
}

// checks for app to come back online
window.addEventListener("online", checkDB);