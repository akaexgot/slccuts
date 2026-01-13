import React, { useState, useEffect, useRef } from 'react';
import { manualMessageTemplate, manualMessageText } from '../../lib/email-templates';

// Use a custom event to open this modal from anywhere
// Use a custom event to open this modal from anywhere
export const openEmailModal = (to: string, orderId: string, status: string = 'pending') => {
    const event = new CustomEvent('open-email-modal', {
        detail: { to, orderId, status }
    });
    window.dispatchEvent(event);
};

export default function EmailModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [emailData, setEmailData] = useState({
        to: '',
        subject: '',
        message: ''
    });
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    const getSubjectByStatus = (status: string, orderId: string) => {
        const id = orderId.slice(0, 8);
        switch (status) {
            case 'completed':
                return `¡Tu pedido #${id} se ha completado!`;
            case 'shipped':
                return `¡Tu pedido #${id} ha sido enviado!`;
            case 'paid':
                return `Confirmación de pedido #${id}`;
            case 'cancelled':
                return `Actualización: Pedido #${id} cancelado`;
            default:
                return `Actualización de tu pedido #${id}`;
        }
    };

    const getMessageByStatus = (status: string) => {
        switch (status) {
            case 'completed':
                return `Hola,\n\nTu pedido ha sido completado exitosamente. Esperamos que disfrutes de tu compra.\n\nGracias por confiar en SLC CUTS.`;
            case 'shipped':
                return `Hola,\n\n¡Buenas noticias! Tu pedido ha salido de nuestro almacén y está en camino.\n\nPronto recibirás información de seguimiento.`;
            case 'paid':
                return `Hola,\n\nHemos recibido correctamente el pago de tu pedido. Estamos procediendo a prepararlo.\n\nTe avisaremos cuando sea enviado.`;
            case 'cancelled':
                return `Hola,\n\nTe informamos que tu pedido ha sido cancelado.\n\nSi tienes alguna duda, por favor contáctanos.`;
            default:
                return `Hola,\n\nTe escribimos en relación a tu pedido en SLC CUTS.\n\n`;
        }
    };

    useEffect(() => {
        const handleOpen = (e: any) => {
            const { to, orderId, status } = e.detail;
            console.log('EmailModal: Received open-email-modal event', { to, orderId, status });
            setEmailData({
                to,
                subject: getSubjectByStatus(status, orderId),
                message: getMessageByStatus(status)
            });
            setIsOpen(true);
            setIsSuccess(false);
            document.body.style.overflow = 'hidden';
        };

        window.addEventListener('open-email-modal', handleOpen);
        return () => {
            window.removeEventListener('open-email-modal', handleOpen);
        };
    }, []);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeModal();
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
        }

        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const closeModal = () => {
        setIsOpen(false);
        setIsSuccess(false);
        document.body.style.overflow = '';
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            closeModal();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        try {
            const response = await fetch('/api/emails/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: emailData.to,
                    subject: emailData.subject,
                    text: manualMessageText(emailData.message),
                    html: manualMessageTemplate(emailData.message),
                }),
            });

            if (response.ok) {
                console.log('Email sent successfully');
                setIsSuccess(true);
                // Auto close after showing success
                setTimeout(() => {
                    closeModal();
                }, 2000);
            } else {
                const error = await response.json();
                console.error('Error sending email:', error);
                alert('Error al enviar el email: ' + (error.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Network error sending email:', error);
            alert('Error de red al enviar el email');
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="relative bg-[#0B1121] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 min-h-[400px] flex flex-col"
            >
                {/* Close Button */}
                <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {isSuccess ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-green-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">¡Email Enviado!</h3>
                        <p className="text-gray-400">El correo se ha enviado correctamente al cliente.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-6 pb-2">
                            <h3 className="text-xl font-bold text-white uppercase tracking-wide">Enviar Email</h3>
                            <p className="text-sm text-gray-400 mt-1">Notifica al cliente sobre su pedido</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-5 flex-1 flex flex-col">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-white mb-2">Para</label>
                                <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                                        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                                    </svg>
                                    <span className="text-sm font-medium">{emailData.to}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-white mb-2">Asunto</label>
                                <input
                                    required
                                    type="text"
                                    value={emailData.subject}
                                    onChange={e => setEmailData({ ...emailData, subject: e.target.value })}
                                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:ring-0 outline-none transition-all font-medium"
                                    placeholder="Asunto del correo"
                                />
                            </div>

                            <div className="flex-1">
                                <label className="block text-xs font-bold uppercase tracking-wider text-white mb-2">Mensaje</label>
                                <textarea
                                    required
                                    value={emailData.message}
                                    onChange={e => setEmailData({ ...emailData, message: e.target.value })}
                                    className="w-full h-32 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:ring-0 outline-none resize-none transition-all leading-relaxed"
                                    placeholder="Escribe tu mensaje aquí..."
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-3 text-white hover:text-gray-300 font-bold uppercase tracking-wider text-sm transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSending}
                                    className={`px-8 py-3 bg-white text-black font-bold uppercase tracking-wider rounded-lg hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-2 text-sm shadow-lg ${isSending ? 'opacity-75 cursor-not-allowed' : ''}`}
                                >
                                    {isSending ? (
                                        <>
                                            <span className="animate-spin">⟳</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                            </svg>
                                            Enviar
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
