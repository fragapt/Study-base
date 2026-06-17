-- Base de Estudo — IAedu agent credentials
-- AI milestone generation uses the IAedu agent API instead of Anthropic direct.
-- The API key (secret) + channel id are configured per user. The endpoint is
-- fixed in code. `ai_model` is no longer used (the agent is fixed by the endpoint).

alter table public.app_settings
  add column if not exists ai_channel_id text;
