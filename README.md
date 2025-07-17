# 🚀 Real-Time System Playback Visualizer

> **Debug complex distributed systems with visual clarity and interactive log exploration**

A powerful Next.js application that transforms your system logs into interactive visual diagrams, making it easy to understand message flows, state changes, and system behavior in real-time applications.

![System Visualization](https://img.shields.io/badge/Visualization-Interactive-blue) ![Log Explorer](https://img.shields.io/badge/Logs-Real--time-green) ![File System API](https://img.shields.io/badge/Files-Native%20Access-orange)

## ✨ What Makes This Special

**Turn This** (cryptic log files):
```
2024-01-15T10:30:00.123Z [INFO] overseer: Processing started
2024-01-15T10:30:01.456Z [WARN] llm_orchestrator: Rate limit approaching
2024-01-15T10:30:02.789Z [ERROR] tts_orchestrator: Connection timeout
```

**Into This** (visual, interactive diagrams):
- 🎯 **Visual Components**: See your system architecture as connected nodes
- 📝 **Smart Annotations**: Log messages appear as tooltips next to components
- 🎨 **Color-Coded Events**: Instant visual feedback for different event types
- 🔄 **Interactive Timeline**: Scrub through events and watch your system come alive

## 🎮 Two Powerful Modes

### 📊 **Log Explorer Mode** (Default)
- 🔒 **Safe Exploration**: Components are locked to prevent accidental changes
- 📁 **Native File Access**: Connect directly to your log directories (Chrome/Edge)
- 🔄 **Live Updates**: Watch new log entries appear in real-time
- 🎯 **Smart Highlighting**: Click log entries to see visual effects on your diagram

### ✏️ **Graph Editor Mode**
- 🎨 **Visual Design**: Create and modify your system architecture
- 🔗 **Smart Connections**: Drag between components to create relationships
- ⚙️ **Component Properties**: Edit names, types, and visual properties
- 🎯 **Interactive Elements**: Full editing capabilities for diagram customization

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** 
- **Chrome or Edge** (for full file system features)

### Get Running in 30 Seconds

```bash
# Clone and install
git clone <your-repo-url>
cd real-time-system-visualizer
npm install

# Start the magic
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you're ready to go! 🎉

## 📁 Working with Your Log Files

### Option 1: Native Directory Access (Recommended)
1. Click **"Open Log Directory"** in Log Explorer mode
2. Select your log directory using the native file picker
3. Watch as files are automatically discovered and monitored
4. New log entries appear automatically as files are updated

### Option 2: Drag & Drop (All Browsers)
Simply drag your log files onto the interface - works everywhere!

## 📝 Log Format Examples

### JSON Structured Logs (Recommended)
```json
{
  "timestamp": "2024-01-15T10:30:00.123Z",
  "message": "Processing user request",
  "component": "api-gateway",
  "event_type": "request_received",
  "unblind": {
    "actions": [
      {
        "id": "api-gateway-node",
        "action": "highlight",
        "style": "active"
      }
    ],
    "data": {
      "emoji": "🚀",
      "user_id": "user_123",
      "request_id": "req_456"
    }
  }
}
```

### Plain Text Logs (Also Supported)
```
2024-01-15T10:30:00.123Z [INFO] api-gateway: Processing user request
2024-01-15T10:30:01.456Z [WARN] rate-limiter: Approaching threshold
2024-01-15T10:30:02.789Z [ERROR] database: Connection timeout
```

### Supported File Extensions
- `.log` - Standard log files
- `.txt` - Text-based logs  
- `.out` - Application output
- `.err` - Error logs
- `.trace` - Trace files
- `.debug` - Debug output

## 🎨 Visual Features

### Smart Annotations
Log entries can display contextual information right on your diagram:

```json
{
  "message": "Sending STOP command to TTS engine",
  "unblind": {
    "actions": [
      {
        "id": "tts-connector",
        "action": "annotate",
        "annotation": "Sending STOP to TTS engine..."
      }
    ]
  }
}
```

### Emoji Support
Add visual flair to your logs:

```json
{
  "message": "System startup complete",
  "unblind": {
    "data": {
      "emoji": "✅"
    }
  }
}
```

### Highlighting Styles
- 🔵 **active** - Component is processing
- 🟢 **success** - Operation completed successfully  
- 🟡 **warning** - Attention needed
- 🔴 **error** - Something went wrong
- ⚪ **context** - Related component

## 🏗️ System Architecture

```
src/
├── app/                    # Next.js App Router
│   └── page.tsx           # Main application
├── components/            # React components
│   ├── LogViewer.tsx      # Log exploration interface
│   ├── DirectoryBrowser.tsx # File system integration
│   ├── NodeComponent.tsx  # Visual diagram nodes
│   ├── ConnectorComponent.tsx # Node connections
│   └── AnnotationOverlay.tsx # Smart annotations
├── utils/                 # Core utilities
│   └── fileSystemAccess.ts # File System Access API
├── types/                 # TypeScript definitions
│   ├── log.ts            # Log entry structures
│   ├── node.ts           # Diagram components
│   └── canvas.ts         # Canvas management
└── hooks/                 # Custom React hooks
    ├── useCanvas.ts       # Canvas state management
    └── useConnectionCreation.ts # Interactive connections
```

## 🔧 Advanced Configuration

### Custom Component Types
Create your own system components by extending the node types:

```typescript
// Add to your log entries
{
  "component": "my-custom-service",
  "unblind": {
    "actions": [
      {
        "id": "my-custom-node",
        "action": "highlight",
        "style": "active"
      }
    ]
  }
}
```

### Real-Time Integration
For live log streaming, your backend can write to files that the visualizer monitors:

```python
# Python example
import json
import datetime

def log_system_event(component, message, actions=None):
    entry = {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "message": message,
        "component": component,
        "unblind": {
            "actions": actions or []
        }
    }
    
    with open("system.log", "a") as f:
        f.write(json.dumps(entry) + "\n")
```

## 🌐 Browser Support

| Feature | Chrome/Edge | Firefox | Safari |
|---------|-------------|---------|--------|
| Basic Visualization | ✅ | ✅ | ✅ |
| Log Explorer | ✅ | ✅ | ✅ |
| Graph Editor | ✅ | ✅ | ✅ |
| Native File Access | ✅ | ❌ | ❌ |
| Drag & Drop Files | ✅ | ✅ | ✅ |
| Real-time Monitoring | ✅ | ❌ | ❌ |

*For the best experience, use Chrome or Edge to get native file system access and real-time monitoring.*

## 🚀 Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm run start

# Or deploy to Vercel/Netlify
npm run build && npx vercel --prod
```

## 🤝 Contributing

We love contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin amazing-feature`
5. **Open** a Pull Request

### Development Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🎯 Use Cases

### Perfect For:
- 🔍 **Debugging Distributed Systems**: Visualize message flows between microservices
- 📊 **Performance Analysis**: See timing and bottlenecks in your system
- 🎓 **System Documentation**: Create living diagrams of your architecture
- 🐛 **Issue Investigation**: Trace problems through visual log exploration
- 👥 **Team Collaboration**: Share visual system understanding

### Real-World Examples:
- **AI/ML Pipelines**: Track data flow through processing stages
- **Microservices**: Visualize service-to-service communication
- **IoT Systems**: Monitor device interactions and state changes
- **Chat Applications**: Debug message routing and delivery
- **Financial Systems**: Trace transaction flows and validations

## 🔮 Roadmap

- [ ] **Real-time WebSocket Integration**: Live log streaming
- [ ] **Performance Metrics**: Built-in timing and performance analysis
- [ ] **Multi-session Comparison**: Compare different system runs
- [ ] **Export Capabilities**: Save diagrams and analysis
- [ ] **Advanced Filtering**: Complex log search and filtering
- [ ] **Machine Learning**: Anomaly detection in log patterns
- [ ] **Collaboration Features**: Share and comment on visualizations

## 📄 License

MIT License - feel free to use this in your projects!

---

**Made with ❤️ for developers who love visual debugging**

*Have questions? Found a bug? Want to contribute? Open an issue or start a discussion!*