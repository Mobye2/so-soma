import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiPost } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  content: string;
  created_at: string;
}

const subjectMap: Record<string, string> = {
  registration: "課程報名",
  payment: "付款問題",
  business: "企業合作",
  other: "其他",
};

const ContactMessagesTab = () => {
  const { getIdToken } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = await getIdToken();
        const data = await apiPost("/admin-db", {
          method: "GET",
          table: "contact_messages?order=created_at.desc"
        }, token || undefined);
        if (data) setMessages(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load messages:", e);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <p className="p-6 text-muted-foreground">載入中...</p>;
  if (messages.length === 0) return <p className="p-6 text-muted-foreground">目前沒有聯絡訊息</p>;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>時間</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>主旨</TableHead>
                <TableHead>內容</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(msg.created_at).toLocaleString("zh-TW")}
                  </TableCell>
                  <TableCell>{msg.name}</TableCell>
                  <TableCell>{msg.email}</TableCell>
                  <TableCell>{subjectMap[msg.subject] || msg.subject}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{msg.content}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactMessagesTab;
