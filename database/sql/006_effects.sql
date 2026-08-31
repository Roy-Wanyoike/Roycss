-- RoyCSS Database — Effects (1,959 CSS effects)
CREATE TABLE effects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    css_code TEXT NOT NULL,
    preview_type TEXT NOT NULL DEFAULT 'box' CHECK (preview_type IN ('box', 'text', 'button', 'loader', 'card', 'background')),
    preview_text TEXT,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived', 'deprecated')),
    version TEXT NOT NULL DEFAULT '1.0.0',
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    browser_support JSONB DEFAULT '{}',
    accessibility JSONB DEFAULT '{}',
    performance JSONB DEFAULT '{}',
    deprecated BOOLEAN NOT NULL DEFAULT FALSE,
    replacement_id UUID REFERENCES effects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_effects_slug ON effects(slug);
CREATE INDEX idx_effects_category ON effects(category_id);
CREATE INDEX idx_effects_status ON effects(status);
CREATE INDEX idx_effects_name ON effects USING gin(to_tsvector('english', name));
CREATE INDEX idx_effects_description ON effects USING gin(to_tsvector('english', description));
