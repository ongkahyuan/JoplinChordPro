# ChordPro Renderer for Joplin

A Joplin plugin that renders ChordPro song markup directly in your notes with chord diagrams, lyrics formatting, and automatic transposition capabilities.

## Features

- **ChordPro Rendering**: Automatically renders ChordPro markup in code blocks tagged with ````chordpro````
- **Chord Diagrams**: Displays chord names above lyrics with proper formatting
- **Transposition Support**: Automatically detects and applies transpose directives (`{transpose: +2}`)
- **Dark Theme Support**: Automatically adapts to Joplin's dark/light themes
- **Mobile Support**: Works on the mobile version of Joplin
- **Song Metadata**: Extracts and displays title, artist, capo information, and credits


## Usage

### Basic Syntax

Create a code block in your Joplin note with the language set to `chordpro`:

````markdown
```chordpro
{title: Song Title}
{artist: Artist Name}

[Verse 1]
C             G
These are the chords above lyrics
F              C
With proper alignment and spacing
```
````

### Transposition

The plugin automatically detects and applies transposition directives:

```chordpro
{transpose: +2}
{title: My Song}

[C]Original chord will be rendered as [D]
```

### Full Example

````markdown
```chordpro
{title: House of the Rising Sun}
{artist: The Animals}
{capo: 1}

[Intro]
Am   C         D      F
There is a house in New Orleans
Am   C         E      E7
They call the Rising Sun
Am   C         D      F  
And it's been the ruin of many a poor boy
Am         E7        Am
And God, I know I'm one
```
````

## Development

### Prerequisites

- Node.js and npm
- Joplin desktop app (for testing)

### Building the Plugin

```bash
# Install dependencies
npm install

# Build the plugin
npm run dist
```

The built plugin will be available in the `publish/` directory.

### Project Structure

```
src/
├── index.ts                    # Plugin entry point
├── chordproRenderer.ts         # Markdown-it plugin for ChordPro
└── chordpro/
    ├── songProcessor.ts        # ChordPro parsing and processing
    ├── styles.ts              # CSS styles for rendering
    ├── htmlInjector.ts        # HTML metadata injection
    ├── metadataBuilder.ts     # Extracts song metadata
    └── utils.ts               # Utility functions
```

### Updating the Version

```bash
npm run updateVersion
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

- **Issues**: Report bugs or feature requests on the [GitHub Issues page](https://github.com/ongkahyuan/JoplinChordPro/issues)
- **Documentation**: For build/publishing details, see [GENERATOR_DOC.md](./GENERATOR_DOC.md)
