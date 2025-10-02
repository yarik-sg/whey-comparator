import { create } from 'zustand';

interface ProductSummary {
  id: string;
  name: string;
}

type SubscriptionStatus = 'idle' | 'loading' | 'success' | 'error';

export interface PriceAlertSubscription {
  id: string;
  email: string;
  productId: string;
  productName: string;
  priceThreshold: number;
  createdAt: string;
}

interface PriceAlertState {
  email: string;
  productId: string;
  priceThreshold: string;
  alerts: PriceAlertSubscription[];
  status: SubscriptionStatus;
  message?: string;
  setEmail: (email: string) => void;
  setProductId: (productId: string) => void;
  setPriceThreshold: (value: string) => void;
  clearStatus: () => void;
  resetForm: () => void;
  removeAlert: (alertId: string) => void;
  subscribeToAlert: (product: ProductSummary, thresholdValue: number) => Promise<boolean>;
}

const createSubscription = (
  email: string,
  product: ProductSummary,
  priceThreshold: number,
): PriceAlertSubscription => ({
  id: `${product.id}-${Date.now()}`,
  email,
  productId: product.id,
  productName: product.name,
  priceThreshold,
  createdAt: new Date().toISOString(),
});

export const usePriceAlertStore = create<PriceAlertState>((set, get) => ({
  email: '',
  productId: '',
  priceThreshold: '',
  alerts: [],
  status: 'idle',
  message: undefined,
  setEmail: (email) => set({ email }),
  setProductId: (productId) => set({ productId }),
  setPriceThreshold: (value) => set({ priceThreshold: value }),
  clearStatus: () => set({ status: 'idle', message: undefined }),
  resetForm: () => set({ productId: '', priceThreshold: '' }),
  removeAlert: (alertId) =>
    set((state) => ({ alerts: state.alerts.filter((alert) => alert.id !== alertId) })),
  subscribeToAlert: async (product, thresholdValue) => {
    const { email } = get();
    set({ status: 'loading', message: undefined });

    const serapiEndpoint = import.meta.env.VITE_SERPAI_PRICE_ALERT_URL;

    try {
      if (serapiEndpoint) {
        const response = await fetch(serapiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            productId: product.id,
            priceThreshold: thresholdValue,
          }),
        });

        if (!response.ok) {
          throw new Error('SerpAI subscription failed');
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const shouldFail = Math.random() < 0.15;
        if (shouldFail) {
          throw new Error('Simulated failure');
        }
      }

      const newAlert = createSubscription(email, product, thresholdValue);

      set((state) => ({
        alerts: [
          ...state.alerts.filter(
            (existing) => !(existing.email === email && existing.productId === product.id),
          ),
          newAlert,
        ],
        status: 'success',
        message: `Vous serez averti si ${product.name} passe sous ${thresholdValue.toFixed(2)} €.`,
        productId: '',
        priceThreshold: '',
      }));

      return true;
    } catch (error) {
      const fallbackMessage =
        error instanceof Error && error.message === 'SerpAI subscription failed'
          ? "Le service d'alertes est temporairement indisponible."
          : "Nous n'avons pas pu enregistrer votre alerte. Merci de réessayer.";

      set({ status: 'error', message: fallbackMessage });
      return false;
    }
  },
}));
