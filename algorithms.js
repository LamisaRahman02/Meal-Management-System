/* ============================================================================
   ALGORITHMS MODULE — Single Source of Truth for Algorithms
============================================================================ */

// 1. MERGE SORT (Used for sorting Transaction Ledger by Date)
function merge(dateArr, idArr, left, mid, right) {
    var n1 = mid - left + 1;
    var n2 = right - mid;
    var Ldate = [], Lid = [], Rdate = [], Rid = [];
   

    for (var i = 0; i < n1; i++) { Ldate[i] = dateArr[left + i]; Lid[i] = idArr[left + i]; }
    for (var j = 0; j < n2; j++) { Rdate[j] = dateArr[mid + 1 + j]; Rid[j] = idArr[mid + 1 + j]; }

    var i = 0, j = 0, k = left;
    while (i < n1 && j < n2) {
        if (Ldate[i] <= Rdate[j]) {
            dateArr[k] = Ldate[i]; idArr[k] = Lid[i]; i++;
        } else {
            dateArr[k] = Rdate[j]; idArr[k] = Rid[j]; j++;
        }
        k++;
    }
    while (i < n1) { dateArr[k] = Ldate[i]; idArr[k] = Lid[i]; i++; k++; }
    while (j < n2) { dateArr[k] = Rdate[j]; idArr[k] = Rid[j]; j++; k++; }
}

function mergeSort(dateArr, idArr, left, right) {
    if (left < right) {
        var mid = Math.floor((left + right) / 2);
        mergeSort(dateArr, idArr, left, mid);
        mergeSort(dateArr, idArr, mid + 1, right);
        merge(dateArr, idArr, left, mid, right);
    }
}

// 2. QUICK SORT (Used for ranking Members by Due Amount - Descending)
function partition(nameArr, dueArr, low, high) {
    var pivot = dueArr[low];
    var i = low, j = high;

    while (true) {
        while (dueArr[i] > pivot) i++; 
        while (dueArr[j] < pivot) j--; 
        if (i >= j) return j; 

        var tempName = nameArr[i]; nameArr[i] = nameArr[j]; nameArr[j] = tempName;
        var tempDue = dueArr[i]; dueArr[i] = dueArr[j]; dueArr[j] = tempDue;
        i++; j--;
    }
}

function quickSort(nameArr, dueArr, low, high) {
    if (low < high) {
        var pivotIndex = partition(nameArr, dueArr, low, high);
        quickSort(nameArr, dueArr, low, pivotIndex);
           quickSort(nameArr, dueArr, pivotIndex + 1, high);
    }
}

// 3. FRACTIONAL KNAPSACK (Used for Grocery Budget Optimizer)
function selectionSortByRatio(nameArr, val, wt, ratio, n) {
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
}

function fractionalKnapsack(nameArr, val, wt, n, capacity) {
    var ratio = [];
    for (var i = 0; i < n; i++) ratio[i] = val[i] / wt[i];

    selectionSortByRatio(nameArr, val, wt, ratio, n);

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
