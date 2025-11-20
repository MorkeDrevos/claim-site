'use client';

import {
  BaseMessageSignerWalletAdapter,
  WalletName,
  WalletReadyState,
} from '@solana/wallet-adapter-base';
import { PublicKey, Transaction } from '@solana/web3.js';

type JupiterProvider = {
  publicKey: string;
  connect: () => Promise<{ publicKey: string }>;
  disconnect?: () => Promise<void> | void;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
};

export class JupiterWalletAdapter extends BaseMessageSignerWalletAdapter {
  name: WalletName = 'Jupiter Wallet' as WalletName;
  url = 'https://jup.ag';
  icon = '/jupiter-icon.svg'; // can add this later; works even if missing

  private _publicKey: PublicKey | null = null;
  private _connected = false;
  private _readyState: WalletReadyState;

  constructor() {
    super();

    if (typeof window !== 'undefined' && (window as any).jupiter?.solana) {
      this._readyState = WalletReadyState.Installed;
    } else {
      this._readyState = WalletReadyState.NotDetected;
    }
  }

  get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  get readyState(): WalletReadyState {
    return this._readyState;
  }

  get connected(): boolean {
    return this._connected;
  }

  private get provider(): JupiterProvider | null {
    if (typeof window === 'undefined') return null;
    return (window as any).jupiter?.solana ?? null;
  }

  async connect(): Promise<void> {
    try {
      const provider = this.provider;
      if (!provider) throw new Error('Jupiter Wallet not found');

      const res = await provider.connect();
      this._publicKey = new PublicKey(res.publicKey);
      this._connected = true;
      this.emit('connect', this._publicKey);
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      const provider = this.provider;
      if (provider?.disconnect) {
        await provider.disconnect();
      }
    } finally {
      this._publicKey = null;
      this._connected = false;
      this.emit('disconnect');
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    const provider = this.provider;
    if (!provider) throw new Error('Jupiter Wallet not found');
    return await provider.signTransaction(transaction);
  }

  async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    const provider = this.provider;
    if (!provider) throw new Error('Jupiter Wallet not found');
    return await provider.signAllTransactions(transactions);
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    const provider = this.provider;
    if (!provider) throw new Error('Jupiter Wallet not found');
    const { signature } = await provider.signMessage(message);
    return signature;
  }
}
