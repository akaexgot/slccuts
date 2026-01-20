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
        }, 3000);

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
            className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-[600px] m-6 bg-white rounded-[2.5rem] overflow-hidden shadow-2xl transform transition-transform duration-700 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>
                {popup.image_url && (
                    <div className="h-64 relative">
                        <img
                            src={popup.image_url}
                            alt={popup.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                    </div>
                )}

                <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>

                <div className="p-10 text-center">
                    <h2 className="text-4xl font-black text-black italic uppercase tracking-tighter leading-none mb-4">
                        {popup.title}
                    </h2>

                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-8 leading-relaxed max-w-md mx-auto">
                        {popup.content}
                    </p>

                    {popup.button_text && (
                        <a
                            href={popup.button_link || '#'}
                            className="inline-block px-12 h-16 bg-black text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-800 transition-all font-black uppercase tracking-widest text-xs shadow-2xl hover:shadow-black/20"
                        >
                            {popup.button_text}
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromotionalPopup;
