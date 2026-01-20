'use client';

import { useState, useEffect } from 'react';
import { Button, Alert } from '@/components/ui';
import { apiGet, apiPost, apiPut, apiDelete, ApiResponse } from '@/lib/api';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  priority: number;
  is_active: boolean;
  is_pinned: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export function AnnouncementsManagementClient() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'INFO' as 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR',
    priority: 0,
    is_active: true,
    is_pinned: false,
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiGet<ApiResponse<Announcement[]>>('/homepage/announcements');
      
      if (response.success && response.data) {
        setAnnouncements(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data pengumuman');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      if (editingAnnouncement) {
        const response = await apiPut<ApiResponse<Announcement>>(`/homepage/announcements/${editingAnnouncement.id}`, formData);
        if (response.success) {
          setSuccess('Pengumuman berhasil diupdate');
          fetchAnnouncements();
          handleCancel();
        }
      } else {
        const response = await apiPost<ApiResponse<Announcement>>('/homepage/announcements', formData);
        if (response.success) {
          setSuccess('Pengumuman berhasil ditambahkan');
          fetchAnnouncements();
          handleCancel();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan pengumuman');
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      is_active: announcement.is_active,
      is_pinned: announcement.is_pinned,
      start_date: announcement.start_date ? announcement.start_date.split('T')[0] : '',
      end_date: announcement.end_date ? announcement.end_date.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingAnnouncement) return;
    
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiDelete<ApiResponse<null>>(`/homepage/announcements/${deletingAnnouncement.id}`);
      if (response.success) {
        setSuccess('Pengumuman berhasil dihapus');
        fetchAnnouncements();
        setDeletingAnnouncement(null);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus pengumuman');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      type: 'INFO',
      priority: 0,
      is_active: true,
      is_pinned: false,
      start_date: '',
      end_date: '',
    });
  };

  const getTypeColor = (type: string) => {
    const colors = {
      INFO: 'bg-blue-100 text-blue-800',
      WARNING: 'bg-yellow-100 text-yellow-800',
      SUCCESS: 'bg-green-100 text-green-800',
      ERROR: 'bg-red-100 text-red-800',
    };
    return colors[type as keyof typeof colors] || colors.INFO;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="bg-gray-200 rounded-xl h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements Management</h1>
          <p className="text-gray-600 mt-1">Kelola pengumuman dan informasi untuk pengguna</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          + Tambah Pengumuman
        </Button>
      </div>

      {/* Alerts */}
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(announcement.type)}`}>
                  {announcement.type}
                </span>
                {announcement.is_pinned && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">Pinned</span>
                )}
                {announcement.is_active ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">Active</span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">Inactive</span>
                )}
                <span className="text-xs text-gray-500">Priority: {announcement.priority}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(announcement)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeletingAnnouncement(announcement)}
                  className="text-red-600 hover:text-red-700 font-medium text-sm"
                >
                  Hapus
                </button>
              </div>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">{announcement.title}</h3>
            <p className="text-gray-600 text-sm">{announcement.content}</p>
            {(announcement.start_date || announcement.end_date) && (
              <div className="mt-2 text-xs text-gray-500">
                {announcement.start_date && `Start: ${new Date(announcement.start_date).toLocaleDateString()}`}
                {announcement.start_date && announcement.end_date && ' • '}
                {announcement.end_date && `End: ${new Date(announcement.end_date).toLocaleDateString()}`}
              </div>
            )}
          </div>
        ))}
      </div>

      {announcements.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Belum ada pengumuman. Klik "Tambah Pengumuman" untuk membuat pengumuman baru.</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingAnnouncement ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}
                </h2>
                <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judul *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konten *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={5}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="INFO">Info</option>
                      <option value="WARNING">Warning</option>
                      <option value="SUCCESS">Success</option>
                      <option value="ERROR">Error</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority (0-10)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_pinned}
                      onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Pinned (tampil paling atas)</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date (optional)
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date (optional)
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                    Batal
                  </Button>
                  <Button type="submit" isLoading={processing} className="flex-1">
                    {editingAnnouncement ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Hapus Pengumuman</h2>
            <p className="text-gray-600 mb-4">
              Apakah Anda yakin ingin menghapus pengumuman "{deletingAnnouncement.title}"?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeletingAnnouncement(null)} className="flex-1">
                Batal
              </Button>
              <Button variant="danger" onClick={handleDelete} isLoading={processing} className="flex-1">
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
