/**
 * MPP (Machine Payments Protocol) — Frontend Payment Layer
 * 
 * Uses the @stellar/mpp SDK for native Soroban SAC payments.
 * No external facilitator required — payments settle directly on Stellar Testnet.
 * 
 * Flow:
 *   1. Client hits API → server returns 402 with MPP challenge JSON
 *   2. Client parses challenge (currency, amount, recipient, network)
 *   3. Client builds Soroban SAC transfer via Freighter wallet
 *   4. Client retries request with signed credential
 *   5. Server verifies + broadcasts → returns 200 + receipt
 */

import { getAddress, isConnected, signTransaction } from '@stellar/freighter-api';
import {
  TransactionBuilder,
  Networks,
  Contract,
  nativeToScVal,
  Address,
} from '@stellar/stellar-sdk';
import { Server, Api, assembleTransaction } from '@stellar/stellar-sdk/rpc';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface MppPaymentInfo {
  price: string;
  network: string;
  payTo: string;
  endpoint: string;
  currency?: string;
}

export interface MppResult<T = any> {
  success: boolean;
  data?: T;
  paymentRequired?: MppPaymentInfo;
  error?: string;
  mpp_settled?: boolean;
}

/**
 * Makes a request to an MPP-protected endpoint.
 * If the server responds with 402, it returns the payment requirements
 * so the UI can display a payment confirmation modal.
 */
export async function mppRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<MppResult<T>> {
  const url = `${API_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // MPP 402 Payment Required — parse challenge
    if (res.status === 402) {
      let paymentInfo: MppPaymentInfo = {
        price: '0.001',
        network: 'stellar:testnet',
        payTo: '',
        endpoint,
      };

      try {
        const body = await res.json();
        if (body.accepts) {
          paymentInfo = {
            price: body.accepts.amount || '0.001',
            network: body.accepts.network || 'stellar:testnet',
            payTo: body.accepts.recipient || '',
            currency: body.accepts.currency || '',
            endpoint,
          };
        }
      } catch {
        // Response may not be JSON, use defaults
      }

      return {
        success: false,
        paymentRequired: paymentInfo,
      };
    }

    // Normal response
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ error: res.statusText }));
      return { success: false, error: errBody.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { success: true, data, mpp_settled: !!data.mpp_receipt };

  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Executes a real MPP payment settlement via Freighter.
 * 
 * The MPP Charge flow (Pull mode):
 * 1. Hit endpoint → receive 402 with challenge
 * 2. Build Soroban SAC transfer (token.transfer) 
 * 3. Simulate + prepare via SorobanRpc
 * 4. Sign with Freighter
 * 5. Retry request with signed XDR as credential
 */
export async function settleMppPayment(
  endpoint: string,
  options: RequestInit = {}
): Promise<MppResult> {
  const url = `${API_URL}${endpoint}`;
  
  try {
    // 1. Check wallet
    const connected = await isConnected();
    if (!connected) {
      return { success: false, error: "Freighter wallet is not connected" };
    }

    const pubKeyResult = await getAddress();
    const publicKey = (pubKeyResult as any).address || pubKeyResult;
    if (!publicKey) {
      return { success: false, error: "Failed to get public key from Freighter" };
    }

    // 2. First request — get 402 challenge
    const challengeRes = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (challengeRes.status !== 402) {
      // Not payment-gated, return as normal
      const data = await challengeRes.json();
      return { success: challengeRes.ok, data };
    }

    const challenge = await challengeRes.json();
    const { amount, recipient, currency, network } = challenge.accepts;

    console.log(`🔐 MPP Challenge: Pay ${amount} USDC to ${recipient} on ${network}`);

    // 3. Build Soroban SAC transfer transaction
    const rpcUrl = 'https://soroban-testnet.stellar.org';
    const server = new Server(rpcUrl);
    const sourceAccount = await server.getAccount(publicKey as string);

    const tokenContract = new Contract(currency);
    
    // Convert amount from string to i128 stroops (7 decimals for USDC)
    const amountStroops = Math.floor(parseFloat(amount) * 10_000_000);

    const tx = new TransactionBuilder(sourceAccount, {
      fee: '100000',
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        tokenContract.call(
          'transfer',
          nativeToScVal(Address.fromString(publicKey as string), { type: 'address' }),     // from
          nativeToScVal(Address.fromString(recipient), { type: 'address' }),  // to
          nativeToScVal(amountStroops, { type: 'i128' }),                      // amount
        )
      )
      .setTimeout(30)
      .build();

    // 4. Simulate + prepare
    const simResult = await server.simulateTransaction(tx);
    if (Api.isSimulationError(simResult)) {
      return { success: false, error: `Simulation failed: ${(simResult as any).error}` };
    }

    const preparedTx = assembleTransaction(tx, simResult).build();

    // 5. Sign with Freighter
    const signedResult = await signTransaction(preparedTx.toXDR(), {
      networkPassphrase: Networks.TESTNET,
    });

    if ((signedResult as any).error) {
      return { success: false, error: 'User declined to sign the MPP payment' };
    }

    const signedXdr = (signedResult as any).signedTxXdr || signedResult;

    // 6. Retry original request with MPP credential
    const retryRes = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-MPP-Credential': signedXdr as string,
        ...options.headers,
      },
    });

    if (retryRes.status === 402) {
      return { success: false, error: 'Payment verification failed.' };
    }

    const data = await retryRes.json();
    return { success: true, data, mpp_settled: true };
  } catch (err: any) {
    console.error("MPP Settlement Error:", err);
    return { success: false, error: err.message || "Unknown settlement error" };
  }
}

/**
 * Price formatting utility for MPP amounts
 */
export function formatMppPrice(price: string): string {
  const num = parseFloat(price);
  if (isNaN(num)) return `$${price}`;
  return `$${num.toFixed(4)}`;
}

// Keep backward compatibility aliases
export const x402Request = mppRequest;
export const settleX402Payment = settleMppPayment;
export const formatX402Price = formatMppPrice;

/**
 * Check if an endpoint is MPP-protected by making a preflight request
 */
export async function checkMppStatus(endpoint: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, { method: 'HEAD' });
    return res.status === 402;
  } catch {
    return false;
  }
}
