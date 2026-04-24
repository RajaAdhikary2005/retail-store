-- ============================================================
-- Advanced SQL Queries for Retail Store Analytics
-- Demonstrates: Aggregation, Window Functions, CTEs, Recursive
-- ============================================================

USE retail_store;

-- ============================================================
-- 1. AGGREGATION FUNCTIONS (SUM, AVG, COUNT, MAX, MIN)
-- ============================================================

-- Total sales, average order value, order count
SELECT
    COUNT(*)                    AS total_orders,
    SUM(total_amount)           AS total_sales,
    AVG(total_amount)           AS avg_order_value,
    MAX(total_amount)           AS highest_order,
    MIN(total_amount)           AS lowest_order
FROM orders
WHERE status != 'Cancelled';

-- Sales by category
SELECT
    c.name                      AS category,
    COUNT(DISTINCT o.order_id)  AS order_count,
    SUM(oi.quantity)            AS units_sold,
    SUM(oi.quantity * oi.unit_price) AS total_revenue,
    AVG(oi.unit_price)          AS avg_unit_price
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
JOIN categories c ON p.category_id = c.category_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.status != 'Cancelled'
GROUP BY c.category_id, c.name
ORDER BY total_revenue DESC;

-- Monthly sales summary
SELECT
    DATE_FORMAT(order_date, '%Y-%m') AS month,
    COUNT(*)                         AS total_orders,
    SUM(total_amount)                AS total_sales,
    AVG(total_amount)                AS avg_order_value
FROM orders
WHERE status != 'Cancelled'
GROUP BY DATE_FORMAT(order_date, '%Y-%m')
ORDER BY month;


-- ============================================================
-- 2. WINDOW FUNCTIONS (RANK, ROW_NUMBER, DENSE_RANK, LAG)
-- ============================================================

-- Top customers ranked by total spending using RANK()
SELECT
    c.customer_id,
    c.name,
    c.email,
    COUNT(o.order_id)           AS total_orders,
    SUM(o.total_amount)         AS total_spent,
    RANK() OVER (ORDER BY SUM(o.total_amount) DESC) AS spending_rank
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.status != 'Cancelled'
GROUP BY c.customer_id, c.name, c.email;

-- Best-selling products using DENSE_RANK()
SELECT
    p.product_id,
    p.name,
    SUM(oi.quantity)            AS total_units_sold,
    SUM(oi.quantity * oi.unit_price) AS total_revenue,
    DENSE_RANK() OVER (ORDER BY SUM(oi.quantity) DESC) AS sales_rank,
    ROW_NUMBER() OVER (ORDER BY SUM(oi.quantity * oi.unit_price) DESC) AS revenue_rank
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.status != 'Cancelled'
GROUP BY p.product_id, p.name;

-- Running total of monthly revenue using SUM() window function
SELECT
    DATE_FORMAT(order_date, '%Y-%m') AS month,
    SUM(total_amount) AS monthly_revenue,
    SUM(SUM(total_amount)) OVER (ORDER BY DATE_FORMAT(order_date, '%Y-%m'))
        AS cumulative_revenue
FROM orders
WHERE status != 'Cancelled'
GROUP BY DATE_FORMAT(order_date, '%Y-%m')
ORDER BY month;


-- ============================================================
-- 3. CTE (Common Table Expressions)
-- ============================================================

-- Monthly revenue with growth rate using CTE + LAG()
WITH monthly_revenue AS (
    SELECT
        DATE_FORMAT(order_date, '%Y-%m') AS month,
        SUM(total_amount) AS revenue
    FROM orders
    WHERE status != 'Cancelled'
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
),
revenue_with_growth AS (
    SELECT
        month,
        revenue,
        LAG(revenue) OVER (ORDER BY month) AS prev_month_revenue,
        ROUND(
            ((revenue - LAG(revenue) OVER (ORDER BY month))
            / LAG(revenue) OVER (ORDER BY month)) * 100, 2
        ) AS growth_percentage
    FROM monthly_revenue
)
SELECT * FROM revenue_with_growth ORDER BY month;

-- Customer segmentation using CTE
WITH customer_metrics AS (
    SELECT
        c.customer_id,
        c.name,
        COUNT(o.order_id) AS order_count,
        SUM(o.total_amount) AS total_spent,
        AVG(o.total_amount) AS avg_order_value,
        MAX(o.order_date) AS last_order_date,
        DATEDIFF(CURDATE(), MAX(o.order_date)) AS days_since_last_order
    FROM customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.status != 'Cancelled'
    GROUP BY c.customer_id, c.name
)
SELECT
    *,
    CASE
        WHEN total_spent >= 2000 THEN 'Premium'
        WHEN total_spent >= 500  THEN 'Regular'
        WHEN total_spent > 0     THEN 'New'
        ELSE 'Inactive'
    END AS customer_segment
FROM customer_metrics
ORDER BY total_spent DESC;

-- Inventory alert using CTE
WITH inventory_status AS (
    SELECT
        p.product_id,
        p.name,
        p.stock_quantity,
        COALESCE(SUM(oi.quantity), 0) AS total_sold,
        CASE
            WHEN p.stock_quantity = 0 THEN 'Critical'
            WHEN p.stock_quantity < 10 THEN 'Low'
            WHEN p.stock_quantity < 50 THEN 'Medium'
            ELSE 'Normal'
        END AS stock_status
    FROM products p
    LEFT JOIN order_items oi ON p.product_id = oi.product_id
    GROUP BY p.product_id, p.name, p.stock_quantity
)
SELECT * FROM inventory_status
WHERE stock_status IN ('Critical', 'Low')
ORDER BY stock_quantity ASC;


-- ============================================================
-- 4. RECURSIVE CTE (Category hierarchy example)
-- ============================================================

-- For a more complex schema with parent-child categories:
-- This demonstrates recursive CTE capability
WITH RECURSIVE category_tree AS (
    -- Base: top-level categories
    SELECT
        category_id,
        name,
        description,
        CAST(name AS CHAR(500)) AS full_path,
        0 AS depth
    FROM categories

    -- In a schema with parent_category_id, this would recurse:
    -- UNION ALL
    -- SELECT c.category_id, c.name, c.description,
    --        CONCAT(ct.full_path, ' > ', c.name),
    --        ct.depth + 1
    -- FROM categories c
    -- JOIN category_tree ct ON c.parent_category_id = ct.category_id
)
SELECT * FROM category_tree ORDER BY full_path;


-- ============================================================
-- 5. DASHBOARD QUERIES
-- ============================================================

-- Dashboard stats
SELECT
    (SELECT SUM(total_amount) FROM orders WHERE status != 'Cancelled') AS total_sales,
    (SELECT COUNT(*) FROM orders) AS total_orders,
    (SELECT COUNT(*) FROM customers) AS total_customers,
    (SELECT SUM(total_amount) FROM orders
     WHERE status != 'Cancelled'
     AND MONTH(order_date) = MONTH(CURDATE())
     AND YEAR(order_date) = YEAR(CURDATE())) AS monthly_revenue;

-- Category distribution
SELECT
    c.name AS category,
    COUNT(p.product_id) AS product_count,
    ROUND(COUNT(p.product_id) * 100.0 / (SELECT COUNT(*) FROM products), 1) AS percentage
FROM categories c
LEFT JOIN products p ON c.category_id = p.category_id
GROUP BY c.category_id, c.name
ORDER BY product_count DESC;
