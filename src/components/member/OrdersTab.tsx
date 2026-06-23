import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/api";
import type { User } from "@supabase/supabase-js";
interface OrderItem {
  product_title: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  items: OrderItem[];
}

const statusMap: Record<string, string> = {
  pending: "待付款",
  paid: "已付款",
  completed: "已完成",
  cancelled: "已取消",
};

const OrdersTab = ({ user }: { user: User }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePayNow = async (orderId: string) => {
    setPayingOrderId(orderId);
    try {
      const paymentData = await apiPost("/ecpay-create-payment", { orderId });

      const { paymentUrl, params } = paymentData;
      const formEl = document.createElement("form");
      formEl.method = "POST";
      formEl.action = paymentUrl;
      formEl.target = "_top";
      Object.entries(params).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value as string;
        formEl.appendChild(input);
      });
      document.body.appendChild(formEl);
      formEl.submit();
    } catch (err) {
      console.error(err);
      toast({
        title: "付款請求失敗",
        description: "請稍後再試或聯繫我們。",
        variant: "destructive",
      });
      setPayingOrderId(null);
    }
  };
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_email", user.email || "")
        .order("created_at", { ascending: false });

      if (orderData && orderData.length > 0) {
        const orderIds = orderData.map((o) => o.id);
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("order_id, product_title, quantity, unit_price")
          .in("order_id", orderIds);

        setOrders(
          orderData.map((o) => ({
            ...o,
            items: (itemsData || []).filter((i) => i.order_id === o.id),
          }))
        );
      } else {
        setOrders([]);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">訂單記錄</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">尚無訂單記錄</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono">
                    {order.id.slice(0, 8)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {statusMap[order.status] || order.status}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-foreground">
                        {item.product_title} × {item.quantity}
                      </span>
                      <span className="text-muted-foreground">
                        NT${(item.unit_price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("zh-TW")}
                  </span>
                  <div className="flex items-center gap-3">
                    {order.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                        disabled={payingOrderId === order.id}
                        onClick={() => handlePayNow(order.id)}
                      >
                        {payingOrderId === order.id ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <CreditCard className="w-3 h-3 mr-1" />
                        )}
                        立即付款
                      </Button>
                    )}
                    <span className="font-medium text-foreground">
                      NT${order.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersTab;
