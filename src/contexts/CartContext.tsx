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
  cartKey: string;           // unique key: productId or productId::{"size":"L"}
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
  stock: number;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerRole?: string;
  quantity: number;
  variations?: Record<string, string>;
}

interface CartContextValue {
  items: CartItem[];
  cartCount: number;
  loading: boolean;
  addToCart: (item: Omit<CartItem, 'quantity' | 'cartKey'>, qty?: number) => Promise<void>;
  removeFromCart: (cartKey: string) => Promise<void>;
  updateQty: (cartKey: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const GUEST_CART_KEY = 'lapakstikom_guest_cart';

// ── Cart key helper ──────────────────────────────────────────────────────────
function makeCartKey(productId: string, variations?: Record<string, string>): string {
  if (!variations || Object.keys(variations).length === 0) return productId;
  const sorted = Object.fromEntries(
    Object.entries(variations).sort(([a], [b]) => a.localeCompare(b))
  );
  return `${productId}::${JSON.stringify(sorted)}`;
}

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
  seller_avatar: string | null;
  seller_role: string | null;
  quantity: number;
  variations: Record<string, string> | null;
}

function dbRowToItem(row: DbCartRow): CartItem {
  const variations =
    row.variations && Object.keys(row.variations).length > 0 ? row.variations : undefined;
  return {
    cartKey: makeCartKey(row.product_id, variations),
    productId: row.product_id,
    title: row.title,
    price: Number(row.price),
    imageUrl: row.image_url ?? '/images/placeholder-product.png',
    stock: row.stock,
    sellerId: row.seller_id,
    sellerName: row.seller_name ?? '',
    sellerAvatar: row.seller_avatar ?? undefined,
    sellerRole: row.seller_role ?? undefined,
    quantity: row.quantity,
    variations,
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
        const guest = readGuestCart();
        if (guest.length > 0) {
          apiPost('/cart/sync', {
            items: guest.map(i => ({
              productId: i.productId,
              quantity: i.quantity,
              variations: i.variations ?? {},
            })),
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
        loadFromDb();
      }
    } else {
      if (wasLoggedIn === true) {
        clearGuestCart();
        setItems([]);
      } else {
        setItems(readGuestCart());
      }
    }
  }, [isLoggedIn, authLoading, loadFromDb]);

  // ── addToCart ────────────────────────────────────────────────────────────
  const addToCart = useCallback(
    async (item: Omit<CartItem, 'quantity' | 'cartKey'>, qty = 1) => {
      const cartKey = makeCartKey(item.productId, item.variations);
      if (isLoggedIn) {
        const existing = items.find(i => i.cartKey === cartKey);
        const newQty = Math.min(item.stock, (existing?.quantity ?? 0) + qty);
        await apiPut(`/cart/${item.productId}`, {
          quantity: newQty,
          variations: item.variations ?? {},
        });
        await loadFromDb();
      } else {
        const current = readGuestCart();
        const idx = current.findIndex(i => i.cartKey === cartKey);
        if (idx >= 0) {
          current[idx].quantity = Math.min(item.stock, current[idx].quantity + qty);
        } else {
          current.push({ ...item, cartKey, quantity: Math.min(item.stock, qty) });
        }
        writeGuestCart(current);
        setItems([...current]);
      }
    },
    [isLoggedIn, items, loadFromDb]
  );

  // ── updateQty ────────────────────────────────────────────────────────────
  const updateQty = useCallback(
    async (cartKey: string, qty: number) => {
      const item = items.find(i => i.cartKey === cartKey);
      if (!item) return;
      if (isLoggedIn) {
        if (qty <= 0) {
          await apiDelete(`/cart/${item.productId}`, { variations: item.variations ?? {} });
        } else {
          await apiPut(`/cart/${item.productId}`, {
            quantity: qty,
            variations: item.variations ?? {},
          });
        }
        await loadFromDb();
      } else {
        const current = readGuestCart();
        const updated =
          qty <= 0
            ? current.filter(i => i.cartKey !== cartKey)
            : current.map(i => (i.cartKey === cartKey ? { ...i, quantity: qty } : i));
        writeGuestCart(updated);
        setItems(updated);
      }
    },
    [isLoggedIn, items, loadFromDb]
  );

  // ── removeFromCart ───────────────────────────────────────────────────────
  const removeFromCart = useCallback(
    async (cartKey: string) => {
      const item = items.find(i => i.cartKey === cartKey);
      if (!item) return;
      if (isLoggedIn) {
        await apiDelete(`/cart/${item.productId}`, { variations: item.variations ?? {} });
        await loadFromDb();
      } else {
        const updated = readGuestCart().filter(i => i.cartKey !== cartKey);
        writeGuestCart(updated);
        setItems(updated);
      }
    },
    [isLoggedIn, items, loadFromDb]
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

