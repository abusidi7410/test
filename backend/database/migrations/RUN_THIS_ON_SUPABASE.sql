-- TechHub: Add transaction PIN columns to users table
-- Run this in Supabase SQL Editor

-- 1. Add transaction_pin and pin_set_at to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS transaction_pin VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_set_at TIMESTAMPTZ;

-- 2. Create pin_resets table
CREATE TABLE IF NOT EXISTS pin_resets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pin_resets_user_otp ON pin_resets(user_id, otp);

-- 3. Add ip_address and user_agent to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- 4. Create gift_cards table
CREATE TABLE IF NOT EXISTS gift_cards (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id BIGINT REFERENCES transactions(id) ON DELETE SET NULL,
    card_name VARCHAR(255) NOT NULL,
    card_number VARCHAR(255) NOT NULL,
    card_pin VARCHAR(255),
    card_value DECIMAL(15,2) NOT NULL,
    exchange_rate DECIMAL(10,4) NOT NULL,
    naira_value DECIMAL(15,2) NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'active',
    metadata JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_user_id ON gift_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
