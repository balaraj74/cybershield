-- ============================================
-- CyberShield AI - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- THREAT ANALYSES TABLE
-- Stores anonymized threat analysis results
-- ============================================
CREATE TABLE IF NOT EXISTS threat_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    input_hash VARCHAR(64) UNIQUE NOT NULL,
    input_type VARCHAR(20) NOT NULL CHECK (input_type IN ('email', 'url', 'message')),
    
    -- Analysis Results
    threat_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'safe')),
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Explainable AI Data
    summary TEXT,
    explanation JSONB,
    indicators JSONB,
    recommendations JSONB,
    risk_contributions JSONB,
    
    -- Metadata
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analyzed_by UUID REFERENCES auth.users(id),
    processing_time_ms INTEGER,
    model_version VARCHAR(20) DEFAULT '1.0.0',
    
    -- Feedback
    is_false_positive BOOLEAN DEFAULT FALSE,
    feedback_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analyses_severity ON threat_analyses(severity);
CREATE INDEX IF NOT EXISTS idx_analyses_analyzed_at ON threat_analyses(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_user ON threat_analyses(analyzed_by);
CREATE INDEX IF NOT EXISTS idx_analyses_threat_type ON threat_analyses(threat_type);

-- ============================================
-- USER FEEDBACK TABLE
-- Stores user feedback on analyses
-- ============================================
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES threat_analyses(id) ON DELETE CASCADE,
    analysis_hash VARCHAR(64) NOT NULL,
    
    feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('false_positive', 'false_negative', 'accurate')),
    user_comment TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_analysis ON user_feedback(analysis_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON user_feedback(user_id);

-- ============================================
-- AUDIT LOG TABLE
-- Security audit trail
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(100),
    
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- ============================================
-- USER SETTINGS TABLE
-- User preferences and settings
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification Settings
    email_alerts BOOLEAN DEFAULT TRUE,
    high_risk_only BOOLEAN DEFAULT FALSE,
    
    -- Display Settings
    compact_view BOOLEAN DEFAULT FALSE,
    auto_refresh BOOLEAN DEFAULT TRUE,
    refresh_interval INTEGER DEFAULT 60,
    
    -- Privacy Settings
    retention_days INTEGER DEFAULT 30,
    anonymize_data BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_user ON user_settings(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Privacy-first: Users can only see their own data
-- ============================================

-- Enable RLS
ALTER TABLE threat_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Threat Analyses Policies
CREATE POLICY "Users can view their own analyses"
    ON threat_analyses FOR SELECT
    USING (auth.uid() = analyzed_by);

CREATE POLICY "Users can insert their own analyses"
    ON threat_analyses FOR INSERT
    WITH CHECK (auth.uid() = analyzed_by);

CREATE POLICY "Users can update their own analyses"
    ON threat_analyses FOR UPDATE
    USING (auth.uid() = analyzed_by);

-- User Feedback Policies
CREATE POLICY "Users can view their own feedback"
    ON user_feedback FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
    ON user_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Audit Log Policies (read-only for users)
CREATE POLICY "Users can view their own audit logs"
    ON audit_logs FOR SELECT
    USING (auth.uid() = user_id);

-- User Settings Policies
CREATE POLICY "Users can view their own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- SERVICE ROLE BYPASS (for backend API)
-- The service role key bypasses RLS
-- ============================================

-- Create a function to auto-create user settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- USEFUL VIEWS
-- ============================================

-- Dashboard summary view
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT 
    COUNT(*) FILTER (WHERE severity != 'safe') as total_threats,
    COUNT(*) FILTER (WHERE severity IN ('critical', 'high')) as high_risk_count,
    COUNT(*) FILTER (WHERE analyzed_at >= CURRENT_DATE) as threats_today,
    AVG(risk_score) FILTER (WHERE severity != 'safe') as avg_risk_score,
    COUNT(*) as total_analyses
FROM threat_analyses;

-- Daily threat trends view
CREATE OR REPLACE VIEW threat_trends AS
SELECT 
    DATE(analyzed_at) as date,
    COUNT(*) as count,
    AVG(risk_score) as avg_risk
FROM threat_analyses
WHERE analyzed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(analyzed_at)
ORDER BY date DESC;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON threat_analyses TO authenticated;
GRANT SELECT, INSERT ON user_feedback TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_settings TO authenticated;
GRANT SELECT ON dashboard_summary TO authenticated;
GRANT SELECT ON threat_trends TO authenticated;

-- Grant access to service role (full access)
GRANT ALL ON threat_analyses TO service_role;
GRANT ALL ON user_feedback TO service_role;
GRANT ALL ON audit_logs TO service_role;
GRANT ALL ON user_settings TO service_role;

COMMENT ON TABLE threat_analyses IS 'Stores anonymized threat analysis results. No raw input content is stored.';
COMMENT ON TABLE user_feedback IS 'User feedback for improving AI accuracy.';
COMMENT ON TABLE audit_logs IS 'Security audit trail for compliance.';
COMMENT ON TABLE user_settings IS 'Per-user preferences and settings.';
