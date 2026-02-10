import { useState, useRef, useEffect } from 'react';

export default function ProfilePage({ user, profileImage, setProfileImage, darkMode }) {
  // STATE FORM DATA (Ambil dari LocalStorage jika ada, atau default)
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('profileData');
    return savedData ? JSON.parse(savedData) : {
      fullName: user || "",
      email: "",
      campus: "",
      role: "",
      bio: ""
    };
  });

  const fileInputRef = useRef(null);
  const [isSaved, setIsSaved] = useState(false); // Indikator simpan berhasil

  // FUNGSI MENANGANI KETIKAN USER
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setIsSaved(false); // Reset status simpan jika ada perubahan
  };

  // FUNGSI SIMPAN PERUBAHAN
  const handleSave = () => {
    localStorage.setItem('profileData', JSON.stringify(formData));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000); // Hilangkan pesan sukses setelah 3 detik
  };

  // FUNGSI GANTI FOTO
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfileImage(base64String);
        localStorage.setItem('profileImage', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Profile Settings</h2>

      <div className={`rounded-xl shadow-lg border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        
        {/* HEADER / COVER BACKGROUND */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>

        <div className="px-8 pb-8">
          
          {/* FOTO PROFIL */}
          <div className="relative -mt-16 mb-6 flex flex-col sm:flex-row justify-between items-end gap-4">
            <div className="relative group">
              <div className={`w-32 h-32 rounded-full border-4 overflow-hidden flex items-center justify-center ${darkMode ? 'border-slate-800 bg-slate-700' : 'border-white bg-slate-100'}`}>
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-slate-400">{user ? user.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
              
              {/* Tombol Kamera Overlay */}
              <button 
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-lg border-2 border-white dark:border-slate-800"
                title="Ganti Foto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            
            {/* Tombol Simpan */}
            <div className="flex flex-col items-end">
                <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition shadow-md active:scale-95"
                >
                    Simpan Perubahan
                </button>
                {isSaved && <span className="text-emerald-500 text-sm mt-2 font-medium animate-pulse">✓ Data Berhasil Disimpan!</span>}
            </div>
          </div>

          {/* FORM DATA DIRI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Nama Lengkap */}
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Nama Lengkap</label>
              <input 
                type="text" 
                name="fullName"
                value={formData.fullName} 
                onChange={handleChange} // Fungsi pencatat ketikan
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                placeholder="Masukkan nama lengkap"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Email Institusi</label>
              <input 
                type="email" 
                name="email"
                value={formData.email} 
                onChange={handleChange}
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                placeholder="email@kampus.ac.id"
              />
            </div>

            {/* Kampus */}
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Kampus / Instansi</label>
              <input 
                type="text" 
                name="campus"
                value={formData.campus} 
                onChange={handleChange}
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                placeholder="Nama Kampus"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Role / Jurusan</label>
              <input 
                type="text" 
                name="role"
                value={formData.role} 
                onChange={handleChange}
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                placeholder="Jurusan / Pekerjaan"
              />
            </div>

            {/* Bio */}
            <div className="md:col-span-2 space-y-2">
              <label className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Bio Singkat</label>
              <textarea 
                rows="3"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                placeholder="Ceritakan sedikit tentang dirimu..."
              ></textarea>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}