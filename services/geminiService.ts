
import { GoogleGenAI, Type } from "@google/genai";
import { Invoice, Client, Product, InvoiceStatus } from "../types";

// Get API key from environment or return null if not set
const getApiKey = (): string | null => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env.VITE_GEMINI_API_KEY || null;
    }
  } catch {
    // Fallback if import.meta is not available
  }
  return null;
};

// Initialize AI client only if API key is available
const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateFollowUpEmail = async (invoice: Invoice, clientData: Client): Promise<string> => {
  if (!ai) {
    console.warn("Gemini API key not configured. Using fallback email generation.");
    return `Bonjour ${clientData.name},\n\nNous vous rappelons que la facture n°${invoice.number} d'un montant de ${invoice.grandTotal.toFixed(2)} MAD est en attente de règlement.\n\nNous vous remercions de bien vouloir procéder au paiement dans les meilleurs délais.\n\nCordialement,`;
  }
  const prompt = `Génère un email professionnel de relance pour la facture suivante :
  Numéro de facture : ${invoice.number}
  Client : ${clientData.name}
  Montant total : ${invoice.grandTotal.toFixed(2)} MAD
  Date d'échéance : ${invoice.date}
  
  L'email doit être poli, professionnel, et rédigé en français. Ne mets pas d'objet, juste le corps du message.`;

  try {
    // Generate content from the model using prompt and model name
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    // Extract text from GenerateContentResponse using .text property
    return response.text || "Impossible de générer l'email.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erreur lors de la génération de l'email par l'IA.";
  }
};

