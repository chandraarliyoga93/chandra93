"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ModalType = "alert";

interface ModalData {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  variant?: "destructive" | "default";
}

interface ModalContextType {
  type: ModalType | null;
  data: ModalData;
  isOpen: boolean;
  onOpen: (type: ModalType, data?: ModalData) => void;
  onClose: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [type, setType] = useState<ModalType | null>(null);
  const [data, setData] = useState<ModalData>({});
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = useCallback((type: ModalType, data: ModalData = {}) => {
    setType(type);
    setData(data);
    setIsOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setIsOpen(false);
    setType(null);
    setData({});
  }, []);

  return (
    <ModalContext.Provider value={{ type, data, isOpen, onOpen, onClose }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
