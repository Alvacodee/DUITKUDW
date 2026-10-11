// Aturan password — harus sama dengan auth.ValidatePassword di backend (src/backend/auth/policy.go).
export const PASSWORD_RULES = [
  { label: 'Minimal 8 karakter',      test: (p) => [...p].length >= 8 },
  { label: 'Huruf besar (A-Z)',       test: (p) => /\p{Lu}/u.test(p) },
  { label: 'Huruf kecil (a-z)',       test: (p) => /\p{Ll}/u.test(p) },
  { label: 'Angka (0-9)',             test: (p) => /\p{Nd}/u.test(p) },
  { label: 'Simbol (!@#$%...)',       test: (p) => /[^\p{L}\p{Nd}\s]/u.test(p) },
];

// Kembalikan label aturan pertama yang gagal, atau null bila password valid.
export function validatePassword(password) {
  const failed = PASSWORD_RULES.find((r) => !r.test(password));
  return failed ? failed.label : null;
}
