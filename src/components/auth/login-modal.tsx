"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LoginForm } from "./login-form";
import { useState } from "react";

export function LoginModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-background text-foreground hover:bg-muted shadow-md hover:shadow-lg rounded-full px-6 font-medium border border-border transition-all">
          Sign in
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center text-2xl">Sign in</DialogTitle>
            <DialogDescription className="text-center">
              to continue to Live Trip
            </DialogDescription>
          </DialogHeader>
          <LoginForm className="px-0" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
