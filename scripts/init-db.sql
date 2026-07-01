-- VEDA Database Initialization
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS veda;

-- Set search path
SET search_path TO veda, public;

-- Create enum types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('researcher', 'student', 'professor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE paper_status AS ENUM ('uploaded', 'parsing', 'indexed', 'analyzed', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE experiment_status AS ENUM ('planning', 'in_progress', 'completed', 'failed', 'analyzed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE manuscript_status AS ENUM ('draft', 'writing', 'reviewing', 'completed', 'published');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE relation_type AS ENUM ('is_a', 'part_of', 'leads_to', 'contradicts', 'supports', 'extends', 'related_to');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
