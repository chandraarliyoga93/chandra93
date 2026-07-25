"use client";

import { useEffect, useState } from "react";
import { AlertModal } from "@/components/modal/AlertModal";
import { ModalProvider as ContextProvider } from "@/hooks/use-modal";

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <ContextProvider>{children}</ContextProvider>;
  }

  return (
    <ContextProvider>
      <AlertModal />
      {children}
    </ContextProvider>
  );
};
