-- Create transaction table with foreign keys directly in the table creation
CREATE TABLE public.transaction (
    id SERIAL PRIMARY KEY,  -- The transaction ID (primary key)
    customer_id INTEGER NOT NULL,  -- The ID of the customer making the transaction
    receipt_id INTEGER NOT NULL,  -- The receipt ID (linked to an order)
    amount NUMERIC(10, 2) NOT NULL,  -- The amount of the transaction
    transaction_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- The date and time of the transaction
    bankaccount_id INTEGER NOT NULL,  -- The ID of the customer's bank account
    -- Foreign key constraints to link the transaction to the receipt and bank account
    CONSTRAINT transactions_bankaccount_id_fkey FOREIGN KEY (bankaccount_id) REFERENCES public.bankaccount(id),
    CONSTRAINT transactions_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.receipt(ReceiptNumber),
    CONSTRAINT transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(id)
);
