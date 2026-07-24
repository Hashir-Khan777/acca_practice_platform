'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useDashboard } from '../context';
import { Card, Button, Input, Select } from '@/components/UI';
import { Camera, Loader2 } from 'lucide-react';

export default function StudentProfilePage() {
  const { store, updateStore } = useDashboard();

  // Profile Form State
  const [profileName, setProfileName] = React.useState('');
  const [profilePic, setProfilePic] = React.useState('');
  const [profileEmail, setProfileEmail] = React.useState('');
  const [profileCountry, setProfileCountry] = React.useState('');
  const [profileLevel, setProfileLevel] = React.useState('');
  const [profileSuccess, setProfileSuccess] = React.useState(false);

  // Avatar Upload State
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const accaLevels = [
    { value: 'Foundation Diploma (FA1, FA2, MA1, MA2)', label: 'Foundation Diploma (FA1, FA2, MA1, MA2)' },
    { value: 'Applied Knowledge (BT, MA, FA)', label: 'Applied Knowledge (BT, MA, FA)' },
    { value: 'Applied Skills (LW, PM, TX, FR, AA, FM)', label: 'Applied Skills (LW, PM, TX, FR, AA, FM)' },
    { value: 'Strategic Professional (SBL, SBR)', label: 'Strategic Professional (SBL, SBR)' },
    { value: 'Strategic Professional Options (AFM, APM, ATX AAA)', label: 'Strategic Professional Options (AFM, APM, ATX AAA)' },
  ];

  React.useEffect(() => {
    if (store && store.currentUser) {
      setProfileName(store.currentUser.name);
      setProfileEmail(store.currentUser.email);
      setProfileCountry(store.currentUser.country || '');
      setProfileLevel(store.currentUser.accaLevel || '');
    }
  }, [store]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !profileEmail || !store) return;

    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo: profilePic,
          name: profileName,
          email: profileEmail,
          country: profileCountry,
          accaLevel: profileLevel
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const updatedUser = result.data.user;
        const updatedStore = {
          ...store,
          currentUser: updatedUser,
        };
        updateStore(updatedStore);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (err: any) {}
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store) return;

    // Validate file size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setUploadError('Image size must be less than 3MB.');
      return;
    }

    setUploadError('');
    setIsUploading(true);

    try {
      // 1. Upload Directly to Cloudinary via Signed Request
      const formData = new FormData();
      formData.append('file', file);
      formData.append("upload_preset", "accountly_preset");
      formData.append("folder", "profile_pictures");

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/atkelhuz/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        const uploadErrData = await uploadRes.json();
        throw new Error(uploadErrData.error?.message || 'Cloudinary image transfer failed.');
      }

      const uploadData = await uploadRes.json();
      const photoUrl = uploadData.secure_url;

      if (photoUrl) {
        setProfilePic(photoUrl);
        const updatedUser = { ...store.currentUser, photo: photoUrl };
        const updatedStore = {
          ...store,
          currentUser: updatedUser
        };
        updateStore(updatedStore);
      } else {
        throw new Error('Failed to save avatar.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Avatar upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!store) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-lg">
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Student Profile</h2>
        <p className="text-xs text-slate-500">Edit your credentials, country parameters, and target study level.</p>
      </div>

      {profileSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-semibold font-mono">
          Personal details updated and saved successfully!
        </div>
      )}

      {uploadError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs rounded-xl font-semibold font-mono">
          {uploadError}
        </div>
      )}

      <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5 text-left">
        {/* Interactive Avatar Container */}
        <div className="flex items-center gap-5">
          <div className="relative group w-20 h-20 cursor-pointer" onClick={handleAvatarClick}>
            <img 
              src={store.currentUser.photo} 
              alt="Avatar" 
              className={`w-20 h-20 rounded-full border border-slate-200 dark:border-slate-800 object-cover transition-opacity ${isUploading ? 'opacity-30' : 'group-hover:opacity-60'}`} 
            />
            {isUploading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/20 dark:bg-slate-950/40 rounded-full">
                <Camera className="w-5 h-5 text-white" />
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
              disabled={isUploading}
            />
          </div>

          <div className="flex flex-col">
            <span className="font-extrabold text-sm">{store.currentUser.name}</span>
            <span className="text-xs text-slate-400">Account Role: Student • {store.currentUser.plan.toUpperCase()}</span>
            <span 
              onClick={handleAvatarClick} 
              className="text-[11px] text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 mt-1 hover:underline cursor-pointer font-bold flex items-center gap-1"
            >
              Upload New Picture
            </span>
          </div>
        </div>

        <Input
          label="Name"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          required
        />

        <Input
          label="Email Address"
          type="email"
          value={profileEmail}
          onChange={(e) => setProfileEmail(e.target.value)}
          required
        />

        <Input
          label="Country of Residence"
          value={profileCountry}
          onChange={(e) => setProfileCountry(e.target.value)}
        />

        <Select
          label="Target Study Level"
          options={accaLevels}
          value={profileLevel}
          onChange={(e) => setProfileLevel(e.target.value)}
        />

        <div className="mt-2 flex justify-end">
          <Button variant="primary" type="submit">
            Save Profile Changes
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
