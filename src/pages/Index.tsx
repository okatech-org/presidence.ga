import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Activity, Users, TrendingUp, Globe, CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import commandCenterImage from "@/assets/command-center.jpg";
import presidentialPalaceImage from "@/assets/presidential-palace.jpg";
import collaborationImage from "@/assets/collaboration.jpg";
import securityImage from "@/assets/security.jpg";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Activity className="h-8 w-8" />,
      title: "Surveillance en Temps Réel",
      description: "Monitoring instantané de tous les indicateurs clés de l'État : économie, sécurité, santé, éducation.",
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Analyse Prédictive",
      description: "Détection précoce des risques et opportunités grâce à l'analyse des tendances et des données historiques.",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Coordination Interministérielle",
      description: "Centralisation des informations de tous les ministères pour une prise de décision éclairée et rapide.",
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: "Sécurité Maximale",
      description: "Chiffrement de bout en bout, authentification multi-facteurs, et contrôle d'accès granulaire par rôle.",
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Vision Stratégique",
      description: "Tableaux de bord synthétiques permettant une vue d'ensemble de l'action gouvernementale.",
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Suivi des Objectifs",
      description: "Monitoring de l'exécution des instructions présidentielles et des projets stratégiques nationaux.",
    },
  ];

  const benefits = [
    "Réduction du temps de prise de décision de 70%",
    "Amélioration de la coordination interministérielle",
    "Détection précoce des crises potentielles",
    "Transparence et traçabilité des actions gouvernementales",
    "Optimisation des ressources de l'État",
    "Renforcement de l'efficacité de l'action publique",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(21, 45, 75, 0.85), rgba(21, 45, 75, 0.85)), url(${presidentialPalaceImage})`,
          }}
        />
        
        <div className="container mx-auto px-6 py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-accent mb-8 shadow-xl animate-scale-in">
              <Shield className="h-12 w-12 text-accent-foreground" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
              PRÉSIDENCE DE LA RÉPUBLIQUE
            </h1>
            
            <p className="text-2xl md:text-3xl mb-4 text-accent animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Plateforme Unifiée de Pilotage de l'État
            </p>
            
            <p className="text-lg md:text-xl mb-12 text-white/90 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Une solution technologique de pointe permettant au Président de la République et à son cabinet 
              d'avoir une vision complète et en temps réel de l'action gouvernementale et de l'état de la nation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Button 
                size="lg" 
                className="gradient-gold text-accent-foreground text-lg px-8 py-6 hover:scale-105 transition-smooth"
                onClick={() => navigate("/auth")}
              >
                Accéder à la Plateforme
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 text-lg px-8 py-6"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Découvrir
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Matters Section */}
      <section className="py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pourquoi Cette Application Est Cruciale ?
            </h2>
            <p className="text-xl text-muted-foreground">
              Dans un monde en constante évolution, la gouvernance moderne exige des outils adaptés 
              pour une prise de décision rapide, éclairée et coordonnée.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="p-8 shadow-elegant hover:shadow-xl transition-smooth">
              <img 
                src={commandCenterImage} 
                alt="Centre de commandement moderne" 
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Activity className="h-8 w-8 text-primary" />
                Centralisation des Données
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Tous les ministères et institutions transmettent leurs données en temps réel vers une plateforme unique. 
                Plus besoin de multiplier les rapports papier ou les réunions : l'information est accessible instantanément, 
                standardisée et analysée automatiquement.
              </p>
            </Card>

            <Card className="p-8 shadow-elegant hover:shadow-xl transition-smooth">
              <img 
                src={securityImage} 
                alt="Sécurité des données" 
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Lock className="h-8 w-8 text-primary" />
                Sécurité & Confidentialité
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Les données sensibles de l'État sont protégées par un chiffrement de niveau militaire. 
                Chaque utilisateur dispose d'un accès personnalisé selon son rôle, garantissant que seules 
                les personnes autorisées peuvent consulter les informations stratégiques.
              </p>
            </Card>

            <Card className="p-8 shadow-elegant hover:shadow-xl transition-smooth">
              <img 
                src={collaborationImage} 
                alt="Collaboration gouvernementale" 
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                Coordination Optimale
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                L'application facilite la coordination entre tous les acteurs de l'État : du Vice-Président 
                du Gouvernement aux ministres, en passant par les institutions judiciaires et législatives. 
                Les blocages interministériels sont identifiés et résolus rapidement.
              </p>
            </Card>

            <Card className="p-8 shadow-elegant hover:shadow-xl transition-smooth bg-gradient-to-br from-primary/5 to-secondary/5">
              <div className="flex items-center justify-center h-64 mb-6">
                <TrendingUp className="h-32 w-32 text-primary animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-success" />
                Décisions Éclairées
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Grâce aux tableaux de bord synthétiques et aux alertes en temps réel, le Président peut 
                prendre des décisions basées sur des données concrètes et actualisées, anticiper les crises 
                et saisir les opportunités au bon moment.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Fonctionnalités Clés
            </h2>
            <p className="text-xl text-muted-foreground">
              Une suite complète d'outils pour un pilotage optimal de l'action gouvernementale
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-8 hover:shadow-elegant transition-smooth hover:scale-105 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-secondary/10 to-primary/10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
              Impact Mesurable
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-4 p-6 bg-card rounded-lg shadow-sm hover:shadow-elegant transition-smooth animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                  <p className="text-lg">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-primary text-primary-foreground">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Prêt à Transformer la Gouvernance ?
            </h2>
            <p className="text-xl mb-10 text-primary-foreground/90">
              Rejoignez la nouvelle ère de l'administration publique gabonaise avec des outils 
              technologiques de pointe au service de l'efficacité gouvernementale.
            </p>
            <Button 
              size="lg" 
              className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-10 py-6 hover:scale-105 transition-smooth"
              onClick={() => navigate("/auth")}
            >
              <Shield className="mr-2 h-5 w-5" />
              Accéder à la Plateforme Sécurisée
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">© 2025 Présidence de la République Gabonaise - Tous droits réservés</p>
            <p className="flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              Plateforme sécurisée - Accès strictement réservé aux membres autorisés
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
