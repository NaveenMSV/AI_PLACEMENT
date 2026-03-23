export const SQL_DUMMY_DATA = `
-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);
INSERT OR IGNORE INTO departments (id, name) VALUES (1, 'Engineering');
INSERT OR IGNORE INTO departments (id, name) VALUES (2, 'Sales');
INSERT OR IGNORE INTO departments (id, name) VALUES (3, 'Marketing');
INSERT OR IGNORE INTO departments (id, name) VALUES (4, 'HR');

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    salary REAL,
    dept_id INTEGER,
    city TEXT,
    manager_id INTEGER
);
INSERT OR IGNORE INTO employees (id, name, salary, dept_id, city, manager_id) VALUES (1, 'Alice', 95000, 1, 'London', NULL);
INSERT OR IGNORE INTO employees (id, name, salary, dept_id, city, manager_id) VALUES (2, 'Bob', 80000, 1, 'London', 1);
INSERT OR IGNORE INTO employees (id, name, salary, dept_id, city, manager_id) VALUES (3, 'Charlie', 75000, 2, 'New York', 1);
INSERT OR IGNORE INTO employees (id, name, salary, dept_id, city, manager_id) VALUES (4, 'David', 60000, 2, 'New York', 3);
INSERT OR IGNORE INTO employees (id, name, salary, dept_id, city, manager_id) VALUES (5, 'Eve', 85000, 3, 'Paris', 1);
INSERT OR IGNORE INTO employees (id, name, salary, dept_id, city, manager_id) VALUES (6, 'Frank', 70000, 1, 'London', 2);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL,
    category TEXT
);
INSERT OR IGNORE INTO products (id, name, price, category) VALUES (1, 'Laptop', 1200, 'Electronics');
INSERT OR IGNORE INTO products (id, name, price, category) VALUES (2, 'Phone', 800, 'Electronics');
INSERT OR IGNORE INTO products (id, name, price, category) VALUES (3, 'Monitor', 300, 'Electronics');
INSERT OR IGNORE INTO products (id, name, price, category) VALUES (4, 'Desk', 150, 'Furniture');
INSERT OR IGNORE INTO products (id, name, price, category) VALUES (5, 'Chair', 100, 'Furniture');

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    product_id INTEGER,
    quantity INTEGER,
    order_date TEXT,
    customer_id INTEGER
);
INSERT OR IGNORE INTO orders (id, product_id, quantity, order_date, customer_id) VALUES (1, 1, 1, '2023-10-01', 101);
INSERT OR IGNORE INTO orders (id, product_id, quantity, order_date, customer_id) VALUES (2, 2, 2, '2023-10-05', 102);
INSERT OR IGNORE INTO orders (id, product_id, quantity, order_date, customer_id) VALUES (3, 3, 1, '2023-10-10', 101);
INSERT OR IGNORE INTO orders (id, product_id, quantity, order_date, customer_id) VALUES (4, 4, 3, '2023-10-12', 103);
INSERT OR IGNORE INTO orders (id, product_id, quantity, order_date, customer_id) VALUES (5, 5, 5, '2023-10-15', 102);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    city TEXT
);
INSERT OR IGNORE INTO customers (id, name, email, city) VALUES (101, 'John Doe', 'john@example.com', 'New York');
INSERT OR IGNORE INTO customers (id, name, email, city) VALUES (102, 'Jane Smith', 'jane@example.com', 'London');
INSERT OR IGNORE INTO customers (id, name, email, city) VALUES (103, 'Mike Ross', 'mike@example.com', 'Chicago');
`;