export const summarizeInvoices = async (invoices: Invoice[], clients: Client[], products: Product[]): Promise<any> => {
  const total = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalHt = invoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
  const totalTva = invoices.reduce((sum, inv) => sum + (inv.tvaTotal || 0), 0);

  const paidInvoices = invoices.filter(i => i.status === InvoiceStatus.PAID);
  const pendingInvoices = invoices.filter(i => i.status === InvoiceStatus.SENT || i.status === InvoiceStatus.PARTIAL);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.payments?.reduce((s, p) => s + p.amount, 0) || 0), 0);
  const totalPending = total - totalPaid;

  const today = new Date();

  // Advanced Financial & Client Metrics
  let totalOverdue = 0;
  const clientData = new Map<string, { totalBought: number, totalPaid: number, unpaid: number, overdue: number }>();

  invoices.forEach(inv => {
    const clientName = clients.find(c => c.id === inv.clientId)?.name || "Client Inconnu";
    const paid = inv.payments?.reduce((s, p) => s + p.amount, 0) || 0;
    const unpaid = inv.grandTotal - paid;
    const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.date);

    let isOverdue = false;
    if (unpaid > 0 && dueDate < today) {
      isOverdue = true;
      totalOverdue += unpaid;
    }

    const currentStats = clientData.get(clientName) || { totalBought: 0, totalPaid: 0, unpaid: 0, overdue: 0 };
    clientData.set(clientName, {
      totalBought: currentStats.totalBought + inv.grandTotal,
      totalPaid: currentStats.totalPaid + paid,
      unpaid: currentStats.unpaid + unpaid,
      overdue: currentStats.overdue + (isOverdue ? unpaid : 0)
    });
  });

  const clientsArray = Array.from(clientData.entries()).map(([name, stats]) => ({ name, ...stats }));

  const bestCashClient = clientsArray.filter(c => c.totalPaid > 0).sort((a, b) => b.totalPaid - a.totalPaid)[0];
  const worstDebtor = clientsArray.filter(c => c.overdue > 0).sort((a, b) => b.overdue - a.overdue)[0];
  const biggestBuyer = clientsArray.sort((a, b) => b.totalBought - a.totalBought)[0];

  // Advanced Product Metrics
  const productSales = new Map<string, number>();
  products.forEach(p => productSales.set(p.name, 0)); // Ensure all DB products exist in map

  invoices.forEach(inv => {
    inv.items.forEach(item => {
      const prodName = products.find(p => item.productName?.toUpperCase().includes(p.name.toUpperCase()))?.name || item.productName || "Produit Inconnu";
      productSales.set(prodName, (productSales.get(prodName) || 0) + item.quantity);
    });
  });

  const sortedProducts = Array.from(productSales.entries()).sort((a, b) => b[1] - a[1]);
  const topProduct = sortedProducts.length > 0 ? `${sortedProducts[0][0]} (${sortedProducts[0][1]} ventes)` : "Aucun";
  const deadProducts = sortedProducts.filter(p => p[1] === 0).map(p => p[0]);

  if (!ai) {
    console.warn("Gemini API key not configured. Using fallback summary.");
    return {
      summary: `Bilan: CA TTC ${total.toLocaleString()} MAD. Encaissé: ${totalPaid.toLocaleString()} MAD. Impayés: ${totalPending.toLocaleString()} MAD.`,
      insights: [
        `Meilleur payeur : ${bestCashClient?.name || 'Aucun'}`,
        `Produit vedette : ${topProduct}`,
        `Retards de paiement : ${totalOverdue.toLocaleString()} MAD`
      ],
      recommendation: worstDebtor
        ? `Contactez d'urgence ${worstDebtor.name} pour recouvrer les ${worstDebtor.overdue.toLocaleString()} MAD en retard.`
        : "Trésorerie saine."
    };
  }

  const prompt = `Agis comme un directeur financier proactif et stratégique (CFO) qui conseille le gérant de l'entreprise. Analyse les données comptables suivantes et donne un avis critique, chiffré et ultra-actionnable :
  
  --- ÉTAT DE LA TRÉSORERIE ---
  - CA Total généré : ${total.toLocaleString()} MAD
  - Cash réel encaissé : ${totalPaid.toLocaleString()} MAD (${total > 0 ? ((totalPaid / total) * 100).toFixed(0) : 0}% du CA)
  - Créances totales (Argent dehors) : ${totalPending.toLocaleString()} MAD
  - Retards de paiement DANGEREUX (Dépassant l'échéance) : ${totalOverdue.toLocaleString()} MAD
  
  --- DIAGNOSTIC CLIENTS ---
  - Le client le plus rentable (Acheteur + Bon Payeur) : ${bestCashClient ? `${bestCashClient.name} (${bestCashClient.totalPaid.toLocaleString()} MAD encaissés)` : "Aucun"}
  - Le plus grand client global : ${biggestBuyer ? `${biggestBuyer.name} (${biggestBuyer.totalBought.toLocaleString()} MAD)` : "Aucun"}
  - LE PIRE PAYEUR (Urgence Recouvrement) : ${worstDebtor ? `${worstDebtor.name} (${worstDebtor.overdue.toLocaleString()} MAD en RÉTARD)` : "Aucun retard critique"}
  
  --- DIAGNOSTIC PRODUITS ---
  - Produit Star : ${topProduct}
  - Produits morts (0 vente, risque de stock dormant) : ${deadProducts.length > 0 ? deadProducts.slice(0, 3).join(', ') : "Aucun"}
  
  --- CE QUE TU DOIS FAIRE ---
  1. Écris un sommaire (summary) dur mais réaliste sur la santé du "Cash FLow" (Trésorerie). Ne te limite pas au CA, parle du cash.
  2. Écris 4 constats (insights) très précis : nomme les clients bons/mauvais, alerte sur le ratio d'impayés, et conseille quoi faire du produit star ou des produits morts.
  3. Formule UNE SEULE recommandation ultra-précise (recommendation) sous forme d'une "Action immédiate". Par exemple : "Envoyez un email ce matin à [Client] pour exiger [Montant]. Proposez une promo de -10% sur [Produit mort]." 
  
  L'output doit être en bon français professionnel et sous forme JSON strict.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "Résumé global des ventes et de la situation financière en 1-2 phrases percutantes.",
            },
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "4-5 observations très spécifiques : mentionne nominativement le meilleur client, le pire client, le client qui retarde les paiements, et le meilleur produit.",
            },
            recommendation: {
              type: Type.STRING,
              description: "Un conseil stratégique pragmatique pour augmenter les ventes ou récupérer l'argent des clients retardataires.",
            },
          },
          required: ["summary", "insights", "recommendation"],
        }
      }
    });
    // Use .text property to get the generated string
    const text = response.text?.trim() || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini JSON Analysis Error:", error);
    return {
      summary: "Analyse indisponible.",
      insights: ["Vérifiez vos paramètres API", "Les données n'ont pu être traitées"],
      recommendation: "Relancez manuellement vos factures en retard."
    };
  }
};
