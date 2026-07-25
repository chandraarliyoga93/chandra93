"use client";

import React, { useCallback, useMemo, useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Calculator,
  NavArrowRight,
  Xmark
} from "iconoir-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { MathRenderer } from "@/components/ui/math-renderer";

interface LatexPickerProps {
  onPick: (latex: string) => void;
}

type LatexItem = {
  label: string;
  value: string;
  display: string;
  placeholders?: string[];
};

type LatexGroup = {
  name: string;
  items: LatexItem[];
};

const LATEX_GROUPS: LatexGroup[] = [
  {
    name: "Keypad",
    items: [
      { label: "7", value: "7", display: "7" },
      { label: "8", value: "8", display: "8" },
      { label: "9", value: "9", display: "9" },
      { label: "Divide", value: "\\div", display: "÷" },
      { label: "4", value: "4", display: "4" },
      { label: "5", value: "5", display: "5" },
      { label: "6", value: "6", display: "6" },
      { label: "Multiply", value: "\\times", display: "×" },
      { label: "1", value: "1", display: "1" },
      { label: "2", value: "2", display: "2" },
      { label: "3", value: "3", display: "3" },
      { label: "Minus", value: "-", display: "-" },
      { label: "0", value: "0", display: "0" },
      { label: ".", value: ".", display: "." },
      { label: "Equal", value: "=", display: "=" },
      { label: "Plus", value: "+", display: "+" },
      { label: "(", value: "(", display: "(" },
      { label: ")", value: ")", display: ")" },
      { label: "x", value: "x", display: "x" },
      { label: "y", value: "y", display: "y" },
    ]
  },
  {
    name: "Dasar",
    items: [
      { label: "Pecahan", value: "\\frac{a}{b}", display: "frac", placeholders: ["a", "b"] },
      { label: "Akar", value: "\\sqrt{x}", display: "√", placeholders: ["x"] },
      { label: "Pangkat", value: "x^{y}", display: "x^y", placeholders: ["x", "y"] },
      { label: "Pangkat 2", value: "x^{2}", display: "x²", placeholders: ["x"] },
      { label: "Pangkat 3", value: "x^{3}", display: "x³", placeholders: ["x"] },
      { label: "Subskrip", value: "x_{i}", display: "x_i", placeholders: ["x", "i"] },
      { label: "Akar n", value: "\\sqrt[n]{x}", display: "n√", placeholders: ["n", "x"] },
      { label: "Nilai Mutlak", value: "\\left|x\\right|", display: "|x|", placeholders: ["x"] },
      { label: "Kali", value: "\\times", display: "×" },
      { label: "Bagi", value: "\\div", display: "÷" },
      { label: "Tidak Sama", value: "\\neq", display: "≠" },
      { label: "Kurang Sama", value: "\\leq", display: "≤" },
      { label: "Lebih Sama", value: "\\geq", display: "≥" },
      { label: "Plus Minus", value: "\\pm", display: "±" },
    ]
  },
  {
    name: "Aljabar",
    items: [
      { label: "Kuadrat Sempurna", value: "(a+b)^2", display: "(a+b)^2", placeholders: ["a", "b"] },
      { label: "Kuadrat Selisih", value: "(a-b)^2", display: "(a-b)^2", placeholders: ["a", "b"] },
      { label: "Perkalian Istimewa", value: "(a+b)(a-b)", display: "(a+b)(a-b)", placeholders: ["a", "b"] },
      { label: "Rumus Kuadrat", value: "x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}", display: "ABC", placeholders: ["a", "b", "c"] },
      { label: "Persamaan", value: "ax^2+bx+c=0", display: "ax²+bx+c", placeholders: ["a", "b", "c"] },
      { label: "Akar Persamaan", value: "x_1, x_2", display: "x₁,x₂", placeholders: ["x_1", "x_2"] },
    ]
  },
  {
    name: "Kalkulus",
    items: [
      { label: "Limit", value: "\\lim_{x \\to a}", display: "lim", placeholders: ["x", "a"] },
      { label: "Turunan", value: "\\frac{d}{dx}", display: "d/dx", placeholders: ["x"] },
      { label: "Turunan Parsial", value: "\\frac{\\partial f}{\\partial x}", display: "∂", placeholders: ["f", "x"] },
      { label: "Integral", value: "\\int f(x)\\,dx", display: "∫", placeholders: ["f", "x"] },
      { label: "Integral Batas", value: "\\int_{a}^{b} f(x)\\,dx", display: "∫ab", placeholders: ["a", "b", "f", "x"] },
      { label: "Sigma Jumlah", value: "\\sum_{i=1}^{n}", display: "Σ", placeholders: ["i", "n"] },
      { label: "Produk", value: "\\prod_{i=1}^{n}", display: "∏", placeholders: ["i", "n"] },
      { label: "Tak Hingga", value: "\\infty", display: "∞" },
    ]
  },
  {
    name: "Trigonometri",
    items: [
      { label: "Sin", value: "\\sin\\theta", display: "sin", placeholders: ["\\theta"] },
      { label: "Cos", value: "\\cos\\theta", display: "cos", placeholders: ["\\theta"] },
      { label: "Tan", value: "\\tan\\theta", display: "tan", placeholders: ["\\theta"] },
      { label: "Cot", value: "\\cot\\theta", display: "cot", placeholders: ["\\theta"] },
      { label: "Sec", value: "\\sec\\theta", display: "sec", placeholders: ["\\theta"] },
      { label: "Csc", value: "\\csc\\theta", display: "csc", placeholders: ["\\theta"] },
      { label: "Identitas", value: "\\sin^2\\theta+\\cos^2\\theta=1", display: "sin²+cos²", placeholders: ["\\theta"] },
      { label: "Derajat", value: "^{\\circ}", display: "°" },
      { label: "Radian", value: "\\text{ rad}", display: "rad" },
    ]
  },
  {
    name: "Simbol",
    items: [
      { label: "Pi", value: "\\pi", display: "π", placeholders: ["\\pi"] },
      { label: "Alpha", value: "\\alpha", display: "α", placeholders: ["\\alpha"] },
      { label: "Beta", value: "\\beta", display: "β", placeholders: ["\\beta"] },
      { label: "Gamma", value: "\\gamma", display: "γ", placeholders: ["\\gamma"] },
      { label: "Delta", value: "\\Delta", display: "Δ", placeholders: ["\\Delta"] },
      { label: "Theta", value: "\\theta", display: "θ", placeholders: ["\\theta"] },
      { label: "Lambda", value: "\\lambda", display: "λ", placeholders: ["\\lambda"] },
      { label: "Mu", value: "\\mu", display: "μ", placeholders: ["\\mu"] },
      { label: "Aproksimasi", value: "\\approx", display: "≈" },
      { label: "Sebanding", value: "\\propto", display: "∝" },
      { label: "Ohm", value: "\\Omega", display: "Ω" },
    ]
  },
  {
    name: "Himpunan",
    items: [
      { label: "Anggota", value: "x \\in A", display: "∈", placeholders: ["x", "A"] },
      { label: "Bukan Anggota", value: "x \\notin A", display: "∉", placeholders: ["x", "A"] },
      { label: "Subset", value: "A \\subset B", display: "⊂", placeholders: ["A", "B"] },
      { label: "Superset", value: "A \\supset B", display: "⊃", placeholders: ["A", "B"] },
      { label: "Irisan", value: "A \\cap B", display: "∩", placeholders: ["A", "B"] },
      { label: "Gabungan", value: "A \\cup B", display: "∪", placeholders: ["A", "B"] },
      { label: "Himpunan Kosong", value: "\\varnothing", display: "∅", placeholders: ["\\varnothing"] },
      { label: "Bilangan Real", value: "\\mathbb{R}", display: "R", placeholders: ["\\mathbb{R}"] },
      { label: "Bilangan Bulat", value: "\\mathbb{Z}", display: "Z", placeholders: ["\\mathbb{Z}"] },
      { label: "Bilangan Asli", value: "\\mathbb{N}", display: "N", placeholders: ["\\mathbb{N}"] },
    ]
  },
  {
    name: "Format",
    items: [
      { label: "Tebal", value: "\\mathbf{teks}", display: "Bold" },
      { label: "Miring", value: "\\mathit{teks}", display: "Italic" },
      { label: "Spasi", value: "\\, ", display: "Space" },
      { label: "Baris Baru", value: "\\\\ ", display: "Enter" },
    ]
  }
];

