# ClaReSys – Classroom Reservation System

## Overview

**ClaReSys (Classroom Reservation System)** is a distributed platform designed to manage and reserve academic classrooms efficiently.  
The system is built using a **microservices architecture** and an **event-driven approach**, ensuring scalability, reliability, and maintainability.

This project was developed as a **university academic project**, applying modern software engineering, distributed systems, and DevOps best practices.

---

## Objectives

- Centralize classroom and reservation management
- Prevent scheduling conflicts through automated validation
- Provide real-time notifications and system auditing
- Enable administrative control and monitoring
- Support scalability through microservices and asynchronous communication

---

## User Roles

### Administrator
- Classroom management
- User management
- Reservation management
- Audit log visualization
- Maintenance ticket management

### Teacher
- Classroom reservations
- Reservation cancellations
- Class and schedule visualization

---

## System Architecture

ClaReSys follows a **microservices-based architecture** combined with:

- Event-Driven Architecture
- CQRS (Command Query Responsibility Segregation)
- Asynchronous communication via messaging systems

Each service is independently deployable and communicates using REST APIs, message queues, or event streams.

---

## Technologies Used

### Backend
- FastAPI
- Python
- JWT Authentication

### Frontend
- Web: React + Vite
- Mobile: React Native + Expo
- Desktop: Electron (Administrator only)

### Infrastructure & DevOps
- Docker & Docker Compose
- Turborepo (Monorepo)
- Nginx (API Gateway)

### Databases & Messaging
- PostgreSQL – transactional data
- MongoDB – logs and audit data
- Redis – caching
- RabbitMQ – command and notification messaging
- Kafka – event streaming and audit logs
- MQTT Bridge – real-time messaging integration

---

## Microservices

- `api-gateway` – Central entry point and routing
- `auth-service` – Authentication and authorization
- `user-service` – User management
- `classroom-service` – Classroom management
- `booking-command` – Reservation creation and cancellation
- `booking-query` – Reservation read model
- `timetable-engine` – Schedule conflict validation
- `notification-service` – Email and system notifications
- `audit-log-service` – System audit logging
- `maintenance-service` – Maintenance ticket management
- `reporting-service` – Reports and analytics
- `mqtt-bridge` – MQTT message integration

---

## Repository Structure

This project uses a **monorepo structure** managed with Turborepo:
```
apps/
├─ api-gateway
├─ auth-service
├─ user-service
├─ classroom-service
├─ booking-command
├─ booking-query
├─ timetable-engine
├─ notification-service
├─ audit-log-service
├─ maintenance-service
├─ reporting-service
├─ mqtt-bridge
├─ front-web
├─ front-mobile
└─ front-desktop
packages/
├─ shared
└─ config
```
---

## Environment Configuration

An example environment configuration file is provided:

.env.example

Create a `.env` file based on this template and adjust values as required before running the project.

---

## Development Setup

### Prerequisites
- Node.js
- Docker & Docker Compose
- npm

### Installation dependencies

```sh
npm install
```

### Run Development Environment
```sh
npm run dev
```

This command:
- Starts infrastructure services (databases, messaging systems)
- Launches backend microservices
- Runs frontend web, mobile, and desktop applications

### Testing

Each microservice includes unit tests using appropriate testing frameworks
(e.g., Pytest, Jest), which can be integrated into CI pipelines.

### Security & Auditing

- JWT-based authentication
- Role-based access control
- Centralized audit logging
- Secure handling of environment variables

### Academic Context

This project was developed as a university-level academic project, applying concepts from:

- Distributed Systems
- Software Architecture
- DevOps and CI/CD
- Software Quality and Auditing

#### Authors

ClaReSys Project Team

#### License

This project is intended for academic and educational purposes only.
