// State management
let state = {
    totalAmount: 0,
    tipPercent: 0,
    tipAmount: 0,
    tipMode: 'percent', // 'percent' or 'amount'
    adults: [],
    minors: [],
    items: {} // personId -> array of items
};

// DOM elements
const landingPage = document.getElementById('landing-page');
const calculationPage = document.getElementById('calculation-page');
const billForm = document.getElementById('bill-form');
const backBtn = document.getElementById('back-btn');
const peopleList = document.getElementById('people-list');

// Landing page controls
const adultsCountInput = document.getElementById('adults-count');
const minorsCountInput = document.getElementById('minors-count');
const adultsIncreaseBtn = document.getElementById('adults-increase');
const adultsDecreaseBtn = document.getElementById('adults-decrease');
const minorsIncreaseBtn = document.getElementById('minors-increase');
const minorsDecreaseBtn = document.getElementById('minors-decrease');

// Initialize counter controls
adultsIncreaseBtn.addEventListener('click', () => {
    const current = parseInt(adultsCountInput.value) || 1;
    adultsCountInput.value = current + 1;
});

adultsDecreaseBtn.addEventListener('click', () => {
    const current = parseInt(adultsCountInput.value) || 1;
    if (current > 1) {
        adultsCountInput.value = current - 1;
    }
});

minorsIncreaseBtn.addEventListener('click', () => {
    const current = parseInt(minorsCountInput.value) || 0;
    minorsCountInput.value = current + 1;
});

minorsDecreaseBtn.addEventListener('click', () => {
    const current = parseInt(minorsCountInput.value) || 0;
    if (current > 0) {
        minorsCountInput.value = current - 1;
    }
});

// Tip toggle functionality
const tipInput = document.getElementById('tip-input');
const tipToggle = document.getElementById('tip-toggle');
const tipWrapper = document.getElementById('tip-wrapper');

// Initialize tip mode
state.tipMode = 'percent';

tipToggle.addEventListener('click', () => {
    const totalAmountInput = document.getElementById('total-amount');
    const currentTotal = parseFloat(totalAmountInput.value) || 0;
    const currentValue = parseFloat(tipInput.value) || 0;
    
    if (state.tipMode === 'percent') {
        // Switch to amount mode
        state.tipMode = 'amount';
        tipToggle.textContent = '$';
        tipInput.step = '0.01';
        tipInput.max = '';
        tipInput.placeholder = '0.00';
        
        // Add currency symbol
        let currencySpan = tipWrapper.querySelector('.currency');
        if (!currencySpan) {
            currencySpan = document.createElement('span');
            currencySpan.className = 'currency';
            currencySpan.textContent = '$';
            tipWrapper.insertBefore(currencySpan, tipInput);
        }
        
        // Convert percentage to amount if there's a total amount
        if (currentTotal > 0 && currentValue > 0) {
            tipInput.value = ((currentTotal * currentValue) / 100).toFixed(2);
        } else {
            tipInput.value = '';
        }
    } else {
        // Switch to percent mode
        state.tipMode = 'percent';
        tipToggle.textContent = '%';
        tipInput.step = '0.1';
        tipInput.max = '100';
        tipInput.placeholder = '0';
        
        // Remove currency symbol
        const currencySpan = tipWrapper.querySelector('.currency');
        if (currencySpan) {
            currencySpan.remove();
        }
        
        // Convert amount to percentage if there's a total amount
        if (currentTotal > 0 && currentValue > 0) {
            tipInput.value = ((currentValue / currentTotal) * 100).toFixed(1);
        } else {
            tipInput.value = '';
        }
    }
});

