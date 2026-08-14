import LoginForm from "@/components/auth/LoginForm";
import { supabaseConfigurado } from "@/lib/supabase/config";

export default function LoginPage() {
  return <LoginForm configurado={supabaseConfigurado} />;
}
