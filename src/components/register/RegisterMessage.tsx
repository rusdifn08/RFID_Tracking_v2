import { memo } from 'react';

interface RegisterMessageProps {
    type: 'error' | 'success';
    message: string;
}

const RegisterMessage = memo(({ type, message }: RegisterMessageProps) => {
    if (!message) return null;

    const isError = type === 'error';
    const bgColor = isError ? 'bg-red-50' : 'bg-green-50';
    const borderColor = isError ? 'border-red-500' : 'border-green-500';
    const textColor = isError ? 'text-red-700' : 'text-green-700';

    return (
        <div className={`w-full p-3 sm:p-4 ${bgColor} border-l-4 ${borderColor} ${textColor} rounded-lg text-xs sm:text-sm mb-4 animate-fade-in`}>
            <div className="flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    {isError ? (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    )}
                </svg>
                <span className="break-words">{message}</span>
            </div>
        </div>
    );
});

RegisterMessage.displayName = 'RegisterMessage';

export default RegisterMessage;

