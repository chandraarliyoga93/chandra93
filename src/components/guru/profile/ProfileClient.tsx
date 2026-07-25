"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { EditPencil, Check, Xmark, User, Mail, Group, Book, Key, InfoCircle } from "iconoir-react";

import { teacherProfileSchema, type TeacherProfileFormValues } from "@/lib/schemas/user";
import { updateTeacherProfile } from "@/actions/users-supabase";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileStats } from "./ProfileStats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface ProfileClientProps {
  initialData: {
    uid: string;
    name: string;
    email: string;
    photo?: string;
    bio?: string;
    school?: string;
    subject?: string;
    nip?: string;
  };
  stats?: {
    totalClasses: number;
    totalStudents: number;
    avgAttendance: string;
  };
}

export function ProfileClient({ initialData, stats }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TeacherProfileFormValues>({
    resolver: zodResolver(teacherProfileSchema),
    defaultValues: {
      name: initialData.name,
      email: initialData.email,
      bio: initialData.bio || "",
      school: initialData.school || "",
      subject: initialData.subject || "",
      nip: initialData.nip || "",
    },
  });

  async function onSubmit(values: TeacherProfileFormValues) {
    setIsSubmitting(true);
    try {
      const result = await updateTeacherProfile(values);
      if (result.success) {
        toast.success("Profil berhasil diperbarui");
        setIsEditing(false);
      } else {
        toast.error((result as any).error || "Gagal memperbarui profil");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Profil Saya</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Kelola informasi pribadi dan data profesional Anda.</p>
        </div>
        {!isEditing && (
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(true)}
            className="rounded-full px-6 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
          >
            <EditPencil className="mr-2 h-4 w-4" />
            Edit Profil
          </Button>
        )}
      </div>

      <ProfileHeader 
        name={initialData.name} 
        photo={initialData.photo} 
        isEditing={isEditing} 
        onPhotoClick={() => toast.info("Fitur ganti foto akan segera hadir")}
      />

      <ProfileStats stats={stats} />

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {/* Personal Info Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
                  <User className="h-5 w-5 text-zinc-400" />
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Informasi Pribadi</h3>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-normal">Nama Lengkap</FormLabel>
                      <FormControl>
                        {isEditing ? (
                          <Input {...field} className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800" />
                        ) : (
                          <p className="text-zinc-900 dark:text-zinc-100 font-medium py-2">{field.value}</p>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-normal flex items-center gap-1">
                        Alamat Email
                        {!isEditing && <Mail className="h-3 w-3 inline opacity-50" />}
                      </FormLabel>
                      <FormControl>
                        {isEditing ? (
                          <Input {...field} type="email" className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800" />
                        ) : (
                          <p className="text-zinc-900 dark:text-zinc-100 font-medium py-2">{field.value}</p>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-normal flex items-center gap-1">
                        Bio Singkat
                        {!isEditing && <InfoCircle className="h-3 w-3 inline opacity-50" />}
                      </FormLabel>
                      <FormControl>
                        {isEditing ? (
                          <Textarea 
                            {...field} 
                            placeholder="Tuliskan bio singkat Anda..."
                            className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 min-h-[120px] resize-none" 
                          />
                        ) : (
                          <p className="text-zinc-900 dark:text-zinc-100 font-medium py-2 leading-relaxed">
                            {field.value || <span className="text-zinc-400 italic font-normal text-sm">Belum ada bio</span>}
                          </p>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Professional Info Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
                  <Book className="h-5 w-5 text-zinc-400" />
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Informasi Profesional</h3>
                </div>

                <FormField
                  control={form.control}
                  name="school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-normal flex items-center gap-1">
                        Sekolah / Institusi
                        {!isEditing && <Group className="h-3 w-3 inline opacity-50" />}
                      </FormLabel>
                      <FormControl>
                        {isEditing ? (
                          <Input {...field} className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800" />
                        ) : (
                          <p className="text-zinc-900 dark:text-zinc-100 font-medium py-2">
                            {field.value || <span className="text-zinc-400 italic font-normal text-sm">Belum diisi</span>}
                          </p>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-normal">Mata Pelajaran</FormLabel>
                      <FormControl>
                        {isEditing ? (
                          <Input {...field} className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800" />
                        ) : (
                          <p className="text-zinc-900 dark:text-zinc-100 font-medium py-2">
                            {field.value || <span className="text-zinc-400 italic font-normal text-sm">Belum diisi</span>}
                          </p>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-normal flex items-center gap-1">
                        NIP / Identitas Pegawai
                        {!isEditing && <Key className="h-3 w-3 inline opacity-50" />}
                      </FormLabel>
                      <FormControl>
                        {isEditing ? (
                          <Input {...field} className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800" />
                        ) : (
                          <p className="text-zinc-900 dark:text-zinc-100 font-medium py-2 tracking-widest">
                            {field.value || <span className="text-zinc-400 italic font-normal text-sm">Belum diisi</span>}
                          </p>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <AnimatePresence>
              {isEditing && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex justify-end gap-3 mt-12 pt-6 border-t border-zinc-100 dark:border-zinc-900"
                >
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    <Xmark className="mr-2 h-4 w-4" />
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-full px-8 shadow-md hover:shadow-lg transition-all"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white dark:text-zinc-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menyimpan...
                      </span>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Simpan Perubahan
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </Form>
      </div>
    </div>
  );
}
