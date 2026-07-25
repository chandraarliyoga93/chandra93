"use client";

import React, { useMemo, useEffect, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

interface MathRendererProps {
  text: string;
  className?: string;
}

export function MathRenderer({ text, className }: MathRendererProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const parts = useMemo(() => {
    if (!text || typeof text !== 'string') return [];

    const result: Array<{ type: 'text' | 'inline' | 'block'; content: string }> = [];
    
    // 1. Split by block math $$...$$
    const blockRegex = /(\$\$[\s\S]+?\$\$)/g;
    const blockParts = text.split(blockRegex);
    
    blockParts.forEach(part => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        result.push({ type: 'block', content: part.slice(2, -2) });
      } else if (part) {
        // 2. Split by inline math $...$
        const inlineRegex = /(\$[^\$]+?\$)/g;
        const inlineParts = part.split(inlineRegex);
        
        inlineParts.forEach(subPart => {
          if (subPart.startsWith('$') && subPart.endsWith('$')) {
            result.push({ type: 'inline', content: subPart.slice(1, -1) });
          } else if (subPart) {
            result.push({ type: 'text', content: subPart });
          }
        });
      }
    });
    
    return result;
  }, [text]);

  if (!text) return null;

  return (
    <div 
      className={cn("w-full break-words leading-relaxed animate-in fade-in duration-300", className)}
      data-math-rendered={isClient}
    >
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index} className="whitespace-pre-wrap">{part.content}</span>;
        }
        
        if (!isClient) {
          return (
            <span key={index} className="opacity-0">
              {part.type === 'block' ? `$$${part.content}$$` : `$${part.content}$`}
            </span>
          );
        }
        
        try {
          const html = katex.renderToString(part.content, {
            displayMode: part.type === 'block',
            throwOnError: false,
            trust: true,
            strict: false
          });
          
          return (
            <span 
              key={index} 
              dangerouslySetInnerHTML={{ __html: html }} 
              className={cn(
                "inline-block max-w-full overflow-x-auto align-middle",
                part.type === 'block' ? "block my-4 text-center py-4 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl border border-zinc-100 dark:border-zinc-800" : "mx-0.5 px-0.5"
              )}
            />
          );
        } catch (e) {
          console.error("KaTeX error:", e);
          return (
            <span key={index} className="text-destructive font-mono text-[10px] bg-destructive/10 px-1 rounded">
              {part.content}
            </span>
          );
        }
      })}
    </div>
  );
}
