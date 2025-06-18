import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/NavBar';
import Home from './pages/Home';
import MyAssets from './pages/MyAssets';
import Transactions from './pages/Transactions';
import MarketPlace from './pages/MarketPlace';
// import WhitelistBlacklist from './pages/WhitelistBlacklist';
import PropertyDAO from './pages/PropertyDAO';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/my-assets" element={<MyAssets />} />
            <Route path="/transactions" element={<MarketPlace />} />
            {/* <Route path="/lists" element={<WhitelistBlacklist />} /> */}
            <Route path="/property-dao" element={<PropertyDAO />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;