# Figma Variables to Design Tokens

This project converts Figma variables into design tokens that can be used across your design system. It fetches variables from a Figma file using the REST API and transforms them into a format compatible with Style Dictionary then generates css custom properties.

## Features

- Fetches variables from Figma using the REST API
- Transforms Figma variables into Design Tokens Community Group (DTCG) format
- Generates CSS variables for both light and dark themes
- Supports semantic tokens with mode-specific values
- Handles color, spacing, and other design token types
- Converts RGB colors to hex format

## Prerequisites

- Node.js 24.2.0 or later
- A Figma access token
- A Figma file with variables

## Installation

1. Clone the repository:

```bash
git clone [your-repo-url]
cd figma-variables
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with your Figma credentials:

```env
FIGMA_ACCESS_TOKEN=your_access_token_here
FIGMA_FILE_KEY=your_file_key_here  # Get this from your Figma file URL
```

The file key can be found in your Figma file URL. For example, in `https://www.figma.com/file/abc123/MyDesign`, the file key would be `abc123`.

## Project Structure

```
figma-variables/
├── index.js           # Main script for fetching and transforming variables
├── utils.js           # Utility functions (e.g., color conversion)
├── style-dictionary.config.json  # Style Dictionary configuration
├── output/            # Generated files
│   ├── variables.json        # Raw Figma variables
│   ├── variables-dtcg.json   # Transformed DTCG format
│   └── theme.css            # Generated CSS variables
└── package.json
```

## Usage

1. Fetch and transform variables:

```bash
npm run get-tokens
```

2. Build CSS files:

```bash
npm run build-tokens
```

3. Or do both in one command:

```bash
npm run tokens
```

## Token Structure

The project handles three types of tokens:

1. **Core Tokens**: Base design values (colors, spacing, etc.)
2. **Semantic Tokens**: Tokens that reference core tokens (e.g., primary color)
3. **Component Tokens**: Tokens specific to components (e.g., button styles)

### Example Output

```css
:root {
  /* Core tokens */
  --color-blue-50: #1500ff;
  --space-md: 16px;

  /* Semantic tokens */
  --color-primary-default: var(--color-blue-50);
  --color-primary-base: var(--color-blue-60);

  /* Component tokens */
  --button-default-background-color: var(--color-primary-default);
  --button-default-text-color: var(--color-base);
}
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## More details

- [Figma REST API](https://www.figma.com/developers/api)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
- [Design Tokens Community Group](https://www.designtokens.org/)
