create extension if not exists pgcrypto;

do $$
begin
  create type public.llm_image_mode as enum ('images_api', 'chat_completions_image_model');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.llm_image_response_format as enum ('url', 'b64_json', 'auto');
exception when duplicate_object then null;
end $$;

create table if not exists public.llm_provider_settings (
  id uuid primary key default gen_random_uuid(),
  provider_name text not null,
  base_url text not null,
  api_key_encrypted text not null,
  chat_model text not null,
  image_model text not null,
  chat_endpoint_path text not null,
  image_endpoint_path text not null,
  image_mode public.llm_image_mode not null default 'images_api',
  image_response_format public.llm_image_response_format not null default 'auto',
  default_image_size text not null default '1024x1024',
  timeout_ms integer not null default 30000,
  max_concurrent_image_jobs integer not null default 3,
  enable_semantic_analysis boolean not null default true,
  enable_concurrent_image_generation boolean not null default true,
  enable_schema_validation boolean not null default true,
  global_visual_style_prompt text not null,
  object_style_prompt text not null,
  negative_prompt text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint llm_provider_settings_provider_name_not_empty check (length(trim(provider_name)) > 0),
  constraint llm_provider_settings_base_url_not_empty check (length(trim(base_url)) > 0),
  constraint llm_provider_settings_api_key_not_empty check (length(trim(api_key_encrypted)) > 0),
  constraint llm_provider_settings_chat_model_not_empty check (length(trim(chat_model)) > 0),
  constraint llm_provider_settings_image_model_not_empty check (length(trim(image_model)) > 0),
  constraint llm_provider_settings_chat_endpoint_not_empty check (length(trim(chat_endpoint_path)) > 0),
  constraint llm_provider_settings_image_endpoint_not_empty check (length(trim(image_endpoint_path)) > 0),
  constraint llm_provider_settings_timeout_positive check (timeout_ms between 1000 and 120000),
  constraint llm_provider_settings_concurrency_positive check (max_concurrent_image_jobs between 1 and 12)
);

drop trigger if exists set_llm_provider_settings_updated_at on public.llm_provider_settings;
create trigger set_llm_provider_settings_updated_at
before update on public.llm_provider_settings
for each row execute function public.set_updated_at();

create unique index if not exists llm_provider_settings_single_active_idx
  on public.llm_provider_settings ((is_active))
  where is_active = true;

comment on column public.llm_provider_settings.api_key_encrypted is 'Encrypted at rest. Never expose directly to clients.';
