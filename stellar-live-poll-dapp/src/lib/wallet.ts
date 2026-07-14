import { StellarWalletsKit, KitEventType } from '@creit.tech/stellar-wallets-kit';
import { Networks as KitNetworks } from '@creit.tech/stellar-wallets-kit';

// Dynamically import default modules to avoid top-level bundler issues
let modulesReady = false;

export async function initKit(): Promise<void> {
  if (modulesReady) return;
  try {
    const { defaultModules } = await import('@creit.tech/stellar-wallets-kit/modules/utils');
    StellarWalletsKit.init({
      modules: defaultModules(),
      network: KitNetworks.TESTNET,
    });
    modulesReady = true;
  } catch (e) {
    console.error('StellarWalletsKit init error:', e);
  }
}

export async function openAuthModal(): Promise<{ address: string }> {
  return StellarWalletsKit.authModal();
}

export async function getConnectedAddress(): Promise<string | null> {
  try {
    const { address } = await StellarWalletsKit.getAddress();
    return address || null;
  } catch {
    return null;
  }
}

export async function getConnectedNetwork(): Promise<{ network: string; networkPassphrase: string } | null> {
  try {
    return await StellarWalletsKit.getNetwork();
  } catch {
    return null;
  }
}

export async function signTransactionXdr(
  xdr: string,
  opts: { networkPassphrase: string; address: string }
): Promise<string> {
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, opts);
  return signedTxXdr;
}

export async function disconnectWallet(): Promise<void> {
  await StellarWalletsKit.disconnect();
}

export function onKitStateUpdate(cb: (address: string | undefined) => void): () => void {
  return StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
    cb(event.payload.address);
  });
}
