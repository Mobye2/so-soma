import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function generateCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIV: string
): Promise<string> {
  const sorted = Object.keys(params)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIV}`;

  const encoded = encodeURIComponent(raw)
    .toLowerCase()
    .replace(/%2d/g, "-")
    .replace(/%5f/g, "_")
    .replace(/%2e/g, ".")
    .replace(/%21/g, "!")
    .replace(/%2a/g, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%20/g, "+");

  const data = new TextEncoder().encode(encoded);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ECPay sends callback as form-urlencoded POST
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    console.log("ECPay callback received:", JSON.stringify(params));

    const hashKey = Deno.env.get("ECPAY_HASH_KEY")!;
    const hashIV = Deno.env.get("ECPAY_HASH_IV")!;

    // Verify CheckMacValue
    const receivedMac = params.CheckMacValue;
    const paramsForCheck = { ...params };
    delete paramsForCheck.CheckMacValue;

    const calculatedMac = await generateCheckMacValue(paramsForCheck, hashKey, hashIV);

    if (receivedMac !== calculatedMac) {
      console.error("CheckMacValue mismatch", { receivedMac, calculatedMac });
      return new Response("0|CheckMacValue Error", { status: 200 });
    }

    const orderId = params.CustomField1;
    const rtnCode = params.RtnCode; // "1" means success

    if (!orderId) {
      console.error("No orderId in CustomField1");
      return new Response("0|Missing OrderId", { status: 200 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const newStatus = rtnCode === "1" ? "paid" : "payment_failed";

    await supabase
      .from("orders")
      .update({
        status: newStatus,
        notes: `ECPay RtnCode: ${rtnCode}, TradeNo: ${params.TradeNo || ""}, PaymentDate: ${params.PaymentDate || ""}`,
      })
      .eq("id", orderId);

    console.log(`Order ${orderId} updated to ${newStatus}`);

    if (newStatus === "paid") {
      try {
        const { data: order } = await supabase
          .from("orders")
          .select("customer_name, customer_email, total_amount")
          .eq("id", orderId)
          .single();

        const { data: items } = await supabase
          .from("order_items")
          .select("product_title, quantity, unit_price")
          .eq("order_id", orderId);

        if (order?.customer_email) {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "order-payment-success",
              recipientEmail: order.customer_email,
              idempotencyKey: `order-paid-${orderId}`,
              templateData: {
                name: order.customer_name,
                orderId: orderId.slice(0, 8),
                totalAmount: order.total_amount,
                items: (items || []).map((i) => ({
                  title: i.product_title,
                  quantity: i.quantity,
                  unit_price: i.unit_price,
                })),
              },
            },
          });
        }
      } catch (emailErr) {
        console.error("Payment success email failed:", emailErr);
      }
    }

    // ECPay expects "1|OK" for successful receipt
    return new Response("1|OK", { status: 200 });
  } catch (err) {
    console.error("ECPay callback error:", err);
    return new Response("0|Error", { status: 200 });
  }
});