// Form submission
billForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const totalAmount = parseFloat(document.getElementById('total-amount').value);
    const tipValue = parseFloat(tipInput.value) || 0;
    const adultsCount = parseInt(adultsCountInput.value) || 1;
    const minorsCount = parseInt(minorsCountInput.value) || 0;

    if (totalAmount <= 0) {
        alert('Please enter a valid total amount');
        return;
    }

    // Initialize state
    state.totalAmount = totalAmount;
    state.items = {};

    // Calculate tip based on mode
    if (state.tipMode === 'percent') {
        state.tipPercent = tipValue;
        state.tipAmount = (totalAmount * tipValue) / 100;
    } else {
        state.tipAmount = tipValue;
        state.tipPercent = totalAmount > 0 ? (tipValue / totalAmount) * 100 : 0;
    }

    // Create adults
    state.adults = Array.from({ length: adultsCount }, (_, i) => ({
        id: `adult-${i}`,
        name: `Adult ${i + 1}`,
        type: 'adult'
    }));

    // Create minors
    state.minors = Array.from({ length: minorsCount }, (_, i) => ({
        id: `minor-${i}`,
        name: `Minor ${i + 1}`,
        type: 'minor',
        percent: 50, // Default 50% of adult amount
        directAmount: null // For direct amount input
    }));

    // Update summary
    updateSummary();
    
    // Render calculation page
    renderCalculationPage();
    
    // Switch pages
    landingPage.classList.remove('active');
    calculationPage.classList.add('active');
});

// Back button
backBtn.addEventListener('click', () => {
    calculationPage.classList.remove('active');
    landingPage.classList.add('active');
});

// Update summary
function updateSummary() {
    const tipAmount = state.tipMode === 'percent' 
        ? (state.totalAmount * state.tipPercent) / 100 
        : state.tipAmount;
    const grandTotal = state.totalAmount + tipAmount;

    document.getElementById('summary-total').textContent = `$${state.totalAmount.toFixed(2)}`;
    document.getElementById('summary-tip').textContent = `$${tipAmount.toFixed(2)}`;
    document.getElementById('summary-grand-total').textContent = `$${grandTotal.toFixed(2)}`;
}

// Check if setting a direct minor amount would cause negative amounts
function wouldCauseNegativeMinorAmount(minorId, directAmount) {
    const tipAmount = state.tipMode === 'percent' 
        ? (state.totalAmount * state.tipPercent) / 100 
        : state.tipAmount;
    const grandTotal = state.totalAmount + tipAmount;

    // Calculate total of individual items
    let totalItemsAmount = 0;
    Object.keys(state.items).forEach(pId => {
        state.items[pId].forEach(item => {
            totalItemsAmount += item.amount;
        });
    });

    // Calculate total direct minor amounts (including the new amount for this minor)
    let totalDirectMinorAmount = 0;
    state.minors.forEach(minor => {
        if (minor.id === minorId) {
            totalDirectMinorAmount += directAmount;
        } else if (minor.directAmount !== null && minor.directAmount !== undefined) {
            totalDirectMinorAmount += minor.directAmount;
        }
    });

    // Amount to split among all people (excluding individual items and direct minor amounts)
    const amountToSplit = grandTotal - totalItemsAmount - totalDirectMinorAmount;

    // If amountToSplit is negative, it will definitely cause issues
    if (amountToSplit < 0) {
        return true;
    }

    // Calculate total number of people
    const totalPeople = state.adults.length + state.minors.length;
    
    // Calculate the even split per person
    const evenSplitPerPerson = totalPeople > 0 ? amountToSplit / totalPeople : 0;

    // Calculate minor amounts
    let totalMinorAmount = 0;
    const minorAmounts = {};
    
    state.minors.forEach(minor => {
        if (minor.id === minorId) {
            // Use the new direct amount for this minor
            minorAmounts[minor.id] = directAmount;
            totalMinorAmount += directAmount;
        } else if (minor.directAmount !== null && minor.directAmount !== undefined) {
            minorAmounts[minor.id] = minor.directAmount;
            totalMinorAmount += minor.directAmount;
        } else {
            const minorAmount = evenSplitPerPerson * (minor.percent / 100);
            minorAmounts[minor.id] = minorAmount;
            totalMinorAmount += minorAmount;
        }
    });

    // Calculate remaining amount after minors
    const remainingAmount = amountToSplit - totalMinorAmount;
    
    // Split remaining amount among adults
    const adultCount = state.adults.length;
    const adultBaseAmount = adultCount > 0 ? remainingAmount / adultCount : 0;

    // Check if any adult would have negative amount
    for (let i = 0; i < state.adults.length; i++) {
        const adult = state.adults[i];
        let amount = adultBaseAmount;
        // Add individual items
        if (state.items[adult.id]) {
            state.items[adult.id].forEach(item => {
                amount += item.amount;
            });
        }
        if (amount < 0) {
            return true;
        }
    }

    // Check if any minor would have negative amount
    for (const mid in minorAmounts) {
        if (minorAmounts[mid] < 0) {
            return true;
        }
    }

    return false;
}

