// pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import googleCalendarService from '../services/googleCalendarService';
import { FiCalendar, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';

function SettingsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        checkConnectionStatus();

        // Kiểm tra query params từ OAuth callback
        const connected = searchParams.get('google-calendar-connected');
        const error = searchParams.get('google-calendar-error');
        const errorDescription = searchParams.get('error-description');

        if (connected === 'true') {
            setMessage('Kết nối Google Calendar thành công!');
            setTimeout(() => {
                setSearchParams({});
                setMessage('');
            }, 5000);
            checkConnectionStatus();
        } else if (error) {
            // Hiển thị thông báo lỗi chi tiết hơn
            let errorMessage = 'Kết nối Google Calendar thất bại. ';
            
            switch(error) {
                case 'access_denied':
                    errorMessage += 'Bạn đã từ chối cấp quyền. Vui lòng cấp quyền khi được hỏi.';
                    break;
                case 'missing_code':
                    errorMessage += 'Thiếu mã xác thực. Vui lòng thử lại.';
                    break;
                case 'missing_state':
                    errorMessage += 'Thiếu thông tin xác thực. Vui lòng thử lại.';
                    break;
                case 'invalid_state':
                    errorMessage += 'Thông tin xác thực không hợp lệ. Vui lòng thử lại.';
                    break;
                case 'callback_failed':
                    errorMessage += 'Không thể xử lý kết nối. Vui lòng thử lại.';
                    break;
                case 'server_error':
                    errorMessage += 'Lỗi máy chủ. Vui lòng thử lại sau.';
                    break;
                default:
                    if (errorDescription) {
                        errorMessage += errorDescription;
                    } else {
                        errorMessage += 'Vui lòng thử lại.';
                    }
            }
            
            setMessage(errorMessage);
            setTimeout(() => {
                setSearchParams({});
                setMessage('');
            }, 10000);
        }
    }, [searchParams, setSearchParams]);

    const checkConnectionStatus = async () => {
        try {
            setLoading(true);
            const status = await googleCalendarService.getConnectionStatus();
            setConnectionStatus(status);
        } catch (error) {
            console.error('Error checking connection status:', error);
            setConnectionStatus({ isConnected: false });
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        try {
            setConnecting(true);
            setMessage('');
            const { authUrl } = await googleCalendarService.getAuthUrl();
            // Redirect đến Google OAuth
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error getting auth URL:', error);
            setMessage('Không thể lấy URL xác thực. Vui lòng thử lại.');
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn ngắt kết nối Google Calendar?')) {
            return;
        }

        try {
            setLoading(true);
            await googleCalendarService.disconnect();
            setMessage('Đã ngắt kết nối Google Calendar thành công.');
            await checkConnectionStatus();
        } catch (error) {
            console.error('Error disconnecting:', error);
            setMessage('Không thể ngắt kết nối. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-neutral-800 mb-8">Cài đặt</h1>

            {/* Message */}
            {message && (
                <div className={`mb-6 p-4 rounded-lg ${
                    message.includes('thành công') || message.includes('success')
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    {message}
                </div>
            )}

            {/* Google Calendar Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <FiCalendar className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-semibold text-neutral-800">
                            Google Calendar
                        </h2>
                    </div>
                </div>

                <p className="text-neutral-600 mb-6">
                    Kết nối Google Calendar để nhận thông báo khi task đến hạn. 
                    Bạn sẽ nhận được 2 thông báo: một vào 0h ngày đến hạn và một vào đúng thời gian đến hạn.
                </p>

                {loading ? (
                    <div className="flex items-center gap-2 text-neutral-600">
                        <FiRefreshCw className="w-5 h-5 animate-spin" />
                        <span>Đang kiểm tra...</span>
                    </div>
                ) : connectionStatus?.isConnected ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600">
                            <FiCheckCircle className="w-5 h-5" />
                            <span className="font-medium">Đã kết nối</span>
                        </div>
                        
                        {connectionStatus.connectedAt && (
                            <p className="text-sm text-neutral-600">
                                Kết nối vào: {new Date(connectionStatus.connectedAt).toLocaleString('vi-VN')}
                            </p>
                        )}
                        
                        {connectionStatus.expiresAt && (
                            <p className="text-sm text-neutral-600">
                                Hết hạn: {new Date(connectionStatus.expiresAt).toLocaleString('vi-VN')}
                            </p>
                        )}

                        <button
                            onClick={handleDisconnect}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <FiXCircle className="w-5 h-5" />
                            Ngắt kết nối
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {connecting ? (
                            <>
                                <FiRefreshCw className="w-5 h-5 animate-spin" />
                                <span>Đang kết nối...</span>
                            </>
                        ) : (
                            <>
                                <FiCalendar className="w-5 h-5" />
                                <span>Kết nối Google Calendar</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

export default SettingsPage;

