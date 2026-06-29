import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Loader2 } from "lucide-react";
import { userPool } from "@/hooks/useAuth";

const PasswordTab = () => {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = () => {
    if (newPassword.length < 8) {
      toast({ title: "密碼長度不足", description: "新密碼至少需要 8 個字元", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "密碼不一致", description: "請確認兩次輸入的密碼相同", variant: "destructive" });
      return;
    }
    if (newPassword === currentPassword) {
      toast({ title: "密碼未變更", description: "新密碼不能與目前密碼相同", variant: "destructive" });
      return;
    }

    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      toast({ title: "無法取得登入狀態", description: "請重新登入後再試", variant: "destructive" });
      return;
    }

    setSaving(true);
    cognitoUser.getSession((err: Error | null, session: any) => {
      if (err || !session?.isValid()) {
        toast({ title: "工作階段已過期", description: "請重新登入後再試", variant: "destructive" });
        setSaving(false);
        return;
      }

      cognitoUser.changePassword(currentPassword, newPassword, (changeErr: Error | null) => {
        if (changeErr) {
          const msg =
            (changeErr as any).code === "NotAuthorizedException"
              ? "目前密碼不正確，請重新確認。"
              : changeErr.message;
          toast({ title: "密碼修改失敗", description: msg, variant: "destructive" });
        } else {
          toast({ title: "密碼已更新" });
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }
        setSaving(false);
      });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">修改密碼</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">目前密碼</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="輸入您目前使用的密碼"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">新密碼</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="至少 8 個字元"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">確認新密碼</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再次輸入新密碼"
          />
        </div>
        <Button
          onClick={handleChangePassword}
          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
          className="gap-1.5"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          更新密碼
        </Button>
      </CardContent>
    </Card>
  );
};

export default PasswordTab;
