"use client";

import { Node, mergeAttributes } from "@tiptap/core";

export function driveFileIdFromUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;

  // Matches:
  // - https://drive.google.com/file/d/<id>/view?...
  // - https://drive.google.com/open?id=<id>
  // - https://drive.google.com/uc?id=<id>&export=download
  const m1 = url.match(/drive\.google\.com\/file\/d\/([^/]+)\//i);
  if (m1?.[1]) return m1[1];

  const m2 = url.match(/[?&]id=([^&]+)/i);
  if (m2?.[1]) return m2[1];

  return null;
}

export function drivePreviewSrcFromUrl(raw: string): string | null {
  const id = driveFileIdFromUrl(raw);
  if (!id) return null;
  return `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`;
}

export const DriveEmbed = Node.create({
  name: "driveEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[src*="drive.google.com"]',
        getAttrs: (dom) => {
          if (!(dom instanceof HTMLIFrameElement)) return false;
          return { src: dom.getAttribute("src") };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src as string | null;
    return [
      "iframe",
      mergeAttributes(
        {
          src: src || undefined,
          allow: "autoplay; encrypted-media",
          allowFullScreen: "true",
          frameBorder: "0",
          class:
            "rounded-md overflow-hidden border shadow-sm my-4 w-full aspect-video",
        },
        HTMLAttributes,
      ),
    ];
  },
});

