const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    console.log("Serving customer.html");
    res.sendFile(path.join(__dirname, 'public', 'customer.html'));
});

app.get('/admin', (req, res) => {
    console.log("Serving index.html");
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'cosc3380',
    password: 'BhimNicholas21',
    port: 5432,
});

//GETTING CUSTOMERS AT FIRST LOAD
app.get('/customer', async (req, res) => {
    try {
        console.log('Fetching customer...');
        const result = await pool.query('SELECT * FROM customer');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching customer:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/employeepositions', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM employeeposition ORDER BY positionid');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching employee positions:', err.message);
        res.status(500).json({ error: 'Failed to fetch employee positions.' });
    }
});



//RESTURANT LOCATIONS
app.get('/restaurantlocations', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM restaurantlocation');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching restaurant locations:', err.message);
        res.status(500).json({ error: 'Failed to fetch restaurant locations' });
    }
});


//GETTING MENU ITEMS
app.get('/menuitem', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM menuitem');
        res.json(result.rows);  
    } catch (err) {
        console.error('Error fetching menu items:', err.message);
        res.status(500).json({ error: 'Failed to fetch menu items' });
    }
});


//GETTING RECEIPT
app.get('/receipt', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM receipt');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching receipts:', err.message);
        res.status(500).json({ error: 'Failed to fetch receipts' });
    }
});

//GETTING BANK ACCOUNTS
app.get('/bankaccount', async(req,res) => {
    try {
        const result = await pool.query('SELECT * FROM bankaccount');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching bank accounts:', err.message);
        res.status(500).json({ error: 'Failed to fetch receipts'});
    }
});

//GETTING ORDERITEM
app.get('/orderitem', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orderitem');
        res.json(result.rows);  
    } catch (err) {
        console.error('Error fetching order items:', err.message);
        res.status(500).json({ error: 'Failed to fetch order items' });
    }
});

app.get('/getPromoCodes', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT promocode, discountpercentage, description 
            FROM public.promo
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching promo codes:', err.message);
        res.status(500).json({ error: 'Failed to fetch promo codes.' });
    }
});


app.post('/generateRandomOrders', async (req, res) => {
    try {
        console.log('Generating 100 random orders...');

        const orders = [];
        // Get customer ids from the database
        const customerResult = await pool.query('SELECT id FROM customer');
        const customerIds = customerResult.rows.map(row => row.id);

        // Retrieve all location_ids from the restaurantlocation table
        const locationResult = await pool.query('SELECT locationid FROM restaurantlocation');
        const locationIds = locationResult.rows.map(row => row.locationid);

        // Retrieve all menu items from the menuitem table
        const menuItemResult = await pool.query('SELECT id, price FROM menuitem');
        const menuItems = menuItemResult.rows;

        for (let i = 0; i < 100; i++) {
            try {
                // Randomly select customer and location
                const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
                const locationId = locationIds[Math.floor(Math.random() * locationIds.length)];
                const paymentMethod = ['Cash', 'Credit', 'Online'][Math.floor(Math.random() * 3)];
                const totalAmount = (Math.random() * 90 + 10).toFixed(2);  // Random amount between $10 and $100

                console.log(`Creating order ${i + 1}: Customer ${customerId}, Location ${locationId}, Payment ${paymentMethod}, Total $${totalAmount}`);

                // Insert the order (receipt) into the receipt table
                const insertOrderQuery = `
                    INSERT INTO receipt (customer_id, location_id, total_amount, payment_method, order_date)
                    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING ReceiptNumber
                `;
                const orderResult = await pool.query(insertOrderQuery, [customerId, locationId, totalAmount, paymentMethod]);
                const orderId = orderResult.rows[0].ReceiptNumber;

                console.log(`Order ${i + 1}: Order ID ${orderId} created for Customer ${customerId}`);

                // Random number of items to add to the order (between 1 and 5 items)
                const itemCount = Math.floor(Math.random() * 5) + 1;  

                for (let j = 0; j < itemCount; j++) {
                    const randomItem = menuItems[Math.floor(Math.random() * menuItems.length)]; // Randomly select a menu item
                    const quantity = Math.floor(Math.random() * 3) + 1;  // Random quantity between 1 and 3
                    const totalPrice = (randomItem.price * quantity).toFixed(2);

                    // Insert the item into the orderitem table
                    const insertOrderItemQuery = `
                        INSERT INTO orderitem (receipt_id, item_id, quantity, total_price)
                        VALUES ($1, $2, $3, $4)
                    `;
                    await pool.query(insertOrderItemQuery, [orderId, randomItem.id, quantity, totalPrice]);

                    console.log(`Item ${randomItem.id}: Added item to order ${orderId}, Total price $${totalPrice}`);
                }

                orders.push(orderId);  // Add the generated order ID to the orders list
            } catch (err) {
                console.error(`Error creating order ${i + 1}:`, err.message);
                continue;
            }
        }

        console.log('Successfully generated 100 random orders.');

        res.status(200).json({
            message: '100 random orders generated successfully!',
            orders,  // List of generated order IDs
        });
    } catch (err) {
        console.error('Error generating random orders:', err.message);
        res.status(500).json({ error: 'Failed to generate random orders.' });
    }
});




