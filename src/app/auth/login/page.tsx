import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10 gap-4">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Back to Map
      </Link>
    </div>
  );
}

