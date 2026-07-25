"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "iconoir-react";

interface ProfileHeaderProps {
  photo?: string;
  name: string;
  isEditing: boolean;
  onPhotoClick?: () => void;
}

export function ProfileHeader({ photo, name, isEditing, onPhotoClick }: ProfileHeaderProps) {
  return (
    <div className="relative mb-20">
      {/* Banner */}
      <div className="h-48 w-full rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
      
      {/* Avatar Positioned Overlapping Banner */}
      <div className="absolute -bottom-16 left-8 flex items-end gap-6">
        <div className="relative group">
          <Avatar className="h-32 w-32 border-4 border-white dark:border-zinc-950 shadow-sm">
            <AvatarImage src={photo} alt={name} className="object-cover" />
            <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-2xl font-medium">
              {name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {isEditing && (
            <button
              onClick={onPhotoClick}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="h-8 w-8 text-white" />
            </button>
          )}
        </div>
        
        <div className="pb-2">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{name}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Guru Dashboard</p>
        </div>
      </div>
    </div>
  );
}
