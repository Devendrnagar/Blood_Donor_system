# Google Maps API Setup Guide

This document explains how to fix the Google Maps API issues and set up the API key properly.

## Issues Fixed

1. **Deprecated Marker Warning**: Updated to use `google.maps.marker.AdvancedMarkerElement` instead of the deprecated `google.maps.Marker`
2. **Multiple Script Loading**: Prevented duplicate Google Maps API script loading
3. **Invalid API Key**: Added proper error handling and configuration guidance
4. **Performance Issues**: Implemented async loading with proper loading states

## Setting Up Google Maps API

### 1. Get a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API** (required)
   - **Places API** (optional, for future features)
4. Go to "Credentials" and create an API key
5. Restrict the API key:
   - **Application restrictions**: HTTP referrers (websites)
   - **Website restrictions**: Add your domain(s):
     - `localhost:*` (for development)
     - `127.0.0.1:*` (for development)
     - Your production domain
   - **API restrictions**: Select "Maps JavaScript API"

### 2. Configure the API Key

Replace `your_google_maps_api_key_here` in your `.env` file:

```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBvOkBwgyLQN...your_actual_key_here
```

### 3. Key Features Implemented

- **AdvancedMarkerElement**: Uses the new Google Maps marker system
- **Fallback Support**: Falls back to legacy markers if AdvancedMarkerElement is unavailable
- **Error Handling**: Proper error messages for API key issues
- **Loading States**: Visual feedback while the map loads
- **Script Management**: Prevents duplicate API loading
- **Performance**: Async loading with deferred execution

### 4. Map Features

- **User Location**: Blue marker showing your current location
- **Donor Locations**: Red markers for blood donors
- **Info Windows**: Click markers to see donor information
- **Responsive Design**: Works on mobile and desktop

## Troubleshooting

### Common Issues

1. **"InvalidKeyMapError"**: Your API key is invalid or not properly configured
   - Check if the API key is correct in `.env`
   - Ensure Maps JavaScript API is enabled
   - Verify domain restrictions

2. **"Marker is deprecated"**: This warning is normal and will be resolved automatically
   - The app now uses AdvancedMarkerElement when available
   - Falls back to legacy markers for compatibility

3. **"Multiple API loads"**: Fixed by preventing duplicate script loading

4. **Map not loading**: 
   - Check browser console for errors
   - Verify API key configuration
   - Ensure internet connection

### Testing the Fix

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the dashboard and enable location access
3. The map should load without deprecation warnings
4. Markers should appear using the new AdvancedMarkerElement system

## Environment Variables

Update your `.env` file with these variables:

```env
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here

# Backend API URL
VITE_API_BASE_URL=http://localhost:5000/api

# Supabase (if using)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Code Changes Made

1. **Updated DonorMap.tsx**:
   - Added AdvancedMarkerElement support
   - Implemented proper error handling
   - Added loading states
   - Prevented duplicate script loading
   - Added TypeScript types

2. **Added TypeScript Support**:
   - Installed `@types/google.maps`
   - Added proper type declarations
   - Fixed TypeScript compilation errors

The Google Maps integration should now work properly without deprecation warnings!
