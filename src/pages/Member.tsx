import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Package, Lock, Loader2, BookOpen } from "lucide-react";
import ProfileTab from "@/components/member/ProfileTab";
import PasswordTab from "@/components/member/PasswordTab";
import OrdersTab from "@/components/member/OrdersTab";

const Member = () => {
  const { user, profile, loading: authLoading, db } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <section className="py-20 md:py-28">
        <div className="container-brand max-w-3xl px-4">
          <h1 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-8">
            會員中心
          </h1>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile" className="gap-1.5">
                <User className="w-4 h-4" />
                個人資料
              </TabsTrigger>
              <TabsTrigger value="password" className="gap-1.5">
                <Lock className="w-4 h-4" />
                修改密碼
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-1.5">
                <Package className="w-4 h-4" />
                訂單記錄
              </TabsTrigger>
              <TabsTrigger value="resources" className="gap-1.5" asChild>
                <Link to="/member/purchases">
                  <BookOpen className="w-4 h-4" />
                  學習資源
                </Link>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <ProfileTab user={user} profile={profile} />
            </TabsContent>

            <TabsContent value="password">
              <PasswordTab />
            </TabsContent>

            <TabsContent value="orders">
              <OrdersTab user={user} db={db} />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default Member;
