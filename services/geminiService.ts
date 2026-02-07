
import { GoogleGenAI, Type } from "@google/genai";
import { Invoice, Client } from "../types";

export const generateFollowUpEmail = async (invoice: Invoice, client: Client): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Génère un email professionnel de relance pour la facture suivante :
  Numéro de facture : ${invoice.number}
  Client : ${client.name}
  Montant total : ${invoice.grandTotal.toFixed(2)} MAD
  Date d'échéance : ${invoice.date}
  
  L'email doit être poli, professionnel, et rédigé en français.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Impossible de générer l'email.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erreur lors de la génération de l'email par l'IA.";
  }
};

export const summarizeInvoices = async (invoices: Invoice[]): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const total = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalTva = invoices.reduce((sum, inv) => sum + (inv.tvaTotal || 0), 0);
  const paidCount = invoices.filter(i => i.status === 'Payée').length;
  const overdueCount = invoices.filter(i => i.status === 'En retard').length;
  
  const prompt = `Analyse ces statistiques de facturation et retourne un diagnostic financier structuré en JSON :
  - Nombre total de factures : ${invoices.length}
  - Chiffre d'affaires TTC : ${total.toFixed(2)} MAD
  - Montant TVA Collectée (20%) : ${totalTva.toFixed(2)} MAD
  - Factures payées : ${paidCount}
  - Factures en retard : ${overdueCount}
  
  Fournis des conseils sur la gestion de la trésorerie et les obligations fiscales (TVA).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { 
              type: Type.STRING, 
              description: "Un résumé court (max 15 mots) de la situation financière incluant la TVA." 
            },
            insights: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3 observations clés sur les flux, les retards et la part fiscale."
            },
            recommendation: { 
              type: Type.STRING, 
              description: "Une recommandation stratégique sur la gestion du cash ou de la TVA." 
            }
          },
          required: ["summary", "insights", "recommendation"]
        }
      }
    });
    
    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return null;
  } catch (error) {
    console.error("Gemini JSON Analysis Error:", error);
    return null;
  }
};
