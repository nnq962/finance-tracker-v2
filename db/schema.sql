\restrict dbmate

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: dbmate; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA dbmate;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: schema_migrations; Type: TABLE; Schema: dbmate; Owner: -
--

CREATE TABLE dbmate.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id uuid DEFAULT uuidv7() NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    institution_id text,
    opening_balance bigint NOT NULL,
    balance bigint NOT NULL,
    note text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT accounts_balance_check CHECK (((balance >= '-999999999999999'::bigint) AND (balance <= '999999999999999'::bigint))),
    CONSTRAINT accounts_check CHECK (((type = 'cash'::text) = (institution_id IS NULL))),
    CONSTRAINT accounts_institution_id_check CHECK (((char_length(institution_id) >= 1) AND (char_length(institution_id) <= 64))),
    CONSTRAINT accounts_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 80))),
    CONSTRAINT accounts_note_check CHECK ((char_length(note) <= 500)),
    CONSTRAINT accounts_opening_balance_check CHECK (((opening_balance >= '-999999999999999'::bigint) AND (opening_balance <= '999999999999999'::bigint))),
    CONSTRAINT accounts_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text]))),
    CONSTRAINT accounts_type_check CHECK ((type = ANY (ARRAY['cash'::text, 'bank'::text, 'e-wallet'::text])))
);


--
-- Name: ai_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_usage (
    user_id text NOT NULL,
    month date NOT NULL,
    count integer DEFAULT 0 NOT NULL,
    CONSTRAINT ai_usage_count_check CHECK ((count >= 0)),
    CONSTRAINT ai_usage_month_check CHECK ((EXTRACT(day FROM month) = (1)::numeric))
);


--
-- Name: category_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category_groups (
    id uuid DEFAULT uuidv7() NOT NULL,
    user_id text NOT NULL,
    type text NOT NULL,
    name text NOT NULL,
    icon_name text NOT NULL,
    color_name text NOT NULL,
    sort_order bigint DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT category_groups_color_name_check CHECK (((char_length(color_name) >= 1) AND (char_length(color_name) <= 64))),
    CONSTRAINT category_groups_icon_name_check CHECK (((char_length(icon_name) >= 1) AND (char_length(icon_name) <= 64))),
    CONSTRAINT category_groups_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 80))),
    CONSTRAINT category_groups_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text]))),
    CONSTRAINT category_groups_type_check CHECK ((type = ANY (ARRAY['expense'::text, 'income'::text])))
);


--
-- Name: category_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category_items (
    id uuid DEFAULT uuidv7() NOT NULL,
    user_id text NOT NULL,
    group_id uuid NOT NULL,
    type text NOT NULL,
    name text NOT NULL,
    icon_name text NOT NULL,
    sort_order bigint DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT category_items_icon_name_check CHECK (((char_length(icon_name) >= 1) AND (char_length(icon_name) <= 64))),
    CONSTRAINT category_items_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 80))),
    CONSTRAINT category_items_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text]))),
    CONSTRAINT category_items_type_check CHECK ((type = ANY (ARRAY['expense'::text, 'income'::text])))
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id uuid DEFAULT uuidv7() NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    initials text NOT NULL,
    relationship text,
    phone text,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contacts_initials_check CHECK (((char_length(initials) >= 1) AND (char_length(initials) <= 4))),
    CONSTRAINT contacts_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 80))),
    CONSTRAINT contacts_note_check CHECK ((char_length(note) <= 500)),
    CONSTRAINT contacts_phone_check CHECK ((char_length(phone) <= 30)),
    CONSTRAINT contacts_relationship_check CHECK ((char_length(relationship) <= 80))
);


--
-- Name: debt_operations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debt_operations (
    user_id text NOT NULL,
    id uuid NOT NULL,
    fingerprint text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT debt_operations_fingerprint_check CHECK ((fingerprint ~ '^[0-9a-f]{64}$'::text))
);


--
-- Name: debt_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debt_payments (
    id uuid DEFAULT uuidv7() NOT NULL,
    user_id text NOT NULL,
    debt_id uuid NOT NULL,
    account_id uuid NOT NULL,
    amount bigint NOT NULL,
    paid_at date NOT NULL,
    paid_time time(0) without time zone NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT debt_payments_amount_check CHECK (((amount >= 1) AND (amount <= '999999999999999'::bigint))),
    CONSTRAINT debt_payments_note_check CHECK ((char_length(note) <= 500))
);


