# Ocularum

A modern Electron-based Twitch viewer with autotune capabilities. Ocularum allows you to watch your favorite Twitch streamers with enhanced features like automatic stream launching and multi-stream viewing.

![Ocularum Banner Image](resources/images/banner.png)

## Features

- **Twitch Integration**: Authenticate with Twitch and browse your followed channels
- **Stream Viewing**: Watch Twitch streams with quality selection
- **Autotune**: Automatically start streams when your favorite streamers go live
- **Multi-Stream Support**: Watch multiple streams simultaneously with custom layouts
- **Notifications**: Get notified when followed streamers go live
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Python 3.7+
- Streamlink

### Installation

#### From Releases
1. Download the latest release for your platform from the [Releases page](https://github.com/bluntwizard/Ocularum/releases)
2. Install the application following the platform-specific instructions

#### Building from Source
1. Clone the repository
   ```
   git clone https://github.com/bluntwizard/Ocularum.git
   cd Ocularum
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up Python environment
   ```
   pip install -r python/requirements.txt
   ```

4. Create a `.env` file with your Twitch API credentials:
   ```
   TWITCH_CLIENT_ID=your_client_id
   TWITCH_CLIENT_SECRET=your_client_secret
   ```

5. Start the development server
   ```
   npm run dev
   ```

## Documentation

- [User Guide](docs/user_guide.md) - How to use Ocularum
- [Developer Guide](docs/developer_guide.md) - How to develop for Ocularum
- [Technical Architecture](docs/technical_architecture.md) - Technical overview
- [Project Roadmap](docs/project_roadmap.md) - Future development plans

## Contributing

We welcome contributions to Ocularum! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on how to contribute.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Electron](https://www.electronjs.org/) - For the cross-platform desktop app framework
- [React](https://reactjs.org/) - For the UI library
- [Streamlink](https://streamlink.github.io/) - For the stream handling capabilities
- [Twitch API](https://dev.twitch.tv/) - For the Twitch integration
- [Material-UI](https://mui.com/) - For the component library 