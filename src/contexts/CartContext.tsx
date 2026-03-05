'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { apiGet, apiPost, apiPut, apiDelete, ApiResponse } from '@/lib/api';

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
  stock: number;
  sellerId: string;
  sellerName: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  cartCount: number;
  loading: boolean;
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQty: (productId: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const GUEST_CART_KEY = 'lapakstikom_guest_cart';

// ── localStorage helpers (guest-only) ──────────────────────────────────────
function readGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeGuestCart(items: CartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}
function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);
}

// ── DB row shape from GET /api/cart ─────────────────────────────────────────
interface DbCartRow {
  product_id: string;
  title: string;
  price: string | number;
  stock: number;
  image_url: string | null;
  seller_id: string;
  seller_name: string;
  quantity: number;
}

function dbRowToItem(row: DbCartRow): CartItem {
  return {
    productId: row.product_id,
    title: row.title,
    price: Number(row.price),
    imageUrl: row.image_url ?? '/images/placeholder-product.png',
    stock: row.stock,
    sellerId: row.seller_id,
    sellerName: row.seller_name ?? '',
    quantity: row.quantity,
  };
}

// ────────────────────────────────────────────────────────────────────────────
export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated: isLoggedIn, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const prevLoggedIn = useRef<boolean | null>(null);

  // ── Load cart from DB ────────────────────────────────────────────────────
  const loadFromDb = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<ApiResponse<DbCartRow[]>>('/cart');
      const rows: DbCartRow[] = Array.isArray((res as any).data) ? (res as any).data : [];
      setItems(rows.map(dbRowToItem));
    } catch (err) {
      console.error('[CartContext] loadFromDb failed:', err);
      // Don't wipe items on transient error — keep showing stale data
    } finally {
      setLoading(false);
    }
  }, []);

  // ── React to auth state ─────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;

    const wasLoggedIn = prevLoggedIn.current;
    prevLoggedIn.current = isLoggedIn;

    if (isLoggedIn) {
      if (wasLoggedIn === false) {
        // Just logged in → merge guest cart → reload from DB
        const guest = readGuestCart();
        if (guest.length > 0) {
          apiPost('/cart/sync', {
            items: guest.map(i => ({ productId: i.productId, quantity: i.quantity })),
          })
            .catch(() => {})
            .finally(() => {
              clearGuestCart();
              loadFromDb();
            });
        } else {
          loadFromDb();
        }
      } else if (wasLoggedIn === null) {
        // App first load while already logged in
        loadFromDb();
      }
    } else {
      if (wasLoggedIn === true) {
        // Just logged out → clear localStorage and empty cart
        clearGuestCart();
        setItems([]);
      } else {
        // App first load as guest
        setItems(readGuestCart());
      }
    }
  }, [isLoggedIn, authLoading, loadFromDb]);

  // ── addToCart ────────────────────────────────────────────────────────────
  const addToCart = useCallback(
    async (item: Omit<CartItem, 'quantity'>, qty = 1) => {
      if (isLoggedIn) {
        const existing = items.find(i => i.productId === item.productId);
        const newQty = Math.min(item.stock, (existing?.quantity ?? 0) + qty);
        await apiPut(`/cart/${item.productId}`, { quantity: newQty });
        await loadFromDb();
      } else {
        const current = readGuestCart();
        const idx = current.findIndex(i => i.productId === item.productId);
        if (idx >= 0) {
          current[idx].quantity = Math.min(item.stock, current[idx].quantity + qty);
        } else {
          current.push({ ...item, quantity: Math.min(item.stock, qty) });
        }
        writeGuestCart(current);
        setItems([...current]);
      }
    },
    [isLoggedIn, items, loadFromDb]
  );

  // ── updateQty ────────────────────────────────────────────────────────────
  const updateQty = useCallback(
    async (productId: string, qty: number) => {
      if (isLoggedIn) {
        if (qty <= 0) {
          await apiDelete(`/cart/${productId}`);
        } else {
          await apiPut(`/cart/${productId}`, { quantity: qty });
        }
        await loadFromDb();
      } else {
        const current = readGuestCart();
        const updated =
          qty <= 0
            ? current.filter(i => i.productId !== productId)
            : current.map(i =>
                i.productId === productId ? { ...i, quantity: qty } : i
              );
        writeGuestCart(updated);
        setItems(updated);
      }
    },
    [isLoggedIn, loadFromDb]
  );

  // ── removeFromCart ───────────────────────────────────────────────────────
  const removeFromCart = useCallback(
    async (productId: string) => {
      if (isLoggedIn) {
        await apiDelete(`/cart/${productId}`);
        await loadFromDb();
      } else {
        const updated = readGuestCart().filter(i => i.productId !== productId);
        writeGuestCart(updated);
        setItems(updated);
      }
    },
    [isLoggedIn, loadFromDb]
  );

  // ── clearCart ────────────────────────────────────────────────────────────
  const clearCart = useCallback(async () => {
    if (isLoggedIn) {
      await apiDelete('/cart');
    } else {
      clearGuestCart();
    }
    setItems([]);
  }, [isLoggedIn]);

  const isInCart = useCallback(
    (productId: string) => items.some(i => i.productId === productId),
    [items]
  );

  const cartCount = items.length;

  return (
    <CartContext.Provider
      value={{ items, cartCount, loading, addToCart, removeFromCart, updateQty, clearCart, isInCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