// Check if adding an item would cause negative amounts
function wouldCauseNegativeAmounts(personId, itemAmount) {
    const tipAmount = state.tipMode === 'percent' 
        ? (state.totalAmount * state.tipPercent) / 100 
        : state.tipAmount;
    const grandTotal = state.totalAmount + tipAmount;

    // Calculate total of individual items (including the new item)
    let totalItemsAmount = 0;
    Object.keys(state.items).forEach(pId => {
        state.items[pId].forEach(item => {
            totalItemsAmount += item.amount;
        });
    });
    // Add the new item amount
    totalItemsAmount += itemAmount;

    // Calculate total direct minor amounts
    let totalDirectMinorAmount = 0;
    state.minors.forEach(minor => {
        if (minor.directAmount !== null && minor.directAmount !== undefined) {
            totalDirectMinorAmount += minor.directAmount;
        }
    });

    // Amount to split among all people (excluding individual items and direct minor amounts)
    const amountToSplit = grandTotal - totalItemsAmount - totalDirectMinorAmount;

    // If amountToSplit is negative, it will definitely cause issues
    if (amountToSplit < 0) {
        return true;
    }

    // Calculate total number of people
    const totalPeople = state.adults.length + state.minors.length;
    
    // Calculate the even split per person
    const evenSplitPerPerson = totalPeople > 0 ? amountToSplit / totalPeople : 0;

    // Calculate minor amounts
    let totalMinorAmount = 0;
    const minorAmounts = {};
    
    state.minors.forEach(minor => {
        if (minor.directAmount !== null && minor.directAmount !== undefined) {
            minorAmounts[minor.id] = minor.directAmount;
            totalMinorAmount += minor.directAmount;
        } else {
            const minorAmount = evenSplitPerPerson * (minor.percent / 100);
            minorAmounts[minor.id] = minorAmount;
            totalMinorAmount += minorAmount;
        }
    });

    // Calculate remaining amount after minors
    const remainingAmount = amountToSplit - totalMinorAmount;
    
    // Split remaining amount among adults
    const adultCount = state.adults.length;
    const adultBaseAmount = adultCount > 0 ? remainingAmount / adultCount : 0;

    // Check if any adult would have negative amount
    for (let i = 0; i < state.adults.length; i++) {
        const adult = state.adults[i];
        let amount = adultBaseAmount;
        // Add individual items (including new item if it's for this adult)
        if (state.items[adult.id]) {
            state.items[adult.id].forEach(item => {
                amount += item.amount;
            });
        }
        if (adult.id === personId) {
            amount += itemAmount;
        }
        if (amount < 0) {
            return true;
        }
    }

    // Check if any minor would have negative amount
    for (const minorId in minorAmounts) {
        if (minorAmounts[minorId] < 0) {
            return true;
        }
    }

    return false;
}

