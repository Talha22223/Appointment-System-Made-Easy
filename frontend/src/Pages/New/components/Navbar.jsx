import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/home" className="navbar-logo">ConnecFriend</Link>
        <div className="search-container">
          <input type="text" placeholder="Search ConnecFriend" className="search-input" />
          <i className="fas fa-search search-icon"></i>
        </div>
      </div>
      
      <div className="navbar-center">
        <Link to="/home" className="nav-item active">
          <i className="fas fa-home"></i>
        </Link>
        <Link to="/friends" className="nav-item">
          <i className="fas fa-user-friends"></i>
        </Link>
        <Link to="/messages" className="nav-item">
          <i className="fas fa-comment-alt"></i>
        </Link>
        <Link to="/notifications" className="nav-item">
          <i className="fas fa-bell"></i>
        </Link>
      </div>
      
      <div className="navbar-right">
        <div className="profile-menu">
          <div 
            className="profile-pic"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <img src="https://via.placeholder.com/40" alt="Profile" />
          </div>
          
          {showDropdown && (
            <div className="dropdown-menu">
              <Link to="/profile" className="dropdown-item">My Profile</Link>
              <Link to="/settings" className="dropdown-item">Settings</Link>
              <div className="dropdown-divider"></div>
              <button onClick={handleLogout} className="dropdown-item logout-btn">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
