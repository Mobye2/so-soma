import { useEffect, useState } from "react";
import { useAuth, userPool } from "./useAuth";

export const useAdminCheck = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    cognitoUser.getSession((err: Error | null, session: any) => {
      if (err || !session?.isValid()) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const payload = session.getIdToken().decodePayload();
      const groups: string[] = payload["cognito:groups"] || [];
      setIsAdmin(groups.includes("admin"));
      setLoading(false);
    });
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading, user };
};
