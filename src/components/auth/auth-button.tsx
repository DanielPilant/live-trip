import Link from "next/link";
import { Button } from "../ui/button";
import { getUser } from "@/lib/services/auth-service";
import { LogoutButton } from "./logout-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export async function AuthButton() {
  const user = await getUser();

  return user ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 overflow-hidden border-2 border-white shadow-md hover:shadow-lg transition-shadow"
        >
          <img
            src={
              user.user_metadata?.avatar_url ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`
            }
            alt={user.email || "User avatar"}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.user_metadata?.full_name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <LogoutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Button
      asChild
      className="bg-white text-black hover:bg-gray-50 shadow-md hover:shadow-lg rounded-full px-6 font-medium border border-gray-200 transition-all"
    >
      <Link href="/auth/login">Sign in</Link>
    </Button>
  );
}
