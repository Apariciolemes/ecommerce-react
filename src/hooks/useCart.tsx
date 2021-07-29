import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get('/products')
      const getNewItem = data.find((item: any) => item.id === productId)

      const cartHasItem = cart.find(item => item.id === getNewItem.id)

      if (cartHasItem) {
        let { id, amount } = cartHasItem
        amount += 1
        updateProductAmount({ productId: id, amount })
        return
      }
      setCart([...cart, { ...getNewItem, amount: 1 }])
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {

    const indexProduct = cart.findIndex(product => product.id === productId)
    if (indexProduct < 0) {
      toast.error('Erro na remoção do produto')
      return
    }

    cart.splice(indexProduct, 1)
    setCart([...cart])
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))

  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data } = await api.get('/stock')
      const getAmountStock = data.find((item: Stock) => item.id === productId)?.amount

      if (getAmountStock < amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return

      }
      const cartItem = cart.find(item => item.id === productId)

      if (cartItem) {
        cartItem.amount = amount
        setCart([...cart])
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
