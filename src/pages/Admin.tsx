import { useEffect, useState, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminsTab from "@/components/admin/AdminsTab";
import ContactMessagesTab from "@/components/admin/ContactMessagesTab";
import IGPostsTab from "@/components/admin/IGPostsTab";
import BlogPostsTab from "@/components/admin/BlogPostsTab";
import ProductsTab from "@/components/admin/ProductsTab";
import SEOMetricsTab from "@/components/admin/SEOMetricsTab";
import SubscribersTab from "@/components/admin/SubscribersTab";
import CourseEnrollmentsTab from "@/components/admin/CourseEnrollmentsTab";
import { Cloud, ChevronDown } from "lucide-react";

interface OrderItem {
  id: string;
  product_title: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total_amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  items?: OrderItem[];
}

interface EventRegistration {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_type: string;
  status: string;
  notes: string | null;
  created_at: string;
}

const useResizableColumns = (initialWidths: number[]) => {
  const [widths, setWidths] = useState(initialWidths);
  const dragging = useRef<{ colIndex: number; startX: number; startWidth: number } | null>(null);

  const onMouseDown = useCallback((colIndex: number) => (e: React.MouseEvent) => {
    dragging.current = { colIndex, startX: e.clientX, startWidth: widths[colIndex] };
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = ev.clientX - dragging.current.startX;
      const newWidth = Math.max(60, dragging.current.startWidth + delta);
      setWidths((prev) => prev.map((w, i) => i === dragging.current!.colIndex ? newWidth : w));
    };
    const onUp = () => {
      dragging.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    e.preventDefault();
  }, [widths]);

  return { widths, onMouseDown };
};

const statusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "default";
    case "pending":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
};

const Admin = () => {
  const { user, isAdmin, loading } = useAdminCheck();
  const [orders, setOrders] = useState<Order[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      try {
        // 直接用 Supabase，不用 Lambda
        const [ordersRes, regsRes] = await Promise.all([
          supabase.from("orders").select("*, order_items(id, product_title, quantity, unit_price)").order("created_at", { ascending: false }),
          supabase.from("event_registrations").select("*").order("created_at", { ascending: false }),
        ]);
        if (ordersRes.data) setOrders(ordersRes.data.map((o: any) => ({ ...o, items: o.order_items || [] })));
        if (regsRes.data) setRegistrations(regsRes.data);
      } catch (e) {
        console.error("Failed to load admin data:", e);
      }
      setLoadingData(false);
    };
    fetchData();
  }, [isAdmin]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <Layout>
      <section className="py-12 bg-background min-h-screen">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-foreground mb-8">訂單管理後台</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">總訂單數</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{orders.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">活動報名數</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{registrations.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">總營收</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">
                  NT$ {orders.filter(o => o.status === "paid").reduce((sum, o) => sum + o.total_amount, 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="orders">
            <TabsList className="mb-4">
              <TabsTrigger value="orders">訂單列表</TabsTrigger>
              <TabsTrigger value="registrations">活動報名</TabsTrigger>
              <TabsTrigger value="contacts">聯絡訊息</TabsTrigger>
              <TabsTrigger value="ig">IG 貼文</TabsTrigger>
              <TabsTrigger value="blog">部落格</TabsTrigger>
              <TabsTrigger value="courses">商品管理</TabsTrigger>
              <TabsTrigger value="enrollments">課程授權</TabsTrigger>
              <TabsTrigger value="seo">SEO 監控</TabsTrigger>
              <TabsTrigger value="subscribers">訂閱名單</TabsTrigger>
              <TabsTrigger value="quiz-results" className="gap-1.5">
                <Cloud className="h-4 w-4" />
                身心測驗結果
              </TabsTrigger>
              <TabsTrigger value="admins">管理員</TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <Card>
                <CardContent className="p-0">
                  {loadingData ? (
                    <p className="p-6 text-muted-foreground">載入中...</p>
                  ) : orders.length === 0 ? (
                    <p className="p-6 text-muted-foreground">目前沒有訂單</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead>建立時間</TableHead>
                            <TableHead>姓名</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>電話</TableHead>
                            <TableHead className="text-right">金額</TableHead>
                            <TableHead>狀態</TableHead>
                            <TableHead>備註</TableHead>
                            <TableHead className="w-8"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => (
                            <>
                              <TableRow
                                key={order.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                              >
                                <TableCell className="whitespace-nowrap text-sm">
                                  {new Date(order.created_at).toLocaleString("zh-TW")}
                                </TableCell>
                                <TableCell>{order.customer_name}</TableCell>
                                <TableCell>{order.customer_email}</TableCell>
                                <TableCell>{order.customer_phone || "-"}</TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                  NT$ {order.total_amount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={statusColor(order.status)}>{order.status}</Badge>
                                </TableCell>
                                <TableCell>
                                  {expandedOrder === order.id
                                    ? <span className="whitespace-pre-wrap">{order.notes || "-"}</span>
                                    : <span className="line-clamp-1">{order.notes || "-"}</span>
                                  }
                                </TableCell>
                                <TableCell className="text-center">
                                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedOrder === order.id ? "rotate-180" : ""}`} />
                                </TableCell>
                              </TableRow>
                              {expandedOrder === order.id && (
                                <TableRow key={`${order.id}-items`}>
                                  <TableCell colSpan={8} className="bg-muted/30 px-6 py-3">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">購買明細</p>
                                    {order.items && order.items.length > 0 ? (
                                      <ul className="space-y-1">
                                        {order.items.map((item) => (
                                          <li key={item.id} className="flex justify-between text-sm">
                                            <span>{item.product_title} × {item.quantity}</span>
                                            <span className="text-muted-foreground">NT$ {(item.unit_price * item.quantity).toLocaleString()}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">無明細</p>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="registrations">
              <Card>
                <CardContent className="p-0">
                  {loadingData ? (
                    <p className="p-6 text-muted-foreground">載入中...</p>
                  ) : registrations.length === 0 ? (
                    <p className="p-6 text-muted-foreground">目前沒有活動報名</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>報名時間</TableHead>
                            <TableHead>姓名</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>電話</TableHead>
                            <TableHead>活動類型</TableHead>
                            <TableHead>狀態</TableHead>
                            <TableHead>備註</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {registrations.map((reg) => (
                            <TableRow key={reg.id}>
                              <TableCell className="whitespace-nowrap">
                                {new Date(reg.created_at).toLocaleString("zh-TW")}
                              </TableCell>
                              <TableCell>{reg.customer_name}</TableCell>
                              <TableCell>{reg.customer_email}</TableCell>
                              <TableCell>{reg.customer_phone}</TableCell>
                              <TableCell>{reg.event_type}</TableCell>
                              <TableCell>
                                <Badge variant={statusColor(reg.status)}>{reg.status}</Badge>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">{reg.notes || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts">
              <ContactMessagesTab />
            </TabsContent>

            <TabsContent value="ig">
              <IGPostsTab />
            </TabsContent>

            <TabsContent value="blog">
              <BlogPostsTab />
            </TabsContent>

            <TabsContent value="courses">
              <ProductsTab />
            </TabsContent>

            <TabsContent value="enrollments">
              <CourseEnrollmentsTab />
            </TabsContent>

            <TabsContent value="seo">
              <SEOMetricsTab />
            </TabsContent>

            <TabsContent value="subscribers">
              <SubscribersTab />
            </TabsContent>

            <TabsContent value="quiz-results">
              <SubscribersTab defaultValue="quiz" />
            </TabsContent>

            <TabsContent value="admins">
              <AdminsTab currentUserEmail={user?.email || ""} />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default Admin;