app.post('/addEmployee', async (req, res) => {
    const { name, salary, locationid, positionid } = req.body;

    if (!name || !salary || !locationid || !positionid) {
        console.log('Invalid input:', { name, salary, locationid, positionid });
        return res.status(400).json({ error: 'All fields are required.' });
    }

    console.log('Adding new employee:', { name, salary, locationid, positionid });

    try {
        const insertEmployeeQuery = `
            INSERT INTO employee (name, salary, locationid, positionid)
            VALUES ($1, $2, $3, $4) RETURNING *
        `;
        const result = await pool.query(insertEmployeeQuery, [name, salary, locationid, positionid]);

        console.log('Employee added successfully:', result.rows[0]);

        res.status(201).json({
            message: 'Employee added successfully',
            employee: result.rows[0],
        });
    } catch (err) {
        console.error('Error adding employee:', err.message);
        res.status(500).json({ error: 'Failed to add employee.' });
    }
});



app.post('/customer', async (req, res) => {
    const { name, email, phoneNumber, membershipStatus, loyaltyPoints } = req.body;
    try {
        console.log('Adding new customer:', name, email, phoneNumber, membershipStatus, loyaltyPoints);
        const result = await pool.query(
            'INSERT INTO customer (name, email, phone_number, membership_status, loyalty_points) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, email, phoneNumber, membershipStatus, loyaltyPoints]
        );
        res.status(201).json(result.rows[0]); 
    } catch (err) {
        console.error('Error adding customer:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/addPromoCode', async (req, res) => {
    const { promocode, discountpercentage, description } = req.body;

    console.log('Received request to add promo code:', { promocode, discountpercentage, description });

    if (!promocode || !discountpercentage || !description) {
        console.log('Invalid input received:', { promocode, discountpercentage, description });
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const checkPromoQuery = 'SELECT * FROM promo WHERE LOWER(promocode) = LOWER($1)';
        console.log('Executing query to check existing promo:', checkPromoQuery, promocode);
        const existingPromo = await pool.query(checkPromoQuery, [promocode]);

        console.log('Result of existing promo check:', existingPromo.rows);

        if (existingPromo.rows.length > 0) {
            console.log('Promo code already exists:', promocode);
            return res.status(400).json({ error: 'Promo code already exists.' });
        }

        const insertPromoQuery = `
            INSERT INTO promo (promocode, discountpercentage, description)
            VALUES ($1, $2, $3) RETURNING *
        `;
        console.log('Executing insert query:', insertPromoQuery, [promocode, discountpercentage, description]);

        const result = await pool.query(insertPromoQuery, [promocode, discountpercentage, description]);

        console.log('Promo code inserted successfully:', result.rows[0]);

        res.status(201).json({
            message: 'Promo code added successfully',
            promo: result.rows[0]
        });
    } catch (err) {
        console.error('Error adding promo code:', err);
        res.status(500).json({ error: 'Failed to add promo code' });
    }
});



app.post('/menuitem', async (req, res) => {
    const { name, price, category, quantity } = req.body;

    if (!name || !price || !category || quantity === undefined) {
        return res.status(400).json({ error: 'Missing required fields (name, price, category, quantity)' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO menuitem (name, price, category, quantity) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, price, category, quantity]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding menu item:', err.message);
        res.status(500).json({ error: err.message });
    }
});


app.delete('/menuitem/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const ordersCheck = await pool.query('SELECT * FROM orderitem WHERE item_id = $1', [id]);
        
        if (ordersCheck.rows.length > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete menu item. It is referenced in existing orders.',
                ordersCount: ordersCheck.rows.length
            });
        }

        const result = await pool.query('DELETE FROM menuitem WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json({ message: 'Menu item deleted', deletedItem: result.rows[0] });
    } catch (err) {
        console.error('Error deleting menu item:', err.message);
        res.status(500).json({ error: 'Failed to delete menu item' });
    }
});

app.post('/orderitem', async (req, res) => {
    const { receipt_id, item_id, quantity } = req.body;
    
    if (!receipt_id || !item_id || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO orderitem (receipt_id, item_id, quantity) VALUES ($1, $2, $3) RETURNING *',
            [receipt_id, item_id, quantity]
        );

        res.status(201).json(result.rows[0]);  
    } catch (err) {
        console.error('Error adding order item:', err.message);
        res.status(500).json({ error: 'Failed to add order item' });
    }
});

