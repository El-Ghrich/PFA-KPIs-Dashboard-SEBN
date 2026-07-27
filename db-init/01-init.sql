-- Create kpi_user
CREATE USER kpi_user WITH PASSWORD 'SecurePassword123';
CREATE DATABASE kpi_dashboard OWNER kpi_user;
GRANT ALL PRIVILEGES ON DATABASE kpi_dashboard TO kpi_user;
GRANT CONNECT ON DATABASE kpi_dashboard TO kpi_user;