import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const NewsletterPopup: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const hasSubscribed = localStorage.getItem('slccuts_newsletter_subscribed');
        const hasDismissed = localStorage.getItem('slccuts_newsletter_dismissed');

        if (!hasSubscribed && !hasDismissed) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 5000); // Show after 5 seconds
            return () => clearTimeout(timer);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            // Check content type before parsing
            const contentType = response.headers.get("content-type");
            let data;

            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                // If not JSON (likely a 500 error page), throw custom error
                throw new Error("Respuesta inesperada del servidor");
            }

            if (response.ok) {
                setStatus('success');
                localStorage.setItem('slccuts_newsletter_subscribed', 'true');
                setTimeout(() => setIsVisible(false), 3000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Algo ha salido mal. Inténtalo de nuevo.');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage('Error de conexión. Comprueba tu red.');
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('slccuts_newsletter_dismissed', 'true');
    };

    if (!isVisible && status !== 'success') return null;

    return (
        <div className={`fixed inset-x-4 bottom-6 md:inset-auto md:bottom-6 md:right-6 z-[200] w-auto md:w-[350px] max-w-lg mx-auto transform transition-all duration-700 ease-out flex justify-center md:block ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
            <div className="bg-black/95 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group w-full">
                {/* Background effects */}
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 blur-[50px] rounded-full group-hover:bg-white/10 transition-all duration-700" />

                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                    aria-label="Cerrar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>

                {status === 'success' ? (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 scale-animation">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">¡Bienvenido!</h3>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                            Revisa tu correo para obtener tu regalo
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-2xl">🎁</span>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] leading-none">Un regalo te espera</span>
                        </div>

                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">
                            Consigue <span className="text-white/40 italic">-10%</span><br />
                            en tu pedido
                        </h3>

                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed">
                            Suscríbete a nuestra newsletter para recibir tu cupón y ofertas exclusivas
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    placeholder="Tu email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-6 text-sm font-bold text-white placeholder:text-gray-600 focus:border-white/20 focus:outline-none transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full h-14 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {status === 'loading' ? 'Enviando...' : '¡Lo quiero!'}
                            </button>

                            {status === 'error' && (
                                <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest text-center mt-2">
                                    {message}
                                </p>
                            )}
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default NewsletterPopup;
