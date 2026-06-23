import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderItemIn {
  id: string;
  title: string;
  quantity: number;
  price: number;
  category?: string;
}

interface CreateOrderBody {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  notes?: string;
  items: OrderItemIn[];
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as CreateOrderBody;
    const { customer_name, customer_email, customer_phone, notes, items } = body;

    if (!customer_name?.trim() || !customer_email?.trim() || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate input shape & recompute total server-side to prevent price tampering
    for (const it of items) {
      if (!it || typeof it.id !== "string" || typeof it.title !== "string" ||
          typeof it.quantity !== "number" || typeof it.price !== "number" ||
          it.quantity <= 0 || it.price < 0 || it.quantity > 999 || it.price > 1_000_000) {
        return new Response(JSON.stringify({ error: "Invalid item" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // If a JWT is present, validate it and enforce that the order's
    // customer_email matches the authenticated user's email. This prevents
    // logged-in callers from placing orders under someone else's identity.
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Invalid session" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const authedEmail = (claimsData.claims as { email?: string }).email?.toLowerCase();
      if (!authedEmail || authedEmail !== customer_email.trim().toLowerCase()) {
        return new Response(JSON.stringify({ error: "Email does not match signed-in user" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Re-price products against DB to prevent tampering; events keep submitted price
    const productItems = items.filter((i) => isUuid(i.id) && i.category !== "event");
    const productIds = productItems.map((i) => i.id);
    const priceMap = new Map<string, number>();
    const titleMap = new Map<string, string>();
    if (productIds.length > 0) {
      const { data: prods, error: prodErr } = await supabase
        .from("products")
        .select("id, title, price")
        .in("id", productIds);
      if (prodErr) throw prodErr;
      for (const p of prods ?? []) {
        priceMap.set(p.id as string, Number(p.price));
        titleMap.set(p.id as string, p.title as string);
      }
      for (const it of productItems) {
        if (!priceMap.has(it.id)) {
          return new Response(JSON.stringify({ error: "Product not found" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const total = items.reduce((sum, it) => {
      const unit = priceMap.has(it.id) ? priceMap.get(it.id)! : it.price;
      return sum + unit * it.quantity;
    }, 0);

    const orderId = crypto.randomUUID();
    const { error: orderError } = await supabase.from("orders").insert({
      id: orderId,
      customer_name: customer_name.slice(0, 200),
      customer_email: customer_email.slice(0, 200),
      customer_phone: (customer_phone || "").slice(0, 50) || null,
      total_amount: total,
      notes: (notes || "").slice(0, 2000) || null,
      payment_method: "ecpay",
    });
    if (orderError) throw orderError;

    if (productItems.length > 0) {
      const orderItems = productItems.map((it) => ({
        order_id: orderId,
        product_id: it.id,
        product_title: titleMap.get(it.id) ?? it.title,
        quantity: it.quantity,
        unit_price: priceMap.get(it.id)!,
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;
    }

    const eventItems = items.filter((i) => i.category === "event");
    if (eventItems.length > 0) {
      const registrations = eventItems.map((item) => ({
        customer_name,
        customer_email,
        customer_phone: customer_phone || "",
        event_type: item.id,
        notes: notes || null,
      }));
      await supabase.from("event_registrations").insert(registrations);

      for (const item of eventItems) {
        supabase.functions
          .invoke("send-transactional-email", {
            body: {
              templateName: "event-registration-confirmation",
              recipientEmail: customer_email,
              idempotencyKey: `event-reg-${orderId}-${item.id}`,
              templateData: { name: customer_name, eventTitle: item.title },
            },
          })
          .catch((err) => console.error("Event email failed", err));
      }
    }

    return new Response(JSON.stringify({ orderId, total }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-order error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
