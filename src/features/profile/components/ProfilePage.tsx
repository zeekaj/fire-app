/**
 * ProfilePage.tsx
 * 
 * Page for viewing and editing user profile information.
 */
import { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';
import { getAge } from '@/lib/data-utils';

export function ProfilePage() {
  const { profile, isLoading, isUpdating, updateProfile } = useProfile();
  const [birthDate, setBirthDate] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setBirthDate(profile.birth_date);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);

    if (!birthDate) {
      setFeedbackMessage({ type: 'error', message: 'Birth date cannot be empty.' });
      return;
    }

    try {
      await updateProfile({ birth_date: birthDate });
      setFeedbackMessage({ type: 'success', message: 'Profile updated successfully!' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setFeedbackMessage({ type: 'error', message: `Failed to update profile: ${errorMessage}` });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Profile</h1>

      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
              Birth Date
            </label>
            <div className="mt-1">
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            {profile && (
              <p className="mt-2 text-sm text-gray-500">
                This means you are currently {getAge(profile.birth_date)} years old.
              </p>
            )}
          </div>

          {feedbackMessage && (
            <div
              className={`p-4 rounded-md text-sm ${
                feedbackMessage.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {feedbackMessage.message}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
