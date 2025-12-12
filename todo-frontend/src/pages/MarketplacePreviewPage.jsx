import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import apiService from '../services/apiService';
import RenderComponent from '../components/builder/RenderComponent';

export default function MarketplacePreviewPage() {
    const { appId } = useParams();
    const navigate = useNavigate();

    const [app, setApp] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (loading) return <div className="p-10 text-center">Đang tải preview...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        <div className="fixed inset-0 bg-neutral-50 z-50 flex flex-col">
            <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-neutral-100 rounded-lg">
                    <FiArrowLeft className="w-5 h-5 text-neutral-600" />
                </button>
                <div>
                    <h2 className="font-semibold text-neutral-800">{app?.name || 'Preview'}</h2>
                    <p className="text-xs text-neutral-500">Read-only preview. Install to edit.</p>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto bg-white rounded-lg p-6">
                    {items && items.length > 0 ? (
                        items.filter(i => !i.parentId).map(root => (
                            <RenderComponent key={root.id} item={root} items={items} isPreview={true} context={{}} />
                        ))
                    ) : (
                        <div className="text-center text-neutral-500">No preview content</div>
                    )}
                </div>
            </div>
        </div>
    );
}
