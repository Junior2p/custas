import LoginForm from "@/components/auth/LoginForm";
import { codigoConfigurado } from "@/lib/auth/sessao";

export default function LoginPage() {
  return <LoginForm configurado={Boolean(codigoConfigurado())} />;
}