// Calculate amounts
function calculateAmounts() {
    const tipAmount = state.tipMode === 'percent' 
        ? (state.totalAmount * state.tipPercent) / 100 
        : state.tipAmount;
    const grandTotal = state.totalAmount + tipAmount;

    // Calculate total of individual items
    let totalItemsAmount = 0;
    Object.values(state.items).forEach(personItems => {
        personItems.forEach(item => {
            totalItemsAmount += item.amount;
        });
    });

    // Calculate total direct minor amounts
    let totalDirectMinorAmount = 0;
    state.minors.forEach(minor => {
        if (minor.directAmount !== null && minor.directAmount !== undefined) {
            totalDirectMinorAmount += minor.directAmount;
        }
    });

    // Amount to split among all people (excluding individual items and direct minor amounts)
    const amountToSplit = grandTotal - totalItemsAmount - totalDirectMinorAmount;

    // Calculate total number of people
    const totalPeople = state.adults.length + state.minors.length;
    
    // Calculate the even split per person (if everyone paid equally)
    const evenSplitPerPerson = totalPeople > 0 ? amountToSplit / totalPeople : 0;

    // Calculate minor amounts
    // For percentage-based minors: they pay evenSplitPerPerson * (percent / 100)
    // For direct amount minors: they pay their direct amount
    let totalMinorAmount = 0;
    const minorAmounts = {};
    
    state.minors.forEach(minor => {
        if (minor.directAmount !== null && minor.directAmount !== undefined) {
            // Use direct amount
            minorAmounts[minor.id] = minor.directAmount;
            totalMinorAmount += minor.directAmount;
        } else {
            // Use percentage-based amount: even split * percentage
            const minorAmount = evenSplitPerPerson * (minor.percent / 100);
            minorAmounts[minor.id] = minorAmount;
            totalMinorAmount += minorAmount;
        }
    });

    // Calculate remaining amount after minors
    const remainingAmount = amountToSplit - totalMinorAmount;
    
    // Split remaining amount among adults
    const adultCount = state.adults.length;
    const adultBaseAmount = adultCount > 0 ? remainingAmount / adultCount : 0;

    // Calculate final amounts
    const amounts = {};

    // Adults: base amount + individual items
    state.adults.forEach(adult => {
        let amount = adultBaseAmount;
        // Add individual items
        if (state.items[adult.id]) {
            state.items[adult.id].forEach(item => {
                amount += item.amount;
            });
        }
        amounts[adult.id] = amount;
    });

    // Minors: use pre-calculated amounts
    Object.assign(amounts, minorAmounts);

    return amounts;
}

// Render calculation page
function renderCalculationPage() {
    peopleList.innerHTML = '';
    
    const amounts = calculateAmounts();
    const allPeople = [...state.adults, ...state.minors];

    allPeople.forEach(person => {
        const personRow = createPersonRow(person, amounts[person.id]);
        peopleList.appendChild(personRow);
    });
}

// Create person row
function createPersonRow(person, amount) {
    const row = document.createElement('div');
    row.className = 'person-row';
    row.dataset.personId = person.id;

    const isMinor = person.type === 'minor';
    const icon = isMinor ? '👶' : '😊';

    row.innerHTML = `
        <div class="person-header">
            <div class="person-info">
                <div class="person-icon ${isMinor ? 'minor' : ''}">${icon}</div>
                <div class="person-name-wrapper">
                    <input type="text" class="person-name" value="${person.name}" data-person-id="${person.id}">
                    <button type="button" class="person-name-clear" style="display: none;">×</button>
                </div>
            </div>
            <div class="person-amount">$${amount.toFixed(2)}</div>
        </div>
        ${isMinor ? createMinorControls(person) : createAdultControls(person)}
        ${createItemsList(person)}
    `;

    // Attach event listeners
    attachPersonName(row, person);
    if (isMinor) {
        attachMinorControls(row, person);
    } else {
        attachAdultControls(row, person);
    }

    attachItemsList(row, person);

    return row;
}

// Create minor controls
function createMinorControls(person) {
    const hasDirectAmount = person.directAmount !== null && person.directAmount !== undefined;
    const directAmountValue = hasDirectAmount ? person.directAmount.toFixed(2) : '';
    
    return `
        <div class="minor-controls">
            <div class="minor-percent-options">
                <button class="minor-percent-btn ${!hasDirectAmount && person.percent === 25 ? 'active' : ''}" data-percent="25">25%</button>
                <button class="minor-percent-btn ${!hasDirectAmount && person.percent === 50 ? 'active' : ''}" data-percent="50">50%</button>
                <button class="minor-percent-btn ${!hasDirectAmount && person.percent === 75 ? 'active' : ''}" data-percent="75">75%</button>
            </div>
            <div class="minor-or-divider">OR</div>
            <div class="minor-amount-input-wrapper">
                <span class="currency">$</span>
                <input type="number" step="0.01" min="0" placeholder="0.00" class="minor-amount-input" value="${directAmountValue}" data-person-id="${person.id}">
            </div>
        </div>
    `;
}

