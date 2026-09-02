-- Base de données Commercial Pro (WAMP MySQL)
-- Exécuter via : npm run db:init

CREATE DATABASE IF NOT EXISTS commercial
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE commercial;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  phone VARCHAR(20) NOT NULL UNIQUE,
  pin_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  promo_code VARCHAR(20) NULL UNIQUE,
  role ENUM('admin', 'agent') NOT NULL DEFAULT 'agent',
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  monthly_target DECIMAL(15, 2) NOT NULL DEFAULT 0,
  monthly_achieved DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_phone (phone)
);

CREATE TABLE IF NOT EXISTS weekly_performance (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  day_label CHAR(1) NOT NULL,
  day_order TINYINT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_day_order (user_id, day_order)
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  status ENUM('pending', 'completed', 'rejected') NOT NULL DEFAULT 'completed',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_withdrawals_user (user_id),
  INDEX idx_withdrawals_created (created_at)
);

CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('commission', 'withdrawal', 'bonus', 'prospect') NOT NULL,
  label VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_activities_user (user_id),
  INDEX idx_activities_created (created_at)
);

CREATE TABLE IF NOT EXISTS prospects (
  id VARCHAR(36) PRIMARY KEY,
  agent_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  payment_ref VARCHAR(100) NULL,
  reward_amount DECIMAL(15, 2) NOT NULL DEFAULT 250,
  status ENUM('qualified') NOT NULL DEFAULT 'qualified',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_payment_ref (payment_ref),
  UNIQUE KEY uk_agent_prospect_phone (agent_id, phone),
  INDEX idx_prospects_agent (agent_id),
  INDEX idx_prospects_created (created_at)
);

CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('prospect_reward_amount', '250');
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('api_key', 'commercial-api-key-change-me');
