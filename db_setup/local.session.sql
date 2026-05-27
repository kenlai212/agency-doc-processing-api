CREATE DATABASE IF NOT EXISTS agency_doc_processing_api;
CREATE USER 'system_acct' @'%' IDENTIFIED BY '{password}';
GRANT ALL PRIVILEGES ON agency_doc_processing_api.* TO 'system_acct' @'%';
FLUSH PRIVILEGES;
SHOW GRANTS FOR system_acct