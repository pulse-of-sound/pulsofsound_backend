Pulse of Sound – Backend Overview:
This repository contains the backend logic for Pulse of Sound, a therapeutic platform tailored for children with hearing disabilities. The backend is built with Node.js, TypeScript, and Parse Server, and is designed to be modular, secure, and scientifically credible.

Architecture Highlights:
Session & Permission Control: Fine-grained authentication with admin-only flows for chat moderation
Cloud Functions: Custom logic for booking, messaging, and group management, fully tested via Postman
Mute/Unmute Logic: Reliable participant control with error handling and transparent diagnostics
Scientific Integrity: Data validation and logging designed for therapeutic credibility and future research
Scalable Design: Organized for maintainability and extensibility across future features and user roles

Frontend Integration:
The backend exposes REST APIs and Parse SDK endpoints consumed by the Flutter front-end, enabling real-time interaction and seamless user experience.
