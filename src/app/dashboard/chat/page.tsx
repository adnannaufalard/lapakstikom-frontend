'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import UkmDashboardLayout from '@/components/layout/UkmDashboardLayout';
import { MdSend, MdSearch } from 'react-icons/md';

export default function ChatPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?redirect=/dashboard/chat');
    } else if (!authLoading && user && user.role !== 'UKM_OFFICIAL') {
      router.push('/');
    }
  }, [authLoading, isLoggedIn, user, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user.role !== 'UKM_OFFICIAL') {
    return null;
  }

  const chats = [
    { id: 1, name: 'Budi Santoso', lastMessage: 'Produknya masih ada kak?', time: '10:30', unread: 2, avatar: '👤' },
    { id: 2, name: 'Siti Nurhaliza', lastMessage: 'Terima kasih kak', time: '09:15', unread: 0, avatar: '👩' },
    { id: 3, name: 'Ahmad Fauzi', lastMessage: 'Bisa COD gak?', time: 'Kemarin', unread: 1, avatar: '👨' },
  ];

  const messages = selectedChat === 1 ? [
    { id: 1, text: 'Halo, saya mau tanya produk ini', sender: 'customer', time: '10:25' },
    { id: 2, text: 'Ya kak, silakan', sender: 'ukm', time: '10:26' },
    { id: 3, text: 'Produknya masih ada kak?', sender: 'customer', time: '10:30' },
  ] : [];

  return (
    <UkmDashboardLayout ukmName={user.full_name || 'UKM'} avatarUrl={user.avatar_url}>
      <div className="h-[calc(100vh-12rem)] flex gap-4">
        {/* Chat List */}
        <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-3">Pesan</h2>
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Cari chat..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors ${
                  selectedChat === chat.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{chat.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{chat.name}</h3>
                      {chat.unread > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{chat.lastMessage}</p>
                    <p className="text-xs text-gray-400 mt-1">{chat.time}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">👤</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Budi Santoso</h3>
                    <p className="text-xs text-gray-500">Online</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'ukm' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender === 'ukm'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender === 'ukm' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ketik pesan..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <MdSend className="text-xl" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Pilih chat untuk memulai percakapan
            </div>
          )}
        </div>
      </div>
    </UkmDashboardLayout>
  );
}
