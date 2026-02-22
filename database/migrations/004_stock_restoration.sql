
-- 004: Fix Stock Restoration and Order Statuses
-- Adds 'completed' status and ensures stock is restored on cancellation

-- 1. Update the status check constraint on orders table safely
DO $$ 
DECLARE 
    constraint_name_var text;
BEGIN 
    -- Find the check constraint on the status column
    SELECT con.conname INTO constraint_name_var
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
    WHERE con.conrelid = 'public.orders'::regclass
      AND att.attname = 'status'
      AND con.contype = 'c';

    IF constraint_name_var IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT ' || constraint_name_var;
    END IF;
END $$;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'paid', 'cancelled', 'shipped', 'completed'));

-- 2. Improve the stock management function
CREATE OR REPLACE FUNCTION public.handle_stock_deduction() 
RETURNS TRIGGER AS $$
DECLARE
    is_old_deducted BOOLEAN;
    is_new_deducted BOOLEAN;
BEGIN
    -- Define which statuses imply stock has been deducted
    is_old_deducted := OLD.status IN ('paid', 'shipped', 'completed');
    is_new_deducted := NEW.status IN ('paid', 'shipped', 'completed');

    -- CASE 1: Transition to a deducted state from a non-deducted state -> DEDUCT STOCK
    IF (is_new_deducted AND NOT is_old_deducted) THEN
        UPDATE public.stock s
        SET quantity = s.quantity - oi.quantity,
            updated_at = NOW()
        FROM public.order_items oi
        WHERE oi.order_id = NEW.id
          AND oi.product_id = s.product_id;
    
    -- CASE 2: Transition from a deducted state to 'cancelled' -> RESTORE STOCK
    ELSIF (NEW.status = 'cancelled' AND is_old_deducted) THEN
        UPDATE public.stock s
        SET quantity = s.quantity + oi.quantity,
            updated_at = NOW()
        FROM public.order_items oi
        WHERE oi.order_id = NEW.id
          AND oi.product_id = s.product_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger on_order_paid already exists, we just updated the function it calls.
-- But let's rename it to something more descriptive if we want, or just leave it.
-- Based on schema.sql:
-- CREATE TRIGGER on_order_paid
--   AFTER UPDATE OF status ON public.orders
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_stock_deduction();

-- Just to be safe, let's ensure the trigger is correctly attached to any status update
DROP TRIGGER IF EXISTS on_order_paid ON public.orders;
CREATE TRIGGER on_order_status_change
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE public.handle_stock_deduction();
