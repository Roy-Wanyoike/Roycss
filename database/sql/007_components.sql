-- RoyCSS Database — Components
CREATE TABLE components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    html_code TEXT,
    css_code TEXT,
    js_code TEXT,
    status TEXT NOT NULL DEFAULT 'published',
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_components_slug ON components(slug);
CREATE INDEX idx_components_name ON components USING gin(to_tsvector('english', name));
