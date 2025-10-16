# PulseStage

> **Engaging Q&A platform for team all-hands, AMAs, and town halls**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Demo](https://img.shields.io/badge/demo-live-success)](https://demo.pulsestage.app)
[![Self-Host](https://img.shields.io/badge/self--host-ready-orange)]()

PulseStage is an open-source Q&A platform designed for organizations to run effective all-hands meetings, AMAs (Ask Me Anything), and town halls. Submit questions anonymously, vote on what matters most, and get your answers in real-time.

---

## 🌟 Screenshots

<div align="center">

### 📋 Open Questions View
*Your team's questions, prioritized by votes*

![Open Questions](screenshots/02-open-questions.png)

---

### ✍️ Submit Questions
*Easy submission with team context*

![Submit Question](screenshots/03-submit-question.png)

---

### 💡 Answered Questions Timeline
*Track responses organized by week*

![Answered Timeline](screenshots/07-answered-timeline.png)

---

### 🎯 Moderator Dashboard
*Powerful tools for managing your AMA*

![Moderator Dashboard](screenshots/05-moderator-dashboard.png)

---

### 📺 Presentation Mode
*Full-screen display for live events*

![Presentation Mode](screenshots/12-presentation-mode.png)

---

### 🌓 Dark Mode Support
*Beautiful themes for every preference*

![Dark Mode](screenshots/14-dark-mode.png)

</div>

---

## ✨ Features

### For Everyone
- 📝 **Submit Questions** - Ask anything, with optional anonymity
- 👍 **Upvote Questions** - Help prioritize what matters most
- 🔍 **Smart Search** - Find questions and answers quickly
- 📱 **Mobile Responsive** - Works great on any device
- 🌓 **Dark Mode** - Easy on the eyes

### For Moderators
- 🎯 **Answer Management** - Respond to questions efficiently
- 🏷️ **Tag System** - Organize questions by topic
- 📊 **Analytics** - Track engagement and participation
- 🔄 **Real-time Updates** - See new questions instantly
- 📺 **Presentation Mode** - Perfect for live town halls

### For Admins
- 👥 **Multi-Team Support** - Separate spaces for different groups
- 🛡️ **Content Moderation** - AI-powered flagging with manual review
- 🔐 **Role-Based Access** - Granular permissions (Admin, Moderator, Member)
- 📧 **Email Notifications** - Keep everyone in the loop
- 🎨 **Customizable** - Tags, teams, and settings

---

## 🚀 Quick Start

### Try the Demo
Visit **[demo.pulsestage.app](https://demo.pulsestage.app)** to try PulseStage instantly.

### Self-Host (Docker Compose)
```bash
# Clone the repository
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage

# Set up environment
cp env.example .env
# Edit .env with your settings

# Start services
docker-compose up -d

# Visit http://localhost:5173
```

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for production deployment.

---

## 📸 More Screenshots

<details>
<summary><b>🔒 Moderation Queue</b></summary>

![Moderation Queue](screenshots/06-moderation-queue.png)

*Review and approve questions before they go live*
</details>

<details>
<summary><b>⚙️ Admin Panel</b></summary>

![Admin Panel](screenshots/08-admin-panel.png)

*Comprehensive administration tools*
</details>

<details>
<summary><b>🏷️ Tag Management</b></summary>

![Tag Management](screenshots/09-tag-management.png)

*Organize questions with customizable tags*
</details>

<details>
<summary><b>👥 Team Management</b></summary>

![Team Management](screenshots/10-team-management.png)

*Multi-tenant support for different teams*
</details>

<details>
<summary><b>👤 User Profile</b></summary>

![User Profile](screenshots/11-user-profile.png)

*Track your submitted questions and their status*
</details>

<details>
<summary><b>📱 Mobile View</b></summary>

![Mobile View](screenshots/15-mobile-view.png)

*Fully responsive design for mobile devices*
</details>

---

## 🏗️ Architecture

PulseStage is built with modern, production-ready technologies:

- **Frontend**: React 19 + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: PostgreSQL 16
- **Cache/Sessions**: Redis
- **Real-time**: Server-Sent Events (SSE)
- **Deployment**: Docker + Docker Compose

---

## 📚 Documentation

- [🚀 Quick Start Guide](docs/getting-started/quick-start.md)
- [⚙️ Configuration](docs/getting-started/configuration.md)
- [🔐 Authentication Setup](docs/deployment/oauth-setup.md)
- [👥 User Guide](docs/user-guide/)
- [🛡️ Moderator Guide](docs/moderator-guide/)
- [⚡ Admin Guide](docs/admin-guide/)
- [🏗️ Architecture](docs/architecture/)
- [🔒 Security](docs/security/)

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup
```bash
# Install dependencies
npm install

# Start local development
make dev

# Run tests
make test

# Check coverage
cd api && npm run test:coverage
cd web && npm run test:coverage
```

---

## 📊 Test Coverage

- **API**: 327+ tests | ~40% coverage
- **Web**: 26+ tests | ~20% coverage
- **E2E**: Playwright integration tests
- **Security**: Automated scans (Semgrep + Trivy)

---

## 🌍 Use Cases

### 🏢 Company All-Hands
Monthly company-wide Q&A sessions with leadership.

### 💼 Team AMAs
Department-specific Ask Me Anything sessions.

### 🎙️ Town Halls
Large-scale community or organization gatherings.

### 📚 Webinars & Conferences
Engage audiences during virtual or hybrid events.

### 🎓 Education
Classroom Q&A and lecture engagement.

---

## 🔒 Security

PulseStage takes security seriously:
- ✅ Content Security Policy (CSP)
- ✅ OWASP security headers
- ✅ SQL injection protection (Prisma ORM)
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Input validation
- ✅ Automated security scans

See [docs/security/](docs/security/) for details.

---

## 📄 License

Licensed under the [Apache License 2.0](LICENSE).

Copyright 2025 Sean M. Dalton

---

## 🙏 Acknowledgments

Built with ❤️ using amazing open-source projects:
- React, TypeScript, TailwindCSS
- Node.js, Express, Prisma
- PostgreSQL, Redis
- And many more!

---

## 📞 Support & Community

- 🐛 [Report a Bug](https://github.com/seanmdalton/pulsestage/issues)
- 💡 [Request a Feature](https://github.com/seanmdalton/pulsestage/issues)
- 📖 [Read the Docs](docs/)
- 💬 [Discussions](https://github.com/seanmdalton/pulsestage/discussions)

---

<div align="center">

**⭐ Star this project if you find it useful!**

[🚀 Deploy PulseStage](https://github.com/seanmdalton/pulsestage/) • [📖 Documentation](docs/) • [🎮 Live Demo](https://demo.pulsestage.app)

</div>

