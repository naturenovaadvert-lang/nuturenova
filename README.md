# NurtureNova Storefront

Responsive React storefront for browsing NurtureNova protein products, built with Vite, Tailwind CSS, and GSAP.

## Live Demo

Visit the live site at **[https://romackjnr.github.io/wisestores/](https://romackjnr.github.io/wisestores/)**.

## �🎨 Description

Browse flavor products, view product details, and adjust quantities in the local cart. Paystack checkout uses server-side API routes and requires a `PAYSTACK_SECRET_KEY` configured in Vercel.

## 🚀 Features

- **Advanced GSAP Animations** : Smooth and performant animations for an exceptional user experience
- **Responsive Design** : Interface adapted to all devices (mobile, tablet, desktop)
- **Product Pages** : Individual flavor pages with product images and descriptions
- **Local Cart** : Quantity selection and cart storage in the browser
- **Smooth Navigation** : Interactive navigation bar
- **Multimedia Gallery** : Integrated images and videos
- **Interactive Slider** : Flavor selection with intuitive navigation

## 🛠️ Technologies Used

- **React 19** : JavaScript library for building user interfaces
- **Vite** : Ultra-fast build tool for development
- **Tailwind CSS 4** : Utility-first CSS framework for styling
- **GSAP 3** : Professional animation library
- **React Responsive** : Media queries management in React
- **ES Modules** : Modern JavaScript syntax

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/romackjnr/wisestores.git
   cd wisestores
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

## 📝 Available Scripts

```bash
# Start the development server
npm run dev

# Build for production
npm run build

# Check code linting
npm run lint

# Preview the production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── ClipPathTitle.jsx
│   ├── FlavorSlider.jsx
│   ├── FlavorTitle.jsx
│   ├── NavBar.jsx
│   └── VideoPinSection.jsx
├── sections/           # Main page sections
│   ├── HeroSection.jsx
│   ├── BenefitSection.jsx
│   ├── FlavorSection.jsx
│   ├── NutritionSection.jsx
│   ├── TestimonialSection.jsx
│   ├── MessageSection.jsx
│   └── FooterSection.jsx
├── constants/          # Constants and data
├── App.jsx            # Main component
├── main.jsx           # Entry point
└── index.css          # Global styles
```

## 🎯 Main Sections

- **HeroSection** : Landing section with introduction animation
- **BenefitSection** : Product benefits presentation
- **FlavorSection** : Interactive flavor gallery with slider
- **NutritionSection** : Nutritional information
- **TestimonialSection** : Customer testimonials
- **MessageSection** : Call-to-action or promotional message
- **FooterSection** : Footer with links and information

## 🌐 Deployment

To deploy the production version:

```bash
npm run build
```

Compiled files are written to `docs/` for the GitHub Pages workflow.

### Paystack checkout

The Paystack API routes in `api/paystack/` require a Vercel deployment; the static GitHub Pages demo does not run these routes.

1. In Paystack, start with a **test secret key**. Never share it in chat or commit it to the repository.
2. In Vercel, open the project’s **Settings → Environment Variables** and add `PAYSTACK_SECRET_KEY` with that secret key. Enable it for the environments you use, then redeploy.
3. Keep the key server-side: do not prefix it with `VITE_` or put it in frontend code. The `.env.example` file is a placeholder, not a working key.
4. Test a checkout on the Vercel deployment. Switch to the live secret key in Vercel only when ready to accept real payments, and redeploy.

## 📱 Responsiveness

The project uses Tailwind CSS and React Responsive to ensure an optimal experience on:
- Mobile devices (320px and above)
- Tablets (768px and above)
- Desktops (1024px and above)

## 💡 Development Notes

- GSAP animations are integrated via `@gsap/react` for better React integration
- Images and videos are stored in the `public/` folder
- Custom fonts are imported from Google Fonts
