"# 🎓 TQI - Teacher Quality Index

> **Empowering Education Through Transparent, Data-Driven Teacher Reviews**

TQI (Teacher Quality Index) is a comprehensive teacher rating and review platform designed to provide transparent, merit-based feedback for professors across multiple universities. The platform enables students to submit structured reviews while maintaining academic integrity through verification systems, and helps educators enhance their professional profiles.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Mobile-orange.svg)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Running the Application](#running-the-application)
- [User Roles](#user-roles)
- [Core Workflows](#core-workflows)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Security & Privacy](#security--privacy)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)
- [Contact](#contact)

---

## 🌟 Overview

TQI is a self circulating mobile application that facilitates authentic, data-driven teacher evaluations. By implementing strict verification mechanisms and structured questionnaires, TQI ensures that feedback is both meaningful and credible, benefiting students, educators, and institutions alike.

### Why TQI?

- **Merit-Based Access**: Only academically qualified students (6.5+ SGPA) can submit reviews
- **Structured Feedback**: 15-20 carefully designed questions + open-ended responses
- **Multi-University Support**: Scalable architecture for any educational institution
- **Data Integrity**: Marksheet verification through authorized sources
- **Profile Enhancement**: Helps professors build credible professional profiles
- **Transparent Analytics**: Median-based scoring system for fair representation

---

## Key Features

### For Students

- **Secure Authentication**: Email, Google Account, and LinkedIn integration
- **Academic Verification**: Upload official marksheet for eligibility verification
- **Comprehensive Review System**: 15-20 structured questions covering:
  - Teaching methodology
  - Subject knowledge
  - Communication skills
  - Availability and support
  - Fairness in evaluation
  - Course content quality
- **Open-Ended Feedback**: Share detailed thoughts beyond structured questions
- **Professor Discovery**: Search and filter professors by department, course, or university

### For Teachers/Professors

- **Review Dashboard**: View aggregated ratings and feedback
- **Session Management**: Control when review sessions open/close
- **Performance Analytics**: Track ratings over time with median calculations
- **Professional Profile**: Showcase credentials with Google Account and LinkedIn integration
- **Profile Value Enhancement**: Build credibility through transparent feedback

### For Universities

- **Institutional Dashboard**: Separate sections for each university
- **Data Integration**: Optional data sharing (attendance, enrollment, etc.)
- **Authorized Verification**: Integrate with official systems for marksheet validation
- **Aggregate Insights**: Department-wide and university-wide analytics

### System Features

- **Role-Based Access Control (RBAC)**: Student, Teacher, Admin, University roles
- **Responsive Design**: Seamless experience across web and mobile
- **Data Privacy**: GDPR-compliant data handling
- **Notification System**: Email alerts for review sessions and updates
- **Real-Time Updates**: Live session status and review submission tracking
- **Statistical Analysis**: Median-based scoring to minimize outlier bias

---

## Problem Statement

Traditional teacher evaluation systems face several critical challenges:

1. **Lack of Transparency**: Feedback is often not accessible or actionable
2. **No Verification**: Anyone can submit reviews without academic validation
3. **Unstructured Data**: Inconsistent feedback makes analysis difficult
4. **Limited Access**: Existing platforms don't serve all universities equally
5. **Profile Fragmentation**: Professors struggle to showcase their teaching quality professionally
6. **Bias and Manipulation**: Unverified reviews can be unfair or fraudulent

---

## Solution

TQI addresses these challenges through:

### 1. **Academic Verification System**
- Students must upload official marksheets from authorized sources
- Minimum 6.5 SGPA requirement ensures serious, engaged reviewers
- One-time verification process per semester

### 2. **Structured Review Framework**
- 15-20 standardized questions across all reviews
- Quantitative ratings (1-5 scale) for objective comparison
- Qualitative text field for nuanced feedback
- Median calculation to reduce extreme bias

### 3. **Time-Controlled Review Sessions**
- Professors control when reviews are open
- Typically aligned with semester end
- Prevents out-of-context or retaliatory reviews

### 4. **Multi-University Architecture**
- Separate sections for each institution
- Customizable questionnaires per university
- Federated data model with privacy controls

### 5. **Professional Profile Integration**
- LinkedIn and Google Account linking
- Verified credentials increase profile visibility
- Build reputation for career advancement

--

### Access the Application

## User Roles

### 1. Student
**Capabilities:**
- Register and verify academic credentials
- Upload marksheet for SGPA verification
- Search for professors and courses
- Submit reviews during active sessions
- View own submission history
- Update profile information

**Access Requirements:**
- Valid university email
- Verified marksheet with ≥6.5 SGPA
- Active enrollment status

### 2. Professor/Teacher
**Capabilities:**
- Create and manage review sessions
- View aggregated ratings and feedback
- Access detailed analytics dashboard
- Manage profile (bio, courses, LinkedIn)
- Respond to reviews (optional feature)
- Export review data

**Access Requirements:**
- University-issued faculty email
- Admin approval for account activation

### 3. University Admin
**Capabilities:**
- Manage university-specific settings
- Approve professor accounts
- Customize questionnaire for their institution
- View department-wide analytics
- Export institutional reports
- Manage student verification process

### 4. System Admin
**Capabilities:**
- Full system access
- Manage all universities
- User management across institutions
- System configuration
- Security and audit logs
- Platform-wide analytics

---

## Core Workflows

**Steps:**
1. Student registers with university email
2. Receives verification email
3. Completes profile (name, department, etc.)
4. Uploads official marksheet (PDF)
5. System validates SGPA ≥ 6.5
6. Admin approves verification (if needed)
7. Student gains review access

### 2. Professor Creates Review Session

**Steps:**
1. Professor selects course and semester
2. Sets session duration (start/end dates)
3. Chooses questionnaire template
4. Activates session
5. Eligible students receive notifications

### 3. Student Submits Review

**Steps:**
1. Student views active review sessions
2. Selects professor/course to review
3. Answers 15-20 structured questions (rating 1-5)
4. Provides open-ended text feedback
5. Confirms anonymous/non-anonymous submission
6. Submits review
7. System updates professor's median rating


## Security & Privacy

### Data Protection

1. **Password Security**
   - Bcrypt hashing with salt rounds = 12
   - Minimum password requirements: 8 chars, 1 uppercase, 1 number, 1 special char
   - Password reset via secure email tokens (15-minute expiry)

2. **File Upload Security**
   - File type validation (PDF only for marksheets)
   - Max size: 5 MB
   - Virus scanning before storage
   - Secure S3 bucket with private access

3. **Data Anonymization**
   - Reviews can be anonymous (student identity hidden from professors)
   - Aggregated data only shared with universities
   - No personally identifiable information (PII) in analytics

### Access Control

- **Role-Based Access Control (RBAC)**:
  - Students: Read own data, write reviews
  - Professors: Read own reviews, manage sessions
  - University Admins: Read university data, approve users
  - System Admins: Full access

- **API Rate Limiting**:
  - 100 requests/minute per user
  - 500 requests/minute per IP
  - Exponential backoff on violations


### Code Style

## Roadmap

### Phase 1: MVP (Current)
User authentication (Email, Google)
Student verification system
Professor profiles
Review session management
15-20 question questionnaire
Median rating calculation
Basic analytics dashboard
Multi-university support

```
MIT License

Copyright (c) 2025 TQI - Teacher Quality Index

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the \"Software\"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Project Stats

![GitHub stars](https://img.shields.io/github/stars/your-org/tqi?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-org/tqi?style=social)
![GitHub issues](https://img.shields.io/github/issues/your-org/tqi)
![GitHub pull requests](https://img.shields.io/github/issues-pr/your-org/tqi)
![GitHub last commit](https://img.shields.io/github/last-commit/your-org/tqi)

---

<div align=\"center\">
