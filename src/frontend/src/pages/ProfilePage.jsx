import { useState, useRef } from 'react';
import { Camera, Save, User, Mail, Building2, BookOpen, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { profileImageKey, profileDataKey } from '../lib/storage';

const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB, localStorage browser hanya ~5MB

export default function ProfilePage({ user, profileImage, setProfileImage }) {
  const fileRef = useRef(null);
  // Data profil disimpan per-user agar tidak terlihat oleh akun lain di browser yang sama
  const [form, setForm] = useState(() => {
    const defaults = { fullName: user || '', email: '', campus: '', role: '', bio: '' };
    try {
      const saved = JSON.parse(localStorage.getItem(profileDataKey(user)));
      return saved ? { ...defaults, ...saved } : defaults;
    } catch {
      return defaults;
    }
  });

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSave = () => {
    localStorage.setItem(profileDataKey(user), JSON.stringify(form));
    toast.success('Profil berhasil disimpan!');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // agar file yang sama bisa dipilih ulang
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Ukuran file maksimal 1MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result;
      try {
        localStorage.setItem(profileImageKey(user), b64);
      } catch {
        toast.error('Penyimpanan browser penuh. Gunakan foto yang lebih kecil.');
        return;
      }
      setProfileImage(b64);
      toast.success('Foto profil diperbarui!');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profil Pengguna</h2>
        <p className="text-sm text-muted-foreground">Kelola informasi pribadimu</p>
      </div>

      {/* Avatar card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-border">
                <AvatarImage src={profileImage} alt={user} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {user ? user.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-card transition hover:bg-primary/90"
                title="Ganti Foto"
              >
                <Camera size={13} />
              </button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <p className="text-lg font-bold">{form.fullName || user || 'Username'}</p>
              <p className="text-sm text-muted-foreground">
                {form.role || 'Role belum diisi'} • {form.campus || 'Kampus belum diisi'}
              </p>
              {form.bio && (
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">{form.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Pribadi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Nama */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <User size={13} className="text-muted-foreground" /> Nama Lengkap
              </Label>
              <Input
                type="text"
                placeholder="Masukkan nama lengkap"
                value={form.fullName}
                onChange={set('fullName')}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Mail size={13} className="text-muted-foreground" /> Email Institusi
              </Label>
              <Input
                type="email"
                placeholder="nama@mahasiswa.itb.ac.id"
                value={form.email}
                onChange={set('email')}
              />
            </div>

            {/* Kampus */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Building2 size={13} className="text-muted-foreground" /> Kampus / Instansi
              </Label>
              <Input
                type="text"
                placeholder="Institut Teknologi Bandung"
                value={form.campus}
                onChange={set('campus')}
              />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <BookOpen size={13} className="text-muted-foreground" /> Role / Jurusan
              </Label>
              <Input
                type="text"
                placeholder="Teknik Informatika"
                value={form.role}
                onChange={set('role')}
              />
            </div>
          </div>

          <Separator />

          {/* Bio */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <FileText size={13} className="text-muted-foreground" /> Bio Singkat
            </Label>
            <textarea
              rows={3}
              placeholder="Ceritakan sedikit tentang dirimu..."
              value={form.bio}
              onChange={set('bio')}
              className="flex min-h-[80px] w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button onClick={handleSave}>
              <Save size={15} /> Simpan Perubahan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Username</p>
              <p className="text-sm text-muted-foreground">@{user}</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              Aktif
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
