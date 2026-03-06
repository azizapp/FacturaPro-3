
import { jsonDatabase } from './jsonDatabase';
import { supabase } from './supabaseClient';

export interface MigrationProgress {
    step: string;
    done: number;
    total: number;
    error?: string;
}

type ProgressCallback = (progress: MigrationProgress) => void;

/**
 * Migrates all local data (localStorage) to Supabase in the correct order.
 * Order matters due to foreign key constraints:
 * 1. Company settings
 * 2. Customers
 * 3. Products
 * 4. Invoices (header only)
 * 5. Invoice items (reference invoices)
 * 6. Payments (reference invoices)
 */
export async function migrateLocalToSupabase(onProgress?: ProgressCallback): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    const data = jsonDatabase.getAllData();

    const report = (step: string, done: number, total: number, error?: string) => {
        onProgress?.({ step, done, total, error });
    };

    // 1. Company Settings
    report('Paramètres entreprise', 0, 1);
    if (data.company) {
        const { id, ...companyData } = data.company;
        const { error } = await supabase.from('Factur_settings').upsert([{ id, ...companyData }]);
        if (error) errors.push(`Paramètres: ${error.message}`);
    }
    report('Paramètres entreprise', 1, 1);

    // 2. Customers
    const customers = data.clients || [];
    report('Clients', 0, customers.length);
    for (let i = 0; i < customers.length; i++) {
        const { balance, ...c } = customers[i];
        const { error } = await supabase.from('customers').upsert([c]);
        if (error) errors.push(`Client "${c.name}": ${error.message}`);
        report('Clients', i + 1, customers.length, error?.message);
    }

    // 3. Products
    const products = data.products || [];
    report('Produits', 0, products.length);
    for (let i = 0; i < products.length; i++) {
        const { error } = await supabase.from('products').upsert([products[i]]);
        if (error) errors.push(`Produit "${products[i].name}": ${error.message}`);
        report('Produits', i + 1, products.length, error?.message);
    }

    // 4. Invoices (header without items/payments)
    const invoices = data.invoices || [];
    report('Factures', 0, invoices.length);
    for (let i = 0; i < invoices.length; i++) {
        const inv = invoices[i];
        const { error } = await supabase.from('invoices').upsert([{
            id: inv.id,
            number: inv.number,
            date: inv.date,
            due_date: inv.dueDate,
            po_number: inv.poNumber,
            customer_id: inv.clientId,
            status: inv.status,
            notes: inv.notes,
            subtotal: inv.subtotal,
            tva_total: inv.tvaTotal,
            discount_amount: inv.discountAmount || 0,
            adjustment_amount: inv.adjustmentAmount || 0,
            grand_total: inv.grandTotal,
        }]);
        if (error) errors.push(`Facture "${inv.number}": ${error.message}`);
        report('Factures', i + 1, invoices.length, error?.message);
    }

    // 5. Invoice Items
    const allItems = invoices.flatMap(inv =>
        (inv.items || []).map(item => ({
            id: item.id,
            invoice_id: inv.id,
            product_id: item.productId,
            product_name: item.productName,
            quantity: item.quantity,
            price: item.price,
            tva_rate: item.tvaRate,
            discount: item.discount,
        }))
    );
    report('Lignes de facture', 0, allItems.length);
    for (let i = 0; i < allItems.length; i++) {
        const { error } = await supabase.from('invoice_items').upsert([allItems[i]]);
        if (error) errors.push(`Ligne facture: ${error.message}`);
        report('Lignes de facture', i + 1, allItems.length, error?.message);
    }

    // 6. Payments
    const allPayments = invoices.flatMap(inv =>
        (inv.payments || []).map(p => ({
            id: p.id,
            invoice_id: inv.id,
            amount: p.amount,
            date: p.date,
            method: p.method,
            check_image: p.checkImage,
            note: p.note,
        }))
    );
    report('Paiements', 0, allPayments.length);
    for (let i = 0; i < allPayments.length; i++) {
        const { error } = await supabase.from('payments').upsert([allPayments[i]]);
        if (error) errors.push(`Paiement: ${error.message}`);
        report('Paiements', i + 1, allPayments.length, error?.message);
    }

    return { success: errors.length === 0, errors };
}
