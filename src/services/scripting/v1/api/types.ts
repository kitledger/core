export interface KitActions {
    billing: {
        invoices: {
            create: (data: { customerId: string; amount: number; }) => Promise<{ invoiceId: string; status: 'created' }>;
        };
    };
    utils: {
        log: (...args: unknown[]) => Promise<'logged'>;
    };
}