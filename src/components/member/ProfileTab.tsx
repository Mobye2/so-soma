import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";
interface ProfileTabProps {
  user: { email: string; sub: string };
  profile: { display_name: string | null; phone: string | null; email: string | null; birthday?: string | null; created_at?: string | null } | null;
}

const ProfileTab = ({ user, profile }: ProfileTabProps) => {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [original, setOriginal] = useState({ displayName: "", phone: "", birthday: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      const init = {
        displayName: profile.display_name || "",
        phone: profile.phone || "",
        birthday: profile.birthday || "",
      };
      setDisplayName(init.displayName);
      setPhone(init.phone);
      setBirthday(init.birthday);
      setOriginal(init);
    }
  }, [profile]);

  const isDirty =
    displayName !== original.displayName ||
    phone !== original.phone ||
    birthday !== original.birthday;

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        phone: phone.trim() || null,
        birthday: birthday || null,
      })
      .eq("id", user.sub);

    if (error) {
      toast({ title: "儲存失敗", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "個人資料已更新" });
      setOriginal({ displayName, phone, birthday });
    }
    setSaving(false);
  };

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("zh-TW", { year: "numeric", month: "long" })
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">編輯個人資料</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="font-medium text-foreground">{profile?.display_name || "（尚未設定名稱）"}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {joinedDate && (
            <p className="text-xs text-muted-foreground mt-0.5">加入於 {joinedDate}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user.email} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">Email 為帳號憑證，無法自行修改。</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">顯示名稱</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="輸入您的名稱"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">聯絡電話</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="輸入您的電話號碼"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthday">生日</Label>
          <Input
            id="birthday"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
        </div>

        <Button onClick={handleSave} disabled={saving || !isDirty} className="gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          儲存變更
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileTab;
