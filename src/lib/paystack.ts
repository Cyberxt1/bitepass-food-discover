declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        label?: string;
        metadata?: {
          custom_fields?: Array<{
            display_name: string;
            variable_name: string;
            value: string;
          }>;
        };
        callback: (response: { reference: string; status?: string; trans?: string }) => void;
        onClose: () => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

let paystackScriptPromise: Promise<void> | null = null;

function getPaystackPublicKey() {
  return import.meta.env.VITE_PAYSTACK_PUBLIC_KEY?.trim() ?? "";
}

function loadPaystackScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Paystack is only available in the browser"));
  }

  if (window.PaystackPop) return Promise.resolve();
  if (paystackScriptPromise) return paystackScriptPromise;

  paystackScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-paystack="inline"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Paystack")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.dataset.paystack = "inline";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Paystack"));
    document.head.appendChild(script);
  });

  return paystackScriptPromise;
}

export function isPaystackConfigured() {
  return Boolean(getPaystackPublicKey());
}

type StartPaystackPaymentInput = {
  amountNaira: number;
  email: string;
  name: string;
  reference: string;
  address?: string;
};

export async function startPaystackPayment({
  amountNaira,
  email,
  name,
  reference,
  address,
}: StartPaystackPaymentInput) {
  const key = getPaystackPublicKey();
  if (!key) {
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    return `${reference}-demo`;
  }

  await loadPaystackScript();

  return new Promise<string>((resolve, reject) => {
    const handler = window.PaystackPop?.setup({
      key,
      email,
      amount: Math.round(amountNaira * 100),
      currency: "NGN",
      ref: reference,
      label: name,
      metadata: address
        ? {
            custom_fields: [
              {
                display_name: "Pickup address",
                variable_name: "pickup_address",
                value: address,
              },
            ],
          }
        : undefined,
      callback: (response) => {
        resolve(response.reference || reference);
      },
      onClose: () => {
        reject(new Error("Payment was cancelled"));
      },
    });

    if (!handler) {
      reject(new Error("Paystack could not start"));
      return;
    }

    handler.openIframe();
  });
}
