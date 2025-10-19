/**
 * AccountGroupsManager Component
 * 
 * Page for managing account groups - rename, change colors, reorder, delete.
 */

import { useState } from 'react';
import { useAccountGroups } from '../hooks/useAccountGroups';
import { useUpdateAccountGroup, useDeleteAccountGroup, useCreateAccountGroup } from '../hooks/useAccountGroupMutations';
import { logger } from '@/lib/logger';

const PRESET_COLORS = [
  { name: 'Blue', value: '#2E86AB' },
  { name: 'Green', value: '#10B981' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Emerald', value: '#059669' },
];

export function AccountGroupsManager() {
  const { data: groups, isLoading } = useAccountGroups();
  const updateGroup = useUpdateAccountGroup();
  const deleteGroup = useDeleteAccountGroup();
  const createGroup = useCreateAccountGroup();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(PRESET_COLORS[0].value);

  const handleStartEdit = (id: string, name: string, color: string) => {
    setEditingId(id);
    setEditName(name);
    setEditColor(color || '#6B7280');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    try {
      await updateGroup.mutateAsync({
        id: editingId,
        name: editName.trim(),
        color: editColor,
      });
      setEditingId(null);
    } catch (error) {
      logger.error('Failed to update group', error);
      alert('Failed to update group');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Accounts in this group will be ungrouped.`)) {
      return;
    }

    try {
      await deleteGroup.mutateAsync(id);
    } catch (error) {
      logger.error('Failed to delete group', error);
      alert('Failed to delete group');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newGroupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    try {
      await createGroup.mutateAsync({
        name: newGroupName.trim(),
        color: newGroupColor,
        is_system: false,
        sort_order: (groups?.length || 0) + 1,
      });

      setNewGroupName('');
      setNewGroupColor(PRESET_COLORS[0].value);
      setShowNewGroupForm(false);
    } catch (error) {
      logger.error('Failed to create group', error);
      alert('Failed to create group');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Account Groups</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage how your accounts are organized
          </p>
        </div>
        <button
          onClick={() => setShowNewGroupForm(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Group
        </button>
      </div>

      {/* New Group Form */}
      {showNewGroupForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Create New Group</h3>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group Name
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Business Checking, Kids Savings"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setNewGroupColor(color.value)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      newGroupColor === color.value
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowNewGroupForm(false);
                  setNewGroupName('');
                  setNewGroupColor(PRESET_COLORS[0].value);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createGroup.isPending}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {createGroup.isPending ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Groups List */}
      <div className="space-y-3">
        {groups?.map((group) => {
          const isEditing = editingId === group.id;

          return (
            <div
              key={group.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
            >
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setEditColor(color.value)}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            editColor === color.value
                              ? 'border-primary ring-2 ring-primary ring-offset-2'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={updateGroup.isPending}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                      {updateGroup.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: group.color || '#6B7280' }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      {group.is_system && (
                        <span className="text-xs text-gray-500">System group</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEdit(group.id, group.name, group.color || '#6B7280')}
                      className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      Edit
                    </button>
                    {!group.is_system && (
                      <button
                        onClick={() => handleDelete(group.id, group.name)}
                        className="px-3 py-1.5 text-sm text-danger hover:bg-red-50 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(!groups || groups.length === 0) && !showNewGroupForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No account groups found.</p>
          <p className="text-sm text-gray-500 mt-1">
            Click "New Group" to create your first group.
          </p>
        </div>
      )}
    </div>
  );
}
