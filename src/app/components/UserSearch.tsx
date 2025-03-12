'use client';

import { useState, useEffect } from 'react';
import { searchUsers } from '@/lib/chat';
import { useAuth } from '../context/AuthContext';
import { Profile } from '@/lib/supabase';

interface UserSearchProps {
  onSelectUser: (user: Profile) => void;
  selectedUsers: Profile[];
}

export default function UserSearch({ onSelectUser, selectedUsers }: UserSearchProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2 && user) {
        setLoading(true);
        const { users } = await searchUsers(searchQuery, user.id);
        
        // Zaten seçilmiş kullanıcıları filtreleme
        const filteredUsers = users.filter(
          (searchUser) => !selectedUsers.some((selectedUser) => selectedUser.id === searchUser.id)
        );
        
        setSearchResults(filteredUsers);
        setLoading(false);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user, selectedUsers]);

  return (
    <div className="mt-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Kullanıcı ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        {loading && (
          <div className="absolute right-2 top-2">
            <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {searchResults.length > 0 && (
        <ul className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-200 max-h-60 overflow-y-auto">
          {searchResults.map((searchedUser) => (
            <li
              key={searchedUser.id}
              className="p-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                onSelectUser(searchedUser);
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                  {searchedUser.avatar_url ? (
                    <img
                      src={searchedUser.avatar_url}
                      alt={searchedUser.username}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <span className="text-lg text-white">
                      {searchedUser.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {searchedUser.full_name || searchedUser.username}
                  </div>
                  <div className="text-sm text-gray-500">@{searchedUser.username}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}