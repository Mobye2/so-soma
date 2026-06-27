import { useEffect, useRef, useState } from "react";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import { supabase, setSupabaseToken } from "@/integrations/supabase/client";
import { apiPost } from "@/lib/api";

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
  const [supabaseToken, _setSupabaseToken] = useState<string | null>(null);
  const [pendingCognitoUser, setPendingCognitoUser] = useState<CognitoUser | null>(null);

  const syncAuth = async (cognitoJwt: string): Promise<string | null> => {
    try {
      const { supabase_token } = await apiPost<{ supabase_token: string }>(
        "/sync-auth",
        {},
        cognitoJwt
      );
      setSupabaseToken(supabase_token);
      return supabase_token;
    } catch (err) {
      console.error("Failed to sync auth:", err);
      return null;
    }
  };

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

      await syncAuth(session.getIdToken().getJwtToken());

      const { data } = await supabase
        .from("profiles")
        .select("display_name, phone, email")
        .eq("id", currentUser.sub)
        .maybeSingle();
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

          await syncAuth(session.getIdToken().getJwtToken());

          const { data } = await supabase
            .from("profiles")
            .select("display_name, phone, email")
            .eq("id", currentUser.sub)
            .maybeSingle();
          setProfile(data);
          resolve();
        },
        onFailure: (err) => reject(err),
        newPasswordRequired: (_userAttributes, _requiredAttributes) => {
          setPendingCognitoUser(cognitoUser);
          reject({ code: "NewPasswordRequired" });
        },
      });
    });
  };

  const completeNewPassword = (newPassword: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!pendingCognitoUser) return reject(new Error("No pending user"));
      pendingCognitoUser.completeNewPasswordChallenge(newPassword, {}, {
        onSuccess: async (session) => {
          const payload = session.getIdToken().decodePayload();
          const currentUser = { email: payload.email, sub: payload.sub };
          setUser(currentUser);

          await syncAuth(session.getIdToken().getJwtToken());

          const { data } = await supabase
            .from("profiles")
            .select("display_name, phone, email")
            .eq("id", currentUser.sub)
            .maybeSingle();
          setProfile(data);
          setPendingCognitoUser(null);
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
      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  };

  const forgotPassword = (email: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.forgotPassword({
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err),
      });
    });
  };

  const confirmForgotPassword = (email: string, code: string, newPassword: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err),
      });
    });
  };

  const signOut = () => {
    const cognitoUser = userPool.getCurrentUser();
    cognitoUser?.signOut();
    setSupabaseToken(null);
    _setSupabaseToken(null);
    setUser(null);
    setProfile(null);
  };

  const getIdToken = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) return resolve(null);
      cognitoUser.getSession((err: Error | null, session: any) => {
        if (err || !session?.isValid()) return resolve(null);
        resolve(session.getIdToken().getJwtToken());
      });
    });
  };

  return { user, profile, loading, db: supabase, signIn, signUp, confirmSignUp, signOut, completeNewPassword, needsNewPassword: !!pendingCognitoUser, forgotPassword, confirmForgotPassword, getIdToken };
};
