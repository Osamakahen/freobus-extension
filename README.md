# FreoBus Wallet

A secure and seamless Web3 wallet for the FreoBus ecosystem.

## Overview

FreoBus Wallet is a browser extension that provides a secure and user-friendly interface for managing Web3 assets and interacting with decentralized applications. Built with TypeScript, React, and Vite, it offers a robust set of features for both users and developers.

## Key Features

### Security & Privacy
- **Secure Storage**: Encrypted storage for sensitive data
- **Permission Management**: Granular control over dApp permissions
- **Session Security**: Advanced session management with auto-disconnect
- **MEV Protection**: Built-in protection against Maximal Extractable Value
- **Gas Optimization**: Smart gas price recommendations

### User Experience
- **Auto-Connect**: Seamless connection to previously authorized dApps
- **Session Analytics**: Real-time monitoring of connection health
- **Network Management**: Easy switching between different networks
- **Transaction Management**: Comprehensive transaction history and status tracking
- **Balance Tracking**: Real-time balance updates across networks

### Developer Features
- **TypeScript Support**: Full type safety and better development experience
- **Event System**: Robust event handling for state changes
- **Analytics Dashboard**: Detailed session and connection metrics
- **Permission System**: Flexible permission management for dApps
- **Network Observer**: Automatic network detection and switching

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/freobus-extension.git
cd freobus-extension
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in your browser:
- Open Chrome/Edge
- Go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `dist` folder

## Development

### Project Structure
```
freobus-extension/
├── src/              # Source code
│   ├── popup/       # Extension popup UI
│   ├── background/  # Service worker and background scripts
│   ├── content/     # Content scripts for dApp interaction
│   └── utils/       # Utility functions
├── extension/       # Extension-specific code
├── icons/          # Extension icons
├── scripts/        # Build and utility scripts
└── docs/           # Documentation
```

### Available Scripts
- `npm run build`: Build the extension using Vite
- `npm run dev`: Start development server with hot reload
- `npm run test`: Run tests using Vitest
- `npm run lint`: Run linter
- `npm run type-check`: Run TypeScript type checking

### Development Setup
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. The extension will be built to the `dist` directory
4. Load the `dist` directory as an unpacked extension in your browser
5. Changes will be automatically reflected after rebuilding

## Extension Architecture

### Service Worker
The extension uses a service worker (background script) for:
- Managing wallet state
- Handling network requests
- Processing transactions
- Managing permissions

### Content Scripts
Content scripts are injected into web pages to:
- Detect dApp connection requests
- Handle wallet interactions
- Manage permissions
- Provide secure communication

### Permissions
The extension requires the following permissions:
- `storage`: For managing wallet data and settings
- `tabs`: For interacting with browser tabs
- Host permissions for secure dApp communication

## Security Measures

- End-to-end encryption for sensitive data
- Secure session management
- Permission-based access control
- Regular security audits
- MEV protection mechanisms

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Documentation

- [API Documentation](./docs/api.md)
- [Security Guidelines](./docs/security.md)
- [Development Guide](./docs/development.md)
- [User Guide](./docs/user-guide.md)

## Support

- [GitHub Issues](https://github.com/yourusername/freobus-extension/issues)
- [Documentation](https://github.com/yourusername/freobus-extension/docs)
- [Discord Community](https://discord.gg/freobus)

## Roadmap

- [ ] Multi-chain support
- [ ] Hardware wallet integration
- [ ] Mobile companion app
- [ ] Advanced analytics dashboard
- [ ] Custom token management

## License

MIT License - see [LICENSE](./LICENSE) for details

## Contact

- Website: [freobus.com](https://freobus.com)
- Email: support@freobus.com
- Twitter: [@freobus](https://twitter.com/freobus) 