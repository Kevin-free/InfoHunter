-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    photo_url VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    username VARCHAR(255) UNIQUE,
    display_name VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    data_type VARCHAR(255) NOT NULL,
    data_id VARCHAR(255) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_free BOOLEAN NOT NULL DEFAULT FALSE,
    subscription_fee DECIMAL(20,8) NOT NULL DEFAULT 0,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(255) DEFAULT 'watching',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, data_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    chat_id VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    message_timestamp BIGINT NOT NULL,
    sender_id VARCHAR(255),
    sender JSONB DEFAULT '{}',
    reply_to VARCHAR(255),
    topic_id VARCHAR(255),
    buttons JSONB DEFAULT '[]',
    reactions JSONB DEFAULT '[]',
    is_pinned BOOLEAN DEFAULT FALSE,
    media_type VARCHAR(50), -- photo, video, document, audio, etc.
    media_file_id VARCHAR(255), -- File identifier
    media_url TEXT,
    media_metadata JSONB DEFAULT '{}', -- Store additional media info like dimensions, duration, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (channel_id, message_id)
);

-- Workflow definitions table
CREATE TABLE IF NOT EXISTS workflow_definitions (
    id SERIAL PRIMARY KEY,
    workflow_definition_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    model VARCHAR(255) NOT NULL,
    refresh_interval_hours INTEGER DEFAULT 24,
    last_refresh_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    next_refresh_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours',
    schedule_id VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'active',
    message_strategy VARCHAR(255) NOT NULL DEFAULT 'latest_n',
    message_count INTEGER NOT NULL DEFAULT 100,
    time_window_value INTEGER DEFAULT 24,
    time_window_unit VARCHAR(20) DEFAULT 'hours',
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workflow values table
CREATE TABLE IF NOT EXISTS workflow_values (
    id SERIAL PRIMARY KEY,
    workflow_value_id VARCHAR(255) UNIQUE NOT NULL,
    workflow_definition_id VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    value TEXT,
    confidence DECIMAL(4,2),
    reason TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(255) NOT NULL DEFAULT 'pending',
    is_aggregated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Channel workflows association table
CREATE TABLE IF NOT EXISTS channel_workflows (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(255) NOT NULL,
    workflow_definition_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel_id, workflow_definition_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    chain_id INTEGER NOT NULL,
    original_amount DECIMAL(20,8) NOT NULL,
    token_decimals INTEGER NOT NULL,
    token_address VARCHAR(255) NOT NULL,
    original_amount_on_chain VARCHAR(255) NOT NULL,
    transfer_amount_on_chain VARCHAR(255) NOT NULL,
    transfer_address VARCHAR(255) NOT NULL,
    transfer_hash TEXT,
    application_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 0: pending, 1: success, 2: failed, 3: cancelled, 4: expired
    create_timestamp INTEGER NOT NULL,
    finish_timestamp INTEGER,
    external_order_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    credits DECIMAL(20,8) NOT NULL
);

-- User credits table
CREATE TABLE IF NOT EXISTS user_credits (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    credits DECIMAL(20,8) NOT NULL DEFAULT 0,
    workflows INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Credit consumption logs table
CREATE TABLE IF NOT EXISTS credit_consumption_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    workflow_definition_id VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    credits_consumed DECIMAL(20,8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API keys table
CREATE TABLE IF NOT EXISTS apikeys (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(100),
    user_id VARCHAR(255) NOT NULL,
    created_at timestamptz,
    status VARCHAR(50)
);