import { useNavigate } from "react-router-dom";
import emblemGabon from "@/assets/emblem_gabon.png";
import presidentialPalaceImage from "@/assets/presidential-palace.jpg";
import { usePrefetch } from "@/hooks/usePrefetch";

// Version de secours sans dépendances Radix UI
const IndexFallback = () => {
  const navigate = useNavigate();
  const { prefetchPresidentSpace, prefetchDashboard } = usePrefetch();

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
        
        <div className="container mx-auto px-4 py-12 md:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-full bg-white p-1.5 md:p-2 mb-4 md:mb-8 shadow-xl">
              <img 
                src={emblemGabon} 
                alt="Emblème de la République Gabonaise" 
                className="w-full h-full object-contain"
              />
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold mb-3 md:mb-6 leading-tight">
              PRÉSIDENCE DE LA RÉPUBLIQUE
            </h1>
            
            <p className="text-lg md:text-2xl lg:text-3xl mb-2 md:mb-4 text-accent">
              Plateforme Unifiée de Pilotage de l'État
            </p>
            
            <p className="text-sm md:text-lg lg:text-xl mb-6 md:mb-12 text-white/90 max-w-3xl mx-auto">
              Une solution technologique de pointe permettant au Président de la République et à son cabinet 
              d'avoir une vision complète et en temps réel de l'action gouvernementale et de l'état de la nation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 md:gap-4 justify-center">
              <button 
                className="gradient-gold text-accent-foreground text-sm md:text-lg px-4 py-4 md:px-8 md:py-6 rounded-md hover:opacity-90 transition-all font-medium"
                onClick={() => navigate("/auth")}
                onMouseEnter={() => {
                  // Précharger les données des destinations possibles
                  prefetchPresidentSpace();
                  prefetchDashboard();
                }}
              >
                Accéder à la Plateforme →
              </button>
              <button 
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 text-sm md:text-lg px-4 py-4 md:px-8 md:py-6 rounded-md transition-all"
                onClick={() => navigate("/demo")}
              >
                Comptes Démo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">© 2025 Présidence de la République Gabonaise - Tous droits réservés</p>
            <p className="flex items-center justify-center gap-1">
              🔒 Plateforme sécurisée - Accès strictement réservé aux membres autorisés
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IndexFallback;
