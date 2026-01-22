"use client";

import { useRouter } from "next/navigation";
import { Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginChoicePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-4xl font-bold text-accent">SGYMZ</CardTitle>
          <CardDescription>Escolha como deseja acessar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="default"
            className="w-full h-16 text-lg gap-3"
            onClick={() => router.push("/admin/login")}
          >
            <Shield size={24} />
            Sou Administrador
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-16 text-lg gap-3"
            onClick={() => router.push("/login")}
          >
            <User size={24} />
            Sou Usuário
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
