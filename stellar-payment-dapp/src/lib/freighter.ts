import {
  isConnected,
  getAddress,
  getNetwork,
  signTransaction,
  requestAccess,
} from "@stellar/freighter-api";
import { Networks } from "@stellar/stellar-sdk";

/**
 * Check if the Freighter browser extension is installed.
 */
export async function checkIsConnected(): Promise<boolean> {
  try {
    const result = await isConnected();
    return !!result.isConnected;
  } catch (error) {
    console.error("Failed checking Freighter connection status:", error);
    return false;
  }
}

/**
 * Request permission from Freighter (triggers the popup) and return the
 * user's public address.
 *
 * This must be called on a user gesture (button click) to open the Freighter
 * popup. On subsequent loads when the user has already approved, use
 * getSavedAddress() instead so we don't reprompt.
 */
export async function connectAndGetAddress(): Promise<string | null> {
  try {
    // requestAccess() triggers the Freighter popup AND returns the address.
    const result = await requestAccess();
    if (result.error) {
      console.error("Freighter access request error:", result.error);
      return null;
    }
    return result.address || null;
  } catch (error) {
    console.error("Failed requesting Freighter access:", error);
    return null;
  }
}

/**
 * Silently retrieve the already-permitted address (no popup).
 * Use this on page load to restore a previously connected session.
 */
export async function getSavedAddress(): Promise<string | null> {
  try {
    const result = await getAddress();
    if (result.error || !result.address) {
      return null;
    }
    return result.address;
  } catch (error) {
    console.error("Failed retrieving Freighter address silently:", error);
    return null;
  }
}

/**
 * Retrieve the current network details of the Freighter extension.
 */
export async function getWalletNetwork(): Promise<{
  network: string;
  networkPassphrase: string;
} | null> {
  try {
    const result = await getNetwork();
    if (result.error) {
      console.error("Freighter network retrieval error:", result.error);
      return null;
    }
    return {
      network: result.network || "",
      networkPassphrase: result.networkPassphrase || "",
    };
  } catch (error) {
    console.error("Failed retrieving Freighter network details:", error);
    return null;
  }
}

/**
 * Sign a transaction XDR with Freighter for the Stellar Testnet.
 */
export async function signTx(transactionXdr: string): Promise<string> {
  try {
    const result = await signTransaction(transactionXdr, {
      networkPassphrase: Networks.TESTNET,
    });
    if (result.error) {
      throw new Error(`Freighter signing error: ${result.error}`);
    }
    if (!result.signedTxXdr) {
      throw new Error("No signed transaction XDR returned from Freighter.");
    }
    return result.signedTxXdr;
  } catch (error: any) {
    console.error("Failed to sign transaction with Freighter:", error);
    throw error;
  }
}
