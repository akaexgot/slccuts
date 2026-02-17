import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const NewsletterSubscriptionBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        console.log('[Newsletter Banner] Component mounted, starting checks...');
        checkUserAndSubscription();
    }, []);

    const checkUserAndSubscription = async () => {
        console.log('[Newsletter Banner] Checking user and subscription...');

        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[Newsletter Banner] Session:', session ? 'Found' : 'Not found');

        if (!session) {
            console.log('[Newsletter Banner] No session, hiding banner');
            setIsVisible(false);
            return;
        }

        setIsLoggedIn(true);
        setUserEmail(session.user.email || '');
        console.log('[Newsletter Banner] User email:', session.user.email);

        // Check if user already subscribed (localStorage)
        const hasSubscribed = localStorage.getItem('slccuts_newsletter_subscribed');
        console.log('[Newsletter Banner] Has subscribed (localStorage):', hasSubscribed);

        if (hasSubscribed) {
            console.log('[Newsletter Banner] User already subscribed (localStorage), hiding permanently');
            setIsVisible(false);
            return;
        }

        // Check if user dismissed the banner recently (within 7 days)
        const dismissedTimestamp = localStorage.getItem('slccuts_newsletter_dismissed_time');
        if (dismissedTimestamp) {
            const dismissedTime = parseInt(dismissedTimestamp);
            const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
            console.log('[Newsletter Banner] Days since dismissed:', daysSinceDismissed.toFixed(1));

            if (daysSinceDismissed < 7) {
                console.log('[Newsletter Banner] User dismissed banner recently (< 7 days), hiding');
                setIsVisible(false);
                return;
            } else {
                console.log('[Newsletter Banner] Dismissed period expired, clearing flag');
                localStorage.removeItem('slccuts_newsletter_dismissed_time');
                // Remove old flag too if it exists
                localStorage.removeItem('slccuts_newsletter_dismissed');
            }
        }

        // Check if email is already in database
        console.log('[Newsletter Banner] Checking database for existing subscription...');
        const { data: existingSubscriber, error } = await supabase
            .from('newsletter_subscribers')
            .select('id')
            .eq('email', session.user.email)
            .maybeSingle();

        console.log('[Newsletter Banner] Database check - existing subscriber:', existingSubscriber, 'error:', error);

        if (existingSubscriber) {
            console.log('[Newsletter Banner] User already in database, saving to localStorage and hiding permanently');
            localStorage.setItem('slccuts_newsletter_subscribed', 'true');
            setIsVisible(false);
            return;
        }

        // Show banner
        console.log('[Newsletter Banner] All checks passed, showing banner!');
        setIsVisible(true);
    };

    const handleSubscribe = async () => {
        setStatus('loading');
        setMessage('');

        try {
            console.log('[Newsletter Banner] Subscribing with email:', userEmail);
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail }),
            });

            console.log('[Newsletter Banner] Response status:', response.status);

            const contentType = response.headers.get("content-type");
            let data;

            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
                console.log('[Newsletter Banner] Response data:', data);
            } else {
                const text = await response.text();
                console.error('[Newsletter Banner] Non-JSON response:', text);
                throw new Error("Respuesta inesperada del servidor");
            }

            if (response.ok) {
                setStatus('success');
                localStorage.setItem('slccuts_newsletter_subscribed', 'true');
                console.log('[Newsletter Banner] Subscription successful');
                setTimeout(() => setIsVisible(false), 3000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Algo ha salido mal. Inténtalo de nuevo.');
                console.error('[Newsletter Banner] Subscription failed:', data.error);
            }
        } catch (error) {
            console.error('[Newsletter Banner] Exception:', error);
            setStatus('error');
            setMessage('Error de conexión. Comprueba tu red.');
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        // Store timestamp instead of boolean, so banner can reappear after 7 days
        localStorage.setItem('slccuts_newsletter_dismissed_time', Date.now().toString());
        console.log('[Newsletter Banner] Banner dismissed, will reappear in 7 days');
    };

    if (!isVisible || !isLoggedIn) return null;

    return (
        <>
            {/* Bottom Banner - No backdrop, allows navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 pointer-events-none">
                <div
                    className="container mx-auto max-w-6xl pointer-events-auto animate-slideUp"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative bg-gradient-to-r from-black via-gray-900 to-black p-6 md:p-8 rounded-[2rem] border border-white/20 shadow-2xl overflow-hidden">
                        {/* Background effects */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 blur-[100px] rounded-full" />
                        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-white/5 blur-[100px] rounded-full" />

                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
                            aria-label="Cerrar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        {status === 'success' ? (
                            <div className="flex items-center justify-center gap-4 py-4 relative z-10">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center animate-scaleIn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">¡Suscrito correctamente!</h3>
                                    <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">
                                        Revisa tu correo para obtener tu descuento del 10%
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    {/* Left side - Content */}
                                    <div className="flex items-center gap-4 flex-1">
                                        <span className="text-4xl md:text-5xl">🎁</span>
                                        <div>
                                            <h3 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-tight mb-1">
                                                ¿Quieres <span className="text-white/60">descuentos</span> y <span className="text-white/60">novedades</span>?
                                            </h3>
                                            <p className="text-gray-400 text-xs md:text-sm font-bold uppercase tracking-wider">
                                                Suscríbete y obtén un 10% de descuento
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right side - Action buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:min-w-[400px]">
                                        <button
                                            onClick={handleSubscribe}
                                            disabled={status === 'loading'}
                                            className="flex-1 h-12 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {status === 'loading' ? 'Suscribiendo...' : 'Sí, quiero suscribirme'}
                                        </button>

                                        <button
                                            onClick={handleDismiss}
                                            className="flex-1 h-12 bg-white/5 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                                        >
                                            No, gracias
                                        </button>
                                    </div>
                                </div>

                                {status === 'error' && (
                                    <div className="mt-4 text-red-400 text-xs font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                                        {message}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(100%);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes scaleIn {
                    from { 
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                .animate-slideUp {
                    animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }
                
                .animate-scaleIn {
                    animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </>
    );
};

export default NewsletterSubscriptionBanner;
