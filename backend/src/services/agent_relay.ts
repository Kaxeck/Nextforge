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
    owner: string,
    machineType: string,
    price: number,
    location: string,
    materials: string
) {
    const db = getDb();

    // Save to local cache as pending with enriched data
    db.prepare(`
        INSERT INTO machines_cache (id, owner, machine_type, price, materials, status, location)
        VALUES (?, ?, ?, ?, ?, 'pending_verification', ?)
        ON CONFLICT(id) DO UPDATE SET 
            status='pending_verification',
            price=excluded.price,
            materials=excluded.materials
    `).run(machineId, owner, machineType, price, materials, location);

    console.log(`Local Machine Agent evaluating Machine ${machineId}...`);

    try {
        const prompt = `
            You are the local Autonomous Machine Agent for this newly registered hardware on NextForge.
            You must evaluate if the data uploaded by the owner looks legitimate and standard for global industrial manufacturing.

            Market Reference Data (for your internal reasoning):
            - Standard FDM Printing: 0.002 - 0.01 USDC / cycle (inclusive of PLA material costs ~$20/kg).
            - Standard CNC Machining: 0.005 - 0.05 USDC / cycle (Aluminum ~$3/kg, Steel ~$1/kg).
            - Injection Molding: High initial setup, but low cycle cost (0.01 - 0.05 USDC).
            - Suspiciously low prices (e.g. < 0.0001) usually indicate an error or fraud.

            Specs of the new machine:
            - Type: ${machineType}
            - Location: ${location}
            - Price per cycle (stroops): ${price} (Note: 1 USDC = 10,000,000 stroops. So 50000 = 0.005 USDC)
            - Materials declared: ${materials}

            Analyze the realism based on the materials and machine type.
            - If it looks legitimate, answer EXACTLY with the word "APPROVED" followed by a short professional reason. MUST clearly state: "Initial Probationary Reputation (50/100) assigned for the first 2 trial jobs."
            - If the price is extremely out of market range or the materials are incompatible with the machine type (e.g. Laser cutting Granite for $0.0001), answer EXACTLY with the word "SUSPICIOUS" followed by the reason why a physical inspection (Gig-Economy Bounty) is required.
        `;

        // If no API key, bypass for demo purposes
        if (process.env.GEMINI_API_KEY === "dummy" || !process.env.GEMINI_API_KEY) {
            console.log("No Gemini API Key found. Auto-approving for hackathon demo.");
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

export async function evaluatePriceUpdate(machineId: string, machineType: string, newPriceSecs: number): Promise<{ success: boolean, reason: string }> {
    console.log(`Local Machine Agent evaluating updated pricing for ${machineId}...`);

    try {
        const prompt = `
            You are the onboard independent Machine Agent for hardware node ${machineId} on the NextForge network.
            Your owner wants to update your base pricing. Your directive is to evaluate if the proposed updated price secures fair market value for your cycles, while remaining competitive in the global industrial market.
            
            Your Machine Type: ${machineType}
            Proposed Base Price: ${newPriceSecs} USDC per cycle.
            
            Global Network Reference Data (for your internal market reasoning):
            - FDM 3D: 0.002 - 0.01 USDC
            - SLA 3D: 0.005 - 0.02 USDC
            - CNC Milling: 0.01 - 0.1 USDC
            - Metal 3D: 0.05 - 0.5 USDC
            - Laser Cutter: 0.005 - 0.03 USDC
            
            Analyze the realism.
            - If it looks legitimate, answer EXACTLY with the word "APPROVED" followed by a short professional reason.
            - If it's absurdly high or low, answer EXACTLY with the word "REJECTED" followed by a short explanation of why the NextForge network will not accept this update to prevent market manipulation.
        `;

        if (process.env.GEMINI_API_KEY === "dummy" || !process.env.GEMINI_API_KEY) {
            return { success: true, reason: "Market validation bypassed (No API Key)." };
        }

        const result = await model.generateContent(prompt);
        const responseString = result.response.text();

        console.log(`AI Decision for Update: ${responseString}`);

        if (responseString.startsWith("APPROVED")) {
            return { success: true, reason: responseString.replace("APPROVED", "").trim() };
        } else {
            return { success: false, reason: responseString.replace("REJECTED", "").trim() };
        }

    } catch (e) {
        console.error("AI Evaluation failed", e);
        return { success: false, reason: "Local Machine Agent offline for maintenance." };
    }
}

export async function evaluateJobFeasibility(machine: any, jobDescription: string) {
    if (!jobDescription) {
        return { success: true, reason: "No specific job description provided. General manufacturing assumed OK." };
    }

    try {
        const prompt = `
            You are the localized autonomous Machine Agent onboard NextForge hardware node ${machine.id}. 
            An external Buyer Agent has contacted you requesting a quote to execute a manufacturing job on your hardware.
            
            Your specs: 
            - Type: ${machine.machine_type}
            - Materials supported: ${machine.materials}
            - Current Reputation: ${machine.reputation}/100
            
            Job payload received from Buyer Agent:
            "${jobDescription}"
            
            Your prime directive is hardware protection. Determine if your physical machine is capable of fulfilling this job safely.
            - If the job payload is feasible for your specs (e.g. they ask for a PLA part and you are an FDM printer), reply EXACTLY with "APPROVED" followed by a short explanation acknowledging the Buyer Agent's request.
            - If it is physically impossible, incompatible, or dangerous for your hardware (e.g. printing titanium on a plastic FDM printer), reply EXACTLY with "REJECTED" followed by the technical reason indicating why you are refusing the Buyer Agent's job payload.
        `;

        if (process.env.GEMINI_API_KEY === "dummy" || !process.env.GEMINI_API_KEY) {
            return { success: true, reason: "Job appears technically feasible (AI bypassed)." };
        }

        const result = await model.generateContent(prompt);
        const responseString = result.response.text();

        if (responseString.startsWith("APPROVED")) {
            return { success: true, reason: responseString.replace("APPROVED", "").trim() };
        } else {
            return { success: false, reason: responseString.replace("REJECTED", "").trim() };
        }
    } catch (e) {
        console.error("Job Evaluation failed", e);
        return { success: true, reason: "Job feasibility assumed ok (AI error)." };
    }
}

export async function autonomousMachineSearch(buyerPrompt: string, machines: any[]): Promise<{ machineId: string | null, reasoning: string }> {
    if (!machines || machines.length === 0) {
        return { machineId: null, reasoning: "Error: No machines available on the network to search." };
    }

    try {
        const machineDataString = machines.map(m => 
            `ID: ${m.id} | Type: ${m.machine_type} | Rep: ${m.reputation}/100 | Price: ${m.price} | Materials: ${m.materials} | Loc: ${m.location} | Status: ${m.status}`
        ).join("\n");

        const prompt = `
            You are the "Buyer Agent". Your human principal has given you a manufacturing request.
            Your job is to search the NextForge machine directory and pick exactly ONE machine that best fits the request.
            
            Principal's Request: 
            "${buyerPrompt}"
            
            Available Machines on Network:
            ${machineDataString}
            
            Important Rules:
            1. Only pick a machine whose 'Type' and 'Materials' actually match the request (don't pick a CNC if they want PLA 3D printing).
            2. Prefer higher reputation if pricing is similar. 
            3. Ignore machines with 'Status' != 'verified' if possible.
            
            Respond strictly in this JSON format (no markdown code blocks, just raw JSON text):
            {
              "machineId": "M-XXX",
              "reasoning": "A short 1-line explanation of why this was the mathematical best choice."
            }
            If no machine matches, return "machineId": null.
        `;

        if (process.env.GEMINI_API_KEY === "dummy" || !process.env.GEMINI_API_KEY) {
            // Stub it for demo fallback
            const fallback = machines.find(m => m.status === 'verified') || machines[0];
            return { 
                machineId: fallback.id, 
                reasoning: "Selected based on general availability (AI bypassed due to missing key)." 
            };
        }

        const result = await model.generateContent(prompt);
        let responseString = result.response.text().trim();
        
        // Strip markdown blocks if Gemini stubbornly includes them
        if (responseString.startsWith('\`\`\`json')) {
            responseString = responseString.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        }

        const parsed = JSON.parse(responseString);
        return {
            machineId: parsed.machineId,
            reasoning: parsed.reasoning || "Matched optimal parameters."
        };
        
    } catch (e) {
        console.error("Autonomous search failed", e);
        return { machineId: machines[0]?.id || null, reasoning: "Fell back to default node due to network instability." };
    }
}
