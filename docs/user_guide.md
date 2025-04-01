# Ocularum User Guide

## Introduction

Welcome to Ocularum, your advanced desktop application for watching Twitch streams with automatic tuning capabilities. This guide will help you get started and make the most of Ocularum's features.

## Installation

### Windows
1. Download the latest installer from the [releases page](https://github.com/bluntwizard/Ocularum/releases)
2. Run the `.exe` installer and follow the on-screen instructions
3. Launch Ocularum from your Start menu or desktop shortcut

### macOS
1. Download the latest `.dmg` file from the [releases page](https://github.com/bluntwizard/Ocularum/releases)
2. Open the `.dmg` file and drag Ocularum to your Applications folder
3. Launch Ocularum from your Applications folder or dock

### Linux
1. Download the appropriate package for your distribution from the [releases page](https://github.com/bluntwizard/Ocularum/releases)
2. Install the package using your package manager
   ```bash
   # Debian/Ubuntu
   sudo dpkg -i ocularum_x.x.x_amd64.deb
   
   # Fedora/RHEL
   sudo rpm -i ocularum-x.x.x.rpm
   
   # AppImage
   chmod +x Ocularum-x.x.x.AppImage
   ./Ocularum-x.x.x.AppImage
   ```
3. Launch Ocularum from your applications menu or using the terminal command `ocularum`

## Getting Started

### First Launch

1. When you first launch Ocularum, you'll be taken to the authentication page
2. Click the "Connect with Twitch" button
3. A browser window will open for Twitch authentication
4. Grant Ocularum permission to access your Twitch account
5. Once authenticated, you'll be redirected back to Ocularum's home page

### Main Interface

The Ocularum interface consists of:

1. **Navigation Sidebar**: Access different sections of the application
   - Home: Dashboard with live and autotuned channels
   - My Streams: View and manage active streams
   - Browse: Discover and watch Twitch channels
   - Settings: Configure application preferences

2. **App Bar**: Shows the current page title and user menu
   - User menu provides access to account settings and logout

3. **Content Area**: Displays the selected page content

## Basic Features

### Home Page

The Home page serves as your dashboard and shows:

1. **Live Now**: Channels you follow that are currently live
   - Click on a channel card to start watching
   - Shows a preview image and live indicator

2. **Autotuned Channels**: Channels you've set up for automatic tuning
   - Shows which autotuned channels are currently live
   - Displays quality settings for each channel

### Browsing Streams

1. Navigate to the "Browse" tab in the sidebar
2. View your followed channels with their live status
3. Use the search bar to find specific channels
4. Toggle between "All Channels" and "Live Now" tabs
5. Click on a channel card to start watching
6. Use the "+" button to add a channel to autotune

### Watching Streams

1. Navigate to the "My Streams" page to see active streams
2. Each stream card shows:
   - Channel name
   - Stream quality
   - Runtime duration
3. Use the "Stop Stream" button to end a stream

### Managing Settings

1. Navigate to the "Settings" page
2. Use the tabs to access different settings categories:
   - Autotune: Configure autotune preferences
   - Appearance: Customize the application appearance
   - Advanced: Access advanced configuration options

#### Autotune Settings

1. Toggle autotune on/off using the switch
2. Configure check interval for live streams
3. Set maximum concurrent streams
4. Choose default stream quality
5. Add or remove autotuned streamers

## Advanced Features

### Autotune Setup

Autotune automatically starts streams from your favorite streamers when they go live.

1. Navigate to the "Settings" page
2. In the "Autotune Settings" section:
   - Enable autotune using the toggle switch
   - Set "Start on application launch" if desired
   - Configure check interval and maximum streams
   - Set default quality for autotuned streams
3. In the "Autotuned Streamers" section:
   - Add new streamers using the input field
   - Remove existing streamers using the delete button

### Application Updates

Ocularum will automatically check for updates.

1. When an update is available, you'll see a notification
2. Once the update is downloaded, a notification will appear in the bottom-right corner
3. Click "Install & Restart" to apply the update

## Troubleshooting

### Common Issues

#### Stream Won't Load
- Check your internet connection
- Try a different quality setting
- Restart the stream
- Verify that Twitch is accessible

#### Authentication Problems
- Re-login to your Twitch account
- Check if Twitch is experiencing service issues
- Ensure your account permissions are correct

#### Application Crashes
- Update to the latest version of Ocularum
- Check for conflicting applications
- Verify your system meets the minimum requirements
- Try reinstalling the application

### Getting Help

If you encounter issues not covered in this guide:

1. Check our [FAQ](https://github.com/bluntwizard/Ocularum/wiki/FAQ)
2. Visit our [GitHub Issues](https://github.com/bluntwizard/Ocularum/issues) page
3. Join our [Discord community](https://discord.gg/ocularum)
4. Contact support at support@ocularum.app

## Privacy & Security

Ocularum respects your privacy:

- Authentication tokens are stored securely on your device
- No personal data is sent to our servers
- Stream viewing habits are not tracked
- All communication with Twitch is direct

You can clear saved data by logging out through the user menu in the top-right corner. 