--
-- Name: debts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debts (
    id uuid DEFAULT uuidv7() NOT NULL,
    user_id text NOT NULL,
    contact_id uuid NOT NULL,
    direction text NOT NULL,
    recording_mode text DEFAULT 'cash-flow'::text NOT NULL,
    account_id uuid,
    amount bigint NOT NULL,
    interest_rate numeric(5,2),
    interest_period text,
    note text,
    recorded_at date NOT NULL,
    due_at date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT debts_amount_check CHECK (((amount >= 1) AND (amount <= '999999999999999'::bigint))),
    CONSTRAINT debts_check CHECK (((interest_rate IS NULL) = (interest_period IS NULL))),
    CONSTRAINT debts_check1 CHECK (((recording_mode = 'opening'::text) OR (account_id IS NOT NULL))),
    CONSTRAINT debts_direction_check CHECK ((direction = ANY (ARRAY['lent'::text, 'borrowed'::text]))),
    CONSTRAINT debts_interest_period_check CHECK ((interest_period = ANY (ARRAY['month'::text, 'year'::text]))),
    CONSTRAINT debts_interest_rate_check CHECK (((interest_rate > (0)::numeric) AND (interest_rate <= (100)::numeric))),
    CONSTRAINT debts_note_check CHECK (((char_length(note) >= 1) AND (char_length(note) <= 500))),
    CONSTRAINT debts_recording_mode_check CHECK ((recording_mode = ANY (ARRAY['cash-flow'::text, 'opening'::text])))
);


--
-- Name: mission_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mission_rewards (
    user_id text NOT NULL,
    mission text NOT NULL,
    credits integer NOT NULL,
    claimed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mission_rewards_credits_check CHECK ((credits > 0)),
    CONSTRAINT mission_rewards_mission_check CHECK (((char_length(mission) >= 1) AND (char_length(mission) <= 40)))
);


--
-- Name: notification_browsers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_browsers (
    id uuid NOT NULL,
    user_id text,
    session_id uuid NOT NULL,
    device_id text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_log_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_log_devices (
    user_id text NOT NULL,
    date date NOT NULL,
    device_id text NOT NULL,
    status text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    error_code text,
    retry_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notification_log_devices_attempts_check CHECK ((attempts >= 0)),
    CONSTRAINT notification_log_devices_device_id_check CHECK ((device_id ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT notification_log_devices_error_code_check CHECK ((char_length(error_code) <= 100)),
    CONSTRAINT notification_log_devices_status_check CHECK ((status = ANY (ARRAY['sending'::text, 'retry'::text, 'sent'::text, 'unregistered'::text, 'failed'::text, 'detached'::text])))
);


--
-- Name: notification_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_logs (
    user_id text NOT NULL,
    date date NOT NULL,
    status text NOT NULL,
    attempt_id uuid,
    lease_until timestamp with time zone,
    message_title text NOT NULL,
    message_body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notification_logs_check CHECK (((attempt_id IS NULL) = (lease_until IS NULL))),
    CONSTRAINT notification_logs_status_check CHECK ((status = ANY (ARRAY['processing'::text, 'retry'::text, 'sent'::text, 'failed'::text, 'waiting'::text])))
);


--
-- Name: notification_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_settings (
    user_id text NOT NULL,
    notifications_enabled boolean DEFAULT false NOT NULL,
    daily_reminder_time time(0) without time zone DEFAULT '20:00:00'::time without time zone NOT NULL,
    time_zone text DEFAULT 'Asia/Ho_Chi_Minh'::text NOT NULL,
    next_reminder_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notification_settings_check CHECK ((notifications_enabled OR (next_reminder_at IS NULL)))
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT uuidv7() NOT NULL,
    user_id text NOT NULL,
    order_code bigint NOT NULL,
    period text NOT NULL,
    amount bigint NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    payment_link_id text,
    checkout_url text,
    reference text,
    paid_at timestamp with time zone,
    subscription_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payments_amount_check CHECK ((amount > 0)),
    CONSTRAINT payments_check CHECK (((status = 'paid'::text) = (paid_at IS NOT NULL))),
    CONSTRAINT payments_period_check CHECK ((period = ANY (ARRAY['month'::text, 'year'::text]))),
    CONSTRAINT payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text, 'expired'::text])))
);


