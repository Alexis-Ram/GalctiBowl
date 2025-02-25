-- Generate 100 customers, their bank accounts, and orders
DO $$ 
DECLARE
    _customer_id INT; -- Variable to store the newly created customer ID
    _random_balance NUMERIC(10, 2); -- Variable to store the random balance
    _location_id INT; -- Variable to store a random restaurant location
    _payment_method TEXT; -- Variable for payment method
    _total_amount NUMERIC(10, 2); -- Total amount for the order
    _order_id INT; -- Variable for order ID (receipt number)
    _item_count INT; -- Number of items in the order
    _item_id INT; -- Variable for item ID
    _quantity INT; -- Quantity of the item
    _total_price NUMERIC(10, 2); -- Total price of the item
BEGIN
    FOR i IN 1..100 LOOP
        -- Insert a customer and get their ID
        INSERT INTO public.customer (name, email, phone_number, membership_status, loyalty_points)
        VALUES 
            ('Customer ' || i, 
             'customer' || i || '@example.com', 
             '123456789' || i, 
             (RANDOM() > 0.5), 
             FLOOR(RANDOM() * 100))
        RETURNING id INTO _customer_id;

        -- Generate a random balance between $1,000 and $10,000
        _random_balance := ROUND((RANDOM() * 9000 + 1000)::NUMERIC, 2);

        -- Insert a bank account for the customer
        INSERT INTO public.bankaccount (balance, customer_id)
        VALUES (_random_balance, _customer_id);

        -- Randomly select a location for the order
        _location_id := (SELECT locationid FROM public.restaurantlocation ORDER BY RANDOM() LIMIT 1);

        -- Select a random payment method
        _payment_method := (SELECT payment_method FROM (VALUES ('Cash'), ('Credit'), ('Online')) AS t(payment_method) ORDER BY RANDOM() LIMIT 1);

        -- Generate a random total amount for the order
        _total_amount := ROUND((RANDOM() * 90 + 10)::NUMERIC, 2); -- Amount between $10 and $100

        -- Insert the order (receipt) and get the receipt ID
        INSERT INTO public.receipt (customer_id, location_id, total_amount, payment_method, order_date)
        VALUES (_customer_id, _location_id, _total_amount, _payment_method, CURRENT_TIMESTAMP) 
        RETURNING ReceiptNumber INTO _order_id;

        -- Random number of items in the order (1 to 5)
        _item_count := FLOOR(RANDOM() * 5) + 1;

        FOR j IN 1.._item_count LOOP
            -- Randomly select an item from the menu
            _item_id := (SELECT id FROM public.menuitem ORDER BY RANDOM() LIMIT 1);

            -- Random quantity of the item (1 to 3)
            _quantity := FLOOR(RANDOM() * 3) + 1;

            -- Get the price of the item and calculate the total price
            _total_price := ROUND((SELECT price FROM public.menuitem WHERE id = _item_id) * _quantity, 2);

            -- Insert the item into the order (orderitem table)
            INSERT INTO public.orderitem (receipt_id, item_id, quantity, total_price)
            VALUES (_order_id, _item_id, _quantity, _total_price);
        END LOOP;
    END LOOP;
END $$;
