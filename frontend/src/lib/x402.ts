/**
 * NextForge x402 Client
 * Handles HTTP 402 Payment Required flows with Freighter wallet signing.
 * Uses the x402 protocol to enable per-request micropayments on Stellar.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface X402PaymentInfo {
  price: string;
  network: string;
  payTo: string;
  endpoint: string;
}

export interface X402Result<T = any> {
  success: boolean;
  data?: T;
  paymentRequired?: X402PaymentInfo;
  error?: string;
  x402_settled?: boolean;
}

/**
 * Makes a request to an x402-protected endpoint.
 * If the server responds with 402, it returns the payment requirements
 * so the UI can display a payment confirmation modal.
 */
export async function x402Request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<X402Result<T>> {
  const url = `${API_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // x402 Payment Required — parse requirements
    if (res.status === 402) {
      // Extract payment info from response headers
      let paymentInfo: X402PaymentInfo = {
        price: '$0.001',
        network: 'stellar:testnet',
        payTo: '',
        endpoint,
      };

      // Try to parse x402 response body or headers
      try {
        const body = await res.json();
        if (body.accepts) {
          paymentInfo = {
            price: body.accepts.price || '$0.001',
            network: body.accepts.network || 'stellar:testnet',
            payTo: body.accepts.payTo || '',
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
    return { success: true, data, x402_settled: !!data.x402_payment };

  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Simulates settling an x402 payment for demo/hackathon purposes.
 * In production, the client would sign Soroban auth entries via Freighter
 * and the Coinbase facilitator would settle on-chain.
 * For the hackathon demo, we use the backend's deployer key to settle
 * so we can demonstrate the full x402 flow visually.
 */
export async function settleX402Payment(
  endpoint: string,
  options: RequestInit = {}
): Promise<X402Result> {
  const url = `${API_URL}${endpoint}`;
  
  try {
    // Add the x402-demo-settle header to bypass payment for demo
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-402-Demo-Settle': 'true',
        ...options.headers,
      },
    });

    if (res.status === 402) {
      // If still 402, the middleware doesn't have demo bypass
      // Return formatted info for the UI
      return { success: false, error: 'Payment settlement pending — connect USDC wallet' };
    }

    const data = await res.json();
    return { success: true, data, x402_settled: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Price formatting utility for x402 amounts
 */
export function formatX402Price(price: string): string {
  return price.startsWith('$') ? price : `$${price}`;
}

/**
 * Check if an endpoint is x402-protected by making a preflight request
 */
export async function checkX402Status(endpoint: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, { method: 'HEAD' });
    return res.status === 402;
  } catch {
    return false;
  }
}
