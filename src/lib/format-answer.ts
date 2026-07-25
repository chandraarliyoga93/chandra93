/**
 * Format kunci jawaban soal menjadi teks yang terbaca manusia untuk tampilan di tabel.
 * Mengonversi ID (opt-1, pair-1, dll) ke teks aktual.
 */
import type { Question } from "@/actions/questions-supabase";

export function formatAnswerForDisplay(q: Question): string {
  const ans = q.answer;
  if (ans === undefined || ans === null) return "—";

  const type = q.type?.toLowerCase();
  switch (type) {
    case "bs":
      return ans === true ? "Benar" : "Salah";

    case "pg": {
      const opt = q.options?.find((o) => o.id === ans);
      const idx = q.options?.findIndex((o) => o.id === ans);
      const label = idx !== undefined && idx >= 0 ? String.fromCharCode(65 + idx) : "";
      return opt?.text ? `${label}. ${opt.text}` : String(ans);
    }

    case "pg_kompleks": {
      const ids = Array.isArray(ans) ? ans : (typeof ans === "string" ? ans.split(",").map((s) => s.trim()) : [ans]);
      const parts = (ids as (string | number)[])
        .map((idOrIdx) => {
          const id = String(idOrIdx ?? "");
          const opt = q.options?.find((o) => o?.id === id || o?.id === idOrIdx);
          let idx: number = q.options?.findIndex((o) => o?.id === id || o?.id === idOrIdx) ?? -1;
          // Fallback: id might be 0-based index (legacy)
          if (idx < 0 && !isNaN(Number(id)) && q.options) {
            const numIdx = parseInt(id, 10);
            if (numIdx >= 0 && numIdx < q.options.length) idx = numIdx;
          }
          const optResolved = opt ?? (idx >= 0 && q.options && q.options[idx] ? q.options[idx] : null);
          const label = idx >= 0 ? String.fromCharCode(65 + idx) : "";
          const text = optResolved?.text?.trim();
          return text ? `${label}. ${text}` : (label ? `${label}.` : id || "—");
        })
        .filter(Boolean);
      return parts.length > 0 ? parts.join(", ") : String(ans);
    }

    case "menjodohkan": {
      const map = (ans as Record<string, string>) || {};
      const parts = q.pairs?.map((p, i) => {
        const right = map[p.id] || "—";
        return `${i + 1}. ${right}`;
      }) || [];
      return parts.length > 0 ? parts.join("; ") : "—";
    }

    case "mengurutkan": {
      const order = Array.isArray(ans) ? ans : [];
      const parts = (order as string[]).map((id, i) => {
        const opt = q.options?.find((o) => o.id === id);
        return `${i + 1}. ${opt?.text || id}`;
      });
      return parts.length > 0 ? parts.join(" → ") : String(ans);
    }

    case "matrix": {
      const rowMap = (ans as Record<string, string>) || {};
      const parts = q.rows?.map((row, i) => {
        const colId = rowMap[row.id];
        const col = q.columns?.find((c) => c.id === colId);
        return `${i + 1}→${col?.text || colId || "—"}`;
      }) || [];
      return parts.length > 0 ? parts.join("; ") : "—";
    }

    case "short_answer": {
      const cfg = (q as any).shortAnswerConfig;
      const accepted = cfg?.acceptableAnswers ?? [];
      if (accepted.length > 0) {
        return accepted.length <= 2
          ? accepted.join(", ")
          : `${accepted[0]}, +${accepted.length - 1}`;
      }
      return typeof ans === "string" ? ans : String(ans);
    }

    case "essay": {
      const cfg = (q as any).essayConfig;
      const kw = cfg?.keywords ?? [];
      if (kw.length > 0) {
        const texts = kw.map((k: { text: string }) => k.text);
        return texts.length <= 2 ? texts.join(", ") : `${texts[0]}, +${texts.length - 1}`;
      }
      return typeof ans === "string" && ans.trim() ? ans : "—";
    }

    default:
      return String(ans);
  }
}