--
-- Name: payment_order_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_order_code_seq
    START WITH 100001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_order_code_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_order_code_seq OWNED BY public.payments.order_code;


--
-- Name: push_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_devices (
    id text NOT NULL,
    user_id text NOT NULL,
    fid text NOT NULL,
    name text NOT NULL,
    browser_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT push_devices_fid_check CHECK (((char_length(fid) >= 1) AND (char_length(fid) <= 256))),
    CONSTRAINT push_devices_id_check CHECK ((id ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT push_devices_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100)))
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT uuidv7() NOT NULL,
    user_id text NOT NULL,
    plan text NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    amount bigint DEFAULT 0 NOT NULL,
    note text,
    granted_by text NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT subscriptions_amount_check CHECK ((amount >= 0)),
    CONSTRAINT subscriptions_check CHECK ((ends_at > starts_at)),
    CONSTRAINT subscriptions_note_check CHECK ((char_length(note) <= 200)),
    CONSTRAINT subscriptions_plan_check CHECK ((plan = 'pro'::text))
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT uuidv7() NOT NULL,
    user_id text NOT NULL,
    kind text NOT NULL,
    amount bigint NOT NULL,
    fee bigint DEFAULT 0 NOT NULL,
    account_id uuid,
    category_item_id uuid,
    debt_id uuid,
    from_account_id uuid,
    to_account_id uuid,
    note text,
    occurred_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT transactions_amount_check CHECK (((amount >= 1) AND (amount <= '999999999999999'::bigint))),
    CONSTRAINT transactions_check CHECK ((((kind = 'transfer'::text) AND (from_account_id IS NOT NULL) AND (to_account_id IS NOT NULL) AND (from_account_id <> to_account_id) AND (account_id IS NULL) AND (category_item_id IS NULL) AND (debt_id IS NULL)) OR ((kind = ANY (ARRAY['expense'::text, 'income'::text])) AND (account_id IS NOT NULL) AND (from_account_id IS NULL) AND (to_account_id IS NULL) AND (fee = 0) AND ((category_item_id IS NULL) <> (debt_id IS NULL))))),
    CONSTRAINT transactions_fee_check CHECK (((fee >= 0) AND (fee <= '999999999999999'::bigint))),
    CONSTRAINT transactions_kind_check CHECK ((kind = ANY (ARRAY['expense'::text, 'income'::text, 'transfer'::text]))),
    CONSTRAINT transactions_note_check CHECK ((char_length(note) <= 500))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    categories_initialized_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    onboarding_seen_at timestamp with time zone,
    ai_credits integer DEFAULT 0 NOT NULL,
    CONSTRAINT users_ai_credits_check CHECK ((ai_credits >= 0)),
    CONSTRAINT users_id_check CHECK ((id ~ '^[A-Za-z0-9_-]{1,128}$'::text))
);


--
-- Name: payments order_code; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN order_code SET DEFAULT nextval('public.payment_order_code_seq'::regclass);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: dbmate; Owner: -
--

ALTER TABLE ONLY dbmate.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_user_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_id_key UNIQUE (user_id, id);


--
-- Name: ai_usage ai_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage
    ADD CONSTRAINT ai_usage_pkey PRIMARY KEY (user_id, month);


--
-- Name: category_groups category_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_groups
    ADD CONSTRAINT category_groups_pkey PRIMARY KEY (id);


--
-- Name: category_groups category_groups_user_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_groups
    ADD CONSTRAINT category_groups_user_id_id_key UNIQUE (user_id, id);


--
-- Name: category_groups category_groups_user_id_id_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_groups
    ADD CONSTRAINT category_groups_user_id_id_type_key UNIQUE (user_id, id, type);


--
-- Name: category_items category_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_items
    ADD CONSTRAINT category_items_pkey PRIMARY KEY (id);


--
-- Name: category_items category_items_user_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_items
    ADD CONSTRAINT category_items_user_id_id_key UNIQUE (user_id, id);


--
-- Name: category_items category_items_user_id_id_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_items
    ADD CONSTRAINT category_items_user_id_id_type_key UNIQUE (user_id, id, type);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_user_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_user_id_id_key UNIQUE (user_id, id);


