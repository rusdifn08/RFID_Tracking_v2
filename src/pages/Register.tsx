import { useState, memo, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import backgroundImage from '../assets/aksen.svg';
import { useRegister } from '../hooks/useAuth';
import RegisterHeader from '../components/register/RegisterHeader';
import RegisterMessage from '../components/register/RegisterMessage';
import RegisterLeftSide from '../components/register/RegisterLeftSide';
import RegisterFormField from '../components/register/RegisterFormField';

// Schema validasi dengan ZOD
const registerSchema = z.object({
    rfid_user: z.string().min(1, 'RFID User harus diisi'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    nama: z.string().min(1, 'Nama harus diisi'),
    nik: z.string().min(1, 'NIK harus diisi'),
    bagian: z.string().min(1, 'Bagian harus dipilih'),
    line: z.string().min(1, 'Line harus dipilih'),
    telegram: z.string().optional(),
    no_hp: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register = memo(() => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const registerMutation = useRegister();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            rfid_user: '',
            password: '',
            nama: '',
            nik: '',
            bagian: '',
            line: '',
            telegram: '',
            no_hp: '',
        },
    });

    const onSubmit = async (data: RegisterFormData) => {
        registerMutation.mutate(
            {
                rfid_user: data.rfid_user,
                password: data.password,
                nama: data.nama,
                nik: data.nik,
                bagian: data.bagian,
                line: data.line,
                telegram: data.telegram,
                no_hp: data.no_hp,
            },
            {
                onSuccess: () => {
                    // Reset form setelah 2 detik
                    setTimeout(() => {
                        reset();
                        // Redirect ke login setelah 3 detik
                        setTimeout(() => {
                            navigate('/login');
                        }, 3000);
                    }, 2000);
                },
                onError: (error: Error) => {
                    console.error('❌ [Register] Error:', error);
                },
            }
        );
    };

    const error = registerMutation.error?.message || '';
    const success = registerMutation.isSuccess ? 'Registrasi berhasil! Silakan login dengan NIK dan Password Anda.' : '';
    const isSubmitting = registerMutation.isPending;

    // Options untuk bagian dan line - dioptimasi dengan useMemo
    const bagianOptions = useMemo(() => ['SEWING', 'CUTTING', 'QC', 'ROBOTIC', 'IT', 'HR', 'FINANCE', 'WAREHOUSE'], []);
    const lineOptions = useMemo(() => ['LINE 1', 'LINE 2', 'LINE 3', 'LINE 4', 'LINE 5', 'LINE 6', 'LINE 8', 'LINE 9', 'CUTTING GM1'], []);

    // Toggle password - dioptimasi dengan useCallback
    const togglePassword = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    return (
        <div className="fixed inset-0 w-screen h-screen flex m-0 p-0 overflow-hidden">
            {/* Background SVG */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top',
                    backgroundRepeat: 'no-repeat',
                    width: '100%',
                    height: '100%',
                }}
            />

            {/* Grid Layout 2 Kolom */}
            <div className="w-full h-screen flex flex-col lg:flex-row relative z-10 overflow-hidden">
                {/* Left Side - Aksen SVG & Illustration - Hidden on Mobile */}
                <RegisterLeftSide />

                {/* Right Side - Register Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center relative h-screen overflow-y-auto bg-transparent">
                    <div className="w-full max-w-2xl mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 xl:px-12">
                        {/* Card Container */}
                        <div className="bg-gray-100 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden p-4 sm:p-6 md:p-8">
                            {/* Header */}
                            <RegisterHeader />

                            {/* Error Message */}
                            <RegisterMessage type="error" message={error} />

                            {/* Success Message */}
                            <RegisterMessage type="success" message={success} />

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                                {/* Grid 2 Kolom untuk Field Utama */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    <RegisterFormField
                                        label="RFID User"
                                        name="rfid_user"
                                        type="text"
                                        placeholder="Masukkan RFID User"
                                        required
                                        error={errors.rfid_user?.message}
                                        register={register('rfid_user')}
                                    />
                                    <RegisterFormField
                                        label="Password"
                                        name="password"
                                        type="password"
                                        placeholder="Masukkan Password"
                                        required
                                        error={errors.password?.message}
                                        register={register('password')}
                                        showPassword={showPassword}
                                        onTogglePassword={togglePassword}
                                    />
                                    <RegisterFormField
                                        label="Nama"
                                        name="nama"
                                        type="text"
                                        placeholder="Masukkan Nama Lengkap"
                                        required
                                        error={errors.nama?.message}
                                        register={register('nama')}
                                    />
                                    <RegisterFormField
                                        label="NIK"
                                        name="nik"
                                        type="text"
                                        placeholder="Masukkan NIK"
                                        required
                                        error={errors.nik?.message}
                                        register={register('nik')}
                                    />
                                    <RegisterFormField
                                        label="Bagian"
                                        name="bagian"
                                        type="select"
                                        required
                                        error={errors.bagian?.message}
                                        register={register('bagian')}
                                        options={bagianOptions}
                                    />
                                    <RegisterFormField
                                        label="Line"
                                        name="line"
                                        type="select"
                                        required
                                        error={errors.line?.message}
                                        register={register('line')}
                                        options={lineOptions}
                                    />
                                    <RegisterFormField
                                        label="Telegram"
                                        name="telegram"
                                        type="text"
                                        placeholder="Masukkan Telegram (Opsional)"
                                        register={register('telegram')}
                                    />
                                    <RegisterFormField
                                        label="No. HP"
                                        name="no_hp"
                                        type="text"
                                        placeholder="Masukkan No. HP (Opsional)"
                                        register={register('no_hp')}
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4 flex flex-col items-center gap-3">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-1/2 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Mendaftar...' : 'Register'}
                                    </button>
                                    
                                    <Link
                                        to="/login"
                                        className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors"
                                    >
                                        Sudah punya akun? Masuk di sini
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

Register.displayName = 'Register';

export default Register;

