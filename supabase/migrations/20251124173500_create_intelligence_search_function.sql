-- Function to search for intelligence items by vector similarity
create or replace function public.query_intelligence(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  summary text,
  category text,
  author text,
  published_at timestamptz,
  similarity float
)
language plpgsql
stable
as $$
begin
  return query
  select
    intelligence_items.id,
    intelligence_items.content,
    intelligence_items.summary,
    intelligence_items.category,
    intelligence_items.author,
    intelligence_items.published_at,
    1 - (intelligence_items.embedding <=> query_embedding) as similarity
  from intelligence_items
  where 1 - (intelligence_items.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
