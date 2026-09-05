import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { PermissionSelector } from './PermissionSelector';

export function UserModal({ isOpen, onClose, initialValues, onSave }) {
  const isEditing = Boolean(initialValues?.id);

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [role, setRole] = useState('staff');
  const [fullAccess, setFullAccess] = useState(false);
  const [allowedPages, setAllowedPages] = useState(['dashboard']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialValues && isOpen) {
      setId(initialValues.id || '');
      setPassword(initialValues.password_hash || initialValues.password || '');
      setName(initialValues.display_name || initialValues.name || '');
      setWhatsappNumber(initialValues.whatsapp_number || initialValues.whatsappNumber || '');
      setRole(initialValues.role || 'staff');
      const isFull = Boolean(initialValues.has_full_access || initialValues.allowedPages?.includes('ALL') || initialValues.role === 'admin');
      setFullAccess(isFull);
      setAllowedPages(initialValues.allowedPages || ['dashboard']);
      setError('');
    } else if (isOpen) {
      setId('');
      setPassword('');
      setName('');
      setWhatsappNumber('');
      setRole('staff');
      setFullAccess(false);
      setAllowedPages(['dashboard']);
      setError('');
    }
  }, [initialValues, isOpen]);

  const handlePermissionToggle = (key) => {
    setAllowedPages(prev => {
      const exists = prev.includes(key);
      if (exists) {
        return prev.filter(k => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!id.trim() || !password) {
      setError('User ID and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalAllowed = ['dashboard'];
      if (role === 'admin' || fullAccess) {
        finalAllowed = ['ALL'];
      } else {
        const set = new Set([...allowedPages, 'dashboard']);
        finalAllowed = Array.from(set);
      }

      await onSave({
        id,
        password_hash: password,
        password,
        display_name: name,
        name,
        whatsapp_number: whatsappNumber.trim() || null,
        whatsappNumber: whatsappNumber.trim() || null,
        role,
        has_full_access: fullAccess || role === 'admin',
        allowedPages: finalAllowed,
      }, isEditing);

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit User — ${id}` : 'New User'}
      subtitle="Create or modify staff access rights."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="User ID"
            required
            value={id}
            onChange={(e) => setId(e.target.value)}
            disabled={isEditing}
            mono
            placeholder="e.g. chef_john"
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Input
            label="Display Name"
            optional
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Chef John"
          />

          <Input
            label="WhatsApp Number"
            optional
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="e.g. 917000206500"
            helper="For menu finalization notifications (with country code)"
          />

          <div className="sm:col-span-2">
            <Select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { label: 'Staff', value: 'staff' },
                { label: 'Admin', value: 'admin' },
              ]}
            />
          </div>
        </div>

        <PermissionSelector
          role={role}
          fullAccess={fullAccess}
          onFullAccessChange={setFullAccess}
          allowedPages={allowedPages}
          onPermissionToggle={handlePermissionToggle}
        />

        {error && (
          <div className="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
