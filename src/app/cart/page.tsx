'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { MdAdd, MdRemove, MdDelete, MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';
import { HiShoppingBag } from 'react-icons/hi2';

const rp = (n: number) =>
  Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export default function CartPage() {
  const { items, removeFromCart, updateQty, clearCart } = useCart();
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allChecked = items.length > 0 && items.every(i => selected.has(i.productId));

  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map(i => i.productId)));
    }
  };

  const toggleOne = (productId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleRemove = async (productId: string) => {
    await removeFromCart(productId);
    setSelected(prev => { const n = new Set(prev); n.delete(productId); return n; });
  };

  const selectedItems = items.filter(i => selected.has(i.productId));
  const total = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleCheckout = () => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/cart');
      return;
    }
    if (selectedItems.length === 0) return;
    // For now build query per-item (single product checkout flow)
    const first = selectedItems[0];
    router.push(`/checkout?product=${first.productId}&qty=${first.quantity}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Keranjang Belanja</h1>
            {items.length > 0 && (
              <button
                onClick={() => { clearCart(); setSelected(new Set()); }}
                className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
              >
                Hapus semua
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <HiShoppingBag className="text-7xl text-gray-200 mb-4" />
              <p className="text-gray-600 font-semibold text-base mb-1">Keranjang kamu kosong</p>
              <p className="text-gray-400 text-sm mb-6">Yuk, tambahkan produk ke keranjang dulu!</p>
              <Link
                href="/products"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Lihat Produk
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

              {/* Item list */}
              <div className="space-y-2">
                {/* Select-all row */}
                <div className="flex items-center gap-2 px-1 pb-1 border-b border-gray-100">
                  <button onClick={toggleAll} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    {allChecked
                      ? <MdCheckBox className="text-blue-600 text-xl" />
                      : <MdCheckBoxOutlineBlank className="text-gray-400 text-xl" />}
                    <span className="font-medium">Pilih Semua</span>
                  </button>
                  {selected.size > 0 && (
                    <span className="ml-auto text-xs text-gray-400">{selected.size} item dipilih</span>
                  )}
                </div>

                {items.map(item => {
                  const isChecked = selected.has(item.productId);
                  return (
                    <div
                      key={item.productId}
                      className={`rounded-2xl border p-4 flex gap-3 transition-colors ${
                        isChecked ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100 bg-white'
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleOne(item.productId)}
                        className="shrink-0 mt-1 self-start"
                      >
                        {isChecked
                          ? <MdCheckBox className="text-blue-600 text-xl" />
                          : <MdCheckBoxOutlineBlank className="text-gray-400 text-xl" />}
                      </button>

                      {/* Image */}
                      <Link href={`/products/${item.productId}`} className="shrink-0">
                        <div className="w-18 h-18 w-[72px] h-[72px] rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).src = '/images/placeholder-product.png'; }}
                          />
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <Link
                          href={`/products/${item.productId}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2 leading-snug block"
                        >
                          {item.title}
                        </Link>
                        <p className="text-xs text-gray-400">{item.sellerName}</p>
                        <p className="text-sm font-semibold text-blue-600">Rp{rp(item.price)}</p>

                        <div className="flex items-center justify-between pt-1">
                          {/* Qty selector */}
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <button
                              onClick={() => updateQty(item.productId, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                              <MdRemove className="text-sm" />
                            </button>
                            <span className="w-10 text-center text-sm font-semibold border-x border-gray-200 py-1">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40"
                            >
                              <MdAdd className="text-sm" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-700">
                              Rp{rp(item.price * item.quantity)}
                            </span>
                            <button
                              onClick={() => handleRemove(item.productId)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <MdDelete className="text-base" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 lg:sticky lg:top-6">
                <h2 className="text-sm font-semibold text-gray-900">Ringkasan Belanja</h2>

                {selectedItems.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4 leading-relaxed">
                    Centang produk yang ingin dibeli untuk melihat ringkasan harga.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedItems.map(item => (
                      <div key={item.productId} className="flex justify-between text-xs text-gray-500">
                        <span className="truncate max-w-[160px]">{item.title} Ã—{item.quantity}</span>
                        <span className="shrink-0 ml-2">Rp{rp(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className={`text-lg font-semibold ${selectedItems.length > 0 ? 'text-blue-600' : 'text-gray-300'}`}>
                    Rp{rp(total)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {selectedItems.length === 0
                    ? 'Pilih produk dahulu'
                    : `Beli Sekarang (${selectedItems.length})`}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
