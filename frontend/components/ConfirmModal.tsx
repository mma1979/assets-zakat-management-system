import React from 'react';
import { Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    icon?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    icon
}) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        {icon || <Trash2 size={24} />}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm mb-6">{message}</p>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="px-4 py-2 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
                        >
                            {t('confirm')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
