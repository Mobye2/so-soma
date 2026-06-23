import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user: caller } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!caller) {
      return new Response(JSON.stringify({ error: "未授權" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: callerRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: "權限不足" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action, email } = await req.json();

    if (action === "list") {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("role", "admin");

      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify({ admins: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const userIds = roles.map((r: any) => r.user_id);
      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const admins = users
        .filter((u: any) => userIds.includes(u.id))
        .map((u: any) => ({ id: u.id, email: u.email }));

      return new Response(JSON.stringify({ admins }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "add") {
      if (!email) {
        return new Response(JSON.stringify({ error: "請提供 Email" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Find user by email
      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const targetUser = users.find((u: any) => u.email === email);
      if (!targetUser) {
        return new Response(JSON.stringify({ error: "找不到此 Email 的使用者" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: targetUser.id, role: "admin" });

      if (error && error.code === "23505") {
        return new Response(JSON.stringify({ error: "此使用者已是管理員" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "remove") {
      if (!email) {
        return new Response(JSON.stringify({ error: "請提供 Email" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Prevent removing self
      if (email === caller.email) {
        return new Response(JSON.stringify({ error: "無法移除自己的管理員權限" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const targetUser = users.find((u: any) => u.email === email);
      if (!targetUser) {
        return new Response(JSON.stringify({ error: "找不到此使用者" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", targetUser.id)
        .eq("role", "admin");

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "無效的操作" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
