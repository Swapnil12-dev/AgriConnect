import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [authRole, setAuthRole] = useState('buyer');
  const [isLogin, setIsLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [location, setLocation] = useState('');

  const [marketGrains, setMarketGrains] = useState([]);
  const [pitchInputs, setPitchInputs] = useState({});
  const [myPitches, setMyPitches] = useState([]);
  const [incomingPitches, setIncomingPitches] = useState([]);

  // --- API CALLS ---
  const fetchMarketGrains = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/grains');
      setMarketGrains(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchBuyerPitches = async (buyerId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/pitches/buyer/${buyerId}`);
      setMyPitches(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchFarmerPitches = async (farmerId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/pitches/farmer/${farmerId}`);
      setIncomingPitches(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (currentView === 'dashboard' && user) {
      if (user.role === 'buyer') {
        fetchMarketGrains();
        fetchBuyerPitches(user.id);
      } else if (user.role === 'farmer') {
        fetchFarmerPitches(user.id);
      }
    }
  }, [currentView, user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentView('landing');
    toast.success('Logged out successfully');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = isLogin ? 'http://localhost:5000/api/auth/login' : 'http://localhost:5000/api/auth/register';
    const payload = isLogin ? { email_or_phone: email, password: password } : { full_name: fullName, email_or_phone: email, password: password, role: authRole };

    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error);
      } else {
        if (isLogin) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);
          setCurrentView('dashboard');
          toast.success(`Welcome back, ${data.user.full_name}!`);
        } else {
          toast.success('Account created! Please sign in.');
          setTimeout(() => { setIsLogin(true); setPassword(''); }, 1500);
        }
      }
    } catch (error) {
      toast.error('Cannot connect to server. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishListing = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/grains', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmer_id: user.id, crop_name: cropName, quantity: quantity, asking_price: askingPrice, location: location })
      });
      if (res.ok) {
        toast.success('Crop published to marketplace!');
        setCropName(''); setQuantity(''); setAskingPrice(''); setLocation('');
      } else {
        toast.error('Failed to publish crop.');
      }
    } catch (error) { toast.error('Server error.'); } finally { setLoading(false); }
  };

  const handleMakePitch = async (grainId) => {
    const amount = pitchInputs[grainId];
    if (!amount) return toast.error("Please enter a pitch amount!");

    try {
      const res = await fetch('http://localhost:5000/api/pitches', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grain_id: grainId, buyer_id: user.id, pitch_amount: amount })
      });
      if (res.ok) {
        toast.success(`Pitch of ₹${amount} sent to farmer!`);
        setPitchInputs({ ...pitchInputs, [grainId]: '' });
        fetchBuyerPitches(user.id);
      }
    } catch (err) { toast.error("Failed to send pitch."); }
  };

  const handleUpdateStatus = async (pitchId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/pitches/${pitchId}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Offer ${newStatus}!`);
        fetchFarmerPitches(user.id);
      }
    } catch (err) { toast.error("Failed to update status."); }
  };

  const handleDeletePitch = async (pitchId) => {
    if (!window.confirm("Are you sure you want to remove this from your board?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/pitches/${pitchId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success("Pitch removed from your board!");
        fetchBuyerPitches(user.id);
      } else {
        toast.error("Failed to delete pitch.");
      }
    } catch (err) {
      toast.error("Server error while deleting.");
    }
  };

  const StatusBadge = ({ status }) => {
    if (status === 'accepted') return <span className="bg-green-900/50 text-green-400 border border-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(74,222,128,0.2)]">✅ Deal Done</span>;
    if (status === 'rejected') return <span className="bg-red-900/50 text-red-400 border border-red-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">❌ Rejected</span>;
    return <span className="bg-yellow-900/50 text-yellow-500 border border-yellow-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">⏳ Pending</span>;
  };

  // ==========================================
  // VIEW: DASHBOARDS
  // ==========================================
  if (currentView === 'dashboard' && user) {
    return (
      <div className="min-h-screen bg-agriDark text-agriText font-sans pb-20">
        <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#151a13', color: '#fff', border: '1px solid #374151' } }} />

        <nav className="flex justify-between items-center px-10 py-4 border-b border-gray-800 bg-agriCard sticky top-0 z-50 shadow-md">
          <h1 className="text-xl font-bold text-agriGreen font-serif">AgriConnect</h1>
          <div className="flex items-center gap-6">
            <span className="text-gray-300 text-sm hidden sm:inline">Welcome, <strong className="text-white">{user.full_name}</strong></span>
            <span className="bg-green-900/40 text-green-400 border border-green-800/50 text-xs font-bold px-3 py-1 rounded-full uppercase">{user.role}</span>
            <button onClick={handleLogout} className="border border-red-800 text-red-500 hover:bg-red-900/30 px-4 py-2 rounded-lg text-sm transition-colors shrink-0">Logout</button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-10 py-10">

          {user.role === 'farmer' && (
            <div className="space-y-12">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Negotiation Inbox 📥</h2>
                <p className="text-gray-400 mb-6">Review offers from buyers across India.</p>

                {incomingPitches.length === 0 ? (
                  <div className="bg-agriCard p-6 rounded-2xl border border-gray-800 text-center py-10"><p className="text-gray-500">No pitches received yet.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {incomingPitches.map(pitch => (
                      <div key={pitch.id} className={`bg-agriCard rounded-2xl p-6 border ${pitch.status === 'accepted' ? 'border-green-600 shadow-[0_0_15px_rgba(74,222,128,0.1)]' : 'border-gray-800'} transition-all hover:border-gray-600`}>
                        <div className="flex justify-between items-start mb-4">
                          <StatusBadge status={pitch.status} />
                          <span className="text-gray-400 text-sm font-bold">Offered: <span className="text-white text-lg break-all">₹{pitch.pitch_amount}</span></span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{pitch.crop_name}</h3>
                        <p className="text-sm text-gray-500 mb-4">Your Asking Price: <span className="line-through">₹{pitch.asking_price}</span></p>

                        <div className="bg-agriDark p-4 rounded-xl border border-gray-700 mb-6">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Buyer Profile</p>
                          <p className="text-white font-semibold truncate">{pitch.buyer_name}</p>
                          {pitch.status === 'accepted' ? (
                            <p className="text-green-400 text-sm mt-1 font-mono break-all">📞 {pitch.buyer_contact}</p>
                          ) : (
                            <p className="text-gray-600 text-sm mt-1 flex items-center gap-1">🔒 Contact hidden until accepted</p>
                          )}
                        </div>

                        {pitch.status === 'pending' && (
                          <div className="flex gap-3">
                            <button onClick={() => handleUpdateStatus(pitch.id, 'accepted')} className="flex-1 min-w-0 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold transition-colors">Accept</button>
                            <button onClick={() => handleUpdateStatus(pitch.id, 'rejected')} className="flex-1 min-w-0 border border-red-800 text-red-400 hover:bg-red-900/30 py-2 rounded-lg font-bold transition-colors">Reject</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-agriCard p-6 sm:p-8 rounded-2xl border border-gray-800 shadow-lg overflow-hidden">
                <h3 className="text-2xl font-bold text-agriGreen mb-2">Post a New Listing 🌾</h3>
                <p className="text-gray-400 mb-6">Add crops to the marketplace so buyers can bid.</p>
                <form onSubmit={handlePublishListing} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <input type="text" value={cropName} onChange={(e) => setCropName(e.target.value)} required placeholder="Crop Name" className="w-full min-w-0 bg-agriDark border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-agriGreen transition-colors" />
                  <input type="text" value={quantity} onChange={(e) => setQuantity(e.target.value)} required placeholder="Qty (e.g. 50 kg)" className="w-full min-w-0 bg-agriDark border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-agriGreen transition-colors" />
                  <input type="number" value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} required placeholder="Price (₹)" className="w-full min-w-0 bg-agriDark border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-agriGreen transition-colors" />
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="Location" className="w-full min-w-0 bg-agriDark border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-agriGreen transition-colors" />
                  <button type="submit" disabled={loading} className={`w-full shrink-0 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {loading ? 'Publishing...' : '+ Publish Listing'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {user.role === 'buyer' && (
            <div className="space-y-12">
              <div className="w-full overflow-hidden">
                <h2 className="text-3xl font-bold text-white mb-2">Your Negotiations 🤝</h2>
                <p className="text-gray-400 mb-6">Track the status of pitches you've made to farmers.</p>

                {myPitches.length === 0 ? (
                  <div className="bg-agriCard p-6 rounded-2xl border border-gray-800 text-center py-6"><p className="text-gray-500">You haven't made any offers yet.</p></div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                    {myPitches.map(pitch => (
                      <div key={pitch.id} className="min-w-[300px] max-w-sm snap-start bg-agriCard p-5 rounded-xl border border-gray-800 shrink-0 hover:border-gray-600 transition-colors">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-bold text-white text-lg truncate mr-2">{pitch.crop_name}</h4>
                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={pitch.status} />
                            <button
                              onClick={() => handleDeletePitch(pitch.id)}
                              className="text-gray-500 hover:text-red-500 transition-colors bg-agriDark p-1.5 rounded-md border border-gray-700 hover:border-red-800"
                              title="Remove from board"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">Your Pitch: <span className="font-bold text-agriGreen text-lg break-all">₹{pitch.pitch_amount}</span></p>
                        <p className="text-xs text-gray-500 truncate">Farmer: {pitch.farmer_name}</p>
                        {pitch.status === 'accepted' && (
                          <div className="mt-3 p-3 bg-green-900/20 border border-green-800/50 rounded-lg">
                            <p className="text-xs text-green-400 mb-1">Call to finalize delivery:</p>
                            <p className="font-mono text-white font-bold break-all">{pitch.farmer_contact}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Live Marketplace 🛒</h2>
                <p className="text-gray-400 mb-6">Browse fresh produce and pitch your price.</p>

                {marketGrains.length === 0 ? (
                  <div className="text-center py-10 bg-agriCard rounded-2xl border border-gray-800"><p className="text-gray-500 text-lg">No crops available right now.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {marketGrains.map((grain) => (
                      <div key={grain.id} className="bg-agriCard rounded-2xl p-6 border border-gray-800 hover:border-gray-600 transition-colors flex flex-col justify-between group">
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-green-900/40 text-green-400 border border-green-800/50 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{grain.quantity}</span>
                          <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🌾</span>
                        </div>

                        <div className="flex flex-col flex-1">
                          <h3 className="text-xl font-bold text-white mb-1 truncate">{grain.crop_name}</h3>
                          <p className="text-sm text-gray-400 mb-4 flex items-center gap-1 truncate">📍 {grain.location}</p>

                          <div className="bg-agriDark p-3 rounded-lg border border-gray-700 mb-4">
                            <p className="text-xs text-gray-500 uppercase mb-1">Seller</p>
                            <div className="flex items-center gap-2 overflow-hidden">
                              <p className="text-white text-sm font-semibold truncate">{grain.farmer_name}</p>
                              <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-800/50 shrink-0">Verified</span>
                            </div>
                          </div>

                          <div className="mb-6">
                            <p className="text-xs text-gray-500 uppercase">Asking Rate</p>
                            <span className="text-3xl font-bold text-white font-serif break-all">₹{grain.asking_price}</span>
                          </div>

                          <div className="flex gap-2 mt-auto pt-4 border-t border-gray-800/50">
                            <input
                              type="number"
                              placeholder="Your price?"
                              value={pitchInputs[grain.id] || ''}
                              onChange={(e) => setPitchInputs({ ...pitchInputs, [grain.id]: e.target.value })}
                              className="flex-1 min-w-0 bg-agriDark border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-agriGreen transition-colors font-mono"
                            />
                            <button
                              onClick={() => handleMakePitch(grain.id)}
                              className="px-4 shrink-0 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors text-sm shadow-lg shadow-green-900/20"
                            >
                              Send Pitch
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: AUTHENTICATION / LANDING
  // ==========================================
  // ==========================================
  // VIEW: AUTHENTICATION / LANDING
  // ==========================================
  if (currentView === 'auth') {
    return (
      <div className="min-h-screen bg-agriDark text-agriText flex items-center justify-center p-4 sm:p-6 relative">
        <Toaster position="top-center" toastOptions={{ style: { background: '#151a13', color: '#fff', border: '1px solid #374151' } }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

        <div className="bg-agriCard p-8 sm:p-10 rounded-2xl border border-gray-800 w-full max-w-md z-10 shadow-2xl">
          <button onClick={() => setCurrentView('landing')} className="text-gray-400 hover:text-white mb-6 text-sm flex items-center gap-2 transition-colors">← Back to Home</button>
          <h2 className="text-3xl font-bold text-white font-serif mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-agriGreen font-medium mb-8">Joining as a <span className="capitalize">{authRole}</span></p>

          <form className="space-y-5" onSubmit={handleAuthSubmit}>
            {!isLogin && <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required={!isLogin} className="w-full min-w-0 bg-agriDark border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-agriGreen transition-colors" placeholder="Full Name (e.g. Swapnil)" />}
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full min-w-0 bg-agriDark border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-agriGreen transition-colors" placeholder="Email or Phone" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full min-w-0 bg-agriDark border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-agriGreen transition-colors" placeholder="Password" />
            <button type="submit" disabled={loading} className={`w-full min-w-0 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg mt-4 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>
          <div className="mt-6 text-center text-sm">
            <button onClick={() => { setIsLogin(!isLogin); }} className="text-gray-400 hover:text-agriGreen transition-colors">
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If not auth and not dashboard, show landing page
  return (
    <div className="min-h-screen bg-[#0a0d08] text-agriText font-sans overflow-x-hidden">
      <nav className="flex justify-between items-center px-6 sm:px-10 py-6 border-b border-gray-800 bg-[#0a0d08]/80 backdrop-blur-md sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-agriGreen font-serif">AgriConnect</h1>
        <button onClick={() => { setAuthRole('buyer'); setIsLogin(true); setCurrentView('auth'); }} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-full font-semibold transition-colors shadow-lg shadow-green-900/20">Login</button>
      </nav>
      <main className="relative px-6 sm:px-10 pt-16 sm:pt-20 pb-32 max-w-7xl mx-auto">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 mt-10">
            <span className="inline-block px-4 py-1 rounded-full border border-green-800 text-agriGreen text-xs font-bold tracking-widest uppercase bg-green-900/20">● Direct Farm-To-Table</span>
            <h2 className="text-5xl md:text-7xl font-bold leading-tight font-serif text-white">Connecting Farmers <br /><span className="text-agriGreen italic">Directly</span> to Buyers</h2>
            <p className="text-gray-400 text-lg max-w-lg leading-relaxed">Eliminate exploitative middlemen. Get fair prices. Build a transparent food supply chain where farmers earn more and buyers pay less.</p>
            <div className="flex flex-wrap space-x-4 pt-4 gap-y-4">
              <button onClick={() => { setAuthRole('farmer'); setIsLogin(false); setCurrentView('auth'); }} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-green-900/20">🌿 Join as Farmer</button>
              <button onClick={() => { setAuthRole('buyer'); setIsLogin(false); setCurrentView('auth'); }} className="border border-gray-600 hover:border-white text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 transition-transform hover:scale-105 bg-gray-900/50">🛒 Join as Buyer →</button>
            </div>
          </div>
          <div className="relative hidden md:flex justify-center items-center mt-10 md:mt-0">
            <div className="absolute inset-0 bg-green-500/20 blur-[100px] rounded-full z-0"></div>
            <img src="https://humpyfarms.com/cdn/shop/files/Banner-03.jpg?v=1687439656&width=3840" className="relative z-10 rounded-3xl shadow-2xl object-cover w-full h-auto max-h-[500px] border border-gray-700/50 hover:border-agriGreen/50 transition-colors duration-500" alt="Farm Fresh Banner" />
          </div>
        </div>
      </main>
    </div>
  );
} // <-- This is the final closing bracket for the App component