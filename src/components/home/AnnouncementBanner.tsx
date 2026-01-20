'use client';

import { useState } from 'react';
import { Announcement } from '@/lib/homepage';

interface AnnouncementBannerProps {
  announcements: Announcement[];
}

export function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  if (announcements.length === 0) return null;

  const visibleAnnouncements = announcements.filter(
    (announcement) => !dismissed.includes(announcement.id)
  );

  if (visibleAnnouncements.length === 0) return null;

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'ERROR':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: '⚠️',
        };
      case 'WARNING':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: '⚡',
        };
      case 'SUCCESS':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: '✅',
        };
      default: // INFO
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: 'ℹ️',
        };
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed([...dismissed, id]);
  };

  return (
    <div className="space-y-3">
      {visibleAnnouncements.map((announcement) => {
        const styles = getTypeStyles(announcement.type);
        return (
          <div
            key={announcement.id}
            className={`${styles.bg} border rounded-lg p-4 flex items-start gap-3`}
          >
            {/* Icon */}
            <span className="text-2xl flex-shrink-0">{styles.icon}</span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className={`font-semibold ${styles.text} mb-1 flex items-center gap-2`}>
                    {announcement.title}
                    {announcement.is_pinned && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Penting
                      </span>
                    )}
                  </h3>
                  <p className={`text-sm ${styles.text} whitespace-pre-wrap`}>
                    {announcement.content}
                  </p>
                </div>

                {/* Close button */}
                <button
                  onClick={() => handleDismiss(announcement.id)}
                  className={`${styles.text} hover:opacity-70 transition-opacity flex-shrink-0`}
                  aria-label="Tutup pengumuman"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
