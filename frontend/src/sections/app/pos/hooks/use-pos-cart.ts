import { useCallback, useMemo, useState } from 'react';

import type { ProductListItem } from 'src/sections/app/products/api/types';

import type { CartLine } from '../api/types';

export function usePosCart() {
  const [cart, setCart] = useState<CartLine[]>([]);

  const addProduct = useCallback((product: ProductListItem) => {
    if (product.availableQuantity <= 0) return;
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.productId === product.id);
      if (idx >= 0) {
        const line = prev[idx];
        if (line.quantity >= line.availableStock) return prev;
        return prev.map((l, i) => (i === idx ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: parseFloat(product.averagePurchasePrice) || 0,
          availableStock: product.availableQuantity,
        },
      ];
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((l) => l.productId !== productId);
      return prev.map((l) =>
        l.productId === productId ? { ...l, quantity: Math.min(qty, l.availableStock) } : l
      );
    });
  }, []);

  const setPrice = useCallback((productId: string, price: number) => {
    setCart((prev) =>
      prev.map((l) =>
        l.productId === productId ? { ...l, unitPrice: Math.max(0, price) } : l
      )
    );
  }, []);

  const removeLine = useCallback((productId: string) => {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => setCart([]), []);

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
    [cart]
  );

  return { cart, addProduct, setQty, setPrice, removeLine, clear, subtotal };
}
