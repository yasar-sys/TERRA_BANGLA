import { useEffect, useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";

export function AuthButton() {
  const { lang } = useLang();
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  async function signIn() {
    setBusy(true);
    sessionStorage.setItem("terrabangla-auth-next", window.location.pathname);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth`,
      extraParams: { prompt: "select_account" },
    });
    if (result.error) setBusy(false);
  }

  if (user) {
    return (
      <div className="flex items-center gap-1">
        {user.email?.toLowerCase() === "saminyasarsunny@gmail.com" ? <Button asChild variant="ghost" size="sm"><Link to="/admin">{lang === "bn" ? "অ্যাডমিন" : "Admin"}</Link></Button> : null}
        <Button variant="outline" size="sm" onClick={() => void supabase.auth.signOut()} title={user.email ?? ""}>
          <LogOut aria-hidden /> {lang === "bn" ? "সাইন আউট" : "Sign out"}
        </Button>
      </div>
    );
  }
  return (
    <Button variant="outline" size="sm" onClick={signIn} disabled={busy}>
      <LogIn aria-hidden /> {busy ? (lang === "bn" ? "খুলছে…" : "Opening…") : (lang === "bn" ? "সাইন ইন" : "Sign in")}
    </Button>
  );
}