app.post('/processOrder', async (req, res) => {
    const { customerID, orderItem } = req.body;  

    try {
        await pool.query('BEGIN');

        for (let item of orderItem) {
            const { item_id, quantity } = item;

            const menuItemResult = await pool.query(
                'SELECT quantity FROM menuitem WHERE id = $1',
                [item_id]
            );

            if (menuItemResult.rows.length === 0) {
                throw new Error(`Menu item with ID ${item_id} not found`);
            }

            const currentQuantity = menuItemResult.rows[0].quantity;

            if (currentQuantity < quantity) {
                throw new Error(`Insufficient quantity for item ID ${item_id}`);
            }

            await pool.query(
                'UPDATE menuitem SET quantity = quantity - $1 WHERE id = $2',
                [quantity, item_id]
            );
        }

        await pool.query('COMMIT');

        res.json({ message: 'Order processed successfully' });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error processing order:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/getEmployees', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT employeeid, name, salary, locationid, positionid
            FROM public.employee
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching employees:', err.message);
        res.status(500).json({ error: 'Failed to fetch employees.' });
    }
});

app.post('/addEmployee', async (req, res) => {
    const { name, salary, locationId, positionId } = req.body;
    try {
        await pool.query(`
            INSERT INTO public.employee (name, salary, locationid, positionid)
            VALUES ($1, $2, $3, $4)
        `, [name, salary, locationId, positionId]);

        res.status(200).json({ message: 'Employee added successfully!' });
    } catch (err) {
        console.error('Error adding employee:', err.message);
        res.status(500).json({ error: 'Failed to add employee.' });
    }
});



app.post('/addPromoCode', async (req, res) => {
    const { promoCode, discountPercentage, description } = req.body;
    try {
        await pool.query(`
            INSERT INTO public.promo (promocode, discountpercentage, description)
            VALUES ($1, $2, $3)
        `, [promoCode, discountPercentage, description]);

        res.status(200).json({ message: 'Promo code added successfully!' });
    } catch (err) {
        console.error('Error adding promo code:', err.message);
        res.status(500).json({ error: 'Failed to add promo code.' });
    }
});



