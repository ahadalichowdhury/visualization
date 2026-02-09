-- Gallery feature: Public architecture sharing

-- Public architectures table
CREATE TABLE IF NOT EXISTS public_architectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    architecture_id UUID NOT NULL REFERENCES architectures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    tags TEXT[] DEFAULT '{}',
    category TEXT, -- 'e-commerce', 'streaming', 'api', 'ml-pipeline', 'real-time', 'data-processing'
    complexity TEXT CHECK (complexity IN ('beginner', 'intermediate', 'advanced')),
    node_count INT DEFAULT 0,
    edge_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    view_count INT DEFAULT 0,
    clone_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    published_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(architecture_id) -- One architecture can only be published once
);

-- Indexes for performance
CREATE INDEX idx_public_architectures_user_id ON public_architectures(user_id);
CREATE INDEX idx_public_architectures_category ON public_architectures(category);
CREATE INDEX idx_public_architectures_complexity ON public_architectures(complexity);
CREATE INDEX idx_public_architectures_published_at ON public_architectures(published_at DESC);
CREATE INDEX idx_public_architectures_like_count ON public_architectures(like_count DESC);
CREATE INDEX idx_public_architectures_view_count ON public_architectures(view_count DESC);
CREATE INDEX idx_public_architectures_tags ON public_architectures USING GIN(tags);

-- Gallery likes table
CREATE TABLE IF NOT EXISTS gallery_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_architecture_id UUID NOT NULL REFERENCES public_architectures(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, public_architecture_id) -- One user can only like once
);

CREATE INDEX idx_gallery_likes_user_id ON gallery_likes(user_id);
CREATE INDEX idx_gallery_likes_public_architecture_id ON gallery_likes(public_architecture_id);

-- Gallery comments table
CREATE TABLE IF NOT EXISTS gallery_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_architecture_id UUID NOT NULL REFERENCES public_architectures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gallery_comments_public_architecture_id ON gallery_comments(public_architecture_id);
CREATE INDEX idx_gallery_comments_user_id ON gallery_comments(user_id);
CREATE INDEX idx_gallery_comments_created_at ON gallery_comments(created_at DESC);

-- Trigger to update like_count
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public_architectures 
        SET like_count = like_count + 1 
        WHERE id = NEW.public_architecture_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public_architectures 
        SET like_count = like_count - 1 
        WHERE id = OLD.public_architecture_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_like_count
AFTER INSERT OR DELETE ON gallery_likes
FOR EACH ROW EXECUTE FUNCTION update_like_count();

-- Trigger to update comment_count
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public_architectures 
        SET comment_count = comment_count + 1 
        WHERE id = NEW.public_architecture_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public_architectures 
        SET comment_count = comment_count - 1 
        WHERE id = OLD.public_architecture_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_count
AFTER INSERT OR DELETE ON gallery_comments
FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_public_architectures_updated_at
BEFORE UPDATE ON public_architectures
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_gallery_comments_updated_at
BEFORE UPDATE ON gallery_comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
