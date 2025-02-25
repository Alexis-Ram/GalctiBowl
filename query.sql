-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.transaction CASCADE;
DROP TABLE IF EXISTS public.orderitem CASCADE;
DROP TABLE IF EXISTS public.receipt CASCADE;
DROP TABLE IF EXISTS public.promo CASCADE;
DROP TABLE IF EXISTS public.menuitem CASCADE;
DROP TABLE IF EXISTS public.customer CASCADE;
DROP TABLE IF EXISTS public.restaurantlocation CASCADE;
DROP TABLE IF EXISTS public.bankaccount CASCADE;
DROP TABLE IF EXISTS public.employee CASCADE;
DROP TABLE IF EXISTS public.employeeposition CASCADE;

-- Create customer table
CREATE TABLE public.customer (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    membership_status BOOLEAN DEFAULT FALSE,
    loyalty_points INTEGER DEFAULT 0
);

-- Create restaurantlocation table
CREATE TABLE public.restaurantlocation (
    locationid SERIAL PRIMARY KEY,
    capacity INTEGER NOT NULL,
    address VARCHAR(100) NOT NULL,
    CONSTRAINT restaurantlocation_address_key UNIQUE (address)
);

-- Create employeeposition table
CREATE TABLE public.employeeposition (
    positionid SERIAL PRIMARY KEY,
    title VARCHAR(100),
    description TEXT
);

-- Create employee table without foreign keys
CREATE TABLE public.employee (
    employeeid SERIAL PRIMARY KEY,
    name VARCHAR(100),
    salary NUMERIC(10, 2),
    locationid INTEGER,
    positionid INTEGER
);

-- Create menuitem table
CREATE TABLE public.menuitem (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    category VARCHAR(50),
    quantity INTEGER
);

-- Create promo table
CREATE TABLE public.promo (
    promocode VARCHAR NOT NULL PRIMARY KEY,
    discountpercentage NUMERIC(5, 2),
    description TEXT
);

-- Create bankaccount table
CREATE TABLE public.bankaccount (
    id SERIAL PRIMARY KEY,
    balance NUMERIC(15, 2) NOT NULL,
    customer_id INTEGER
);

-- Create orderitem table
CREATE TABLE public.orderitem (
    id SERIAL PRIMARY KEY,
    receipt_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0)
);

-- Create receipt table
CREATE TABLE public.receipt (
    ReceiptNumber SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    location_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    transaction_id INT,
    promo_code VARCHAR(50),
    payment_method VARCHAR(50) NOT NULL
);

-- Create transaction table
CREATE TABLE public.transaction (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    receipt_id INTEGER NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    transaction_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    bankaccount_id INTEGER NOT NULL
);

-- Add foreign key constraints to `orderitem` table (after receipt and menuitem tables are created)
ALTER TABLE public.orderitem
    ADD CONSTRAINT orderitems_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.menuitem(id),
    ADD CONSTRAINT orderitems_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.receipt(ReceiptNumber);

-- Add foreign key constraints to `employee` table (after restaurantlocation and employeeposition tables are created)
ALTER TABLE public.employee
    ADD CONSTRAINT employee_locationid_fkey FOREIGN KEY (locationid) REFERENCES public.restaurantlocation(locationid),
    ADD CONSTRAINT employee_positionid_fkey FOREIGN KEY (positionid) REFERENCES public.employeeposition(positionid);

-- Add foreign key constraints to `bankaccount` table (after customer table is created)
ALTER TABLE public.bankaccount
    ADD CONSTRAINT bankaccounts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(id);

-- Add foreign key constraints to `receipt` table (after customer, restaurantlocation, transaction, and promo tables are created)
ALTER TABLE public.receipt
    ADD CONSTRAINT receipt_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(id),
    ADD CONSTRAINT receipt_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.restaurantlocation(locationid),
    ADD CONSTRAINT receipt_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transaction(id),
    ADD CONSTRAINT receipt_promo_code_fkey FOREIGN KEY (promo_code) REFERENCES public.promo(promocode);

-- Add foreign key constraints to `transaction` table (after customer, receipt, and bankaccount tables are created)
ALTER TABLE public.transaction
    ADD CONSTRAINT transactions_bankaccount_id_fkey FOREIGN KEY (bankaccount_id) REFERENCES public.bankaccount(id),
    ADD CONSTRAINT transactions_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.receipt(ReceiptNumber);

