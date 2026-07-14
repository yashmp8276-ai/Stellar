import { Horizon, TransactionBuilder, Operation, Asset, Networks, Memo } from "@stellar/stellar-sdk";

// Initialize the Horizon server pointing to Stellar Testnet ONLY
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const server = new Horizon.Server(HORIZON_URL);

/**
 * Fetch native XLM balance for a public key.
 * If the account is not found (404), return "UNFUNDED".
 */
export async function fetchBalance(publicKey: string): Promise<string> {
  try {
    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find((b: any) => b.asset_type === "native");
    return nativeBalance ? nativeBalance.balance : "0";
  } catch (error: any) {
    // Check if account is not found / not funded
    if (error.status === 404 || (error.response && error.response.status === 404)) {
      return "UNFUNDED";
    }
    console.error("Error in fetchBalance:", error);
    throw new Error(error.message || "Failed to fetch balance from Horizon.");
  }
}

/**
 * Fund a testnet account using Stellar Friendbot.
 */
export async function fundWithFriendbot(publicKey: string): Promise<boolean> {
  try {
    const url = `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Friendbot responded with status ${response.status}`);
    }
    return true;
  } catch (error: any) {
    console.error("Error in fundWithFriendbot:", error);
    throw new Error(error.message || "Failed to trigger Friendbot funding.");
  }
}

/**
 * Build a transaction for sending native XLM payments on Testnet.
 * Returns the base64 transaction XDR.
 */
export async function buildPaymentTransaction(
  sourcePublicKey: string,
  destinationPublicKey: string,
  amount: string,
  memo?: string
): Promise<string> {
  try {
    // Load the source account to get current sequence number
    const sourceAccount = await server.loadAccount(sourcePublicKey);

    // Build the transaction
    const txBuilder = new TransactionBuilder(sourceAccount, {
      fee: "100", // Standard base fee (100 stroops = 0.00001 XLM)
      networkPassphrase: Networks.TESTNET,
    });

    // Add payment operation
    txBuilder.addOperation(
      Operation.payment({
        destination: destinationPublicKey,
        asset: Asset.native(),
        amount: amount,
      })
    );

    // Add memo if supplied and not empty
    if (memo && memo.trim() !== "") {
      txBuilder.addMemo(Memo.text(memo.trim()));
    }

    // Set fallback timeout (30 seconds)
    txBuilder.setTimeout(30);

    const transaction = txBuilder.build();
    return transaction.toXDR();
  } catch (error: any) {
    console.error("Error in buildPaymentTransaction:", error);
    throw new Error(error.message || "Failed to build transaction.");
  }
}

/**
 * Submit signed transaction XDR to Horizon.
 * Returns the transaction result.
 */
export async function submitTransaction(signedXdr: string): Promise<any> {
  try {
    const transaction = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error: any) {
    console.error("Error in submitTransaction:", error);

    // Extract detailed Horizon response error details if available
    const errorDetails = error.response?.data;
    if (errorDetails) {
      const resultCodes = errorDetails.extras?.result_codes;
      let errorReason = errorDetails.detail || "Horizon submission failed.";

      if (resultCodes) {
        const txCode = resultCodes.transaction;
        const opCodes = resultCodes.operations ? `, Operations: ${resultCodes.operations.join(", ")}` : "";
        errorReason += ` (Tx: ${txCode}${opCodes})`;
      }
      
      throw new Error(errorReason);
    }
    
    throw new Error(error.message || "Horizon transaction submission failed.");
  }
}
