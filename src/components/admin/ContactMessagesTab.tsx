import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setMessages(data);
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
