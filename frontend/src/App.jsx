import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Heart, ThumbsDown, Upload, RefreshCw, User, BarChart2, PieChart as PieChartIcon, Info } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line } from 'recharts';

const API_BASE = 'http://localhost:3000';

const ItemDNA = ({ embedding }) => {
    if (!embedding) return null;
    const vec = Array.isArray(embedding) ? embedding : (typeof embedding === 'string' ? JSON.parse(embedding) : null);
    if (!Array.isArray(vec)) return null;
    const data = vec.slice(0, 8).map((val, i) => ({ name: i, value: Math.abs(val) }));
    return (
        <div className="h-12 w-24 opacity-50">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const UserProfile = ({ userId, refreshTrigger }) => {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${API_BASE}/user/${userId}`);
                setUserData(res.data);
            } catch (err) {
                console.error('Error fetching user:', err);
            }
        };
        fetchUser();
    }, [userId, refreshTrigger]);

    if (!userData) return <div className="p-4 text-gray-500">Loading profile...</div>;

    // Prepare data for Radar Chart (first 12 dimensions of embedding)
    const radarData = userData.embedding ? userData.embedding.slice(0, 12).map((val, i) => ({
        subject: `Dim ${i + 1}`,
        A: Math.abs(val) * 100, // Scale for visibility
        fullMark: 100,
    })) : [];

    // Prepare data for Pie Chart (Modality Affinity)
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
    const pieData = userData.stats.map(s => ({ name: s.type, value: parseInt(s.count) }));

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
                <User className="text-indigo-600" size={24} />
                <h2 className="text-xl font-bold text-gray-800">User Tower</h2>
            </div>

            <div className="space-y-8">
                <div className="h-48">
                    <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-1">
                        <BarChart2 size={12} /> Vector DNA
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                            <PolarGrid stroke="#f1f5f9" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 8 }} />
                            <Radar name="User" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="h-48">
                    <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-1">
                        <PieChartIcon size={12} /> Modality Affinity
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="mt-6 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="flex items-start gap-2">
                    <Info size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-indigo-700 leading-relaxed">
                        This "Tower" represents your learned preferences. Liking content pulls the vector towards that item, while disliking pushes it away.
                    </p>
                </div>
            </div>
        </div>
    );
};

function App() {
    const [items, setItems] = useState([]);
    const [recs, setRecs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [userId] = useState(1); // Hardcoded for PoC
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchData = async () => {
        try {
            const [itemsRes, recsRes] = await Promise.all([
                axios.get(`${API_BASE}/items`),
                axios.get(`${API_BASE}/recommendations/${userId}`)
            ]);
            setItems(itemsRes.rows || itemsRes.data);
            setRecs(recsRes.rows || recsRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userId, refreshTrigger]);

    const handleInteract = async (itemId, type) => {
        await axios.post(`${API_BASE}/interact`, { userId, itemId, type });
        setRefreshTrigger(prev => prev + 1);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        setUploading(true);
        try {
            await axios.post(`${API_BASE}/upload`, formData);
            e.target.reset();
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const renderItem = (item, isRec = false) => {
        const similarity = item.distance !== undefined ? (1 - item.distance).toFixed(2) : null;

        return (
            <div key={item.id} className={`bg-white rounded-xl shadow-sm border ${isRec ? 'border-indigo-200 bg-indigo-50/20' : 'border-gray-100'} overflow-hidden transition-all hover:shadow-md group`}>
                <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col gap-1">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-black rounded uppercase w-fit">
                                {item.type}
                            </span>
                            {similarity && (
                                <span className="text-[10px] font-bold text-indigo-600">
                                    Match: {(similarity * 100).toFixed(0)}%
                                </span>
                            )}
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => handleInteract(item.id, 'like')}
                                className="p-1.5 text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Like - Pulls profile towards this"
                            >
                                <Heart size={18} fill={isRec ? 'currentColor' : 'none'} />
                            </button>
                            <button
                                onClick={() => handleInteract(item.id, 'dislike')}
                                className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                title="Dislike - Pushes profile away"
                            >
                                <ThumbsDown size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        {item.type === 'text' && (
                            <p className="text-gray-800 text-sm leading-relaxed line-clamp-4">{item.text_content}</p>
                        )}
                        {item.type === 'image' && (
                            <img src={`${API_BASE}${item.content_path}`} alt="Content" className="w-full h-32 object-cover rounded-lg" />
                        )}
                        {item.type === 'audio' && (
                            <audio controls src={`${API_BASE}${item.content_path}`} className="w-full mt-2 h-8" />
                        )}
                    </div>

                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Item DNA</span>
                        <ItemDNA embedding={item.embedding} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black">2T</div>
                        <h1 className="text-xl font-black tracking-tighter text-slate-800">TWO-TOWER EXPLORER</h1>
                    </div>
                    <button
                        onClick={() => setRefreshTrigger(prev => prev + 1)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-all text-slate-600 text-sm font-bold"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
                {/* Fixed Sidebar */}
                <div className="lg:w-80 shrink-0">
                    <div className="lg:sticky lg:top-24 space-y-6 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                        <UserProfile userId={userId} refreshTrigger={refreshTrigger} />

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 mb-6">
                                <Upload className="text-indigo-600" size={20} />
                                <h2 className="font-bold text-lg text-slate-800">Add Content</h2>
                            </div>

                            <form onSubmit={handleUpload} className="space-y-4">
                                <select name="type" className="w-full border-slate-200 rounded-lg text-sm font-medium focus:ring-indigo-500">
                                    <option value="text">Text</option>
                                    <option value="image">Image</option>
                                    <option value="audio">Audio</option>
                                </select>
                                <input type="text" name="text" placeholder="Text content..." className="w-full border-slate-200 rounded-lg text-sm" />
                                <input type="file" name="file" className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700" />
                                <button
                                    disabled={uploading}
                                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-black transition-all disabled:opacity-50"
                                >
                                    {uploading ? 'Embedding...' : 'Upload & Index'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    <section className="mb-12">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
                                <h2 className="text-3xl font-black tracking-tight text-slate-800">Recommended</h2>
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top 10 Matches</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {recs.map(item => renderItem(item, true))}
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-8 bg-slate-300 rounded-full"></div>
                                <h2 className="text-3xl font-black tracking-tight text-slate-400">Discovery</h2>
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">All Indexed Items</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {items.map(item => renderItem(item))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default App;
