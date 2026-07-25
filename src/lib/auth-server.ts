import { cookies } from "next/headers";

/**
 * Gets the authenticated user from cookies.
 * 
 * TODO: Implement Firebase ID Token verification using adminAuth.verifyIdToken()
 * for critical Guru actions to prevent cookie spoofing.
 */
export async function getAuthUser() {
  const cookieStore = await cookies();
  const uid = cookieStore.get("user-id")?.value;
  const role = cookieStore.get("user-role")?.value;

  if (!uid || !role) return null;
  
  return { 
    uid, 
    role: role as 'Guru' | 'Siswa' | 'ADMIN_GURU' | 'SISWA'
  };
}

/**
 * Higher-order function to wrap server actions and check for Guru role.
 */
export async function ensureGuru() {
  const user = await getAuthUser();
  if (!user || (user.role !== "Guru" && user.role !== "ADMIN_GURU")) {
    throw new Error("Unauthorized: Guru role required");
  }
  return user;
}

/**
 * Higher-order function to wrap server actions and check for Student role.
 */
export async function ensureSiswa() {
  const user = await getAuthUser();
  if (!user || (user.role !== "Siswa" && user.role !== "SISWA")) {
    throw new Error("Unauthorized: Student role required");
  }
  return user;
}