// Create adult controls
function createAdultControls(person) {
    return `
        <div class="item-controls">
            <button class="add-item-btn" data-item-type="beverage">
                <span class="item-icon">🥤</span>
                <span>Add Drink</span>
            </button>
            <button class="add-item-btn" data-item-type="food">
                <span class="item-icon">🍔</span>
                <span>Add Food</span>
            </button>
        </div>
    `;
}

// Create items list
function createItemsList(person) {
    const items = state.items[person.id] || [];
    
    if (items.length === 0) {
        return '<div class="items-list" style="display: none;"></div>';
    }

    let itemsHTML = '<div class="items-list">';
    items.forEach((item, index) => {
        itemsHTML += `
            <div class="item-row">
                <div class="item-info">
                    <span class="item-icon">${item.type === 'beverage' ? '🥤' : '🍔'}</span>
                    <span class="item-name">${item.name}</span>
                </div>
                <div class="item-amount">$${item.amount.toFixed(2)}</div>
                <button class="remove-item-btn" data-item-index="${index}">×</button>
            </div>
        `;
    });
    itemsHTML += '</div>';

    return itemsHTML;
}

// Attach person name input
function attachPersonName(row, person) {
    const nameInput = row.querySelector('.person-name');
    const clearBtn = row.querySelector('.person-name-clear');
    
    // Function to toggle clear button visibility
    const toggleClearButton = () => {
        if (nameInput.value.trim() && document.activeElement === nameInput) {
            clearBtn.style.display = 'flex';
        } else {
            clearBtn.style.display = 'none';
        }
    };
    
    // Clear button click handler
    clearBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        nameInput.value = '';
        person.name = ''; // Update the person's name to empty
        nameInput.focus();
        toggleClearButton();
    });
    
    // Show/hide clear button on input
    nameInput.addEventListener('input', toggleClearButton);
    
    // Show clear button on focus
    nameInput.addEventListener('focus', toggleClearButton);
    
    // Hide clear button on blur
    nameInput.addEventListener('blur', () => {
        const newName = nameInput.value.trim();
        if (newName) {
            person.name = newName;
        } else {
            // Only restore if it was empty and we didn't intentionally clear it
            // If person.name is already empty, don't restore
            if (person.name) {
                nameInput.value = person.name;
            }
        }
        toggleClearButton();
    });
    
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            nameInput.blur();
        }
    });
}

// Attach minor controls
function attachMinorControls(row, person) {
    const buttons = row.querySelectorAll('.minor-percent-btn');
    const amountInput = row.querySelector('.minor-amount-input');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const percent = parseInt(btn.dataset.percent);
            person.percent = percent;
            person.directAmount = null; // Clear direct amount when using percentage
            
            // Update active state
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Clear amount input
            amountInput.value = '';
            
            // Recalculate and re-render
            renderCalculationPage();
        });
    });
    
    // Handle direct amount input
    amountInput.addEventListener('input', () => {
        const value = parseFloat(amountInput.value);
        
        if (!isNaN(value) && value > 0) {
            // Check if this amount would cause negative amounts
            if (wouldCauseNegativeMinorAmount(person.id, value)) {
                alert('This amount would cause other attendees to have negative amounts. Please reduce the amount.');
                amountInput.value = person.directAmount !== null && person.directAmount !== undefined 
                    ? person.directAmount.toFixed(2) 
                    : '';
                return;
            }
            
            person.directAmount = value;
            person.percent = 50; // Reset to default, but won't be used
            
            // Remove active state from percentage buttons
            buttons.forEach(b => b.classList.remove('active'));
            
            // Recalculate and re-render
            renderCalculationPage();
        } else if (amountInput.value === '' || amountInput.value === '0' || isNaN(value)) {
            person.directAmount = null;
            
            // Recalculate and re-render
            renderCalculationPage();
        }
    });
    
    // Handle blur to ensure value is set
    amountInput.addEventListener('blur', () => {
        const value = parseFloat(amountInput.value);
        if (isNaN(value) || value <= 0) {
            person.directAmount = null;
            amountInput.value = '';
            renderCalculationPage();
        } else {
            // Validate again on blur
            if (wouldCauseNegativeMinorAmount(person.id, value)) {
                alert('This amount would cause other attendees to have negative amounts. Please reduce the amount.');
                person.directAmount = null;
                amountInput.value = '';
                renderCalculationPage();
            }
        }
    });
}

