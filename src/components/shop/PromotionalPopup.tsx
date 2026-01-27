import React, { useState, useEffect } from 'react';

interface PopupData {
    id: string;
    title: string;
    content: string;
    button_text: string;
    button_link: string;
    image_url: string;
}

interface Props {
    popup: PopupData | null;
}

const PromotionalPopup: React.FC<Props> = ({ popup }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!popup) return;

        const dismissedPopups = JSON.parse(localStorage.getItem('slccuts_dismissed_popups') || '[]');
        if (dismissedPopups.includes(popup.id)) return;

        const timer = setTimeout(() => {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        }, 2000); // Reduced delay for better UX

        return () => {
            clearTimeout(timer);
            document.body.style.overflow = '';
        };
    }, [popup]);

    const handleClose = () => {
        if (!popup) return;
        setIsVisible(false);
        document.body.style.overflow = '';
        const dismissedPopups = JSON.parse(localStorage.getItem('slccuts_dismissed_popups') || '[]');
        dismissedPopups.push(popup.id);
        localStorage.setItem('slccuts_dismissed_popups', JSON.stringify(dismissedPopups));
    };

    if (!popup) return null;

    return (
        <div
            className={`fixed inset-0 z-[200] flex items-center justify-center transition-all duration-700 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
            {/* Backdrop with heavy blur */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-[550px] m-6 bg-white rounded-[3rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] transform transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${isVisible ? 'scale-100 translate-y-0 rotate-0' : 'scale-90 translate-y-20 rotate-1'}`}>
                {popup.image_url && (
                    <div className="h-72 relative group bg-gray-100">
                        <img
                            src={popup.image_url}
                            alt={popup.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                console.error("Error loading popup image:", popup.image_url);
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-80" />
                    </div>
                )}

                <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 hover:scale-110 active:scale-90 transition-all z-20 shadow-xl"
                    aria-label="Cerrar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>

                <div className="p-12 text-center relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl">
                        Especial
                    </div>

                    <h2 className="text-5xl font-black text-black italic uppercase tracking-tighter leading-none mb-6">
                        {popup.title}
                    </h2>

                    <p className="text-gray-500 font-medium text-sm mb-10 leading-relaxed max-w-sm mx-auto">
                        {popup.content}
                    </p>

                    {popup.button_text && (
                        <a
                            href={popup.button_link || '#'}
                            className="group relative inline-flex items-center justify-center w-full h-18 bg-black text-white rounded-[1.5rem] overflow-hidden transition-all duration-300 hover:bg-gray-900 shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
                        >
                            <span className="relative z-10 font-black uppercase tracking-[0.2em] text-xs transition-transform duration-300 group-hover:translate-x-[-4px]">
                                {popup.button_text}
                            </span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="relative z-10 transition-all duration-300 translate-x-4 opacity-0 group-hover:translate-x-2 group-hover:opacity-100"
                            >
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromotionalPopup;
