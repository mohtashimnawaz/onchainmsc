import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { onchainmsc_backend } from 'declarations/onchainmsc_backend';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const client = await AuthClient.create();
      setAuthClient(client);

      const isAuthenticated = await client.isAuthenticated();
      setIsAuthenticated(isAuthenticated);

      if (isAuthenticated) {
        const identity = client.getIdentity();
        setIdentity(identity);
        setPrincipal(identity.getPrincipal());
        
        // Try to get artist profile
        await loadArtistProfile();
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArtistProfile = async () => {
    try {
      const artists = await onchainmsc_backend.list_artists();
      const currentPrincipal = identity?.getPrincipal();
      
      if (currentPrincipal) {
        const userArtist = artists.find(artist => 
          artist.user_principal.toString() === currentPrincipal.toString()
        );
        setArtist(userArtist || null);
      }
    } catch (error) {
      console.error('Failed to load artist profile:', error);
    }
  };

  const login = async () => {
    if (!authClient) return;

    try {
      await authClient.login({
        identityProvider: process.env.DFX_NETWORK === 'local' 
          ? `http://localhost:4943/?canisterId=${process.env.CANISTER_ID_INTERNET_IDENTITY}`
          : 'https://identity.ic0.app',
        onSuccess: async () => {
          const identity = authClient.getIdentity();
          setIdentity(identity);
          setPrincipal(identity.getPrincipal());
          setIsAuthenticated(true);
          
          await loadArtistProfile();
        },
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    if (!authClient) return;

    try {
      await authClient.logout();
      setIsAuthenticated(false);
      setIdentity(null);
      setPrincipal(null);
      setArtist(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const registerArtist = async (name, bio, social, profileImageUrl, links) => {
    try {
      const newArtist = await onchainmsc_backend.register_artist(
        name, 
        bio, 
        social ? [social] : [], 
        profileImageUrl ? [profileImageUrl] : [], 
        links ? [links] : []
      );
      
      if (newArtist && newArtist.length > 0) {
        setArtist(newArtist[0]);
        return newArtist[0];
      }
      return null;
    } catch (error) {
      console.error('Artist registration failed:', error);
      throw error;
    }
  };

  const updateArtist = async (id, name, bio, social, profileImageUrl, links) => {
    try {
      const updatedArtist = await onchainmsc_backend.update_artist(
        id,
        name,
        bio,
        social ? [social] : [],
        profileImageUrl ? [profileImageUrl] : [],
        links ? [links] : []
      );
      
      if (updatedArtist && updatedArtist.length > 0) {
        setArtist(updatedArtist[0]);
        return updatedArtist[0];
      }
      return null;
    } catch (error) {
      console.error('Artist update failed:', error);
      throw error;
    }
  };

  const value = {
    isAuthenticated,
    identity,
    principal,
    artist,
    loading,
    login,
    logout,
    registerArtist,
    updateArtist,
    loadArtistProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
