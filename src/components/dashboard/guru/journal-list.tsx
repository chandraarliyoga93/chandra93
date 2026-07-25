"use client";

import { Journal, deleteJournalSupabase as deleteJournal } from "@/actions/journals-supabase";
import { ClassData } from "@/actions/classes-supabase";
import { Book, Calendar, Trash, Eye } from "iconoir-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface JournalListProps {
  journals: Journal[];
  classes: ClassData[];
}

export function JournalList({ journals, classes }: JournalListProps) {
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (confirm("Hapus jurnal ini?")) {
      startTransition(async () => {
        const result = await deleteJournal(id);
        if (result.success) {
          toast.success("Berhasil!", { description: "Jurnal berhasil dihapus" });
        } else {
          toast.error("Terjadi Kesalahan", { description: result.error || "Gagal menghapus jurnal" });
        }
      });
    }
  };

  if (journals.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-20 px-4 text-center border shadow-sm animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Book className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold">Belum Ada Jurnal</h3>
          <p className="text-muted-foreground max-w-xs mx-auto text-sm">
            Anda belum menulis jurnal untuk kelas ini.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
      {journals.map((journal) => (
        <Card
          key={journal.id}
          className="group relative border shadow-sm hover:shadow-md transition-all flex flex-col h-full"
        >
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-semibold uppercase">
                {journal.className}
              </Badge>
              <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-medium uppercase">
                <Calendar className="w-3 h-3" />
                {new Date(journal.date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
            
            <h3 className="text-lg font-bold mb-3 tracking-tight line-clamp-1">
              {journal.topic}
            </h3>
            
            <div className="space-y-4 mb-6 flex-1">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Kegiatan Utama</span>
                <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed">
                  {journal.activities}
                </p>
              </div>
              
              {journal.incidents && (
                <div className="bg-destructive/5 border border-destructive/10 p-3 rounded-lg">
                  <span className="text-[10px] font-bold uppercase text-destructive block mb-1">Kejadian Penting</span>
                  <p className="text-destructive/90 line-clamp-2 text-xs leading-relaxed italic">
                    "{journal.incidents}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t mt-auto">
               <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setSelectedJournal(journal)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground text-destructive"
                    onClick={() => handleDelete(journal.id)}
                    disabled={isPending}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
               </div>
               <div className="text-2xl filter grayscale group-hover:grayscale-0 transition-all" title="Mood Kelas">
                  {journal.mood}
               </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Detail Dialog */}
      <Dialog open={!!selectedJournal} onOpenChange={(open) => !open && setSelectedJournal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default" className="text-[10px] font-bold uppercase">
                {selectedJournal?.className}
              </Badge>
              <div className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {selectedJournal && new Date(selectedJournal.date).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {selectedJournal?.topic}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Ringkasan Kegiatan</span>
              <div className="p-4 border rounded-lg bg-muted/30 text-sm leading-relaxed">
                {selectedJournal?.activities}
              </div>
            </div>

            {selectedJournal?.incidents && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-destructive">Catatan & Kejadian</span>
                <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5 text-sm italic leading-relaxed text-destructive/90">
                  {selectedJournal?.incidents}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-primary block">Suasana Kelas</span>
                <span className="font-bold text-lg">
                  {selectedJournal?.mood === '😊' && 'Sangat Kondusif'}
                  {selectedJournal?.mood === '⚡' && 'Aktif & Seru'}
                  {selectedJournal?.mood === '😴' && 'Kurang Bersemangat'}
                  {selectedJournal?.mood === '😤' && 'Sedikit Chaos'}
                </span>
              </div>
              <div className="text-4xl">
                {selectedJournal?.mood}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
