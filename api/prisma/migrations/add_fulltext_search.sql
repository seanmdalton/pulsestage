-- Add full-text search capabilities to Question table
-- This migration adds tsvector column and GIN index for fast text search

-- Drop existing column if it exists (handles type conversion from text to tsvector)
ALTER TABLE "Question" DROP COLUMN IF EXISTS "search_vector";

-- Add tsvector column for search
ALTER TABLE "Question" ADD COLUMN "search_vector" tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION question_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.body, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."responseText", '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS question_search_vector_trigger ON "Question";
CREATE TRIGGER question_search_vector_trigger
  BEFORE INSERT OR UPDATE OF body, "responseText"
  ON "Question"
  FOR EACH ROW
  EXECUTE FUNCTION question_search_vector_update();

-- Update existing rows
UPDATE "Question" SET search_vector = 
  setweight(to_tsvector('english', COALESCE(body, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE("responseText", '')), 'B');

-- Create GIN index for fast search
CREATE INDEX IF NOT EXISTS "Question_search_vector_idx" ON "Question" USING GIN(search_vector);

-- Add comment
COMMENT ON COLUMN "Question"."search_vector" IS 'Full-text search vector (auto-updated via trigger)';

