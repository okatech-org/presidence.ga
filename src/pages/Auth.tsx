import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans l'application Présidence",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-secondary p-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="fixed top-6 left-6 text-white hover:bg-white/10 z-50"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour à l'accueil
      </Button>

      <div className="w-full max-w-md">
        {/* Header with Republic emblem */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent mb-4 shadow-xl">
            <Shield className="h-10 w-10 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            PRÉSIDENCE DE LA RÉPUBLIQUE
          </h1>
          <p className="text-primary-foreground/80">
            République Gabonaise
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-elegant">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Connexion Sécurisée</CardTitle>
            <CardDescription className="text-center">
              Accès réservé aux membres autorisés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre.email@presidence.ga"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full gradient-primary"
                disabled={loading}
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center text-xs text-muted-foreground">
              <p className="flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" />
                Connexion sécurisée et chiffrée
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-primary-foreground/60 mt-6">
          © 2025 Présidence de la République Gabonaise - Tous droits réservés
        </p>
      </div>
    </div>
  );
};

export default Auth;
