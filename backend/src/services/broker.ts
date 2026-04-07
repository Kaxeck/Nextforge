import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { getDb } from './database';
import { verifyMachineOnChain } from './stellar';

dotenv.config();

// Inicializamos el SDK oficial de Google AI Studio
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy");

// Seleccionamos la versión ultra rápida de Gemini sugerida
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function handleNewRegistration(
    machineId: string, 
    machineType: string, 
    price: number, 
    location: string, 
    materials: string
) {
    const db = getDb();
    
    // Save to local cache as pending
    db.prepare(`
        INSERT INTO machines_cache (id, machine_type, status, location)
        VALUES (?, ?, 'pending_verification', ?)
        ON CONFLICT(id) DO UPDATE SET status='pending_verification'
    `).run(machineId, machineType, location);

    console.log(`🧠 AI Broker evaluating Machine ${machineId}...`);

    try {
        const prompt = `
            You are the NextForge Autonomous Broker AI. A new machine has been registered on the blockchain.
            You must evaluate if the data uploaded by the owner looks legitimate and standard for global industrial manufacturing.

            Specs:
            - Type: ${machineType}
            - Location: ${location}
            - Price per cycle (stroops): ${price} (Note: 1 USDC = 10,000,000 stroops. So 50000 = 0.005 USDC)
            - Materials: ${materials}

            Analyze the realism. If it looks legitimate, answer EXACTLY with the word "APPROVED" followed by a short reason.
            If the specs look highly suspicious, abusive, or physically impossible (e.g. producing Titanium with FDM for $0.0001), answer EXACTLY with the word "SUSPICIOUS" followed by the reason why a physical inspection is needed.
        `;

        // If no API key, bypass for demo purposes
        if (process.env.GEMINI_API_KEY === "dummy" || !process.env.GEMINI_API_KEY) {
            console.log("⚠️ No Gemini API Key found. Auto-approving for hackathon demo.");
            await verifyMachineOnChain(machineId);
            return;
        }

        const result = await model.generateContent(prompt);
        const responseString = result.response.text().trim();
        
        console.log(`[Gemini Response]: ${responseString}`);

        if (responseString.startsWith("APPROVED")) {
            // Update cache and sign on-chain
            db.prepare(`UPDATE machines_cache SET ai_notes = ? WHERE id = ?`).run(responseString, machineId);
            await verifyMachineOnChain(machineId);
            
        } else if (responseString.startsWith("SUSPICIOUS")) {
            // Put in gig-economy fallback status
            db.prepare(`UPDATE machines_cache SET status = 'pending_physical_verify', ai_notes = ? WHERE id = ?`)
              .run(responseString, machineId);
            
            console.log(`🚨 AI detected suspicious data. Generating physical verification Bounty for ${machineId}.`);
            
            db.prepare(`
                INSERT INTO bounties (machine_id, reason, cost)
                VALUES (?, ?, ?)
            `).run(machineId, responseString, 500000000); // Cost: 50 USDC
        }
        
    } catch (error) {
        console.error("AI Evaluation completely failed:", error);
    }
}

export async function negotiateOrder(orderReq: any) {
    // Boilerplate for matchmaking: AI receives order requirement and picks the best machine from SQLite
    console.log(`🤖 AI Negotiating order for part: ${orderReq.description}`);
    // implementation details omitted for brevity
}