app.post('/processPayment', async (req, res) => {
    const { customerId, receiptId } = req.body;

    try {
        console.log(`Processing payment for customer ${customerId} and receipt ${receiptId}`);
        //START TRANSACTION
        await pool.query('BEGIN');

        const customerResult = await pool.query('SELECT balance FROM bankaccount WHERE customer_id = $1', [customerId]);
        if (customerResult.rows.length === 0) {
            console.log(`Customer with ID ${customerId} not found`);
            throw new Error('Customer bank account not found');
        }
        const currentBalance = parseFloat(customerResult.rows[0].balance);
        console.log(`Current balance for customer ${customerId}: $${currentBalance}`);

        const receiptResult = await pool.query('SELECT total_amount FROM receipt WHERE id = $1', [receiptId]);
        if (receiptResult.rows.length === 0) {
            console.log(`Receipt with ID ${receiptId} not found`);
            throw new Error('Receipt not found');
        }
        const receiptAmount = parseFloat(receiptResult.rows[0].total_amount);
        console.log(`Receipt amount: $${receiptAmount}`);

        if (currentBalance < receiptAmount) {
            console.log(`Insufficient funds: Current balance $${currentBalance} is less than receipt amount $${receiptAmount}`);
            throw new Error('Insufficient funds to process the payment');
        }

        const newBalance = currentBalance - receiptAmount;
        console.log(`New balance after payment: $${newBalance}`);

        await pool.query('UPDATE bankaccount SET balance = $1 WHERE customer_id = $2', [newBalance, customerId]);

        await pool.query(
            'INSERT INTO transaction (customer_id, receipt_id, amount) VALUES ($1, $2, $3)',
            [customerId, receiptId, receiptAmount]
        );

        await pool.query('COMMIT');

        console.log(`Payment processed successfully for customer ${customerId}. New balance: $${newBalance}`);
        res.json({ message: 'Payment processed successfully', newBalance: newBalance });
        //END TRANSACTION
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error processing payment:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/login', async (req, res) => {
    const { email } = req.body;
    console.log('Received email:', email);
    
    try {
      const result = await pool.query('SELECT * FROM customer WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        const customer = result.rows[0];
        console.log('Found customer:', customer);
        return res.json({ message: 'Login successful', customerId: customer.id });
      } else {
        return res.status(404).json({ message: 'Customer not found' });
      }
    } catch (error) {
      console.error('Error logging in:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/placeOrder', async (req, res) => {
    const { customerID, paymentMethod, items, locationId, promoCode = null } = req.body;
    console.log('Received order:', { customerID, paymentMethod, items, locationId, promoCode });

    if (!customerID || !paymentMethod || !items || items.length === 0 || !locationId) {
        return res.status(400).json({ error: 'Invalid order data' });
    }

    try {
        const totalAmount = calculateTotalAmount(items);

        const customerResult = await pool.query(
            'SELECT membership_status, loyalty_points FROM customer WHERE id = $1', 
            [customerID]
        );
        const customer = customerResult.rows[0];
        const isMember = customer.membership_status;
        let updatedLoyaltyPoints = customer.loyalty_points || 0;

        // Check if promo code exists and is valid
        let discountAmount = 0;
        if (promoCode) {
            const promoResult = await pool.query(
                'SELECT discountpercentage FROM promo WHERE promocode = $1', 
                [promoCode]
            );
            if (promoResult.rows.length > 0) {
                const discountPercentage = promoResult.rows[0].discountpercentage;
                discountAmount = totalAmount * (discountPercentage / 100);
            }
        }

        const finalTotalAmount = totalAmount - discountAmount;

        if (isMember) {
            updatedLoyaltyPoints += 10;
            await pool.query(
                'UPDATE customer SET loyalty_points = $1 WHERE id = $2',
                [updatedLoyaltyPoints, customerID]
            );
        }

        // Insert receipt with location_id and promo_code
        const receiptResult = await pool.query(
            'INSERT INTO receipt (customer_id, location_id, total_amount, payment_method, promo_code) VALUES ($1, $2, $3, $4, $5) RETURNING ReceiptNumber',
            [customerID, locationId, finalTotalAmount, paymentMethod, promoCode]
        );
        const receiptId = receiptResult.rows[0].receiptnumber;

        // Insert order items
        for (const item of items) {
            await pool.query(
                'INSERT INTO orderitem (receipt_id, item_id, quantity, total_price) VALUES ($1, $2, $3, $4)',
                [receiptId, item.id, 1, item.price]  
            );
            
            await pool.query(
                'UPDATE menuitem SET quantity = quantity - 1 WHERE id = $1',
                [item.id]
            );
        }

        const bankAccountResult = await pool.query(
            'SELECT id, balance FROM bankaccount WHERE customer_id = $1',
            [customerID]
        );
        const bankAccount = bankAccountResult.rows[0];

        if (bankAccount.balance < finalTotalAmount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        const newBalance = bankAccount.balance - finalTotalAmount;
        await pool.query(
            'UPDATE bankaccount SET balance = $1 WHERE id = $2',
            [newBalance, bankAccount.id]
        );

        // Insert transaction
        await pool.query(
            'INSERT INTO transaction (customer_id, receipt_id, amount, bankaccount_id) VALUES ($1, $2, $3, $4)',
            [customerID, receiptId, finalTotalAmount, bankAccount.id]
        );

        res.status(201).json({
            message: 'Order placed and payment processed successfully!',
            receiptId: receiptId,
            newBalance: newBalance,
            loyaltyPoints: isMember ? updatedLoyaltyPoints : null,
            isMember: isMember,
            discountApplied: discountAmount > 0
        });
    } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


function calculateTotalAmount(items) {
    return items.reduce((total, item) => total + item.price, 0);
}

app.post('/restaurantlocations', async (req, res) => {
    const { address, capacity } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO restaurantlocation (address, capacity) VALUES ($1, $2) RETURNING *',
            [address, capacity]
        );

        res.status(201).json(result.rows[0]); 
    } catch (err) {
        console.error('Error adding restaurant location:', err.message);
        res.status(500).json({ error: 'Failed to add restaurant location' });
    }
});


app.post('/receipt', async (req, res) => {
    const { orderDate, totalAmount, paymentMethod, customerID } = req.body;

    try {
        console.log('Your receipt:', { orderDate, totalAmount, paymentMethod, customerID });

        const customerResult = await pool.query('SELECT id FROM customer WHERE id = $1', [customerID]);
        if (customerResult.rows.length === 0) {
            console.log('Customer not found:', customerID);
            return res.status(400).json({ error: 'Customer not found' });
        }

        const result = await pool.query(
            'INSERT INTO receipt (order_date, total_amount, payment_method, customer_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [orderDate, totalAmount, paymentMethod, customerID]
        );

        console.log('Receipt added:', result.rows[0]);
        res.status(201).json(result.rows[0]); 
    } catch (err) {
        console.error('Error adding receipt:', err.message);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/bankaccount', async (req, res) => {
    const { balance, customerID } = req.body;
    
    console.log('Adding bank account...:', { balance, customerID });

    try {
        const existingAccount = await pool.query('SELECT id FROM bankaccount WHERE customer_id = $1', [customerID]);
        if (existingAccount.rows.length > 0) {
            return res.status(400).json({ error: 'This customer already has a bank account.' });
        }

        const customerResult = await pool.query('SELECT id FROM customer WHERE id = $1', [customerID]);
        if (customerResult.rows.length === 0) {
            console.log('Customer not found:', customerID);
            return res.status(400).json({ error: 'Customer not found' });
        }
        const result = await pool.query(
            'INSERT INTO bankaccount (balance, customer_id) VALUES ($1, $2) RETURNING *',
            [balance, customerID]
        );
        console.log('Bank account added successfully:', result.rows[0]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error occurred while adding bank account:', err.message);
        res.status(500).json({ error: 'Failed to add bank account. Customer already has an existing bank account. Please try again.' });
    }
});

app.put('/customer/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phoneNumber, membershipStatus, loyaltyPoints } = req.body;
    try {
        console.log(`Updating customer ID ${id}...`);
        const result = await pool.query(
            'UPDATE customer SET name = $1, email = $2, phone_number = $3, membership_status = $4, loyalty_points = $5 WHERE id = $6 RETURNING *',
            [name, email, phoneNumber, membershipStatus, loyaltyPoints, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(result.rows[0]); 
    } catch (err) {
        console.error('Error updating customer:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.put('/menu_items/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, price, available } = req.body;

    try {
        const result = await pool.query(
            `UPDATE menu_items
             SET name = $1, description = $2, price = $3, available = $4
             WHERE id = $5
             RETURNING *`,
            [name, description, price, available, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating menu item:', err.message);
        res.status(500).json({ error: 'Failed to update menu item' });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
