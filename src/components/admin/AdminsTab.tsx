import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { apiPost } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ShieldCheck } from "lucide-react";

interface Admin {
  supabase_auth_id: string;
  email: string | null;
  display_name: string | null;
}

const AdminsTab = ({ currentUserEmail }: { currentUserEmail: string }) => {
  const { toast } = useToast();
  const { getIdToken } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      setAdmins([]);
      setLoading(false);
      return;
    }

    const authIds = roles.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("supabase_auth_id, email, display_name")
      .in("supabase_auth_id", authIds);

    setAdmins(
      roles.map((r) => {
        const p = (profiles || []).find((p) => p.supabase_auth_id === r.user_id);
        return {
          supabase_auth_id: r.user_id,
          email: p?.email || null,
          display_name: p?.display_name || null,
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAdd = async () => {
    if (!newEmail.trim()) return;
    setAdding(true);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("supabase_auth_id, email")
      .eq("email", newEmail.trim())
      .maybeSingle();

    if (profileError || !profile?.supabase_auth_id) {
      toast({ title: "新增失敗", description: "找不到此 Email 的會員，請確認已註冊", variant: "destructive" });
      setAdding(false);
      return;
    }

    const { data: existing } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", profile.supabase_auth_id)
      .eq("role", "admin")
      .maybeSingle();

    if (existing) {
      toast({ title: "此會員已是管理員" });
      setAdding(false);
      return;
    }

    // 1. 寫入 Supabase user_roles
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: profile.supabase_auth_id as unknown as string, role: "admin" });

    if (error) {
      toast({ title: "新增失敗", description: error.message, variant: "destructive" });
      setAdding(false);
      return;
    }

    // 2. 加入 Cognito admin group
    try {
      const token = await getIdToken();
      await apiPost("/admin-db", {
        cognito_action: "add_admin",
        username: newEmail.trim(),
      }, token || undefined);
    } catch (e) {
      console.error("Cognito add admin failed:", e);
      toast({ title: "警告", description: "Supabase 已更新，但 Cognito 同步失敗，請聯絡系統管理員", variant: "destructive" });
    }

    toast({ title: "已新增管理員" });
    setNewEmail("");
    fetchAdmins();
    setAdding(false);
  };

  const handleRemove = async (supabaseAuthId: string) => {
    setRemovingId(supabaseAuthId);

    // 1. 移除 Supabase user_roles
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", supabaseAuthId)
      .eq("role", "admin");

    if (error) {
      toast({ title: "移除失敗", description: error.message, variant: "destructive" });
      setRemovingId(null);
      return;
    }

    // 2. 從 Cognito admin group 移除
    const admin = admins.find((a) => a.supabase_auth_id === supabaseAuthId);
    if (admin?.email) {
      try {
        const token = await getIdToken();
        await apiPost("/admin-db", {
          cognito_action: "remove_admin",
          username: admin.email,
        }, token || undefined);
      } catch (e) {
        console.error("Cognito remove admin failed:", e);
      }
    }

    toast({ title: "已移除管理員" });
    fetchAdmins();
    setRemovingId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          權限管理
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="輸入會員 Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={adding} className="gap-1.5 shrink-0">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            新增
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : admins.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">尚無管理員</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.supabase_auth_id}>
                    <TableCell>{admin.display_name || "—"}</TableCell>
                    <TableCell>
                      {admin.email}
                      {admin.email === currentUserEmail && (
                        <span className="ml-2 text-xs text-muted-foreground">（你）</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {admin.email !== currentUserEmail && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(admin.supabase_auth_id)}
                          disabled={removingId === admin.supabase_auth_id}
                          className="text-destructive hover:text-destructive"
                        >
                          {removingId === admin.supabase_auth_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminsTab;
