-- NutriPulse V1 Schema
-- =====================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ==================
-- TABLES
-- ==================

-- User profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'User',
  avatar_url text,
  height_cm numeric(5,1),
  current_weight_kg numeric(5,1),
  goal_weight_kg numeric(5,1),
  body_fat_pct numeric(4,1),
  activity_level text not null default 'moderate'
    check (activity_level in ('sedentary','light','moderate','active','very_active')),
  goal_type text not null default 'maintain'
    check (goal_type in ('lose','maintain','gain')),
  goal_rate numeric(3,1) not null default 0,
  calorie_target int,
  protein_target_g int,
  carb_target_g int,
  fat_target_g int,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Food items (cached from USDA/OFF/custom/AI)
create table public.food_items (
  id uuid primary key default gen_random_uuid(),
  fdc_id int,
  off_barcode text,
  name text not null,
  brand text,
  serving_size numeric(8,2) not null default 100,
  serving_unit text not null default 'g',
  calories_per_serving numeric(7,2) not null default 0,
  protein_g numeric(7,2) not null default 0,
  carbs_g numeric(7,2) not null default 0,
  fat_g numeric(7,2) not null default 0,
  fiber_g numeric(7,2),
  source text not null check (source in ('usda','off','custom','ai')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Daily food log entries
create table public.food_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_item_id uuid references public.food_items(id),
  logged_at date not null default current_date,
  meal_type text not null default 'snack'
    check (meal_type in ('breakfast','lunch','dinner','snack')),
  servings numeric(6,2) not null default 1,
  serving_size numeric(8,2),
  serving_unit text,
  calories numeric(7,2) not null default 0,
  protein_g numeric(7,2) not null default 0,
  carbs_g numeric(7,2) not null default 0,
  fat_g numeric(7,2) not null default 0,
  override_calories numeric(7,2),
  override_protein_g numeric(7,2),
  override_carbs_g numeric(7,2),
  override_fat_g numeric(7,2),
  quick_description text,
  notes text,
  created_at timestamptz not null default now()
);

-- Weekly check-ins
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checked_in_at date not null default current_date,
  weight_kg numeric(5,1) not null,
  body_fat_pct numeric(4,1),
  estimated_tdee int,
  avg_daily_calories_7d numeric(7,1),
  weight_trend_kg numeric(5,2),
  expenditure_estimate numeric(7,1),
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, checked_in_at)
);

-- Favorite foods per user
create table public.favorite_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_item_id uuid not null references public.food_items(id),
  created_at timestamptz not null default now(),
  unique(user_id, food_item_id)
);

-- Food usage tracking (frecency)
create table public.food_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_item_id uuid not null references public.food_items(id),
  use_count int not null default 1,
  last_used_at timestamptz not null default now(),
  last_serving_size numeric(8,2),
  last_serving_unit text,
  unique(user_id, food_item_id)
);

-- Progress photos
create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_url text not null,
  taken_at date not null default current_date,
  weight_kg numeric(5,1),
  notes text,
  created_at timestamptz not null default now()
);

-- Saved recipes
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  total_calories numeric(7,2),
  total_protein_g numeric(7,2),
  total_carbs_g numeric(7,2),
  total_fat_g numeric(7,2),
  created_at timestamptz not null default now()
);

create table public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  food_item_id uuid not null references public.food_items(id),
  servings numeric(6,2) not null default 1,
  serving_size numeric(8,2),
  serving_unit text
);

-- ==================
-- INDEXES
-- ==================

create index idx_food_log_user_date on food_log(user_id, logged_at desc);
create index idx_food_log_meal on food_log(user_id, logged_at, meal_type);
create index idx_check_ins_user on check_ins(user_id, checked_in_at desc);
create index idx_food_items_fdc on food_items(fdc_id) where fdc_id is not null;
create index idx_food_items_name on food_items using gin(to_tsvector('english', name));
create index idx_food_usage_user on food_usage(user_id, last_used_at desc);
create index idx_favorite_foods_user on favorite_foods(user_id);
create index idx_progress_photos_user on progress_photos(user_id, taken_at desc);

