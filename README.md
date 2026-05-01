# 🏥 Erin AI | Multi-Agent Healthcare Command Center

**Live Demo:** [https://erin-assistant.vercel.app/]

Erin AI is a high-performance, full-stack application designed to streamline hospital operations. Originally built for the Google Cloud Gen AI Academy APAC 2026, it serves as a central hub for managing patients, scheduling appointments, and interacting with specialized AI agents to optimize clinical workflows.

This repository features a robust **Multi-Agent Architecture** powered by Google's Gemini 2.5 Flash, capable of autonomous tool-calling, database querying, and natural language processing.

## 🚀 Key Features

* **Multi-Agent AI Architecture:** Utilizes specialized sub-agents (Booking, Patient Admin, Doctor Inquiry) orchestrated by a root AI administrator for precise task delegation.
* **Real-Time Tool Calling:** Agents seamlessly interface with external hospital databases to check live doctor schedules, flag appointment conflicts, and securely manage patient records.
* **Production-Ready Backend:** Custom Python/FastAPI backend deployed on Render, featuring robust error handling, rate-limit protection (429 handling), and stateful conversation memory.
* **Clinical UI/UX:** A minimalist, distraction-free React frontend built with Tailwind CSS, featuring a responsive command center and premium glassmorphic UI elements.

## 🛠 Tech Stack

**Frontend:**
* React.js & Tailwind CSS
* Lucide React (Icons)
* Vercel (Hosting)

**Backend & AI:**
* Python (FastAPI)
* Google Agent Development Kit (ADK)
* Google Gemini 2.5 Flash (`gemini-2.5-flash`)
* Render (Hosting)

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/8bit-gaurav/Hackathon-Frontend.git](https://github.com/8bit-gaurav/Hackathon-Frontend.git)
   cd Hackathon-Frontend
