# Premium UI/UX Update

The application has been completely reskinned with a **Premium Dark Glassmorphism** theme.

## Key Changes

### 1. Global Theme (`index.css`)
- **Font**: Switched to 'Inter' for a modern, clean look.
- **Colors**: Deep blue/slate background (`#0f172a`) with vibrant blue/purple accents.
- **Glassmorphism**: Added utility classes `.glass` and `.glass-card` for translucent, blurred backgrounds.
- **Animations**: Added smooth fade-in animations.

### 2. Login Page (`LoginPage.jsx`)
- **Layout**: Split layout with a rich gradient background on the left and a glass card form on the right.
- **Visuals**: Added abstract background shapes and glowing effects.
- **Typography**: Improved heading hierarchy and readability.

### 3. Main Application (`MainApp.jsx`)
- **Sidebar**: Translucent dark glass sidebar with hover effects.
- **Top Bar**: Minimalist glass header.
- **Content Area**: Subtle gradient background with card-based layout for sessions.

### 4. Components
- **Session Cards**: Glass panels with hover lift and glow effects.
- **Modals**: Dark glass overlays with blurred backdrops.
- **Inputs & Buttons**: Custom styled for dark mode with focus rings and shadows.
- **Data Views**: `PrepCastAI` and `DynamicFile` views updated to match the dark theme, replacing all white backgrounds with dark glass.

## How to Customize
- **Colors**: Edit the CSS variables in `index.css`.
- **Glass Intensity**: Adjust the `backdrop-filter` blur values in `index.css`.
- **Gradients**: Modify the `background-image` in the `body` selector in `index.css`.

Enjoy your new premium UI!
