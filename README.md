# IPT Angular 21 Boilerplate

Email sign up with verification, authentication & forgot password built with Angular 21.

**Live Demo:** https://angular21-auth-boilerplate-bt8r.onrender.com  
**Backend API:** https://node-mysql-api-0foa.onrender.com  
**API Docs:** https://node-mysql-api-0foa.onrender.com/api-docs

## Features

- Email sign up and verification
- JWT authentication with auto-refresh tokens
- Role-based authorization (Admin / User)
- Forgot password and reset password via email
- Profile management (update details, change password, delete account)
- Admin panel to view and manage all accounts

## Tech Stack

- Angular 21 (NgModule architecture)
- Bootstrap 5
- TypeScript
- RxJS

## Project Structure

```
src/app/
├── account/       # Login, register, verify email, forgot/reset password
├── home/          # Home page (authenticated users)
├── profile/       # View and update profile
├── admin/         # Admin panel and account management
├── _helpers/      # JWT interceptor, error interceptor, fake backend
├── _models/       # Account and Role models
└── _services/     # Account service, alert service
```

## Local Development

```bash
npm install
npm start
```

Runs on `http://localhost:4200`. Uses a fake backend in development (no server needed).

## Deployment

Build command: `npm run build`  
Output directory: `dist/ipt-2026-frontend`  
Deployed as a static site on Render.

## Author

[Earl Justine Coyoca](https://github.com/sunrakudev)
