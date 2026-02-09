-- Rollback gallery feature

DROP TRIGGER IF EXISTS trigger_update_gallery_comments_updated_at ON gallery_comments;
DROP TRIGGER IF EXISTS trigger_update_public_architectures_updated_at ON public_architectures;
DROP TRIGGER IF EXISTS trigger_update_comment_count ON gallery_comments;
DROP TRIGGER IF EXISTS trigger_update_like_count ON gallery_likes;

DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_comment_count();
DROP FUNCTION IF EXISTS update_like_count();

DROP TABLE IF EXISTS gallery_comments;
DROP TABLE IF EXISTS gallery_likes;
DROP TABLE IF EXISTS public_architectures;
