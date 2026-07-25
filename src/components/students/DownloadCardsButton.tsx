"use client";

import { Button } from "@/components/ui/button";
import { Download } from "iconoir-react";
import { generateLoginCardPDF } from "@/lib/pdf-generator";
import { toast } from "sonner";
import { useState } from "react";

interface Student {
  name: string;
  studentId: string;
  password?: string;
}

interface DownloadCardsButtonProps {
  students: Student[];
  variant?: "outline" | "default" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon" | "xs";
  label?: string;
  className?: string;
  showIcon?: boolean;
}

export function DownloadCardsButton({ 
  students, 
  variant = "outline", 
  size = "sm",
  label = "Download Kartu",
  className,
  showIcon = true
}: DownloadCardsButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (students.length === 0) {
      toast.error("Tidak ada siswa yang dipilih");
      return;
    }

    setIsGenerating(true);
    const promise = generateLoginCardPDF(students.map(s => ({
      name: s.name,
      username: s.studentId,
      password: s.password
    })));

    toast.promise(promise, {
      loading: `Sedang menyiapkan ${students.length} kartu login...`,
      success: "Kartu login berhasil diunduh",
      error: "Gagal mengunduh kartu login",
      finally: () => setIsGenerating(false)
    });
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleDownload}
      disabled={isGenerating || students.length === 0}
      className={className}
    >
      {showIcon && <Download className="w-4 h-4 mr-2" />}
      {label}
    </Button>
  );
}
