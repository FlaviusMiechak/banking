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

//transactions + card id +bank id + user id

