/**
 * This test file is meant to be mostly a type compliance test.
 * It needs to import the types from the installed @kitledger/actions package and compare the provided types with the ones currently valid in the platform and throw errors if there are mismatches.
 * This will alert us when the types in the @kitledger/actions package are not up to date with the platform types.
 */

/**
 * @file This file is for static type checking only and should not be executed.
 * It ensures that internal data models remain compatible with the public API types.
 * A compilation failure here indicates that the public API package (@kitledger/actions)
 * and the internal DB schema are out of sync.
 */

// --- Public API Types ---
import type { Entity } from '@kitledger/actions/entity';
import type { Transaction, JournalEntry } from '@kitledger/actions/transaction';

// --- Internal Parent App Types (Example with Drizzle) ---
import type { InferSelectModel } from 'drizzle-orm';
import { entities, transactions, journal_entries } from './db/schema.ts';

type InternalEntity = InferSelectModel<typeof entities>;
type InternalTransaction = InferSelectModel<typeof transactions>;
type InternalJournalEntry = InferSelectModel<typeof journal_entries>;

// --- Type Assertions ---

// Helper to prevent "unused variable" warnings.
const use = (...args: any[]) => {};

// Test Case 1: Entity Record
// This checks if your internal entity structure can satisfy the public Entity interface.
declare let internalEntity: InternalEntity;
const publicEntity: Entity = internalEntity;

// Test Case 2: Transaction Record
// This ensures the internal transaction and its entries match the public contract.
declare let internalTransaction: InternalTransaction & { entries: InternalJournalEntry[] };
const publicTransaction: Transaction = internalTransaction;

// Test Case 3: Journal Entry
// Checking the sub-document is also a good practice.
declare let internalEntry: InternalJournalEntry;
const publicEntry: JournalEntry = internalEntry;

use(publicEntity, publicTransaction, publicEntry);