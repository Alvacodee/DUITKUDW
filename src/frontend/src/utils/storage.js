// Key localStorage foto profil dibuat per-user agar tidak "bocor" ke akun lain di browser yang sama
export const profileImageKey = (user) => `profileImage_${user || 'guest'}`;
export const profileDataKey = (user) => `profileData_${user || 'guest'}`;
