-- Migration : codes promo, prospects, paramètres
-- Exécuter via : npm run db:migrate

USE commercial;

-- Code promo par agent
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_code VARCHAR(20) NULL UNIQUE;

-- Prospects qualifiés
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

-- Paramètres globaux
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('prospect_reward_amount', '250');
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('api_key', 'commercial-api-key-change-me');
