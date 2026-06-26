import { useEffect, useState } from "react";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import { supabase } from "@/integrations/supabase/client";

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};

export const userPool = new CognitoUserPool(poolData);

interface Profile {
  display_name: string | null;
  phone: string | null;
  email: string | null;
}

interface AuthUser {
  email: string;
  sub: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      setLoading(false);
      return;
    }

    cognitoUser.getSession(async (err: Error | null, session: any) => {
      if (err || !session?.isValid()) {
        setLoading(false);
        return;
      }

      const payload = session.getIdToken().decodePayload();
      const currentUser = { email: payload.email, sub: payload.sub };
      setUser(currentUser);

      const { data } = await supabase
        .from("profiles")
        .select("display_name, phone, email")
        .eq("id", currentUser.sub)
        .single();
      setProfile(data);
      setLoading(false);
    });
  }, []);

  const signIn = (email: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      const authDetails = new AuthenticationDetails({ Username: email, Password: password });

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: async (session) => {
          const payload = session.getIdToken().decodePayload();
          const currentUser = { email: payload.email, sub: payload.sub };
          setUser(currentUser);

          const { data } = await supabase
            .from("profiles")
            .select("display_name, phone, email")
            .eq("id", currentUser.sub)
            .single();
          setProfile(data);
          resolve();
        },
        onFailure: (err) => reject(err),
      });
    });
  };

  const signUp = (email: string, password: string, name: string, phone: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const attributes = [
        new CognitoUserAttribute({ Name: "email", Value: email }),
      ];

      userPool.signUp(email, password, attributes, [], async (err, result) => {
        if (err) return reject(err);

        const sub = result!.userSub;
        await supabase.from("profiles").insert({
          id: sub,
          email,
          display_name: name || null,
          phone: phone || null,
        });

        resolve();
      });
    });
  };

  const confirmSignUp = (email: string, code: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) return reject(err);
        resolve();
      });
    });
  };

  const signOut = () => {
    const cognitoUser = userPool.getCurrentUser();
    cognitoUser?.signOut();
    setUser(null);
    setProfile(null);
  };

  return { user, profile, loading, signIn, signUp, confirmSignUp, signOut };
};
