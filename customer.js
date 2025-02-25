document.addEventListener('DOMContentLoaded', () => {
    console.log("Customer JS script loaded!");
    console.log("DOM fully loaded");
    fetchMenuItem();
    fetchRestaurantLocations();
    fetchOrderItem();

    const menuItemContainer = document.querySelector('#menuItem') || document.createElement('div');
    const selectedItemsContainer = document.getElementById('selectedItems') || document.createElement('div');
    const orderTotalElement = document.getElementById('orderTotal') || document.createElement('div');
    
    const registrationForm = document.getElementById('registrationForm');
    const registrationToggle = document.getElementById('registrationToggle');
    const showRegistrationLink = document.getElementById('showRegistration');
    const loginForm = document.getElementById('loginForm');
    const restaurantLocationsBody = document.getElementById('restaurantLocationsBody');
    const addRestaurantLocationForm = document.getElementById('addRestaurantLocationForm');

    let selectedItems = [];
    let totalPrice = 0;
    
    async function fetchMenuItem() {
        try {
            const response = await fetch('/menuitem');
            if (!response.ok) {
                throw new Error('Failed to fetch menu items');
            }
    
            const menuItemData = await response.json();
            console.log("Menu Items Fetched:", menuItemData);  
            populateMenuItem(menuItemData);  
        } catch (error) {
            console.error('Error fetching menu items:', error);
            alert('Failed to load menu items. Please try again later.');
        }
    }

    async function fetchMenuItem() {
        try {
            const response = await fetch('/menuitem');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const menuItemData = await response.json();

            if (!menuItemContainer) {
                console.error('Menu items container not found');
                return;
            }
            
            menuItemContainer.innerHTML = '';
            
            menuItemData.forEach(item => {
                const menuItemElement = document.createElement('div');
                menuItemElement.classList.add('menu-item');
                menuItemElement.setAttribute('data-id', item.id);
                menuItemElement.setAttribute('price', item.price);
                menuItemElement.setAttribute('data-name', item.name);
                
                menuItemElement.innerHTML = `
                    <h3>${item.name}</h3>
                    <p>$${parseFloat(item.price).toFixed(2)}</p>
                    <p>${item.category}</p>
                    <button>Add to Order</button>
                `;
                
                menuItemElement.addEventListener('click', () => {
                    const id = item.id;
                    const name = item.name;
                    const price = parseFloat(item.price);

                    if (isNaN(price)) {
                        console.error('Invalid price for item:', name);
                        alert(`Unable to add ${name} - price not available`);
                        return;
                    }

                    selectedItems.push({ id, name, price });

                    totalPrice += price;
                    
                    updateOrderSummary();
                });

                menuItemContainer.appendChild(menuItemElement);
            });

        } catch (error) {
            console.error('Error fetching menu items:', error);
            const errorElement = document.createElement('div');
            errorElement.textContent = 'Unable to load menu items. Please refresh the page or contact support.';
            errorElement.style.color = 'red';
            if (menuItemContainer) {
                menuItemContainer.appendChild(errorElement);
            }
        }
    }

    function updateOrderSummary() {
        // Clear previous selected items
        if (selectedItemsContainer) {
            selectedItemsContainer.innerHTML = '';
            
            selectedItems.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.textContent = `${item.name} - $${item.price.toFixed(2)}`;
                selectedItemsContainer.appendChild(itemElement);
            });
        }

        if (orderTotalElement) {
            orderTotalElement.textContent = `Total: $${totalPrice.toFixed(2)}`;
        }
    }

    const placeOrderButton = document.createElement('button');
    placeOrderButton.textContent = 'Place Cosmic Order';
    placeOrderButton.classList.add('place-order-btn');

    const orderSummarySection = document.querySelector('.order-summary');
    if (orderSummarySection) {
        orderSummarySection.appendChild(placeOrderButton);
    }

    if (showRegistrationLink && registrationForm && loginForm && registrationToggle) {
        showRegistrationLink.addEventListener('click', (e) => {
            e.preventDefault();
            registrationForm.style.display = 'block';
            loginForm.style.display = 'none';
            registrationToggle.style.display = 'none';
        });
    }

    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const phoneNumber = document.getElementById('regPhone').value;
            const membershipStatus = document.getElementById('regMembership').checked;

            try {
                const response = await fetch('/customer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        phoneNumber: phoneNumber,
                        membershipStatus: membershipStatus,
                        loyaltyPoints: 0 
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    localStorage.setItem('customerId', result.customerId);  // Changed from result.id
                    
                    await fetch('/bankaccount', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            balance: 10000, 
                            customerID: result.customerId  // Changed from result.id
                        })
                    });

                    alert('Registration successful! You are now logged in.');
                    
                    // Reset and hide registration form
                    registrationForm.reset();
                    registrationForm.style.display = 'none';
                    loginForm.style.display = 'block';
                    registrationToggle.style.display = 'block';
                } else {
                    throw new Error(result.error || 'Registration failed');
                }
            } catch (error) {
                console.error('Registration Error:', error);
                alert(error.message);
            }
        });
    }

    if (placeOrderButton) {
        placeOrderButton.addEventListener('click', async () => {
            const customerID = localStorage.getItem('customerId');
            const selectedLocationId = localStorage.getItem('selectedLocationId');
            const promoCode = document.getElementById('promoCode') ? document.getElementById('promoCode').value.trim() : null;
            
            if (!customerID) {
                alert('Please log in first');
                return;
            }
    
            if (!selectedLocationId) {
                alert('Please select a location before placing your order');
                return;
            }
    
            if (selectedItems.length === 0) {
                alert('Please select items for your order');
                return;
            }
    
            try {
                const response = await fetch('/placeOrder', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        customerID: customerID,
                        paymentMethod: 'online',
                        items: selectedItems,
                        locationId: selectedLocationId,
                        promoCode: promoCode || null
                    })
                });
    
                const result = await response.json();
    
                if (response.ok) {
                    let successMessage = 'Order placed successfully!';
                    
                    // Detailed success message for members
                    if (result.isMember) {
                        successMessage += `\nYou now have ${result.loyaltyPoints} loyalty points!`;
                    }
    
                    // Optional: Add promo code discount information
                    if (result.discountApplied) {
                        successMessage += '\nPromo code discount applied!';
                    }
    
                    // Optional: Show new bank balance
                    if (result.newBalance !== undefined) {
                        successMessage += `\nNew Account Balance: $${result.newBalance.toFixed(2)}`;
                    }
    
                    alert(successMessage);
                    
                    // Reset order state
                    selectedItems = [];
                    totalPrice = 0;
                    updateOrderSummary();
    
                    // Optional: Clear promo code input
                    if (document.getElementById('promoCode')) {
                        document.getElementById('promoCode').value = '';
                    }
                } else {
                    throw new Error(result.error || 'Failed to place order');
                }
            } catch (error) {
                console.error('Order Error:', error);
                alert(error.message);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = loginForm.querySelector('input[type="email"]');
            
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: emailInput.value
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    localStorage.setItem('customerId', result.customerId);
                    alert('Login successful!');
                } else {
                    throw new Error(result.message || 'Login failed');
                }
            } catch (error) {
                console.error('Login Error:', error);
                alert(error.message);
            }
        });
    }

    async function fetchRestaurantLocations() {
        try {
            console.log("Fetching restaurant locations...");  
            const response = await fetch('/restaurantlocations');
            if (!response.ok) {
                throw new Error('Failed to fetch locations');
            }
    
            const locations = await response.json();
            console.log("Raw Locations Data:", locations);  
    
            // Add extensive logging
            const locationSelect = document.getElementById('locationSelect');
            console.log("Location Select Element:", locationSelect);
    
            if (!locationSelect) {
                console.error('CRITICAL: Location select dropdown not found in DOM');
                return;
            }
    
            // Clear existing options
            locationSelect.innerHTML = '<option value="">Select a GalactiBowl Location</option>';
    
            locations.forEach(location => {
                console.log("Processing Location:", location);
                const option = document.createElement('option');
                
                // Verify these match your backend's actual property names
                option.value = location.locationid || location.id || '';
                option.textContent = location.address || 'Unknown Location'; 
                
                console.log("Created Option:", {
                    value: option.value,
                    text: option.textContent
                });
    
                locationSelect.appendChild(option);
            });
    
            // Add event listener here to ensure it's added after population
            locationSelect.addEventListener('change', (e) => {
                const selectedLocationId = e.target.value;
                console.log('Raw Selected Location Value:', selectedLocationId);
                
                if (selectedLocationId) {
                    console.log('Selected Location ID:', selectedLocationId);
                    localStorage.setItem('selectedLocationId', selectedLocationId);
                    
                    const selectedOption = e.target.options[e.target.selectedIndex];
                    console.log('Selected Option Details:', {
                        value: selectedOption.value,
                        text: selectedOption.textContent
                    });
                    
                    alert(`You selected: ${selectedOption.text}`);
                } else {
                    console.log('No location selected');
                    localStorage.removeItem('selectedLocationId');
                }
            });
    
        } catch (error) {
            console.error('DETAILED Error fetching restaurant locations:', error);
            alert('Failed to load restaurant locations. Please try again.');
        }
    }
         

    if (addRestaurantLocationForm) {
        addRestaurantLocationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const addressInput = document.getElementById('locationAddress');
            const capacityInput = document.getElementById('locationCapacity');

            try {
                const response = await fetch('/restaurantlocations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        address: addressInput.value,
                        capacity: parseInt(capacityInput.value)
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    alert('Restaurant location added successfully!');
                    addressInput.value = '';
                    capacityInput.value = '';
                    fetchRestaurantLocations(); 
                } else {
                    throw new Error(result.error || 'Failed to add location');
                }
            } catch (error) {
                console.error('Error adding restaurant location:', error);
                alert(error.message);
            }
        });
    }

    if (!restaurantLocationsBody) {
        console.error('Element with ID "restaurantLocationsBody" not found in DOM');
        return;
    }

