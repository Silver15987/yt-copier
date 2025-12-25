# Video Sorter Manager

An Electron-based desktop application for uploading videos from your phone, classifying them into categories, and exporting to USB drives.

**No cloud. No accounts. No limits. No expiry.**

![Platform](https://img.shields.io/badge/Platform-Windows-blue)
![Electron](https://img.shields.io/badge/Electron-28-47848F)
![React](https://img.shields.io/badge/React-18-61DAFB)

---

## Features

- **Phone-to-PC Upload** - Scan QR code and upload videos over Wi-Fi
- **Auto Classification** - Videos automatically sorted by filename patterns
- **Manual Organization** - Drag & drop or dropdown-based categorization
- **USB Export** - Export organized videos directly to USB drives
- **Local & Private** - All data stays on your device

## Categories

Videos are automatically classified into:
- Class 7, 8, 9, 10 (education)
- Gym Videos
- Other

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ 
- npm or yarn
- Windows 10+ (macOS/Linux support planned)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/video-sorter-manager.git
cd video-sorter-manager

# Install dependencies
npm install

# Start development mode
npm run dev
```

### Usage

1. **Launch the app** - Run `npm run dev`
2. **Scan QR code** - Use your phone's camera to scan the QR code displayed
3. **Upload videos** - Select videos on your phone and upload
4. **Classify** - Videos auto-classify based on filename, or change manually
5. **Export** - Insert USB, select videos, click "Export to USB"

## Tech Stack

| Component | Technology |
|-----------|------------|
| Desktop Framework | Electron 28 |
| Frontend | React 18 + Tailwind CSS |
| Build Tool | Vite 5 |
| Upload Server | Express + Multer |
| USB Detection | PowerShell (Windows) |

## Project Structure

```
video-sorter-manager/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.js    # App entry point
│   │   ├── server.js   # HTTP upload server
│   │   ├── fileManager.js
│   │   ├── metadata.js
│   │   ├── classifier.js
│   │   ├── usbDetector.js
│   │   └── exportManager.js
│   ├── renderer/       # React UI
│   │   ├── App.jsx
│   │   └── components/
│   └── preload/        # Electron preload
├── public/             # Mobile upload UI
│   ├── upload.html
│   ├── upload.css
│   └── upload.js
└── package.json
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start in development mode |
| `npm run build` | Build for production |
| `npm run package` | Create Windows installer |

## Configuration

Videos are stored in:
```
Windows: %APPDATA%/video-sorter-manager/VideoSorter/
```

Structure:
```
VideoSorter/
├── imports/raw/        # Uploaded videos
├── processed/          # Organized by category
│   ├── Class 7/
│   ├── Class 8/
│   └── ...
└── metadata.json       # Video database
```

## Security

- Session tokens generated per app launch
- Server only accessible on local network
- No external API calls (except QR generation)
- Auto-shutdown on app close

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

Built with Electron + React
