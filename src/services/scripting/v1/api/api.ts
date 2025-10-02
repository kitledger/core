import { KitActions } from './types.ts';

/**
 * Temporary mock implementation of the KitApi for demonstration purposes.
 */
export const kitApiImplementation: KitActions = {
	billing: {
		invoices: {
			create: async (data) => {
				console.log(`HOST: Fulfilling billing.invoices.create with`, data);
				return { invoiceId: `inv_${crypto.randomUUID()}`, status: 'created' };
			},
		},
	},
	utils: {
		log: async (...args) => {
			console.log('[User Script Log]:', ...args);
			return 'logged';
		},
	},
};