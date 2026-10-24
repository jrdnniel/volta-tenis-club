import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';

const ProfilePage = () => {
  const { userProfile } = useAuth();

  const roleColors = {
    admin: 'purple',
    coach: 'blue',
    member: 'green',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-500 mt-1">Informasi akun dan profil Anda.</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar
            src={userProfile?.photoURL}
            name={userProfile?.displayName}
            size="xl"
          />
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{userProfile?.displayName}</h2>
              <p className="text-gray-500">{userProfile?.email}</p>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <Badge color={roleColors[userProfile?.role] || 'gray'}>
                {userProfile?.role?.toUpperCase()}
              </Badge>
              <Badge color={userProfile?.isActive ? 'green' : 'red'}>
                {userProfile?.isActive ? 'Aktif' : 'Nonaktif'}
              </Badge>
              <Badge color="blue">
                {userProfile?.membershipType?.toUpperCase() || 'BASIC'}
              </Badge>
            </div>
          </div>
        </div>

        <hr className="my-6 border-gray-100" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Nama Lengkap', value: userProfile?.displayName },
            { label: 'Email', value: userProfile?.email },
            { label: 'No. HP', value: userProfile?.phone || '-' },
            { label: 'Tipe Keanggotaan', value: userProfile?.membershipType?.toUpperCase() || 'BASIC' },
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{item.label}</p>
              <p className="text-sm text-gray-900">{item.value || '-'}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