export function LatexPicker({ onPick }: LatexPickerProps) {
  const [open, setOpen] = useState(false);
  const [draftLatex, setDraftLatex] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<LatexItem | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  const escapeForRegex = useCallback(
    (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    [],
  );

  const resolveTemplateLatex = useCallback(
    (item: LatexItem, vars: Record<string, string>) => {
      let resolved = item.value;
      const sortedTokens = [...(item.placeholders || [])].sort(
        (a, b) => b.length - a.length,
      );

      sortedTokens.forEach((token) => {
        const safeValue = (vars[token] ?? token).trim() || token;
        const pattern = new RegExp(escapeForRegex(token), "g");
        resolved = resolved.replace(pattern, safeValue);
      });
      return resolved;
    },
    [escapeForRegex],
  );

  const previewText = useMemo(() => {
    const source = selectedTemplate
      ? resolveTemplateLatex(selectedTemplate, templateVariables)
      : draftLatex;
    if (!source.trim()) return "";
    return `$${source}$`;
  }, [draftLatex, selectedTemplate, templateVariables, resolveTemplateLatex]);

  const activeLatex = useMemo(() => {
    if (selectedTemplate) {
      return resolveTemplateLatex(selectedTemplate, templateVariables);
    }
    return draftLatex;
  }, [draftLatex, selectedTemplate, templateVariables, resolveTemplateLatex]);

  const handleTemplatePick = (item: LatexItem) => {
    if (item.placeholders?.length) {
      const initialVars: Record<string, string> = {};
      item.placeholders.forEach((token) => {
        initialVars[token] = token;
      });
      setSelectedTemplate(item);
      setTemplateVariables(initialVars);
      return;
    }
    setSelectedTemplate(null);
    setTemplateVariables({});
    setDraftLatex((prev) => `${prev}${item.value}`);
  };

  const handleInsert = () => {
    if (!activeLatex.trim()) return;
    onPick(activeLatex);
    setDraftLatex("");
    setSelectedTemplate(null);
    setTemplateVariables({});
    setOpen(false);
  };

  const handleCancel = () => {
    setDraftLatex("");
    setSelectedTemplate(null);
    setTemplateVariables({});
  };

  const handleBackspace = () => {
    if (selectedTemplate) return;
    setDraftLatex((prev) => prev.slice(0, -1));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-primary">
          <Calculator className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[min(94vw,720px)] max-w-[720px] p-0 overflow-hidden max-h-[90dvh] flex flex-col">
        <DialogHeader className="p-4 border-b bg-zinc-50 dark:bg-zinc-950 text-left">
          <DialogTitle className="text-sm font-bold uppercase tracking-widest italic">
            Input Rumus
          </DialogTitle>
          <DialogDescription className="text-[10px] text-zinc-500">
            Pilih simbol, ubah variabel, cek preview, lalu klik Sisipkan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="Keypad" className="w-full flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2 h-10 overflow-x-auto overflow-y-hidden">
              {LATEX_GROUPS.map(group => (
                <TabsTrigger 
                  key={group.name} 
                  value={group.name}
                  className="text-[10px] font-bold uppercase data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none shrink-0"
                >
                  {group.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <ScrollArea className="h-[min(34dvh,260px)] p-4">
              {LATEX_GROUPS.map(group => (
                <TabsContent key={group.name} value={group.name} className="mt-0 outline-none">
                  <div className={cn(
                    "grid gap-2",
                    group.name === "Keypad" ? "grid-cols-4" : "grid-cols-2"
                  )}>
                    {group.items.map((item) => (
                      <Button
                        key={item.label}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "justify-start gap-2 h-9 text-xs font-medium border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all",
                          group.name === "Keypad" && "p-0 justify-center h-10"
                        )}
                        onClick={() => handleTemplatePick(item)}
                      >
                        <span className={cn(
                          "text-center font-serif text-base text-primary",
                          group.name === "Keypad" ? "w-auto" : "w-8"
                        )}>{item.display}</span>
                        {group.name !== "Keypad" && <span className="truncate opacity-60 text-[10px]">{item.label}</span>}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </ScrollArea>
          </Tabs>
          <div className="border-t bg-zinc-50/50 dark:bg-zinc-950/50 p-3 space-y-3">
          {selectedTemplate?.placeholders?.length ? (
            <div className="rounded-lg border bg-white dark:bg-zinc-900 p-3 space-y-2">
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wide">
                Ubah Variabel: {selectedTemplate.label}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {selectedTemplate.placeholders.map((token) => (
                  <div key={token} className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-semibold">
                      {token}
                    </label>
                    <Input
                      value={templateVariables[token] ?? token}
                      onChange={(e) =>
                        setTemplateVariables((prev) => ({
                          ...prev,
                          [token]: e.target.value,
                        }))
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border bg-white dark:bg-zinc-900 p-3 min-h-[80px]">
            {previewText ? (
              <MathRenderer text={previewText} className="text-sm" />
            ) : (
              <p className="text-[10px] text-zinc-400 italic">Preview rumus akan muncul di sini.</p>
            )}
          </div>

          <div className="rounded-lg border bg-white dark:bg-zinc-900 p-2">
            <p className="text-[10px] text-zinc-500 mb-1 font-semibold">LaTeX terpilih</p>
            <code className="text-[11px] break-all text-primary">
              {activeLatex || "(kosong)"}
            </code>
          </div>

          <div className="flex items-center justify-end gap-2 sticky bottom-0 bg-zinc-50/95 dark:bg-zinc-950/95 py-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBackspace}
              disabled={!draftLatex || !!selectedTemplate}
              className="gap-1.5"
              aria-label="Hapus karakter terakhir"
            >
              <Xmark className="w-3.5 h-3.5" />
              Backspace
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={!activeLatex.trim()}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={handleInsert}
              disabled={!activeLatex.trim()}
            >
              Sisipkan
              <NavArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <p className="text-[9px] text-center text-zinc-400">
            Rekomendasi: gunakan tanda <code className="text-primary">$...$</code> untuk rumus inline.
          </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
