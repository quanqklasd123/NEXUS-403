import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiTag, FiDollarSign, FiUser, FiClock, FiCheck } from 'react-icons/fi';
import apiService from '../services/apiService';
import RenderComponent from '../components/builder/RenderComponent';

export default function MarketplacePreviewPage() {
    const { appId } = useParams();
    const navigate = useNavigate();

    const [app, setApp] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            if (!appId) return;
            try {
                setLoading(true);
                const res = await apiService.getMarketplaceAppDetail(appId);
                const data = res.data;
                setApp(data);
                if (data && data.jsonData) {
                    try {
                        const parsed = typeof data.jsonData === 'string' ? JSON.parse(data.jsonData) : data.jsonData;
                        setItems(parsed);
                    } catch (e) {
                        console.error('Error parsing marketplace app jsonData', e);
                        setItems([]);
                    }
                }
            } catch (err) {
                console.error(err);
                setError('Không thể tải preview.');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [appId]);

    const handleInstall = async () => {
        try {
            setInstalling(true);
            await apiService.installApp(appId);
            alert("Cài đặt thành công! App đã được thêm vào 'My Apps'.");
            navigate('/apps');
        } catch (error) {
            console.error("Error installing app:", error);
            alert(error.response?.data?.message || "Không thể cài đặt app.");
        } finally {
            setInstalling(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Đang tải preview...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        <div className="fixed inset-0 bg-neutral-50 z-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                        <FiArrowLeft className="w-5 h-5 text-neutral-600" />
                    </button>
                    <div>
                        <h2 className="font-bold text-lg text-neutral-900">{app?.name || 'Preview'}</h2>
                        <p className="text-xs text-neutral-500">Read-only preview from marketplace</p>
                    </div>
                </div>
                
                {/* Install Button */}
                {app?.isInstalled ? (
                    <button disabled className="flex items-center gap-2 px-5 py-2.5 bg-neutral-100 text-neutral-600 rounded-lg font-medium">
                        <FiCheck className="w-4 h-4" />
                        Installed
                    </button>
                ) : (
                    <button 
                        onClick={handleInstall}
                        disabled={installing}
                        className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-black transition-all disabled:opacity-50"
                    >
                        <FiDownload className="w-4 h-4" />
                        {installing ? 'Installing...' : 'Install App'}
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-6 flex gap-6">
                    {/* Left Column - App Info */}
                    <div className="w-80 flex-shrink-0">
                        <div className="bg-white rounded-lg border-2 border-neutral-200 overflow-hidden sticky top-6">
                            {/* App Header */}
                            <div className="p-6 border-b-2 border-neutral-100">
                                <div className="w-16 h-16 bg-neutral-900 rounded-xl flex items-center justify-center mb-4">
                                    <span className="text-2xl text-white font-bold">
                                        {app?.name?.charAt(0).toUpperCase() || 'A'}
                                    </span>
                                </div>
                                <h3 className="font-bold text-xl text-neutral-900 mb-2">{app?.name}</h3>
                                <p className="text-sm text-neutral-600 leading-relaxed">
                                    {app?.description || 'No description available'}
                                </p>
                            </div>

                            {/* App Stats */}
                            <div className="p-6 space-y-4">
                                {/* Category */}
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FiTag className="w-4 h-4 text-neutral-700" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Category</p>
                                        <p className="text-sm font-bold text-neutral-900">{app?.category || 'Uncategorized'}</p>
                                    </div>
                                </div>

                                {/* Downloads */}
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FiDownload className="w-4 h-4 text-neutral-700" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Downloads</p>
                                        <p className="text-sm font-bold text-neutral-900">{app?.downloads || '0'} installs</p>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FiDollarSign className="w-4 h-4 text-neutral-700" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Price</p>
                                        <p className="text-sm font-bold text-neutral-900">
                                            {app?.price || 'FREE'}
                                        </p>
                                    </div>
                                </div>

                                {/* Author */}
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FiUser className="w-4 h-4 text-neutral-700" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Author</p>
                                        <p className="text-sm font-bold text-neutral-900">{app?.author || 'Anonymous'}</p>
                                    </div>
                                </div>

                                {/* Last Updated */}
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FiClock className="w-4 h-4 text-neutral-700" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Last Updated</p>
                                        <p className="text-sm font-bold text-neutral-900">
                                            {app?.updatedAt ? new Date(app.updatedAt).toLocaleDateString('vi-VN') : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Install Button (Bottom) */}
                            <div className="p-4 border-t-2 border-neutral-100">
                                {app?.isInstalled ? (
                                    <button disabled className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-neutral-100 text-neutral-600 rounded-lg font-bold">
                                        <FiCheck className="w-4 h-4" />
                                        INSTALLED
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleInstall}
                                        disabled={installing}
                                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-neutral-900 text-white rounded-lg font-bold hover:bg-black transition-all disabled:opacity-50"
                                    >
                                        <FiDownload className="w-4 h-4" />
                                        {installing ? 'INSTALLING...' : 'INSTALL APP'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Preview */}
                    <div className="flex-1">
                        <div className="bg-white rounded-lg border-2 border-neutral-200 p-8 min-h-[600px]">
                            <div className="mb-6 pb-4 border-b-2 border-neutral-100">
                                <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-2">Live Preview</h4>
                                <p className="text-xs text-neutral-400">This is a read-only preview. Install to customize and use.</p>
                            </div>
                            {items && items.length > 0 ? (
                                <div className="space-y-4">
                                    {items.filter(i => !i.parentId).map(root => (
                                        <RenderComponent key={root.id} item={root} items={items} isPreview={true} context={{}} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-neutral-400">
                                    <p className="text-lg font-medium mb-2">No preview content available</p>
                                    <p className="text-sm">This app may not have any visible components</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
