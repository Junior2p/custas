import LoginForm from "@/components/auth/LoginForm";
import { credenciaisConfiguradas } from "@/lib/auth/sessao";

export default function LoginPage() {
  return <LoginForm configurado={credenciaisConfiguradas()} />;
}