--
-- Name: debt_operations debt_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_operations
    ADD CONSTRAINT debt_operations_pkey PRIMARY KEY (user_id, id);


--
-- Name: debt_payments debt_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_payments
    ADD CONSTRAINT debt_payments_pkey PRIMARY KEY (id);


--
-- Name: debts debts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_pkey PRIMARY KEY (id);


--
-- Name: debts debts_user_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_user_id_id_key UNIQUE (user_id, id);


--
-- Name: mission_rewards mission_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_rewards
    ADD CONSTRAINT mission_rewards_pkey PRIMARY KEY (user_id, mission);


--
-- Name: notification_browsers notification_browsers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_browsers
    ADD CONSTRAINT notification_browsers_pkey PRIMARY KEY (id);


--
-- Name: notification_log_devices notification_log_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_log_devices
    ADD CONSTRAINT notification_log_devices_pkey PRIMARY KEY (user_id, date, device_id);


--
-- Name: notification_logs notification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (user_id, date);


--
-- Name: notification_settings notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_pkey PRIMARY KEY (user_id);


--
-- Name: payments payments_order_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_code_key UNIQUE (order_code);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: push_devices push_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_devices
    ADD CONSTRAINT push_devices_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_debt_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_debt_id_key UNIQUE (debt_id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: accounts_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_user_created_idx ON public.accounts USING btree (user_id, created_at);


--
-- Name: category_groups_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX category_groups_user_idx ON public.category_groups USING btree (user_id, type, sort_order);


--
-- Name: category_items_group_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX category_items_group_idx ON public.category_items USING btree (user_id, group_id, sort_order);


--
-- Name: contacts_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_user_created_idx ON public.contacts USING btree (user_id, created_at);


--
-- Name: debt_payments_account_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX debt_payments_account_idx ON public.debt_payments USING btree (account_id);


--
-- Name: debt_payments_debt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX debt_payments_debt_idx ON public.debt_payments USING btree (user_id, debt_id, paid_at, paid_time);


--
-- Name: debts_account_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX debts_account_idx ON public.debts USING btree (account_id) WHERE (account_id IS NOT NULL);


--
-- Name: debts_contact_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX debts_contact_idx ON public.debts USING btree (user_id, contact_id);


--
-- Name: debts_user_recorded_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX debts_user_recorded_idx ON public.debts USING btree (user_id, recorded_at DESC);


--
-- Name: notification_browsers_device_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_browsers_device_idx ON public.notification_browsers USING btree (device_id) WHERE (device_id IS NOT NULL);


--
-- Name: notification_logs_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_logs_date_idx ON public.notification_logs USING btree (date);


--
-- Name: notification_settings_due_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_settings_due_idx ON public.notification_settings USING btree (next_reminder_at) WHERE notifications_enabled;


--
-- Name: payments_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_user_id_created_at_idx ON public.payments USING btree (user_id, created_at);


--
-- Name: push_devices_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX push_devices_user_idx ON public.push_devices USING btree (user_id);


--
-- Name: subscriptions_user_id_ends_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscriptions_user_id_ends_at_idx ON public.subscriptions USING btree (user_id, ends_at);


--
-- Name: transactions_account_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_account_idx ON public.transactions USING btree (account_id) WHERE (account_id IS NOT NULL);


--
-- Name: transactions_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_category_idx ON public.transactions USING btree (category_item_id) WHERE (category_item_id IS NOT NULL);


--
-- Name: transactions_from_account_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_from_account_idx ON public.transactions USING btree (from_account_id) WHERE (from_account_id IS NOT NULL);


--
-- Name: transactions_to_account_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_to_account_idx ON public.transactions USING btree (to_account_id) WHERE (to_account_id IS NOT NULL);


--
-- Name: transactions_user_occurred_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_user_occurred_idx ON public.transactions USING btree (user_id, occurred_at DESC);


--
-- Name: accounts accounts_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER accounts_set_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: category_groups category_groups_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER category_groups_set_updated_at BEFORE UPDATE ON public.category_groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: category_items category_items_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER category_items_set_updated_at BEFORE UPDATE ON public.category_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: contacts contacts_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER contacts_set_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: debt_payments debt_payments_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER debt_payments_set_updated_at BEFORE UPDATE ON public.debt_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: debts debts_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER debts_set_updated_at BEFORE UPDATE ON public.debts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: notification_browsers notification_browsers_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notification_browsers_set_updated_at BEFORE UPDATE ON public.notification_browsers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: notification_settings notification_settings_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notification_settings_set_updated_at BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: push_devices push_devices_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER push_devices_set_updated_at BEFORE UPDATE ON public.push_devices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: transactions transactions_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER transactions_set_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: accounts accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ai_usage ai_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage
    ADD CONSTRAINT ai_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: category_groups category_groups_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_groups
    ADD CONSTRAINT category_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: category_items category_items_user_id_group_id_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_items
    ADD CONSTRAINT category_items_user_id_group_id_type_fkey FOREIGN KEY (user_id, group_id, type) REFERENCES public.category_groups(user_id, id, type) ON DELETE CASCADE;


--
-- Name: contacts contacts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: debt_operations debt_operations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_operations
    ADD CONSTRAINT debt_operations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: debt_payments debt_payments_user_id_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_payments
    ADD CONSTRAINT debt_payments_user_id_account_id_fkey FOREIGN KEY (user_id, account_id) REFERENCES public.accounts(user_id, id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: debt_payments debt_payments_user_id_debt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_payments
    ADD CONSTRAINT debt_payments_user_id_debt_id_fkey FOREIGN KEY (user_id, debt_id) REFERENCES public.debts(user_id, id) ON DELETE CASCADE;


--
-- Name: debts debts_user_id_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_user_id_account_id_fkey FOREIGN KEY (user_id, account_id) REFERENCES public.accounts(user_id, id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: debts debts_user_id_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_user_id_contact_id_fkey FOREIGN KEY (user_id, contact_id) REFERENCES public.contacts(user_id, id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: debts debts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: mission_rewards mission_rewards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_rewards
    ADD CONSTRAINT mission_rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notification_browsers notification_browsers_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_browsers
    ADD CONSTRAINT notification_browsers_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.push_devices(id) ON DELETE SET NULL;


--
-- Name: notification_browsers notification_browsers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_browsers
    ADD CONSTRAINT notification_browsers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notification_log_devices notification_log_devices_user_id_date_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_log_devices
    ADD CONSTRAINT notification_log_devices_user_id_date_fkey FOREIGN KEY (user_id, date) REFERENCES public.notification_logs(user_id, date) ON DELETE CASCADE;


--
-- Name: notification_logs notification_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notification_settings notification_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;


--
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: push_devices push_devices_browser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_devices
    ADD CONSTRAINT push_devices_browser_id_fkey FOREIGN KEY (browser_id) REFERENCES public.notification_browsers(id) ON DELETE CASCADE;


--
-- Name: push_devices push_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_devices
    ADD CONSTRAINT push_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_user_id_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_account_id_fkey FOREIGN KEY (user_id, account_id) REFERENCES public.accounts(user_id, id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: transactions transactions_user_id_category_item_id_kind_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_category_item_id_kind_fkey FOREIGN KEY (user_id, category_item_id, kind) REFERENCES public.category_items(user_id, id, type) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: transactions transactions_user_id_debt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_debt_id_fkey FOREIGN KEY (user_id, debt_id) REFERENCES public.debts(user_id, id) ON DELETE CASCADE;


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_user_id_from_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_from_account_id_fkey FOREIGN KEY (user_id, from_account_id) REFERENCES public.accounts(user_id, id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: transactions transactions_user_id_to_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_to_account_id_fkey FOREIGN KEY (user_id, to_account_id) REFERENCES public.accounts(user_id, id) DEFERRABLE INITIALLY DEFERRED;


--
-- PostgreSQL database dump complete
--

\unrestrict dbmate


--
-- Dbmate schema migrations
--

INSERT INTO dbmate.schema_migrations (version) VALUES
    ('20261001000001'),
    ('20261001000002'),
    ('20261001000003'),
    ('20261001000004'),
    ('20261001000005'),
    ('20261001000006'),
    ('20261002000001'),
    ('20261002000002'),
    ('20261002000003'),
    ('20261003000001'),
    ('20261003000002'),
    ('20261003000004'),
    ('20261003000005');
