# WebRTC Real-Time AI Interface

## Introduction

This application demonstrates a browser-based real-time communication system powered by WebRTC and an AI backend. The platform enables live audio streaming and structured data exchange between a web client and an AI service using a signaling server.

The goal of this project is to showcase how low-latency voice interaction and browser-level control can be achieved through modern WebRTC architecture.

---

## Architecture Overview

The system consists of three primary components:

* Frontend (HTML, JavaScript, CSS)
* Backend signaling server (Java or Python implementation)
* OpenAI Realtime API endpoint

The backend handles SDP negotiation and session initialization, while the browser manages media capture and real-time communication.

---

## Core Features

### 1. Live Audio Streaming

* Captures microphone input from the browser
* Streams audio to the AI service in real time
* Receives streamed AI-generated audio responses
* Maintains low-latency interaction

### 2. Data Channel Messaging

* Establishes a reliable WebRTC Data Channel
* Sends structured JSON messages
* Receives AI-generated structured responses
* Enables command-driven browser interactions

---

## Browser Interaction Capabilities

The demo includes dynamic browser control through the Data Channel. Supported interactions include:

* Retrieving HTML content
* Updating background color
* Changing font styles
* Adjusting button size
* Modifying button color

These actions are triggered by structured messages exchanged over WebRTC.

---

## Connection Lifecycle

### Step 1: Session Initialization

The browser generates an SDP offer and sends it to the backend signaling endpoint.

### Step 2: Backend Negotiation

The backend forwards the offer to the AI endpoint and retrieves an SDP answer.

### Step 3: SDP Exchange

The backend returns the SDP answer to the browser.

### Step 4: WebRTC Establishment

The browser:

* Applies the remote SDP
* Establishes ICE connectivity
* Negotiates audio and data channels

### Step 5: Active Real-Time Session

Once connected:

* Audio streams bidirectionally
* Data Channel exchanges structured messages
* AI-driven browser updates occur in real time

---

## Project Directory Structure

```
front/              Frontend assets
java_backend/       Java signaling server
python_backend/     Python signaling server
```

Either backend can be used depending on deployment preference.

---

## Setup Instructions

### 1. Install Dependencies

From the project root:

```
npm install
```

For Java backend:

```
mvn clean install
```

For Python backend:

```
pip install -r requirements.txt
```

---

### 2. Configure Environment

Set your OpenAI API key as an environment variable:

```
OPENAI_API_KEY=your_api_key_here
```

Ensure the frontend base URL matches your backend server address.

---

### 3. Run the Application

Frontend (development mode):

```
npm run dev
```

Java backend:

```
mvn spring-boot:run
```

Python backend:

```
python WebRTC.py
```

---

## Security Recommendations

* Store API keys in environment variables
* Do not commit secrets to version control
* Exclude build artifacts and IDE files via `.gitignore`

Suggested `.gitignore` entries:

```
.idea/
target/
__pycache__/
*.iml
desktop.ini
```

---

## Potential Extensions

This foundation can be extended to support:

* AI voice assistants
* Browser automation tools
* Real-time transcription systems
* AI-powered live dashboards
* Interactive learning applications

---

## Summary

This project provides a structured implementation of WebRTC-based real-time communication between a browser and an AI service. It demonstrates how audio streaming and structured messaging can be combined to create responsive, intelligent, voice-enabled web applications.
