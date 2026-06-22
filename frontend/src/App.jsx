import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Heart, Music, Image as ImageIcon, FileText, RefreshCw } from 'lucide-react';

const API_URL = 'http://localhost:3000';

function App() {
    const [items, setItems] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [userId] = useState(1); // Default user
    const [uploadType, setUploadType] = useState('text');
    const [uploadText, setUploadText] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchItems = async () => {
        const res = await axios.get(`${API_URL}/items`);
        setItems(res.data);
    };

    const fetchRecommendations = async () => {
        const res = await axios.get(`${API_URL}/recommendations/${userId}`);
        setRecommendations(res.data);
    };

    useEffect(() => {
        fetchItems();
        fetchRecommendations();
    }, []);

    const handleInteract = async (itemId) => {
        await axios.post(`${API_URL}/interact`, { userId, itemId, type: 'like' });
        fetchRecommendations();
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        formData.append('type', uploadType);
        if (uploadType === 'text') {
            formData.append('text', uploadText);
        } else {
            formData.append('file', uploadFile);
        }

        try {
            await axios.post(`${API_URL}/upload`, formData);
            setUploadText('');
            setUploadFile(null);
            fetchItems();
            fetchRecommendations();
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = (item, isRec = false) => (
        <div key={item.id} className={`p-4 border rounded-lg shadow-sm bg-white ${isRec ? 'border-blue-200' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
                {item.type === 'image' && <ImageIcon size={20} className="text-green-500" />}
                {item.type === 'audio' && <Music size={20} className="text-purple-500" />}
                {item.type === 'text' && <FileText size={20} className="text-blue-500" />}
                <span className="text-xs font-semibold uppercase text-gray-500">{item.type}</span>
            </div>

            {item.type === 'image' && (
                <img src={`${API_URL}${item.content_path}`} alt="content" className="w-full h-32 object-cover rounded mb-2" />
            )}
            {item.type === 'audio' && (
                <audio controls src={`${API_URL}${item.content_path}`} className="w-full mb-2" />
            )}
            {item.type === 'text' && (
                <p className="text-sm mb-2 line-clamp-3">{item.text_content}</p>
            )}

            <button
                onClick={() => handleInteract(item.id)}
                className="flex items-center gap-1 text-pink-500 hover:bg-pink-50 px-2 py-1 rounded transition"
            >
                <Heart size={16} />
                <span className="text-sm">Like</span>
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">Two-Tower Recommender PoC</h1>
                    <button onClick={fetchRecommendations} className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition">
                        <RefreshCw size={18} /> Refresh Recs
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Upload Section */}
                    <section className="bg-white p-6 rounded-xl shadow-md h-fit">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Upload size={20} /> Upload Content
                        </h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                    value={uploadType}
                                    onChange={(e) => setUploadType(e.target.value)}
                                    className="mt-1 block w-full border rounded-md p-2"
                                >
                                    <option value="text">Text</option>
                                    <option value="image">Image</option>
                                    <option value="audio">Audio</option>
                                </select>
                            </div>

                            {uploadType === 'text' ? (
                                <textarea
                                    value={uploadText}
                                    onChange={(e) => setUploadText(e.target.value)}
                                    placeholder="Enter text content..."
                                    className="w-full border rounded-md p-2 h-24"
                                    required
                                />
                            ) : (
                                <input
                                    type="file"
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                    className="w-full"
                                    required
                                />
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
                            >
                                {loading ? 'Processing...' : 'Upload & Embed'}
                            </button>
                        </form>
                    </section>

                    {/* Recommendations Section */}
                    <section className="md:col-span-2">
                        <h2 className="text-xl font-semibold mb-4 text-blue-600">Recommended for You</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            {recommendations.map(item => renderItem(item, true))}
                            {recommendations.length === 0 && <p className="text-gray-500 italic">No recommendations yet. Interact with items below!</p>}
                        </div>

                        <h2 className="text-xl font-semibold mb-4 text-gray-600">All Content</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {items.map(item => renderItem(item))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default App;
