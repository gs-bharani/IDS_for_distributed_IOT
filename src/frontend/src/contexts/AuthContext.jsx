import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios'; // Using axios for cleaner HTTP requests

// Create the authentication context
const AuthContext = createContext(null);

// AuthProvider component to wrap the application and provide auth state
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication status
  const [user, setUser] = useState(null); // Stores user's email etc.
  const [loading, setLoading] = useState(true); // To manage initial loading state while checking token

  const API_BASE_URL = 'http://localhost:8000/api'; // Your backend API base URL

  // useEffect to check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token'); // Get token from local storage
      if (token) {
        // If token exists, attempt to fetch user details to validate the token with the backend
        try {
          // Set Authorization header for all subsequent axios requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get(`${API_BASE_URL}/auth/me`); // Call protected /me endpoint
          if (response.status === 200) {
            setIsAuthenticated(true); // Set authenticated if /me call is successful
            setUser(response.data); // Set user data
          } else {
            // If /me call fails (e.g., token expired/invalid), log out
            console.error('Token validation failed:', response.data);
            logout(); // Perform logout action
          }
        } catch (error) {
          // Handle network errors or server errors during token validation
          console.error('Error validating token:', error);
          logout(); // Perform logout action on error
        }
      }
      setLoading(false); // Set loading to false once check is complete
    };

    checkAuthStatus(); // Call the async function
  }, []); // Empty dependency array means this runs only once on mount

  // Function to handle user login
  const login = async (email, password) => {
    try {
      const formData = new URLSearchParams(); // Create URL-encoded form data for FastAPI's OAuth2
      formData.append('username', email); // FastAPI's OAuth2PasswordRequestForm expects 'username'
      formData.append('password', password);

      // Make a POST request to the token endpoint
      const response = await axios.post(`${API_BASE_URL}/auth/token`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        const { access_token } = response.data;
        localStorage.setItem('token', access_token); // Store the JWT token
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`; // Set default auth header
        
        // Fetch user details immediately after successful login to populate `user` state
        const userResponse = await axios.get(`${API_BASE_URL}/auth/me`);
        setIsAuthenticated(true); // Update auth status
        setUser(userResponse.data); // Set user data
        return true; // Indicate successful login
      }
    } catch (error) {
      // Log and handle login errors
      console.error('Login failed:', error.response?.data || error.message);
      setIsAuthenticated(false); // Ensure authentication status is false
      setUser(null); // Clear user data
      return false; // Indicate failed login
    }
  };

  // Function to handle user registration
  const register = async (email, password) => {
    try {
      // Make a POST request to the register endpoint
      const response = await axios.post(`${API_BASE_URL}/auth/register`, { email, password });
      if (response.status === 201) { // 201 Created for successful registration
        return true; // Indicate successful registration
      }
    } catch (error) {
      // Log and handle registration errors
      console.error('Registration failed:', error.response?.data || error.message);
      return false; // Indicate failed registration
    }
  };

  // Function to handle user logout
  const logout = () => {
    localStorage.removeItem('token'); // Remove token from local storage
    delete axios.defaults.headers.common['Authorization']; // Remove default auth header
    setIsAuthenticated(false); // Set authenticated status to false
    setUser(null); // Clear user data
  };

  // Render a loading indicator while authentication status is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-lg text-foreground">
        Loading authentication...
      </div>
    );
  }

  // Provide the authentication state and functions to child components
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily consume the AuthContext
export const useAuth = () => useContext(AuthContext);
