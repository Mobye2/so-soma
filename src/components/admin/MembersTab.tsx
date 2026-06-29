import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Member {
  id: string;
  email: string | null;
  display_name: string | null;
  phone: string | null;
  created_at: string | null;
  supabase_auth_id: string | null;
  is_admin?: boolean;
}

const MembersTab = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("id, email, display_name, phone, created_at, supabase_auth_id").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id").eq("role", "admin"),
      ]);
      const adminIds = new Set((rolesRes.data || []).map((r) => r.user_id));
      setMembers((profilesRes.data || []).map((m) => ({
        ...m,
        is_admin: adminIds.has(m.supabase_auth_id),
      })));
      setLoading(false);
    })();
  }, []);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.email?.toLowerCase().includes(q) ||
      m.display_name?.toLowerCase().includes(q) ||
      m.phone?.includes(q)
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          會員名單
          {!loading && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              共 {members.length} 位
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜尋姓名、Email 或電話"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">
            {search ? "找不到符合的會員" : "尚無會員"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>電話</TableHead>
                  <TableHead>加入時間</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.display_name || "—"}</TableCell>
                    <TableCell>{member.email || "—"}</TableCell>
                    <TableCell>{member.phone || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {member.created_at
                        ? new Date(member.created_at).toLocaleDateString("zh-TW")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {member.is_admin && (
                        <Badge variant="secondary" className="gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          管理員
                        </Badge>
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

export default MembersTab;
