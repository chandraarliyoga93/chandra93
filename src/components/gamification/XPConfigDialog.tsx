"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Trash, FloppyDisk } from "iconoir-react";
import { toast } from "sonner";
import { getLevelConfigSupabase as getLevelConfig, updateLevelConfigSupabase as updateLevelConfig, LevelConfig } from "@/actions/gamification-supabase";

export function XPConfigDialog() {
  const [levels, setLevels] = useState<LevelConfig[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    const config = await getLevelConfig();
    setLevels(config);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen, loadConfig]);

  const handleUpdateLevel = (index: number, field: keyof LevelConfig, value: string | number) => {
    const newLevels = [...levels];
    newLevels[index] = { 
      ...newLevels[index], 
      [field]: field === "minXp" || field === "rank" ? (parseInt(value.toString()) || 0) : value 
    };
    setLevels(newLevels);
  };

  const addLevel = () => {
    const lastLevel = levels.length > 0 ? levels[levels.length - 1] : { rank: 0, minXp: 0, name: "" };
    setLevels([...levels, { 
      rank: levels.length + 1, 
      name: `Level ${levels.length + 1}`, 
      minXp: lastLevel.minXp + 500 
    }]);
  };

  const removeLevel = (index: number) => {
    if (levels.length <= 1) return;
    const newLevels = levels
      .filter((_, i) => i !== index)
      .map((l, i) => ({ ...l, rank: i + 1 })); // Re-rank
    setLevels(newLevels);
  };

  const handleSave = async () => {
    // Validate: minXp must be strictly increasing
    for (let i = 1; i < levels.length; i++) {
      if (levels[i].minXp <= levels[i - 1].minXp) {
        toast.error(`XP Level ${i + 1} harus lebih besar dari Level ${i}`);
        return;
      }
    }

    setIsLoading(true);
    const result = await updateLevelConfig(levels);
    if (result.success) {
      toast.success("Konfigurasi level berhasil disimpan!");
      setIsOpen(false);
    } else {
      toast.error(result.error || "Gagal menyimpan konfigurasi");
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-lg gap-2">
          <Settings className="w-4 h-4" />
          Konfigurasi Level
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">Konfigurasi XP & Level</DialogTitle>
          <DialogDescription>
            Atur nama dan ambang batas XP untuk setiap level.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto pr-2">
          {levels.map((level, index) => (
            <div key={index} className="flex flex-col gap-3 p-4 rounded-xl border bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {level.rank}
                </div>
                <div className="flex-grow">
                  <Input
                    value={level.name}
                    onChange={(e) => handleUpdateLevel(index, "name", e.target.value)}
                    placeholder="Nama Level"
                    className="h-9 font-medium rounded-lg"
                  />
                </div>
                {index > 0 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeLevel(index)}
                    className="text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10"></div>
                <div className="flex-grow space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                    XP Minimum
                  </Label>
                  <Input
                    type="number"
                    value={level.minXp}
                    onChange={(e) => handleUpdateLevel(index, "minXp", e.target.value)}
                    className="h-9 rounded-lg"
                    disabled={index === 0}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <Button variant="outline" onClick={addLevel} className="rounded-xl border-dashed py-8 gap-2 hover:bg-primary/5">
            <Plus className="w-4 h-4" />
            Tambah Level Baru
          </Button>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="w-full font-bold gap-2 rounded-lg"
          >
            <FloppyDisk className="w-4 h-4" />
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
