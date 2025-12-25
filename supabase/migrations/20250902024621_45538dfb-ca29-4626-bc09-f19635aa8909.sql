-- Create sample orders for Krishna Rao (user_id: c5820b77-a2de-4b81-af36-0d6ba7ef2a3c)

-- Order 1: Delivered order from 2 weeks ago
INSERT INTO orders (user_id, total_amount, status, shipping_address, created_at, updated_at) 
VALUES (
  'c5820b77-a2de-4b81-af36-0d6ba7ef2a3c',
  234.98,
  'delivered',
  '{"name": "Krishna Rao", "street": "123 Oak Street", "city": "San Francisco", "postal_code": "94102", "country": "USA"}',
  now() - interval '14 days',
  now() - interval '12 days'
);

-- Get the order ID from the first order
WITH first_order AS (
  SELECT id FROM orders WHERE user_id = 'c5820b77-a2de-4b81-af36-0d6ba7ef2a3c' AND total_amount = 234.98 LIMIT 1
)
-- Order Items for Order 1 (Air Jordan + Nike Hoodie)
INSERT INTO order_items (order_id, product_id, quantity, price, size, color)
SELECT first_order.id, '56278a68-9f3f-4b05-bb98-d9e076e9ccaa', 1, 149.99, '10', 'Black/Red'
FROM first_order
UNION ALL
SELECT first_order.id, 'b9b1a6e4-2516-4c5b-8dfc-c32a5215bdee', 1, 89.99, 'L', 'Black'
FROM first_order;

-- Order 2: Shipped order from 5 days ago
INSERT INTO orders (user_id, total_amount, status, shipping_address, created_at, updated_at)
VALUES (
  'c5820b77-a2de-4b81-af36-0d6ba7ef2a3c',
  154.98,
  'shipped',
  '{"name": "Krishna Rao", "street": "123 Oak Street", "city": "San Francisco", "postal_code": "94102", "country": "USA"}',
  now() - interval '5 days',
  now() - interval '3 days'
);

-- Get the order ID from the second order
WITH second_order AS (
  SELECT id FROM orders WHERE user_id = 'c5820b77-a2de-4b81-af36-0d6ba7ef2a3c' AND total_amount = 154.98 LIMIT 1
)
-- Order Items for Order 2 (Adidas Ultraboost + Shorts)
INSERT INTO order_items (order_id, product_id, quantity, price, size, color)
SELECT second_order.id, '19477aec-b36a-47dd-827a-31172c5a9ce0', 1, 169.99, '9.5', 'White'
FROM second_order
UNION ALL
SELECT second_order.id, 'b8c0859f-21a8-478c-98ae-6982dd37900d', 1, 34.99, 'M', 'Navy'
FROM second_order;

-- Order 3: Pending order from yesterday
INSERT INTO orders (user_id, total_amount, status, shipping_address, created_at, updated_at)
VALUES (
  'c5820b77-a2de-4b81-af36-0d6ba7ef2a3c',
  89.99,
  'pending',
  '{"name": "Krishna Rao", "street": "123 Oak Street", "city": "San Francisco", "postal_code": "94102", "country": "USA"}',
  now() - interval '1 day',
  now() - interval '1 day'
);

-- Get the order ID from the third order
WITH third_order AS (
  SELECT id FROM orders WHERE user_id = 'c5820b77-a2de-4b81-af36-0d6ba7ef2a3c' AND total_amount = 89.99 LIMIT 1
)
-- Order Items for Order 3 (Air Max 90)
INSERT INTO order_items (order_id, product_id, quantity, price, size, color)
SELECT third_order.id, 'c78b0d4c-c283-474d-955f-acb7a3571848', 1, 89.99, '10.5', 'White/Grey'
FROM third_order;