
import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { cartStore } from '../../store/cartStore';
import { supabase } from '../../lib/supabase';

export default function CartSync() {
    const cart = useStore(cartStore);

    useEffect(() => {
        const syncCart = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user && cart.items.length > 0) {
                // Update cart in database
                await supabase
                    .from('users')
                    .update({
                        cart_items: cart.items,
                        last_cart_update: new Date().toISOString()
                    })
                    .eq('id', session.user.id);
            }
        };

        // Debounce sync to avoid too many writes
        const timer = setTimeout(syncCart, 2000);
        return () => clearTimeout(timer);
    }, [cart.items]);

    return null; // Invisible helper
}
