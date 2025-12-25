import React, { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { ProductGrid } from './ProductGrid';
import { ProductDetail } from './ProductDetail';
import { Cart } from './Cart';
import { Chatbot } from './Chatbot';
import { AdminPanel } from './AdminPanel';
import { Product, CartItem } from '@/types/ecommerce';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export const EcommerceLayout = () => {
  const [currentView, setCurrentView] = useState<'home' | 'product' | 'cart'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    if (user) {
      fetchCartItems();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCartItems = async () => {
    if (!user) return;
    
    try {
      // Fallback to localStorage for cart functionality
      const savedCart = localStorage.getItem('ccs_cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Fallback to localStorage for backward compatibility
      const savedCart = localStorage.getItem('ccs_cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product');
  };

  const handleAddToCart = async (product: Product, size?: string, color?: string, quantity: number = 1) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add items to your cart",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if item already exists in cart
      // For now, use localStorage for cart functionality
      const savedCart = localStorage.getItem('ccs_cart') || '[]';
      const currentCart = JSON.parse(savedCart);
      
      const existingItemIndex = currentCart.findIndex((item: any) => 
        item.product.id === product.id && 
        item.size === size && 
        item.color === color
      );

      if (existingItemIndex >= 0) {
        currentCart[existingItemIndex].quantity += quantity;
      } else {
        currentCart.push({
          id: `temp_${Date.now()}`,
          product,
          quantity,
          size,
          color,
          user_id: user.id,
          created_at: new Date().toISOString()
        });
      }
      
      localStorage.setItem('ccs_cart', JSON.stringify(currentCart));
      setCartItems(currentCart);

      // Refresh cart
      await fetchCartItems();

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromCart = async (itemId: string) => {
    try {
      // Use localStorage for cart functionality
      const savedCart = localStorage.getItem('ccs_cart') || '[]';
      const currentCart = JSON.parse(savedCart);
      const updatedCart = currentCart.filter((item: any) => item.id !== itemId);
      
      localStorage.setItem('ccs_cart', JSON.stringify(updatedCart));
      setCartItems(updatedCart);
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCartQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }

    try {
      // Use localStorage for cart functionality
      const savedCart = localStorage.getItem('ccs_cart') || '[]';
      const currentCart = JSON.parse(savedCart);
      const updatedCart = currentCart.map((item: any) => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      
      localStorage.setItem('ccs_cart', JSON.stringify(updatedCart));
      setCartItems(updatedCart);
    } catch (error) {
      console.error('Error updating cart:', error);
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        currentView={currentView}
        onViewChange={setCurrentView}
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
      />

      <main className="container mx-auto px-4 py-6">
        {currentView === 'home' && (
          <div>
            {/* Hero Section */}
            <section className="relative h-96 mb-12 rounded-2xl overflow-hidden gradient-hero">
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <div className="text-white">
                  <img src="/complete-credit-logo.png" alt="Complete Credit Solutions" className="h-20 mx-auto mb-4" />
                  <h1 className="text-5xl font-bold mb-4">Complete Credit Solutions</h1>
                  <p className="text-xl mb-6">Moving Forward Together Towards a Brighter Future</p>
                  <button
                    onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-white text-primary px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Shop Now
                  </button>
                </div>
              </div>
            </section>

            <ProductGrid
              products={products}
              loading={loading}
              onProductSelect={handleProductSelect}
            />
          </div>
        )}

        {currentView === 'product' && selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onAddToCart={handleAddToCart}
            onBack={() => setCurrentView('home')}
          />
        )}

        {currentView === 'cart' && (
          <Cart
            items={cartItems}
            onRemoveItem={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateCartQuantity}
          />
        )}
      </main>

      {/* Admin Panel - Only show to admin users */}
      {userProfile?.role === 'admin' && <AdminPanel />}

      <Chatbot />
    </div>
  );
};