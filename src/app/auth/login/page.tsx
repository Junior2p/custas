import LoginForm from "@/components/auth/LoginForm";
import { senhaConfigurada } from "@/lib/auth/sessao";

export default function LoginPage() {
  return <LoginForm configurado={Boolean(senhaConfigurada())} />;
}
