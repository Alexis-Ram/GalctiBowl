# GalctiBowl

This Program:
● An out-of-this-world restaurant, called GalctiBowl, where it is based on a different planet
and where this restaurant is styled like a Chipotle.
● It is a chain restaurant across multiple planets, with it having different locations in
each one
● Assumptions:
  ○ Customers pay using their bank account numbers instead of credit or debit cards
  ○ Customers can have multiple bank accounts linked to their profile
● The design of the website follows normalization principles up to BCNF and supports
transaction processing, which handles concurrent requests and ensuring data integrity.
● There are two panels in the website a admin panel and a customer panel
  ○ Admin Panel: Process all reports, manually add customers and more
  ○ Customer Panel: A customer can place an order using a login
● The database uses efficient joins using foreign keys that define the relationships
between different entities like in the customer, order, menu item, transaction tables
● Indexing columns that are frequently queried, (like TransactionID, PromoCode,
LocationID) ensures quick access to data during transaction processing, especially in a
high-volume system of the 100 transaction/customers


Getting Started with the Web App:
1. The first step in the application process is to run the sql files (query.sql) in your
database. This will create the tables and fill in the basic information for the website.
2. Then you have to change the user, host, database and password in the server.js file so
that it works on your local machine.
3. Then run the server.js file, by going to to the “hw4” folder in your terminal and then in
your terminal run “node server.js”
4. Then in your web browser, preferably google chrome, put in this website
(http://localhost:3000/)
5. Then you are in the admin panel where you can simply fill in the categories and tables
for Galactibowl. Additionally, on the admin side, you can add promo codes and
employee details.
6. You can then click the top to go to the client page.

Once that's done, you can explore the functionality of the web app in two ways:
1. Client-Only Page:
On this page, you'll need to enter your name, email, phone number, and choose whether you'd
like to join our membership program. Your information will then be securely stored in our
database.

After logging in, you can begin placing your order. As you add items, you'll see your order
dynamically populate. When you're ready, simply place your order!
Once your order is placed:
  ● Your bank account balance will be updated.
  ● The order item table and receipt table will reflect your purchase.
  ● If you’re enrolled in the membership program, you’ll earn 10 points for every order.
  ● The quantities of the menu items will also adjust based on your selections.

2. Generate Random Orders:
If you'd like to test the system with bulk data, you can run the sql file named hundred_cust.sql in
your database, which will generate 100 customers along with 100 orders or them.
