import { memo } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, ArrowLeft } from 'lucide-react';

const RegisterHeader = memo(() => {
    return (
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Link
                to="/login"
                className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Kembali ke Login"
            >
                <ArrowLeft size={18} className="text-gray-600" />
            </Link>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                    <UserPlus size={20} className="text-blue-600" />
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                        Register New User
                    </h2>
                </div>
                <p className="text-xs text-gray-600">
                    Lengkapi form di bawah untuk membuat akun baru
                </p>
            </div>
        </div>
    );
});

RegisterHeader.displayName = 'RegisterHeader';

export default RegisterHeader;

