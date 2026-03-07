-- =============================================
-- FacturaPro - Supabase Database Schema
-- Version 2.0 (2026-03-06)
-- =============================================


-- ============================================================
-- 1. Table: Factur_settings (Company/App Settings)
-- ============================================================
CREATE TABLE IF NOT EXISTS public."Factur_settings" (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 TEXT,
    siret                TEXT,             -- ICE (Identifiant Commun de l'Entreprise)
    address              TEXT,
    country              TEXT,
    city                 TEXT,
    email                TEXT,
    phone                TEXT,
    logo                 TEXT,             -- Base64 or URL
    icons                TEXT,
    footer               TEXT,             -- Texte pied de page des factures
    signature            TEXT,             -- Base64 image de signature/cachet
    remarques            TEXT,
    invoice_prefix       TEXT,             -- Ex: FAC-
    invoice_start_number INTEGER DEFAULT 1,
    updated_at           TIMESTAMPTZ DEFAULT timezone('utc', now())
);


-- ============================================================
-- 2. Table: customers (Clients)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    location     TEXT,
    city         TEXT,
    address      TEXT,
    gsm1         TEXT,
    gsm2         TEXT,
    phone        TEXT,
    email        TEXT,
    user_email   TEXT,             -- Email interne (utilisateur assigné)
    is_blocked   BOOLEAN DEFAULT false,
    ice          TEXT,             -- ICE du client
    created_at   TIMESTAMPTZ DEFAULT timezone('utc', now())
);


-- ============================================================
-- 3. Table: products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    description TEXT,
    price       NUMERIC(15, 2) DEFAULT 0.00,
    unit        TEXT,
    created_at  TIMESTAMPTZ DEFAULT timezone('utc', now())
);


-- ============================================================
-- 4. Table: invoices
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number            TEXT NOT NULL UNIQUE,
    date              DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date          DATE,
    po_number         TEXT,                 -- Numéro bon de commande
    customer_id       UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    status            TEXT NOT NULL DEFAULT 'Brouillon',
    notes             TEXT,
    subtotal          NUMERIC(15, 2) DEFAULT 0.00,
    tva_total         NUMERIC(15, 2) DEFAULT 0.00,
    discount_amount   NUMERIC(15, 2) DEFAULT 0.00,
    adjustment_amount NUMERIC(15, 2) DEFAULT 0.00,
    grand_total       NUMERIC(15, 2) DEFAULT 0.00,
    created_at        TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at  ON public.invoices(created_at DESC);


-- ============================================================
-- 5. Table: invoice_items (Lines of each invoice)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id   UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    product_id   UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT,
    quantity     NUMERIC(10, 2) DEFAULT 1.00,
    price        NUMERIC(15, 2) DEFAULT 0.00,
    tva_rate     NUMERIC(10, 2) DEFAULT 0.00,
    discount     NUMERIC(10, 2) DEFAULT 0.00,
    created_at   TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);


-- ============================================================
-- 6. Table: payments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id   UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount       NUMERIC(15, 2) DEFAULT 0.00,
    date         DATE NOT NULL DEFAULT CURRENT_DATE,
    method       TEXT,                   -- Espèces / Chèque / Virement
    check_image  TEXT,                   -- Base64
    note         TEXT,
    created_at   TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);


-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public."Factur_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments          ENABLE ROW LEVEL SECURITY;

-- Allow full access to all tables for the anon role (since the app uses anon key)
CREATE POLICY "Allow all operations for Factur_settings" ON public."Factur_settings" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for invoice_items" ON public.invoice_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

