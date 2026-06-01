-- Local development database setup (run as postgres superuser)
CREATE USER inventory WITH PASSWORD 'inventory';
CREATE DATABASE inventory_db OWNER inventory;
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory;
\c inventory_db
GRANT ALL ON SCHEMA public TO inventory;
