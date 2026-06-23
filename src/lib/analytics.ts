// Lightweight Google Analytics (gtag) event helpers.
// Safe to call anywhere — no-op if gtag isn't loaded yet.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type GtagItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  quantity?: number;
};

export const trackEvent = (
  eventName: string,
  params: Record<string, unknown> = {}
) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
};

export const trackAddToCart = (item: {
  id: string;
  title: string;
  category?: string;
  price: number;
  quantity?: number;
}) => {
  const qty = item.quantity ?? 1;
  trackEvent("add_to_cart", {
    currency: "TWD",
    value: item.price * qty,
    items: [
      {
        item_id: item.id,
        item_name: item.title,
        item_category: item.category,
        price: item.price,
        quantity: qty,
      } satisfies GtagItem,
    ],
  });
};

export const trackBeginCheckout = (
  items: Array<{ id: string; title: string; category?: string; price: number; quantity: number }>,
  totalAmount: number
) => {
  trackEvent("begin_checkout", {
    currency: "TWD",
    value: totalAmount,
    items: items.map((i) => ({
      item_id: i.id,
      item_name: i.title,
      item_category: i.category,
      price: i.price,
      quantity: i.quantity,
    })),
  });
};

export const trackPurchase = (params: {
  transactionId: string;
  value: number;
  items?: Array<{ id: string; title: string; category?: string; price: number; quantity: number }>;
}) => {
  trackEvent("purchase", {
    transaction_id: params.transactionId,
    currency: "TWD",
    value: params.value,
    items:
      params.items?.map((i) => ({
        item_id: i.id,
        item_name: i.title,
        item_category: i.category,
        price: i.price,
        quantity: i.quantity,
      })) ?? [],
  });
};

export const trackContactSubmit = (subject?: string) => {
  trackEvent("generate_lead", {
    form_name: "contact",
    subject: subject ?? "",
  });
  // GA4 conversion event
  trackEvent("contact_form_submit", {
    event_category: "conversion",
    event_label: "聯絡表單",
    value: 1,
  });
};

// GA4 conversion events
export const trackJoinLine = (label = "LINE官方帳號") => {
  trackEvent("join_line", {
    event_category: "engagement",
    event_label: label,
    value: 1,
  });
};

export const trackSignUpTrial = (label = "免費體驗報名") => {
  trackEvent("sign_up_trial", {
    event_category: "conversion",
    event_label: label,
    value: 1,
  });
};

export const trackNewsletterSubscribe = (label = "電子報訂閱") => {
  trackEvent("newsletter_subscribe", {
    event_category: "engagement",
    event_label: label,
    value: 1,
  });
};
