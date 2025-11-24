-- Enable the vector extension if not already enabled
create extension if not exists vector;

-- Create intelligence_sources table
create table if not exists public.intelligence_sources (
    id uuid not null default gen_random_uuid(),
    name text not null,
    type text not null check (type in ('whatsapp_group', 'youtube_channel', 'web_search', 'rss_feed', 'other')),
    url text, -- URL or Group ID
    description text,
    status text not null default 'active' check (status in ('active', 'inactive', 'error')),
    last_crawled_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint intelligence_sources_pkey primary key (id)
);

-- Create intelligence_items table
create table if not exists public.intelligence_items (
    id uuid not null default gen_random_uuid(),
    source_id uuid references public.intelligence_sources(id) on delete set null,
    external_id text, -- Unique ID from the source (e.g., Message ID, Video ID)
    content text not null, -- Raw content
    author text, -- Hashed author or channel name
    published_at timestamptz not null default now(),
    
    -- AI Analysis fields
    summary text,
    category text check (category in ('securite', 'economie', 'social', 'politique', 'rumeur', 'autre')),
    sentiment text check (sentiment in ('positif', 'negatif', 'neutre', 'colere', 'peur', 'joie')),
    entities text[], -- Array of extracted entities
    
    -- Vector embedding (1536 dimensions for OpenAI, or 768 for Gemini - let's go with 1536 for compatibility with most models)
    embedding vector(1536),
    
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint intelligence_items_pkey primary key (id),
    constraint intelligence_items_external_id_key unique (source_id, external_id)
);

-- Enable Row Level Security
alter table public.intelligence_sources enable row level security;
alter table public.intelligence_items enable row level security;

-- Create policies for intelligence_sources
-- Only admins can manage sources
create policy "Admins can manage intelligence sources"
    on public.intelligence_sources
    for all
    using (
        auth.uid() in (
            select id from public.user_profiles 
            where role in ('admin', 'president', 'dgss')
        )
    );

-- Allow read access to authenticated users (iAsted needs to read)
create policy "Authenticated users can read intelligence sources"
    on public.intelligence_sources
    for select
    using (auth.role() = 'authenticated');

-- Create policies for intelligence_items
-- Admins and DGSS can manage items
create policy "Admins and DGSS can manage intelligence items"
    on public.intelligence_items
    for all
    using (
        auth.uid() in (
            select id from public.user_profiles 
            where role in ('admin', 'president', 'dgss')
        )
    );

-- Allow read access to authenticated users (iAsted needs to read for RAG)
create policy "Authenticated users can read intelligence items"
    on public.intelligence_items
    for select
    using (auth.role() = 'authenticated');

-- Create an index for vector similarity search
-- This speeds up the RAG queries significantly
create index on public.intelligence_items using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

-- Create a function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_updated_at_intelligence_sources
    before update on public.intelligence_sources
    for each row
    execute procedure public.handle_updated_at();

create trigger handle_updated_at_intelligence_items
    before update on public.intelligence_items
    for each row
    execute procedure public.handle_updated_at();
