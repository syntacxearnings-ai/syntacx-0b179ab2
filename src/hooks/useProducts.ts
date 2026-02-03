import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  user_id: string;
  sku: string;
  name: string;
  category: string | null;
  cost_unit: number;
  ml_item_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  user_id: string;
  product_id: string;
  available: number;
  reserved: number;
  min_stock: number;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  user_id: string;
  product_id: string;
  movement_type: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  note: string | null;
  created_at: string;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  category?: string;
  cost_unit: number;
}

export function useProducts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!user,
  });

  // Inventory
  const { data: inventory = [], isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventory', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as Inventory[];
    },
    enabled: !!user,
  });

  // Create Product
  const createProduct = useMutation({
    mutationFn: async (input: CreateProductInput) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('products')
        .insert({ user_id: user.id, ...input })
        .select()
        .single();
      
      if (error) throw error;

      // Create inventory record
      await supabase
        .from('inventory')
        .insert({
          user_id: user.id,
          product_id: data.id,
          available: 0,
          reserved: 0,
          min_stock: 10,
        });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: 'Produto criado' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  // Update Product
  const updateProduct = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Product> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('products')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Produto atualizado' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  // Delete Product
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: 'Produto excluído' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  // Update Inventory
  const updateInventory = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Inventory> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('inventory')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: 'Estoque atualizado' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  // Add Inventory Movement
  const addMovement = useMutation({
    mutationFn: async (input: { product_id: string; movement_type: 'entry' | 'exit' | 'adjustment'; quantity: number; note?: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Insert movement
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({ user_id: user.id, ...input });
      
      if (movementError) throw movementError;

      // Update inventory
      const inv = inventory.find(i => i.product_id === input.product_id);
      if (inv) {
        let newAvailable = inv.available;
        if (input.movement_type === 'entry') {
          newAvailable += input.quantity;
        } else if (input.movement_type === 'exit') {
          newAvailable -= input.quantity;
        } else {
          newAvailable = input.quantity;
        }

        await supabase
          .from('inventory')
          .update({ available: newAvailable })
          .eq('id', inv.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: 'Movimentação registrada' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  // Merge products with inventory
  const productsWithInventory = products.map(product => {
    const inv = inventory.find(i => i.product_id === product.id);
    return {
      ...product,
      inventory: inv || null,
    };
  });

  return {
    products,
    inventory,
    productsWithInventory,
    isLoading: isLoadingProducts || isLoadingInventory,
    createProduct: createProduct.mutate,
    updateProduct: updateProduct.mutate,
    deleteProduct: deleteProduct.mutate,
    updateInventory: updateInventory.mutate,
    addMovement: addMovement.mutate,
    isCreating: createProduct.isPending,
    isUpdating: updateProduct.isPending,
    isDeleting: deleteProduct.isPending,
  };
}
