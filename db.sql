create table cards (
  id uuid primary key default gen_random_uuid(),

  bank_id uuid not null,
  user_id uuid not null,

  stripe_card_id text not null,
  stripe_cardholder_id text not null,
  stripe_customer_id text not null,

  brand text default 'visa',
  last4 text default '0000',

  exp_month int default 0,
  exp_year int default 0,

  card_type text default 'virtual',
  status text default 'active',
  currency text default 'USD',

  created_at timestamp default now()
);

//users

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password text not null,
  first_name text not null,
  last_name text not null,
  created_at timestamp default now()
);

//profiles + stripe customer id + cardholder id

create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  stripe_customer_id text,
  stripe_cardholder_id text,
  created_at timestamp default now()
);

//bank_accounts table schema
create table public.bank_accounts (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  bank_id uuid not null,
  account_id text not null,
  iban text null,
  account_number text null,
  mask text null,
  account_name text null,
  official_name text null,
  account_type text null,
  subtype text null,
  currency text null default 'usd'::text,
  current_balance numeric null default 0,
  available_balance numeric null default 0,
  frozen_balance numeric null default 0,
  status text null default 'active'::text,
  stripe_cardholder_id text null,
  access_token text null,
  funding_source_url text null,
  shareable_id text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint bank_accounts_pkey primary key (id),
  constraint bank_accounts_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint fk_bank_user foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

// profiles + stripe customer id + cardholder id
create table public.profiles (
  id uuid not null,
  email text not null,
  first_name text null,
  last_name text null,
  stripe_customer_id text null,
  stripe_cardholder_id text null,
  stripe_cardholder_status text null,
  stripe_cardholder_type text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

//cards
create table public.cards (
  id uuid not null default gen_random_uuid (),
  bank_id uuid not null,
  user_id uuid not null,
  stripe_card_id text not null,
  stripe_cardholder_id text not null,
  stripe_customer_id text null,
  brand text null,
  last4 text null,
  exp_month integer null,
  exp_year integer null,
  card_type text null,
  funding text null,
  currency text null,
  status text null,
  spending_limit numeric null default 0,
  billing_address jsonb null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint cards_pkey primary key (id),
  constraint cards_stripe_card_id_key unique (stripe_card_id),
  constraint cards_bank_id_fkey foreign KEY (bank_id) references bank_accounts (id) on delete CASCADE,
  constraint cards_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

//transactions + card id +bank id + userid
create table public.transactions (
  id uuid not null default gen_random_uuid (),
  bank_account_id uuid not null,
  card_id uuid null,
  amount numeric(12, 2) not null,
  currency text null default 'USD'::text,
  type text null,
  description text null,
  stripe_transaction_id text null,
  created_at timestamp with time zone null default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_bank_account_id_fkey foreign KEY (bank_account_id) references bank_accounts (id) on delete CASCADE,
  constraint transactions_card_id_fkey foreign KEY (card_id) references cards (id),
  constraint transactions_type_check check (
    (type = any (array['credit'::text, 'debit'::text]))
  )
) TABLESPACE pg_default;

//users table schema
create table public.transactions (
  id uuid not null default gen_random_uuid (),
  bank_account_id uuid not null,
  card_id uuid null,
  amount numeric(12, 2) not null,
  currency text null default 'USD'::text,
  type text null,
  description text null,
  stripe_transaction_id text null,
  created_at timestamp with time zone null default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_bank_account_id_fkey foreign KEY (bank_account_id) references bank_accounts (id) on delete CASCADE,
  constraint transactions_card_id_fkey foreign KEY (card_id) references cards (id),
  constraint transactions_type_check check (
    (type = any (array['credit'::text, 'debit'::text]))
  )
) TABLESPACE pg_default;

