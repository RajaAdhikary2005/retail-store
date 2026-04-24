-- ============================================================
-- Online Retail Store Database Schema
-- Normalized to 3NF with proper indexing
-- ============================================================

DROP DATABASE IF EXISTS retail_store;
CREATE DATABASE retail_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE retail_store;

-- ============================================================
-- 1. CATEGORIES TABLE
-- ============================================================
CREATE TABLE categories (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL UNIQUE,
    description   TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2. PRODUCTS TABLE
-- ============================================================
CREATE TABLE products (
    product_id     INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(200) NOT NULL,
    category_id    INT NOT NULL,
    price          DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    description    TEXT,
    image_url      VARCHAR(500),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_products_category (category_id),
    INDEX idx_products_price (price),
    INDEX idx_products_name (name)
) ENGINE=InnoDB;

-- ============================================================
-- 3. CUSTOMERS TABLE
-- ============================================================
CREATE TABLE customers (
    customer_id  INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    email        VARCHAR(200) NOT NULL UNIQUE,
    phone        VARCHAR(20),
    address      VARCHAR(300),
    city         VARCHAR(100),
    state        VARCHAR(100),
    zip_code     VARCHAR(10),
    join_date    DATE DEFAULT (CURDATE()),
    INDEX idx_customers_email (email),
    INDEX idx_customers_city (city)
) ENGINE=InnoDB;

-- ============================================================
-- 4. ORDERS TABLE
-- ============================================================
CREATE TABLE orders (
    order_id         INT AUTO_INCREMENT PRIMARY KEY,
    customer_id      INT NOT NULL,
    order_date       DATE DEFAULT (CURDATE()),
    status           ENUM('Pending','Processing','Shipped','Delivered','Cancelled')
                     DEFAULT 'Pending',
    total_amount     DECIMAL(10,2) DEFAULT 0.00,
    shipping_address VARCHAR(500),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_orders_customer (customer_id),
    INDEX idx_orders_date (order_date),
    INDEX idx_orders_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 5. ORDER_ITEMS TABLE
-- ============================================================
CREATE TABLE order_items (
    item_id     INT AUTO_INCREMENT PRIMARY KEY,
    order_id    INT NOT NULL,
    product_id  INT NOT NULL,
    quantity    INT NOT NULL CHECK (quantity > 0),
    unit_price  DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id)
) ENGINE=InnoDB;

-- ============================================================
-- 6. USERS TABLE (for authentication)
-- ============================================================
CREATE TABLE users (
    user_id    INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(100) NOT NULL UNIQUE,
    email      VARCHAR(200) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('ADMIN') DEFAULT 'ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Groceries', 'Food and household essentials'),
('Footwear', 'Shoes, sandals, and boots'),
('Home & Kitchen', 'Homeware and kitchen products'),
('Clothing', 'Apparel and garments'),
('Sports', 'Sports equipment and accessories'),
('Accessories', 'Bags, wallets, and personal accessories');

-- Products
INSERT INTO products (name, category_id, price, stock_quantity, description) VALUES
('Wireless Bluetooth Headphones', 1, 79.99, 145, 'Premium sound quality wireless headphones'),
('Organic Green Tea (50 bags)', 2, 12.49, 320, 'Natural organic green tea'),
('Running Shoes - Pro Series', 3, 129.99, 67, 'Lightweight performance running shoes'),
('Stainless Steel Water Bottle', 4, 24.99, 210, 'Insulated 750ml water bottle'),
('LED Desk Lamp', 1, 45.99, 89, 'Adjustable brightness LED desk lamp'),
('Cotton T-Shirt Pack (3)', 5, 34.99, 5, 'Premium cotton blend t-shirts'),
('Yoga Mat - Premium', 6, 39.99, 156, 'Non-slip surface yoga mat'),
('Ceramic Coffee Mug Set', 4, 29.99, 3, 'Set of 4 ceramic mugs'),
('Backpack - Urban Style', 7, 59.99, 78, 'Water-resistant urban backpack'),
('Smartphone Case - Clear', 1, 15.99, 450, 'Shockproof clear phone case'),
('Almond Butter Organic', 2, 9.99, 0, 'Natural organic almond spread'),
('Wireless Charging Pad', 1, 29.99, 112, 'Fast charging 15W pad');

-- Customers
INSERT INTO customers (name, email, phone, address, city, state, zip_code, join_date) VALUES
('Arjun Sharma', 'arjun.sharma@email.com', '+91 98765 43210', '42 MG Road', 'Bangalore', 'Karnataka', '560001', '2024-06-15'),
('Priya Patel', 'priya.patel@email.com', '+91 87654 32109', '15 Marine Drive', 'Mumbai', 'Maharashtra', '400001', '2024-07-20'),
('Rahul Gupta', 'rahul.gupta@email.com', '+91 76543 21098', '78 Connaught Place', 'New Delhi', 'Delhi', '110001', '2024-08-10'),
('Sneha Reddy', 'sneha.reddy@email.com', '+91 65432 10987', '23 Jubilee Hills', 'Hyderabad', 'Telangana', '500033', '2024-09-05'),
('Vikram Singh', 'vikram.singh@email.com', '+91 54321 09876', '56 Park Street', 'Kolkata', 'West Bengal', '700016', '2024-10-12'),
('Ananya Iyer', 'ananya.iyer@email.com', '+91 43210 98765', '89 Anna Nagar', 'Chennai', 'Tamil Nadu', '600040', '2024-11-08'),
('Karan Mehta', 'karan.mehta@email.com', '+91 32109 87654', '12 SG Highway', 'Ahmedabad', 'Gujarat', '380015', '2024-12-01'),
('Divya Nair', 'divya.nair@email.com', '+91 21098 76543', '34 MG Road', 'Kochi', 'Kerala', '682011', '2025-01-15');

-- Orders
INSERT INTO orders (customer_id, order_date, status, total_amount, shipping_address) VALUES
(3, '2025-04-20', 'Delivered', 259.97, '78 Connaught Place, New Delhi'),
(5, '2025-04-19', 'Shipped', 154.97, '56 Park Street, Kolkata'),
(1, '2025-04-18', 'Processing', 94.97, '42 MG Road, Bangalore'),
(2, '2025-04-17', 'Pending', 172.47, '15 Marine Drive, Mumbai'),
(7, '2025-04-16', 'Delivered', 109.98, '12 SG Highway, Ahmedabad'),
(4, '2025-04-15', 'Shipped', 79.98, '23 Jubilee Hills, Hyderabad'),
(8, '2025-04-14', 'Cancelled', 45.99, '34 MG Road, Kochi'),
(6, '2025-04-13', 'Delivered', 189.96, '89 Anna Nagar, Chennai'),
(3, '2025-03-10', 'Delivered', 185.97, '78 Connaught Place, New Delhi'),
(5, '2025-03-05', 'Delivered', 224.96, '56 Park Street, Kolkata'),
(1, '2025-02-20', 'Delivered', 119.98, '42 MG Road, Bangalore'),
(2, '2025-02-15', 'Delivered', 89.98, '15 Marine Drive, Mumbai');

-- Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 79.99), (1, 3, 1, 129.99), (1, 10, 1, 15.99),
(2, 5, 1, 45.99), (2, 7, 1, 39.99), (2, 9, 1, 59.99),
(3, 6, 1, 34.99), (3, 4, 1, 24.99), (3, 8, 1, 29.99),
(4, 3, 1, 129.99), (4, 2, 2, 12.49), (4, 10, 1, 15.99),
(5, 1, 1, 79.99), (5, 12, 1, 29.99),
(6, 7, 2, 39.99),
(7, 5, 1, 45.99),
(8, 9, 1, 59.99), (8, 3, 1, 129.99),
(9, 1, 1, 79.99), (9, 5, 1, 45.99), (9, 9, 1, 59.99),
(10, 3, 1, 129.99), (10, 7, 1, 39.99), (10, 4, 1, 24.99), (10, 12, 1, 29.99),
(11, 1, 1, 79.99), (11, 7, 1, 39.99),
(12, 4, 2, 24.99), (12, 7, 1, 39.99);

-- Admin user (password: admin123 — hashed with bcrypt in production)
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@retailstore.com', '$2a$10$example_bcrypt_hash_here', 'ADMIN');
