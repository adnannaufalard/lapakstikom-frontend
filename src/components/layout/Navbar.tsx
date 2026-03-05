'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui';
import { getRoleLabel } from '@/lib/utils';
import { HiShoppingBag } from 'react-icons/hi2';
import { IoChatbubbleEllipses } from 'react-icons/io5';
import { GoBellFill } from 'react-icons/go';
import { BiSolidCategory } from 'react-icons/bi';

const categories = [
  { name: 'Rekomendasi', icon: '⭐', slug: 'rekomendasi' },
  { name: 'Gadget & Elektronik', icon: '📱', slug: 'gadget-elektronik' },
  { name: 'Fashion', icon: '👕', slug: 'fashion' },
  { name: 'Makanan & Minuman', icon: '🍔', slug: 'makanan-minuman' },
  { name: 'Aksesoris', icon: '💎', slug: 'aksesoris' },
  { name: 'Hobi & Koleksi', icon: '🎨', slug: 'hobi-koleksi' },
];

export function Navbar() {
  const { user, isLoading, isLoggedIn, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const { cartCount } = useCart();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="/images/logo.png" alt="Lapak STIKOM" className="h-10 w-auto" />
          </Link>

          {/* Category Dropdown - Desktop */}
          <div className="hidden lg:block relative ml-6">
            <button
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="group flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-blue-500 font-medium transition-colors"
            >
              <BiSolidCategory className="w-5 h-5" />
              <span>Kategori</span>
              <svg className={`w-4 h-4 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Category Dropdown Menu */}
            {isCategoryOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsCategoryOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20">
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/products?category=${category.slug}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsCategoryOpen(false)}
                    >
                      <span className="text-2xl">{category.icon}</span>
                      <span className="text-gray-700 font-medium">{category.name}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 items-center justify-center px-8 max-w-2xl">
            <div className="w-full relative">
              <input
                type="text"
                placeholder="Cari produk di Lapak STIKOM..."
                className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 px-5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Shopping Bag - Hidden for UKM and when not logged in as buyer */}
            {(!user || ['MAHASISWA', 'DOSEN', 'KARYAWAN'].includes(user.role)) && (
              <Link href="/cart" className="group relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <HiShoppingBag className="w-6 h-6 text-gray-500 group-hover:text-blue-500 transition-colors" />
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded px-1 min-w-[18px] h-[16px] flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              </Link>
            )}

            {/* Chat & Notification Icons - Only for logged in users */}
            {isLoggedIn && user && (
              <>
                {/* Chat Icon */}
                <Link href="/chat" className="group relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <IoChatbubbleEllipses className="w-6 h-6 text-gray-500 group-hover:text-blue-500 transition-colors" />
                </Link>

                {/* Notification Icon */}
                <Link href="/notifications" className="group relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <GoBellFill className="w-6 h-6 text-gray-500 group-hover:text-blue-500 transition-colors" />
                </Link>
              </>
            )}

            {/* Divider */}
            <div className="h-8 w-px bg-gray-300 mx-1"></div>

            {/* Auth Buttons / Profile */}
            {isLoading ? (
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded-lg" />
            ) : isLoggedIn && user ? (
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username || user.full_name}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                      {user.username ? `${user.username}` : user.full_name.split(' ')[0]}
                    </span>
                  </Link>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg
                      className={`h-4 w-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {user.role === 'UKM_OFFICIAL' ? (
                      <>
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Dashboard UKM
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Akun Saya
                        </Link>
                        <Link
                          href="/profile?tab=orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Pesanan Saya
                        </Link>
                      </>
                    )}
                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <button className="px-4 py-2 text-sm font-medium border-2 border-blue-500 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                    Masuk
                  </button>
                </Link>
                <Link href="/register">
                  <button className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                    Daftar
                  </button>
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-3">
            <div className="px-2 mb-3">
              <input
                type="text"
                placeholder="Cari produk..."
                className="w-full bg-gray-100 border-0 rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Link
              href="/products"
              className="block px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Produk
            </Link>
            <Link
              href="/categories"
              className="block px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Kategori
            </Link>
            {isLoggedIn && (
              <Link
                href="/sell"
                className="block px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Jual
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
