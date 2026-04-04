# Odoo POS Cafe

A full-stack Restaurant Point of Sale system built with the MERN stack for the Odoo Hackathon Final Round in collaboration with Indus University.

## Project Overview

Odoo POS Cafe is an intelligent restaurant management system that handles the complete workflow from table-based ordering to kitchen preparation to payment processing and sales reporting. The system supports four distinct user roles with role-based access control ensuring each user sees only what they need.

## Tech Stack

- Frontend: React 18, Vite, Tailwind CSS 3
- Backend: Node.js, Express.js
- Database: MongoDB Atlas with Mongoose ODM
- Authentication: JWT with bcrypt password hashing
- Real-time: Socket.io (planned)
- Icons: Lucide React
- Notifications: React Hot Toast

## Current Development Status

### Completed - Authentication Module

The login and signup module is fully built and functional with the following features.

User Registration
- Full name, username, email, password with confirm password
- Role selection through interactive card-based UI with four roles: Cashier, Kitchen Staff, Customer, and Manager
- Conditional form fields based on selected role. Manager sees a business name field. Cashier and Kitchen staff see an employee ID field. Customer sees a phone number field.
- Password strength meter with real-time visual feedback
- Client-side and server-side dual validation
- Terms and conditions acceptance

User Login
- Supports login via email or username in a single field
- Show and hide password toggle
- Remember me checkbox
- Forgot password link placeholder
- Graceful error handling with toast notifications

Security
- Passwords hashed with bcrypt using 12 salt rounds
- JWT tokens with 7-day expiry stored in both localStorage and httpOnly cookies
- Rate limiting at 50 requests per 15-minute window on all auth routes
- Input sanitization via express-validator
- Password field excluded from all default database queries
- Environment variables for all sensitive credentials

Role-Based Access Control
- Four roles defined: cashier, kitchen, customer, manager
- Each role redirects to its own workspace after login
- Cashier goes to the POS floor view
- Kitchen staff goes to the kitchen display
- Customer goes to the customer portal
- Manager goes to the management dashboard
- Protected route wrapper prevents unauthorized access
- Role authorization middleware on the backend

UI and Design
- Premium light-mode design with a cafe-inspired warm color palette
- Split layout with a dark brand panel on the left and a white auth card on the right
- Auto-rotating role spotlight on the brand panel showing role-specific messaging
- Decorative stat preview cards showing active tables, kitchen queue, payments, and average order
- Smooth animations for mode switching, role selection, and error display
- Fully responsive across desktop, tablet, and mobile
- Google Fonts: Plus Jakarta Sans for headings, Inter for body text, JetBrains Mono for monospace

Post-Login Dashboard
- Role-specific welcome card with gradient background
- Quick action buttons as placeholders for upcoming features
- Account details display showing all user information
- Logout functionality with token cleanup

### Backend API Endpoints

POST /api/auth/signup - Register a new user with role
POST /api/auth/login - Login with email or username
GET /api/auth/me - Get the current authenticated user
POST /api/auth/logout - Clear authentication cookie
GET /api/auth/check-username/:username - Check if a username is available
GET /api/auth/check-email/:email - Check if an email is available
GET /api/health - Server health check

### Database Schema

The User collection stores full name, username (unique), email (unique), hashed password, role, phone, business name, employee ID, avatar, active status, last login timestamp, and automatic created and updated timestamps. Indexes exist on email, username, and role fields.

## Project Structure

```
odoo-pos-cafe/
  package.json
  .gitignore
  server/
    .env
    .gitignore
    package.json
    server.js
    config/
      db.js
    middleware/
      auth.js
    models/
      User.js
    routes/
      auth.js
  client/
    .gitignore
    package.json
    index.html
    vite.config.js
    tailwind.config.js
    postcss.config.js
    src/
      main.jsx
      index.css
      App.jsx
      context/
        AuthContext.jsx
      services/
        api.js
      utils/
        validation.js
      components/
        ProtectedRoute.jsx
        auth/
          AuthBrandPanel.jsx
          AuthCard.jsx
          RoleSelector.jsx
          PasswordStrengthMeter.jsx
      pages/
        Dashboard.jsx
        auth/
          AuthPage.jsx
```

## Getting Started

1. Clone the repository
   git clone https://github.com/Lerner-11052025-20/POS-SOFTWARE.git

2. Install server dependencies
   cd server
   npm install

3. Install client dependencies
   cd client
   npm install

4. Create the server environment file at server/.env with the following variables
   PORT=5000
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=7d
   NODE_ENV=development

5. Start the backend server
   cd server
   npm run dev

6. Start the frontend dev server
   cd client
   npm run dev

7. Open the browser at http://localhost:8080

## Upcoming Tasks

### POS Backend Configuration
- Product management with name, category, price, unit, tax, description, and variants
- Payment method setup with enable and disable toggle for cash, digital, and UPI QR
- Floor plan management to create floors and add tables with seat count and status
- POS terminal setup with session open and close functionality
- Self ordering token generation linked to tables

### POS Frontend Terminal
- Floor view showing tables as selectable cards with status indicators
- Order screen with product grid, quantity controls, and cart sidebar
- Payment screen supporting cash, digital card, and UPI QR methods
- UPI QR code generation from saved UPI ID with confirmation flow
- Complete order lifecycle from draft to sent to preparing to completed to paid

### Kitchen Display
- Real-time order board with three columns: To Cook, Preparing, and Completed
- Click to advance orders through preparation stages
- Individual item strike-through when prepared
- Ticket numbers matching order numbers
- Socket.io integration for live updates

### Customer Display
- Separate display screen showing order information
- Payment status visibility for transparency
- Real-time updates via Socket.io

### Reporting and Dashboard
- Sales dashboard with charts and KPI cards
- Report filters by period, session, responsible staff, and product
- PDF and XLS export options
- Session-wise sales analysis

### Polish and Final Touches
- Dark and light mode toggle with smooth transitions
- Micro-animations and hover effects throughout the application
- Demo data seeding for presentation
- Complete end-to-end flow testing
- Final responsive design review

## Team

Hackathon Final Round - Odoo Hackathon in collaboration with Indus University

## License

MIT
