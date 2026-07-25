"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { supabase } from "@/lib/supabase";
import { syncUserSupabase as syncUserWithFirestore } from "@/actions/auth-supabase";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Infinite, Key, User } from "iconoir-react";
import { useEffect, useRef } from "react";

const loginSchema = z.object({
  id: z.string().min(3, "ID tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export default function ManualLoginForm({ role = 'Siswa' }: { role?: 'Guru' | 'Siswa' }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoLoginAttempted = useRef(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      id: "",
      password: "",
    },
  });

  // Handle QR Code Login / Auto-fill from URL
  useEffect(() => {
    const u = searchParams.get("u");
    const p = searchParams.get("p");

    if (u && p && !autoLoginAttempted.current) {
      form.setValue("id", u);
      form.setValue("password", p);
      
      // Auto-submit for Siswa role if both params are present
      if (role === 'Siswa') {
        autoLoginAttempted.current = true;
        form.handleSubmit(onSubmit)();
      }
    }
  }, [searchParams, form, role]);

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsPending(true);
    
    // Automatically append domain for Students, use as-is for Guru
    let email = values.id;
    if (role === 'Siswa') {
      email = values.id.includes("@") ? values.id : `${values.id.toLowerCase().trim()}@siswa.kg`;
    } else if (role === 'Guru') {
      // If user only entered username but ADMIN_GURU_EMAIL has a domain, try to be helpful
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_GURU_EMAIL;
      if (!values.id.includes("@") && adminEmail?.includes("@")) {
        const domain = adminEmail.split("@")[1];
        email = `${values.id.toLowerCase()}@${domain}`;
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: values.password,
      });

      if (error) throw error;
      const user = data.user;

      if (!user) throw new Error("Gagal mendapatkan data user");

      const syncResult = await syncUserWithFirestore({
        uid: user.id,
        email: user.email!,
        displayName: user.user_metadata?.full_name || values.id.split("@")[0],
        photoURL: user.user_metadata?.avatar_url || "",
      }, role);

      if (syncResult.success) {
        toast.success("Login berhasil!");
        router.push(role === 'Guru' ? "/dashboard/guru" : "/dashboard/siswa");
      } else {
        toast.error(syncResult.error || "Gagal sinkronisasi data");
      }
    } catch (error: any) {
      console.error("Manual login error detail:", error);
      const errorMessage = error.message || "Email atau Password salah";
      toast.error(role === 'Guru' ? `Gagal masuk: ${errorMessage}` : "ID atau Password salah");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold text-[10px] uppercase tracking-widest text-zinc-500">
                {role === 'Guru' ? 'Email Address' : 'ID Siswa / Username'}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input 
                    placeholder={role === 'Guru' ? "name@email.com" : "misal: budi123"} 
                    {...field} 
                    className="pl-10 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400 font-bold text-sm"
                  />
                </div>
              </FormControl>
              <FormMessage className="text-[10px] font-bold" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold text-[10px] uppercase tracking-widest text-zinc-500">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    {...field} 
                    className="pl-10 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400 font-bold text-sm"
                  />
                </div>
              </FormControl>
              <FormMessage className="text-[10px] font-bold" />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          disabled={isPending} 
          className="w-full h-11 rounded-xl font-bold bg-zinc-950 text-white dark:bg-zinc-50 dark:text-black hover:bg-zinc-900 dark:hover:bg-zinc-200 shadow-lg shadow-zinc-200/50 dark:shadow-none transition-all active:scale-95"
        >
          {isPending ? <Infinite className="animate-spin mr-2 h-4 w-4" /> : "Masuk Sekarang"}
        </Button>
      </form>
    </Form>
  );
}