-- Insert space-themed menu items into menuitem table
INSERT INTO public.menuitem (name, price, category, quantity)
VALUES
    ('Nebula Burrito', 8.99, 'Main Dish', 150),
    ('Astro Tacos', 7.49, 'Main Dish', 200),
    ('Black Hole Bowl', 9.99, 'Main Dish', 100),
    ('Meteorite Chips', 2.99, 'Side', 250),
    ('Comet Rice', 3.49, 'Side', 200),
    ('Galactic Soda', 1.99, 'Drink', 300),
    ('Plasma Punch', 2.49, 'Drink', 150),
    ('Zero Gravity Water', 0.99, 'Drink', 500),
    ('Supernova Sundae', 4.99, 'Dessert', 100),
    ('Astro Cookies', 3.49, 'Dessert', 150),
    ('Martian Ice Cream', 3.99, 'Dessert', 200);

-- Insert space-themed promotional code into promo table
INSERT INTO public.promo (promocode, discountpercentage, description)
VALUES
    ('GRANDOPENING', 10.00, '10% off your total order');

-- Insert sample restaurant locations into restaurantlocation table
INSERT INTO public.restaurantlocation (capacity, address)
VALUES
    (150, '123 Nebula Blvd, Galaxy Sector 1'),
    (100, '456 Starship Ave, Cosmic Plaza'),
    (200, '789 Lunar Lane, Moon Colony Alpha'),
    (80, '101 Asteroid Belt Rd, Outer Rim'),
    (250, '202 Comet Trail, Andromeda Station'),
    (50, '303 Starlight St, Nova Outpost'),
    (300, '404 Orbit Ring Rd, Space Dock Prime');

-- Insert employee positions into employeeposition table
INSERT INTO public.employeeposition (title, description)
VALUES
    ('Manager', 'Manages the restaurant and staff'),
    ('Server', 'Serves food to customers'),
    ('Cook', 'Prepares meals for customers'),
    ('Cashier', 'Handles customer payments');

-- Insert employees into employee table
INSERT INTO public.employee (name, salary, locationid, positionid)
VALUES
    -- Managers
    ('Luna Walker', 55000, 3, 1),  -- Manager at Moon Colony Alpha
    ('Orion Vega', 60000, 1, 1),   -- Manager at Galaxy Sector 1
    ('Sirius Nova', 58000, 4, 1),  -- Manager at Outer Rim
    ('Elara Zenith', 62000, 2, 1), -- Manager at Cosmic Plaza

    -- Servers
    ('Zara Orion', 30000, 2, 2),   -- Server at Cosmic Plaza
    ('Lyra Comet', 29000, 3, 2),   -- Server at Moon Colony Alpha
    ('Atlas Ray', 31000, 1, 2),    -- Server at Galaxy Sector 1
    ('Nova Eclipse', 30500, 4, 2), -- Server at Outer Rim

    -- Cooks
    ('Astra Nova', 35000, 1, 3),   -- Cook at Galaxy Sector 1
    ('Celeste Lunar', 34000, 2, 3),-- Cook at Cosmic Plaza
    ('Solara Blaze', 36000, 3, 3), -- Cook at Moon Colony Alpha
    ('Cosmo Orbit', 37000, 4, 3),  -- Cook at Outer Rim

    -- Cashiers
    ('Vega Star', 25000, 4, 4),    -- Cashier at Outer Rim
    ('Nova Skye', 26000, 2, 4),    -- Cashier at Cosmic Plaza
    ('Altair Pulse', 25500, 1, 4), -- Cashier at Galaxy Sector 1
    ('Orion Drift', 26500, 3, 4),  -- Cashier at Moon Colony Alpha

-- Sample Insert for bankaccount
INSERT INTO public.bankaccount (balance, customer_id)
VALUES
    (100.00, 1),
    (50.00, 2);

-- Sample Insert for customer
INSERT INTO public.customer (name, email, phone_number, membership_status, loyalty_points)
VALUES
    ('John Doe', 'john.doe@galactic.com', '1234567890', TRUE, 100),
    ('Jane Smith', 'jane.smith@space.com', '9876543210', FALSE, 0);

