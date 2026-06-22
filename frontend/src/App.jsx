import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Heart, Upload, RefreshCw, User, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const API_BASE = 'http://localhost:3000';

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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center gap-2 mb-6">
                <User className="text-indigo-600" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Your Interest Profile</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-64">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                        <BarChart2 size={14} /> Embedding DNA (First 12 Dimensions)
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <Radar
                                name="User"
                                dataKey="A"
                                stroke="#4f46e5"
                                fill="#4f46e5"
                                fillOpacity={0.6}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="h-64">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                        <PieChartIcon size={14} /> Content Type Affinity
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <p className="mt-4 text-xs text-gray-400 italic">
                The Radar chart shows your "vector fingerprint". It shifts in real-time as you interact with different content.
            </p>
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

    const handleLike = async (itemId) => {
        await axios.post(`${API_BASE}/interact`, { userId, itemId, type: 'like' });
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

    const renderItem = (item, isRec = false) => (
        <div key={item.id} className={`bg-white rounded-xl shadow-sm border ${isRec ? 'border-indigo-100 bg-indigo-50/30' : 'border-gray-100'} overflow-hidden transition-all hover:shadow-md`}>
            <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded uppercase">
                        {item.type}
                    </span>
                    {!isRec && (
                        <button
                            onClick={() => handleLike(item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Heart size={20} />
                        </button>
                    )}
                </div>

                {item.type === 'text' && (
                    <p className="text-gray-800 text-sm leading-relaxed">{item.text_content}</p>
                )}
                {item.type === 'image' && (
                    <img src={`${API_BASE}${item.content_path}`} alt="Content" className="w-full h-40 object-cover rounded-lg" />
                )}
                {item.type === 'audio' && (
                    <audio controls src={`${API_BASE}${item.content_path}`} className="w-full mt-2" />
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-2xl font-black tracking-tight text-indigo-600">TWO-TOWER POC</h1>
                    <button
                        onClick={() => setRefreshTrigger(prev => prev + 1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                        title="Refresh Recommendations"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar: Upload */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
                        <div className="flex items-center gap-2 mb-6">
                            <Upload className="text-indigo-600" size={20} />
                            <h2 className="font-bold text-lg">Add Content</h2>
                        </div>

                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                <select name="type" className="w-full border-gray-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="text">Text</option>
                                    <option value="image">Image</option>
                                    <option value="audio">Audio</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Content</label>
                                <input type="text" name="text" placeholder="Text content..." className="w-full border-gray-200 rounded-lg text-sm mb-2" />
                                <input type="file" name="file" className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                            </div>

                            <button
                                disabled={uploading}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {uploading ? 'Processing...' : 'Upload & Embed'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    {/* User Profile Visualization */}
                    <UserProfile userId={userId} refreshTrigger={refreshTrigger} />

                    <section className="mb-12">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                            <h2 className="text-2xl font-bold">Recommended for You</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recs.map(item => renderItem(item, true))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-6 text-gray-500">All Content</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {items.map(item => renderItem(item))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default App;