-- ==================
-- TRIGGERS & FUNCTIONS
-- ==================

-- Auto-create profile on user sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'User')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at on profiles
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- Upsert food usage (called after logging food)
create or replace function public.upsert_food_usage(
  p_user_id uuid,
  p_food_item_id uuid,
  p_serving_size numeric,
  p_serving_unit text
)
returns void as $$
begin
  insert into public.food_usage (user_id, food_item_id, use_count, last_used_at, last_serving_size, last_serving_unit)
  values (p_user_id, p_food_item_id, 1, now(), p_serving_size, p_serving_unit)
  on conflict (user_id, food_item_id)
  do update set
    use_count = food_usage.use_count + 1,
    last_used_at = now(),
    last_serving_size = p_serving_size,
    last_serving_unit = p_serving_unit;
end;
$$ language plpgsql security definer;

-- ==================
-- VIEWS
-- ==================

create or replace view public.daily_summary as
select
  user_id,
  logged_at,
  sum(coalesce(override_calories, calories)) as total_calories,
  sum(coalesce(override_protein_g, protein_g)) as total_protein,
  sum(coalesce(override_carbs_g, carbs_g)) as total_carbs,
  sum(coalesce(override_fat_g, fat_g)) as total_fat,
  count(*) as entry_count
from public.food_log
group by user_id, logged_at;

-- ==================
-- ROW LEVEL SECURITY
-- ==================

alter table public.profiles enable row level security;
alter table public.food_items enable row level security;
alter table public.food_log enable row level security;
alter table public.check_ins enable row level security;
alter table public.favorite_foods enable row level security;
alter table public.food_usage enable row level security;
alter table public.progress_photos enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_items enable row level security;

-- Profiles: read all, update own
create policy "profiles_read" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Food items: read all, insert by authenticated
create policy "food_items_read" on food_items for select using (true);
create policy "food_items_insert" on food_items for insert
  with check (auth.uid() is not null);

-- Food log: users CRUD own
create policy "food_log_select" on food_log for select using (auth.uid() = user_id);
create policy "food_log_insert" on food_log for insert with check (auth.uid() = user_id);
create policy "food_log_update" on food_log for update using (auth.uid() = user_id);
create policy "food_log_delete" on food_log for delete using (auth.uid() = user_id);

-- Check-ins: users own
create policy "checkins_select" on check_ins for select using (auth.uid() = user_id);
create policy "checkins_insert" on check_ins for insert with check (auth.uid() = user_id);

-- Favorites: users own
create policy "favorites_select" on favorite_foods for select using (auth.uid() = user_id);
create policy "favorites_insert" on favorite_foods for insert with check (auth.uid() = user_id);
create policy "favorites_delete" on favorite_foods for delete using (auth.uid() = user_id);

-- Food usage: users own
create policy "usage_select" on food_usage for select using (auth.uid() = user_id);

-- Progress photos: users own
create policy "photos_select" on progress_photos for select using (auth.uid() = user_id);
create policy "photos_insert" on progress_photos for insert with check (auth.uid() = user_id);
create policy "photos_delete" on progress_photos for delete using (auth.uid() = user_id);

-- Recipes: users own
create policy "recipes_select" on recipes for select using (auth.uid() = user_id);
create policy "recipes_insert" on recipes for insert with check (auth.uid() = user_id);
create policy "recipes_update" on recipes for update using (auth.uid() = user_id);
create policy "recipes_delete" on recipes for delete using (auth.uid() = user_id);

create policy "recipe_items_select" on recipe_items for select
  using (exists (select 1 from recipes where recipes.id = recipe_items.recipe_id and recipes.user_id = auth.uid()));
create policy "recipe_items_insert" on recipe_items for insert
  with check (exists (select 1 from recipes where recipes.id = recipe_items.recipe_id and recipes.user_id = auth.uid()));
create policy "recipe_items_delete" on recipe_items for delete
  using (exists (select 1 from recipes where recipes.id = recipe_items.recipe_id and recipes.user_id = auth.uid()));
