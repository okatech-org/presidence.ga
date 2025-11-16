import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSignature, Users, Heart, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const BarreActionsPresidentielles = () => {
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  return (
    <>
      <Card className="sticky bottom-6 border-2 border-primary shadow-2xl bg-background/95 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Actions Présidentielles</h3>
            <div className="flex gap-3">
              {/* Le Stylo Numérique */}
              <Button 
                size="lg" 
                className="gap-2"
                onClick={() => setOpenDialog('signature')}
              >
                <FileSignature className="h-5 w-5" />
                Le Stylo Numérique
              </Button>

              {/* Convocations */}
              <Button 
                size="lg" 
                variant="secondary"
                className="gap-2"
                onClick={() => setOpenDialog('convocations')}
              >
                <Users className="h-5 w-5" />
                Convocations
              </Button>

              {/* Droit de Grâce */}
              <Button 
                size="lg" 
                variant="outline"
                className="gap-2"
                onClick={() => setOpenDialog('grace')}
              >
                <Heart className="h-5 w-5" />
                Droit de Grâce
              </Button>

              {/* Messagerie Sécurisée */}
              <Button 
                size="lg" 
                variant="outline"
                className="gap-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                onClick={() => setOpenDialog('messagerie')}
              >
                <Mail className="h-5 w-5" />
                DIRECT-PR
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Le Stylo Numérique */}
      <Dialog open={openDialog === 'signature'} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-6 w-6" />
              Le Stylo Numérique - Circuit de Signature
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Actes en attente de votre signature • Géré par le Secrétariat Général
            </p>
            
            {[
              { type: "Décret", title: "Nomination Directeur Général Douanes", minister: "Min. Finances", priority: "Urgent" },
              { type: "Ordonnance", title: "Ouverture Crédits Exceptionnels Santé", minister: "Min. Santé", priority: "Normal" },
              { type: "Décret", title: "Ratification Accord Commercial CEMAC", minister: "Min. Affaires Étrangères", priority: "Normal" },
            ].map((acte, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">{acte.type}</span>
                    <h4 className="font-semibold mt-1">{acte.title}</h4>
                    <p className="text-sm text-muted-foreground">{acte.minister}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    acte.priority === 'Urgent' 
                      ? 'bg-red-100 dark:bg-red-950 text-red-600' 
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                  }`}>
                    {acte.priority}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Explorer le dossier
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Signer
                  </Button>
                  <Button size="sm" variant="ghost" className="text-orange-600">
                    Retourner
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600">
                    Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Convocations */}
      <Dialog open={openDialog === 'convocations'} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Convocations Officielles
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <Button size="lg" className="w-full justify-start" variant="outline">
              Convoquer le Conseil des Ministres
            </Button>
            <Button size="lg" className="w-full justify-start" variant="outline">
              Convoquer le Conseil Supérieur de la Magistrature
            </Button>
            <Button size="lg" className="w-full justify-start" variant="outline">
              Convoquer le Parlement en Congrès
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Droit de Grâce */}
      <Dialog open={openDialog === 'grace'} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-6 w-6" />
              Droit de Grâce - Demandes en Instruction
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Dossiers transmis par le Ministère de la Justice après instruction
            </p>
            
            {[
              { name: "NDONG Martin", crime: "Vol simple", peine: "3 ans", purge: "2 ans", avis: "Favorable" },
              { name: "MBOUMBA Claire", crime: "Escroquerie", peine: "5 ans", purge: "4 ans", avis: "Réservé" },
            ].map((dossier, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <h4 className="font-semibold">{dossier.name}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="text-muted-foreground">Crime:</span> {dossier.crime}</p>
                  <p><span className="text-muted-foreground">Peine:</span> {dossier.peine}</p>
                  <p><span className="text-muted-foreground">Purgé:</span> {dossier.purge}</p>
                  <p><span className="text-muted-foreground">Avis Justice:</span> {dossier.avis}</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline">
                    Voir dossier complet
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Accorder
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600">
                    Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Messagerie Sécurisée */}
      <Dialog open={openDialog === 'messagerie'} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-6 w-6" />
              DIRECT-PR - Messagerie Sécurisée
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">
              Canal crypté direct sans intermédiaire
            </p>
            <Button size="lg" className="w-full justify-start" variant="outline">
              Vice-Président de la République
            </Button>
            <Button size="lg" className="w-full justify-start" variant="outline">
              Vice-Président du Gouvernement
            </Button>
            <Button size="lg" className="w-full justify-start" variant="outline">
              Ministre de la Défense Nationale
            </Button>
            <Button size="lg" className="w-full justify-start" variant="outline">
              Ministre de l'Intérieur
            </Button>
            <Button size="lg" className="w-full justify-start" variant="outline">
              Chef de la DGSS
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BarreActionsPresidentielles;
