"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Star, Infinite, Send } from "iconoir-react";
import { toast } from "sonner";
import { getStudentsInClassSupabase as getStudentsInClass, batchAssignXPSupabase as batchAssignXP } from "@/actions/gamification-supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Student {
  id: string;
  name: string;
  photo?: string;
  email: string;
}

interface AssignXPDialogProps {
  classId: string;
}

export function AssignXPDialog({ classId }: AssignXPDialogProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [xpAmount, setXpAmount] = useState(10);
  const [reason, setReason] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const fetchStudents = useCallback(async () => {
    setIsFetching(true);
    const data = await getStudentsInClass(classId);
    setStudents(data as unknown as Student[]);
    setIsFetching(false);
  }, [classId]);

  useEffect(() => {
    if (isOpen) {
      fetchStudents(); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [isOpen, fetchStudents]);

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map(s => s.id));
    }
  };

  const handleAssign = async () => {
    if (selectedIds.length === 0) {
      toast.error("Pilih setidaknya satu siswa");
      return;
    }
    if (!reason) {
      toast.error("Berikan alasan pemberian XP");
      return;
    }

    setIsLoading(true);
    const result = await batchAssignXP(selectedIds, xpAmount, reason);

    if (result.success) {
      toast.success(`${xpAmount} XP berhasil diberikan ke ${selectedIds.length} siswa!`);
      setIsOpen(false);
      setSelectedIds([]);
      setReason("");
    } else {
      toast.error(result.error || "Gagal memberikan XP");
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20">
          <Star className="w-4 h-4 fill-current" />
          Beri XP
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 tracking-tight">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Reward XP Siswa
          </DialogTitle>
          <DialogDescription>
            Pilih siswa dan berikan poin pengalaman atas prestasi mereka.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold uppercase text-muted-foreground">Pilih Siswa ({selectedIds.length})</Label>
              <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs font-bold text-primary">
                {selectedIds.length === students.length ? "Batal Semua" : "Pilih Semua"}
              </Button>
            </div>
            
            <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2">
              {isFetching ? (
                <div className="flex items-center justify-center py-10">
                  <Infinite className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm italic">
                  Belum ada siswa di kelas ini.
                </div>
              ) : (
                students.map((student) => (
                  <div 
                    key={student.id} 
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer min-h-[56px] select-none ${
                      selectedIds.includes(student.id) 
                        ? "bg-primary/5 border-primary/20 shadow-sm" 
                        : "bg-muted/30 border-border/50 hover:bg-muted/50"
                    }`}
                    onClick={() => toggleStudent(student.id)}
                  >
                    <Checkbox 
                      id={`student-${student.id}`}
                      checked={selectedIds.includes(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                      className="rounded-md h-5 w-5"
                    />
                    <Avatar className="h-9 w-9 border-2 border-background">
                      <AvatarImage src={student.photo} />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                        {student.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <Label 
                        htmlFor={`student-${student.id}`}
                        className="text-sm font-semibold truncate cursor-pointer block w-full py-1"
                        onClick={(e) => e.preventDefault()}
                      >
                        {student.name}
                      </Label>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="xp" className="text-xs uppercase font-bold text-muted-foreground">Jumlah XP</Label>
              <Input
                id="xp"
                type="number"
                value={xpAmount}
                onChange={(e) => setXpAmount(parseInt(e.target.value) || 0)}
                className="rounded-lg font-bold"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setXpAmount(10)} className="rounded-lg h-10 flex-1 text-xs font-bold">10</Button>
              <Button variant="outline" size="sm" onClick={() => setXpAmount(50)} className="rounded-lg h-10 flex-1 text-xs font-bold">50</Button>
              <Button variant="outline" size="sm" onClick={() => setXpAmount(100)} className="rounded-lg h-10 flex-1 text-xs font-bold">100</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-xs uppercase font-bold text-muted-foreground">
              Alasan Reward <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Contoh: Menjawab pertanyaan dengan benar, Tugas tepat waktu…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-xl min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleAssign} 
            disabled={isLoading}
            className="w-full rounded-xl font-bold gap-2 py-6 shadow-md shadow-primary/10"
          >
            {isLoading ? <Infinite className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Berikan Reward
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
