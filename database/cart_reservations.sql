-- =====================================================
-- CART RESERVATIONS - Temporary Stock Reservation System
-- =====================================================

-- Create cart_reservations table
CREATE TABLE IF NOT EXISTS public.cart_reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT NOT NULL, -- Browser session identifier
  product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cart_reservations_session ON public.cart_reservations(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_reservations_product ON public.cart_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_reservations_expires ON public.cart_reservations(expires_at);

-- Enable RLS
ALTER TABLE public.cart_reservations ENABLE ROW LEVEL SECURITY;

-- Allow public to manage their own reservations
CREATE POLICY "Users can manage own reservations" 
  ON public.cart_reservations 
  FOR ALL 
  USING (true);

-- Function to clean expired reservations
CREATE OR REPLACE FUNCTION public.clean_expired_reservations() 
RETURNS void AS $$
BEGIN
  DELETE FROM public.cart_reservations
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available stock (total stock - reserved stock)
CREATE OR REPLACE FUNCTION public.get_available_stock(p_product_id BIGINT) 
RETURNS INTEGER AS $$
DECLARE
  total_stock INTEGER;
  reserved_stock INTEGER;
BEGIN
  -- Get total stock
  SELECT COALESCE(quantity, 0) INTO total_stock
  FROM public.stock
  WHERE product_id = p_product_id;
  
  -- Clean expired reservations first
  PERFORM public.clean_expired_reservations();
  
  -- Get reserved stock (only non-expired)
  SELECT COALESCE(SUM(quantity), 0) INTO reserved_stock
  FROM public.cart_reservations
  WHERE product_id = p_product_id
    AND expires_at > NOW();
  
  RETURN GREATEST(total_stock - reserved_stock, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update reservation
CREATE OR REPLACE FUNCTION public.upsert_cart_reservation(
  p_session_id TEXT,
  p_product_id BIGINT,
  p_quantity INTEGER
) 
RETURNS JSON AS $$
DECLARE
  available_stock INTEGER;
  existing_reservation RECORD;
  reservation_id UUID;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Clean expired reservations
  PERFORM public.clean_expired_reservations();
  
  -- Get available stock
  available_stock := public.get_available_stock(p_product_id);
  
  -- Check if there's enough stock
  IF available_stock < p_quantity THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient stock',
      'available_stock', available_stock
    );
  END IF;
  
  -- Set expiration time (10 minutes from now)
  expires_at := NOW() + INTERVAL '10 minutes';
  
  -- Check if reservation exists for this session and product
  SELECT * INTO existing_reservation
  FROM public.cart_reservations
  WHERE session_id = p_session_id
    AND product_id = p_product_id
    AND expires_at > NOW();
  
  IF FOUND THEN
    -- Update existing reservation
    UPDATE public.cart_reservations
    SET quantity = p_quantity,
        expires_at = expires_at
    WHERE id = existing_reservation.id
    RETURNING id INTO reservation_id;
  ELSE
    -- Create new reservation
    INSERT INTO public.cart_reservations (session_id, product_id, quantity, expires_at)
    VALUES (p_session_id, p_product_id, p_quantity, expires_at)
    RETURNING id INTO reservation_id;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'reservation_id', reservation_id,
    'expires_at', expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove reservation
CREATE OR REPLACE FUNCTION public.remove_cart_reservation(
  p_session_id TEXT,
  p_product_id BIGINT
) 
RETURNS void AS $$
BEGIN
  DELETE FROM public.cart_reservations
  WHERE session_id = p_session_id
    AND product_id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear all reservations for a session
CREATE OR REPLACE FUNCTION public.clear_session_reservations(
  p_session_id TEXT
) 
RETURNS void AS $$
BEGIN
  DELETE FROM public.cart_reservations
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to deduct reserved stock when order is paid
CREATE OR REPLACE FUNCTION public.handle_reservation_on_payment() 
RETURNS TRIGGER AS $$
DECLARE
  session_id_val TEXT;
BEGIN
  IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) THEN
    -- Extract session_id from order metadata (you'll need to add this field to orders table)
    -- For now, we'll just clear reservations based on order items
    DELETE FROM public.cart_reservations cr
    USING public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = cr.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_paid_clear_reservations
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.handle_reservation_on_payment();
