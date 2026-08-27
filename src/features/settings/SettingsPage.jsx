import React, { useState, useEffect } from 'react';
import { settingsService } from './settingsService';
import { UsersTable } from './UsersTable';
import { UserModal } from './UserModal';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const { currentUser, setUsers: setGlobalUsers } = useAuth();

  const loadUsers = async () => {
    setIsLoading(true);
    const list = await settingsService.getUsers();
    setUsers(list);
    setGlobalUsers(list);
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenNew = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSave = async (userData, isEditing) => {
    const updatedList = await settingsService.saveUser(userData, isEditing);
    setUsers(updatedList);
    setGlobalUsers(updatedList);
    toast.success(`User ${userData.id} saved successfully!`);
  };

  const handleDelete = async (id) => {
    try {
      if (!window.confirm(`Delete user account "${id}"?`)) return;
      const updatedList = await settingsService.deleteUser(id, currentUser?.id);
      setUsers(updatedList);
      setGlobalUsers(updatedList);
      toast.info(`User ${id} deleted.`);
    } catch (err) {
      toast.error(err.message || 'Failed to delete user.');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-pms-muted">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-pms-border pb-4">
        <div>
          <h3 className="text-lg font-bold text-pms-text">User Accounts & Access</h3>
          <p className="text-xs text-pms-muted mt-0.5">Control staff credentials and page permissions.</p>
        </div>

        <Button variant="primary" onClick={handleOpenNew}>
          <Plus className="w-4 h-4" />
          <span>New User</span>
        </Button>
      </div>

      <UsersTable
        users={users}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialValues={selectedUser}
        onSave={handleSave}
      />
    </div>
  );
}
