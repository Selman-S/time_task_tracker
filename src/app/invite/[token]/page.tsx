"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function InviteAcceptPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, password })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess(true);
        toast({ title: "Account activated!", description: "You can now log in." });
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.error || "Failed to activate account.");
      }
    } catch (err) {
      setError("Failed to activate account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Set Your Password</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-green-600 text-center py-8">Account activated! Redirecting to login...</div>
          ) : (
            <form onSubmit={handleAccept} className="space-y-4">
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                disabled={loading}
                required
              />
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? "Saving..." : "Set Password & Activate"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 