// Attach adult controls
function attachAdultControls(row, person) {
    const addItemBtns = row.querySelectorAll('.add-item-btn');
    addItemBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const itemType = btn.dataset.itemType;
            // Remove active state from all buttons
            addItemBtns.forEach(b => b.classList.remove('active'));
            // Add active state to clicked button
            btn.classList.add('active');
            showItemInput(row, person, itemType);
        });
    });
}

// Show item input
function showItemInput(row, person, itemType) {
    const itemsList = row.querySelector('.items-list');
    
    // Remove any existing input group
    let inputGroup = row.querySelector('.item-input-group');
    if (inputGroup) {
        inputGroup.remove();
    }

    inputGroup = document.createElement('div');
    inputGroup.className = 'item-input-group';
    inputGroup.innerHTML = `
        <input type="number" step="0.01" min="0" placeholder="Amount" class="item-amount-input">
        <button class="add-item-confirm-btn">Add</button>
        <button class="cancel-item-btn">Cancel</button>
    `;

    const personHeader = row.querySelector('.person-header');
    personHeader.after(inputGroup);

    // Focus on amount input
    inputGroup.querySelector('.item-amount-input').focus();

    // Add item
    const addItem = () => {
        const amountInput = inputGroup.querySelector('.item-amount-input');
        const amount = parseFloat(amountInput.value);

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        // Check if adding this item would cause negative amounts
        if (wouldCauseNegativeAmounts(person.id, amount)) {
            alert('Adding this item would cause other attendees to have negative amounts. Please reduce the item amount or remove other items.');
            return;
        }

        // Initialize items array if needed
        if (!state.items[person.id]) {
            state.items[person.id] = [];
        }

        // Count existing items of the same type to generate name
        const existingItemsOfType = state.items[person.id].filter(item => item.type === itemType);
        const itemNumber = existingItemsOfType.length + 1;
        const namePrefix = itemType === 'beverage' ? 'drink' : 'food';
        const name = `${namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1)}-${itemNumber}`;

        // Add item
        state.items[person.id].push({
            name,
            amount,
            type: itemType
        });

        // Remove active state from button
        const addItemBtns = row.querySelectorAll('.add-item-btn');
        addItemBtns.forEach(b => b.classList.remove('active'));

        // Remove input group
        inputGroup.remove();

        // Recalculate and re-render
        renderCalculationPage();
    };

    inputGroup.querySelector('.add-item-confirm-btn').addEventListener('click', addItem);

    // Allow Enter key to submit
    inputGroup.querySelector('.item-amount-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addItem();
        }
    });

    // Cancel
    inputGroup.querySelector('.cancel-item-btn').addEventListener('click', () => {
        // Remove active state from button
        const addItemBtns = row.querySelectorAll('.add-item-btn');
        addItemBtns.forEach(b => b.classList.remove('active'));
        inputGroup.remove();
    });
}

// Attach items list
function attachItemsList(row, person) {
    const removeBtns = row.querySelectorAll('.remove-item-btn');
    removeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.itemIndex);
            state.items[person.id].splice(index, 1);
            
            // If no items left, remove the array
            if (state.items[person.id].length === 0) {
                delete state.items[person.id];
            }

            // Recalculate and re-render
            renderCalculationPage();
        });
    });
}