async function fetchOrderItem() {
    try {
        const response = await fetch('/orderitem');
        if (!response.ok) {
        }

        const orderItemData = await response.json();
        console.log("Order Items Fetched:", orderItemData);  
        populateOrderItem(orderItemData);  
    } catch (error) {
        console.error('Error fetching order items:', error);
    }
}

function populateOrderItem(orderItem) {
    const orderItemTable = document.getElementById('orderItemTable');
    orderItemTable.innerHTML = ''; 

    orderItem.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.receipt_id}</td>   <!-- Display Receipt ID -->
            <td>${item.item_id}</td>      <!-- Display Item ID -->
            <td>${item.quantity}</td>     <!-- Display Quantity -->
        `;
        orderItemTable.appendChild(row);
    });
}

    setInterval(fetchMenuItem, 60000);
});

async function applyPromoCode() {
    const promoCode = document.getElementById('promoCode').value.trim().toUpperCase();
    const totalAmount = parseFloat(document.getElementById('orderTotal').textContent.replace('Total: $', ''));

    if (!promoCode) {
        alert('Please enter a promo code.');
        return;
    }

    try {
        const response = await fetch('/checkPromoCode', {  
            method: 'POST',  
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ promoCode })  
        });

        const result = await response.json();

        if (response.ok) {
            const discountPercentage = result.discountpercentage;
            const discountAmount = (totalAmount * discountPercentage) / 100;
            const newTotal = totalAmount - discountAmount;

            document.getElementById('orderTotal').textContent = `Total: $${newTotal.toFixed(2)}`;
            document.getElementById('discountMessage').textContent = `Promo code applied! You saved $${discountAmount.toFixed(2)}.`;
        } else {
            alert(result.error || 'Invalid promo code');
        }
    } catch (error) {
        console.error('Error applying promo code:', error);
        alert('Failed to apply promo code. Please try again later.');
    }
}
