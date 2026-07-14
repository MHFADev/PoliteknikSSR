// ============================================================
// IAuthProvider — Interface untuk Autentikasi
// ============================================================
// Memisahkan autentikasi dari CRUD user.
// Setiap backend (Supabase, Firebase, custom JWT, dll) harus
// implement interface ini.
// ============================================================

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  user_metadata?: Record<string, any>;
}

export interface IAuthProvider {
  /**
   * signIn — Login dengan email & password
   * @returns AuthUser jika berhasil, atau error message
   */
  signIn(email: string, password: string): Promise<{ user: AuthUser | null; error?: string }>;

  /**
   * signUp — Buat akun baru
   * @returns userId jika berhasil, atau error message
   */
  signUp(input: {
    email: string;
    password: string;
    metadata?: Record<string, any>;
  }): Promise<{ userId?: string; error?: string }>;

  /**
   * signOut — Logout user saat ini
   */
  signOut(): Promise<void>;

  /**
   * getCurrentUser — Ambil user yang sedang login dari session/cookie
   */
  getCurrentUser(): Promise<AuthUser | null>;

  /**
   * getUserById — Ambil user berdasarkan ID (admin operation)
   */
  getUserById(userId: string): Promise<AuthUser | null>;

  /**
   * updateUser — Update user metadata (admin operation)
   */
  updateUser(userId: string, data: { metadata?: Record<string, any>; password?: string }): Promise<{ error?: string }>;

  /**
   * deleteUser — Hapus user (admin operation)
   */
  deleteUser(userId: string): Promise<{ error?: string }>;

  /**
   * listUsers — List semua user (admin operation)
   */
  listUsers(): Promise<{ id: string; email: string; metadata?: Record<string, any>; createdAt: string }[]>;

  /**
   * getUserMetadata — Ambil metadata user
   */
  getUserMetadata(userId: string): Promise<Record<string, any> | null>;
}
