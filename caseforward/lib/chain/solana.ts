// lib/chain/solana.ts
// ============================================================================
// Solana Audit Logger
// ============================================================================
// Logs approval hashes to Solana Devnet for immutable audit trail
// ============================================================================

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

// ============================================================================
// TYPES
// ============================================================================

export interface AuditEntry {
  actionId: string;
  caseId: string;
  actionType: string;
  approvedBy: string;
  approvedAt: Date;
  contentHash: string;
}

export interface AuditResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

// ============================================================================
// CONFIG
// ============================================================================

const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 
  (SOLANA_NETWORK === 'devnet' 
    ? 'https://api.devnet.solana.com' 
    : 'https://api.mainnet-beta.solana.com');

// Memo program ID (official Solana memo program)
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get Solana connection
 */
function getConnection(): Connection {
  return new Connection(SOLANA_RPC_URL, 'confirmed');
}

/**
 * Get payer keypair from environment
 */
function getPayerKeypair(): Keypair | null {
  const privateKey = process.env.SOLANA_PRIVATE_KEY;
  if (!privateKey) {
    console.warn('SOLANA_PRIVATE_KEY not set - audit logging disabled');
    return null;
  }

  try {
    // Support both base58 and JSON array formats
    if (privateKey.startsWith('[')) {
      const secretKey = Uint8Array.from(JSON.parse(privateKey));
      return Keypair.fromSecretKey(secretKey);
    } else {
      // Assume base58 encoded
      const bs58 = require('bs58');
      const secretKey = bs58.decode(privateKey);
      return Keypair.fromSecretKey(secretKey);
    }
  } catch (error) {
    console.error('Failed to parse SOLANA_PRIVATE_KEY:', error);
    return null;
  }
}

/**
 * Compute SHA-256 hash of content
 */
async function computeHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Log an action approval to Solana
 */
export async function logApprovalToSolana(entry: AuditEntry): Promise<AuditResult> {
  const payer = getPayerKeypair();
  if (!payer) {
    return {
      success: false,
      error: 'Solana payer not configured',
    };
  }

  try {
    const connection = getConnection();

    // Create memo content (limited to 566 bytes for memo program)
    const memo = JSON.stringify({
      t: 'approval',  // type
      a: entry.actionId.slice(-8),  // last 8 chars of action ID
      c: entry.caseId.slice(-8),    // last 8 chars of case ID
      h: entry.contentHash.slice(0, 16),  // first 16 chars of content hash
      ts: entry.approvedAt.toISOString(),
    });

    // Create memo instruction
    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memo, 'utf-8'),
    });

    // Create and send transaction
    const transaction = new Transaction().add(memoInstruction);
    
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer],
      { commitment: 'confirmed' }
    );

    return {
      success: true,
      transactionHash: signature,
    };

  } catch (error) {
    console.error('Solana logging error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create audit entry from action data
 */
export async function createAuditEntry(
  actionId: string,
  caseId: string,
  actionType: string,
  approvedBy: string,
  content: any
): Promise<AuditEntry> {
  const contentHash = await computeHash(JSON.stringify(content));
  
  return {
    actionId,
    caseId,
    actionType,
    approvedBy,
    approvedAt: new Date(),
    contentHash,
  };
}

/**
 * Verify an audit entry exists on Solana
 */
export async function verifyAuditEntry(transactionHash: string): Promise<boolean> {
  try {
    const connection = getConnection();
    const transaction = await connection.getTransaction(transactionHash, {
      commitment: 'confirmed',
    });
    return transaction !== null;
  } catch (error) {
    console.error('Verification error:', error);
    return false;
  }
}

/**
 * Get Solana explorer URL for a transaction
 */
export function getExplorerUrl(transactionHash: string): string {
  const cluster = SOLANA_NETWORK === 'mainnet-beta' ? '' : `?cluster=${SOLANA_NETWORK}`;
  return `https://explorer.solana.com/tx/${transactionHash}${cluster}`;
}
