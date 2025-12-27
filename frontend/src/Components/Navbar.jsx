import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets_frontend/assets.js';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [tokken, setTokken] = useState(true);
  const [userData, setUserData] = useState(null);
  const menuRef = useRef(null);
  const Navigate = useNavigate();

  useEffect(() => {
    // Check authentication status when component mounts
    checkAuthStatus();

    // Add click event listener to close menu when clicking outside
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      setTokken(true);
      try {
        const parsedUser = JSON.parse(user);
        setUserData(parsedUser);
        console.log('Current user role:', parsedUser.role);
      } catch (e) {
        console.error('Error parsing user data');
        setUserData(null);
      }
    } else {
      setTokken(false);
      setUserData(null);
    }
  };

  const handleOutsideClick = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setIsUserMenuOpen(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear any auth cookies
    document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Update state
    setTokken(false);
    setUserData(null);
    setIsUserMenuOpen(false);

    // Redirect to login page
    window.location.href = '/login';
  };

  return (
    <nav className="bg-white border-b border-gray-300 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm py-4 px-4 md:px-8">
        <img
          onClick={() => {
            Navigate('/');
          }}
          className="w-32 sm:w-40 md:w-44 cursor-pointer"
          src={assets.logo}
          alt="Logo"
        />

        {/* Desktop Menu */}
        <ul className="hidden md:flex flex-row items-center gap-3 lg:gap-6 font-medium">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? 'text-blue-600' : 'hover:text-blue-500'
              }
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/doctors"
              className={({ isActive }) =>
                isActive ? 'text-blue-600' : 'hover:text-blue-500'
              }
            >
              All Doctors
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/pharmacists"
              className={({ isActive }) =>
                isActive ? 'text-purple-600' : 'hover:text-purple-500'
              }
            >
              All Pharmacists
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/lab-techniques"
              className={({ isActive }) =>
                isActive ? 'text-green-600' : 'hover:text-green-500'
              }
            >
              All Lab Tests
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive ? 'text-blue-600' : 'hover:text-blue-500'
              }
            >
              About
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                isActive ? 'text-blue-600' : 'hover:text-blue-500'
              }
            >
              Contact
            </NavLink>
          </li>
        </ul>
        <div className="flex items-center gap-4">
          {tokken ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={toggleUserMenu}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  {userData?.avatar ? (
                    <img
                      src={userData.avatar}
                      alt="User"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-700">
                      {userData?.name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10">
                  <Link
                    to="/myprofile"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/myappointments"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    My Appointments
                  </Link>
                  <Link
                    to="/my-pharmacist-appointments"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    My Pharmacist Appointments
                  </Link>
                  <Link
                    to="/my-lab-bookings"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    My Lab Bookings
                  </Link>
                  {userData?.role === 'admin' && (
                    <>
                      <hr className="my-1" />
                      <div className="px-4 py-2 text-xs text-gray-500 font-semibold">ADMIN PANEL</div>
                      <Link
                        to="/admin/doctors"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                      >
                        Manage Doctors
                      </Link>
                      <Link
                        to="/admin/pharmacists"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                      >
                        Manage Pharmacists
                      </Link>
                      <Link
                        to="/admin/lab-techniques"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                      >
                        Manage Lab Tests
                      </Link>
                      <Link
                        to="/admin/appointments"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                      >
                        All Appointments
                      </Link>
                      <Link
                        to="/admin/pharmacist-appointments"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                      >
                        Pharmacist Appointments
                      </Link>
                      <Link
                        to="/admin/lab-bookings"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                      >
                        All Lab Bookings
                      </Link>
                    </>
                  )}
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                Navigate('/login');
              }}
              className="hidden md:block bg-blue-600 text-white px-3 py-1.5 lg:px-4 lg:py-2 text-sm rounded-full hover:bg-blue-700 transition"
            >
              Create Account
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button
            className="text-gray-700 focus:outline-none"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute w-full bg-white border-b border-gray-200 z-50 shadow-lg transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0 invisible'
        }`}
      >
        <ul className="flex flex-col px-4 py-2 overflow-hidden">
          <li className="py-2 border-b border-gray-100">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? 'text-blue-600 block' : 'hover:text-blue-500 block'
              }
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </NavLink>
          </li>
          <li className="py-2 border-b border-gray-100">
            <NavLink
              to="/doctors"
              className={({ isActive }) =>
                isActive ? 'text-blue-600 block' : 'hover:text-blue-500 block'
              }
              onClick={() => setIsMenuOpen(false)}
            >
              All Doctors
            </NavLink>
          </li>
          <li className="py-2 border-b border-gray-100">
            <NavLink
              to="/pharmacists"
              className={({ isActive }) =>
                isActive ? 'text-purple-600 block' : 'hover:text-purple-500 block'
              }
              onClick={() => setIsMenuOpen(false)}
            >
              All Pharmacists
            </NavLink>
          </li>
          <li className="py-2 border-b border-gray-100">
            <NavLink
              to="/lab-techniques"
              className={({ isActive }) =>
                isActive ? 'text-green-600 block' : 'hover:text-green-500 block'
              }
              onClick={() => setIsMenuOpen(false)}
            >
              All Lab Tests
            </NavLink>
          </li>
          <li className="py-2 border-b border-gray-100">
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive ? 'text-blue-600 block' : 'hover:text-blue-500 block'
              }
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </NavLink>
          </li>
          <li className="py-2 border-b border-gray-100">
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                isActive ? 'text-blue-600 block' : 'hover:text-blue-500 block'
              }
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </NavLink>
          </li>
          <li className="py-3">
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-center">
              Create Account
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
