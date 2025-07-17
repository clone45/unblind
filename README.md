# Real-Time System Playback Visualizer

A Next.js application for debugging complex real-time systems by visualizing message flows and state changes through interactive timeline playback.

## Features

- **Interactive Timeline**: Scrub through system events with precise timing
- **System Component Visualization**: Visual representation of your system architecture
- **Message Flow Animation**: See how messages flow between components
- **Event Details Panel**: Inspect detailed information about each event
- **Playback Controls**: Play, pause, step through, and adjust playback speed
- **Log File Support**: Load structured JSON log files for analysis

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm run start
```

## Usage

### 1. Generate Sample Logs

Click "Download Sample Logs" to generate example log files for testing, or use the fake log generator:

```typescript
import { generateAndDownloadSampleLogs } from '@/utils/fakeLogGenerator';

generateAndDownloadSampleLogs(5); // Generate 5 conversation turns
```

### 2. Load Log Files

Upload JSON log files using the file upload interface. Each log entry should follow this structure:

```json
{
  "timestamp": 1642614000.123,
  "event_type": "message_published|message_received|state_change|error",
  "component": "overseer|llm_orchestrator|tts_orchestrator|etc",
  "message_type": "COMPLETE_TRANSCRIPT|LLM_RAW_CHUNK|etc",
  "session_id": "session_12345",
  "user_id": "user_abc",
  "direction": "publish|subscribe|internal",
  "data": {
    "content": "event-specific data"
  },
  "correlation_id": "unique_id_for_tracking",
  "component_state": {
    "current_state": "component state snapshot"
  }
}
```

### 3. Navigate and Analyze

- **Timeline**: Click or drag to navigate to specific times
- **Playback**: Use controls to play through events automatically
- **Components**: Click on system components to see their state
- **Events**: Select timeline events to view detailed information

## System Components

The visualizer supports these system components:

- **Overseer**: Main orchestrator
- **MessageBus**: Central message hub
- **LLM Orchestrator**: AI processing pipeline
- **TTS Orchestrator**: Text-to-speech coordination
- **TextQueueManager**: Buffer management
- **AgentContext**: Configuration state
- **DatabaseMemory**: Conversation history
- **AudioOutput**: Final audio delivery
- **UserSession**: Client connection management
- **WebSocket Manager**: Real-time communication

## Message Types & Colors

- **Blue**: STT Events (Speech-to-Text)
- **Green**: LLM Events (Language Model)
- **Orange**: TTS Events (Text-to-Speech)
- **Purple**: Queue Operations
- **Red**: Error Events
- **Gray**: System Messages

## Technology Stack

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: State management
- **Lucide React**: Icons
- **Canvas API**: Timeline and system visualization

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── EventDetails.tsx
│   ├── FileUpload.tsx
│   ├── PlaybackControls.tsx
│   ├── SystemVisualization.tsx
│   └── Timeline.tsx
├── store/              # Zustand store
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
    ├── fakeLogGenerator.ts
    └── logParser.ts
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Integration with Your Backend

To integrate with your existing system:

1. **Enhanced Logging**: Add structured logging to your backend components
2. **Correlation IDs**: Track related events across components
3. **State Snapshots**: Include component state in log entries
4. **Message Direction**: Specify publish/subscribe/internal for message flow

Example logging decorator:

```python
def log_system_event(component: str, event_type: str, message_type: str = None):
    # Your logging implementation here
    pass
```

## Future Enhancements

- Real-time log streaming
- Performance metrics and analysis
- Multi-session comparison
- Export functionality for visualizations
- Advanced filtering and search
- Machine learning for anomaly detection

## License

MIT License - see LICENSE file for details