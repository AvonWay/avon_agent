```
# Avon Landing Page Terminal Commands

## 1. Create Project Directory
```
mkdir avon-landing-page
cd avon-landing-page
```

## 2. Install Next.js and Tailwind CSS
```
npm create next-app --ts
cd avon-landing-page
npx tailwindcss init
```

## 3. Configure Next.js App
```
npm install react-hook-form
```

## 4. Create Hero Section
```
echo "<HeroSection />" > pages/index.tsx
```

## 5. Create Contact Form
```
echo "<ContactForm />" > components/ContactForm.tsx
```

## 6. Configure Theme
```
echo "dark" > .env.local
```

## 7. Install Neon Green Theme
```
npm install tailwindcss-components
```

## 8. Add Neon Green Classes
```
echo "body { @apply bg-neutral-900 text-gray-300; }" >> styles/globals.css
```

## 9. Create Features Grid
```
echo "<FeaturesGrid />" > components/FeaturesGrid.tsx
```

## 10. Start Dev Server with HMR
```
npm run dev
```

## 11. Run Contact Form
```
npm run dev --filter components/ContactForm.tsx
```