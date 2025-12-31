import { memo } from 'react';
import loginSvg from '../../assets/login.svg';

const RegisterLeftSide = memo(() => {
    return (
        <div className="hidden lg:flex w-full lg:w-1/2 relative h-screen bg-transparent overflow-hidden">
            <div className="relative z-10 flex flex-col h-full w-full px-6 xl:px-12 py-8 xl:py-12 text-white">
                <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
                    <h1 className="text-xl xl:text-2xl 2xl:text-3xl font-bold mb-6 xl:mb-8 leading-tight max-w-2xl">
                        Enterprise Resource Monitoring System PT. Gistex Garment Indonesia
                    </h1>
                    <div className="relative w-full max-w-md xl:max-w-lg mt-4 xl:mt-8">
                        <img
                            src={loginSvg}
                            alt="Register Illustration"
                            className="w-full h-auto drop-shadow-2xl"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});

RegisterLeftSide.displayName = 'RegisterLeftSide';

export default RegisterLeftSide;

