import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ShieldCheck } from "lucide-react";

interface Admin {
  id: string;
  email: string;
}

const AdminsTab = ({ currentUserEmail }: { currentUserEmail: string }) => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const callManageAdmin = async (body: Record<string, string>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("manage-admin", {
      body,
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    return res;
  };

  const fetchAdmins = async () => {
    setLoading(true);
    const { data, error } = await callManageAdmin({ action: "list" });
    if (!error && data?.admins) {
      setAdmins(data.admins);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAdd = async () => {
    if (!newEmail.trim()) return;
    setAdding(true);
    const { data, error } = await callManageAdmin({ action: "add", email: newEmail.trim() });
    if (error || data?.error) {
      toast({ title: "新增失敗", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "已新增管理員" });
      setNewEmail("");
      fetchAdmins();
    }
    setAdding(false);
  };

  const handleRemove = async (email: string, id: string) => {
    setRemovingId(id);
    const { data, error } = await callManageAdmin({ action: "remove", email });
    if (error || data?.error) {
      toast({ title: "移除失敗", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "已移除管理員" });
      fetchAdmins();
    }
    setRemovingId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          管理員管理
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="輸入使用者 Email"
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
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
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
                          onClick={() => handleRemove(admin.email, admin.id)}
                          disabled={removingId === admin.id}
                          className="text-destructive hover:text-destructive"
                        >
                          {removingId === admin.id ? (
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
