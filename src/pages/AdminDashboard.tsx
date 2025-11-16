import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Shield, FileText, Download, Eye, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import emblemGabon from "@/assets/emblem_gabon.png";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FeedbackDocumentsViewer } from "@/components/FeedbackDocumentsViewer";

interface Feedback {
  id: string;
  user_email: string;
  role_name: string;
  role_description: string;
  work_description: string;
  implementation_suggestions: string | null;
  created_at: string;
  status: string | null;
  document_paths: string[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from("role_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les feedbacks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "processed":
        return <Badge variant="default">Traité</Badge>;
      case "pending":
        return <Badge variant="secondary">En attente</Badge>;
      default:
        return <Badge variant="outline">Nouveau</Badge>;
    }
  };

  const handleViewDocuments = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setShowDocuments(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Header */}
      <header className="gradient-primary text-primary-foreground shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/demo")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white">
                <img
                  src={emblemGabon}
                  alt="Emblème de la République Gabonaise"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <h1 className="text-xl font-bold">Dashboard Administrateur Système</h1>
                </div>
                <p className="text-sm text-primary-foreground/80">
                  Gestion des feedbacks et contributions
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Feedbacks</p>
                <p className="text-2xl font-bold">{feedbacks.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-secondary/10">
                <Eye className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">
                  {feedbacks.filter((f) => !f.status || f.status === "pending").length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <Download className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Traités</p>
                <p className="text-2xl font-bold">
                  {feedbacks.filter((f) => f.status === "processed").length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Feedbacks Table */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Feedbacks des responsables</h2>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : feedbacks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun feedback pour le moment
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Description du rôle</TableHead>
                    <TableHead>Description du travail</TableHead>
                    <TableHead>Suggestions</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbacks.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(feedback.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="font-medium">{feedback.role_name}</TableCell>
                      <TableCell>{feedback.user_email}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {feedback.role_description}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {feedback.work_description}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {feedback.implementation_suggestions || "-"}
                      </TableCell>
                      <TableCell>
                        {feedback.document_paths && feedback.document_paths.length > 0 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocuments(feedback)}
                          >
                            <Paperclip className="h-4 w-4 mr-2" />
                            {feedback.document_paths.length}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(feedback.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </main>

      {/* Documents Viewer Modal */}
      {selectedFeedback && (
        <FeedbackDocumentsViewer
          isOpen={showDocuments}
          onClose={() => {
            setShowDocuments(false);
            setSelectedFeedback(null);
          }}
          documentPaths={selectedFeedback.document_paths || []}
          feedbackId={selectedFeedback.id}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
