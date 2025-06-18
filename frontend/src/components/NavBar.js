import React from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">
            <img src="/real.png" alt="Logo" className="logo" />
            <span>房地產代幣化平台</span>
          </Link>
        </div>
        
        <div className="navbar-links">
          <Link to="/" className="nav-link">首頁</Link>
          <Link to="/my-assets" className="nav-link">我的資產</Link>
          <Link to="/transactions" className="nav-link">交易</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;