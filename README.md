# Deadlock Detection and Recovery System

**A Finite State Automata-Based Simulation System for Concurrent Systems**

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

This project implements a comprehensive **deadlock detection and recovery system** for concurrent computing environments using **Finite State Automata (FSA)**. The system simulates concurrent processes competing for shared resources, detects deadlocks using Wait-For Graph (WFG) cycle detection, and automatically recovers using intelligent victim selection strategies.

### Key Concepts

- **Deadlock**: A state where processes are indefinitely blocked waiting for resources held by other processes
- **FSA**: Formal mathematical model used to represent process, resource, and system states
- **Wait-For Graph**: Directed graph representing resource dependencies between processes
- **Victim Selection**: Algorithm to choose which process to terminate during recovery

---

## ✨ Features

### Core Functionality
- ✅ **FSA-Based Modeling**: Processes, resources, and system states modeled as finite state automata
- ✅ **Deadlock Detection**: DFS-based cycle detection in Wait-For Graphs
- ✅ **Automatic Recovery**: Multiple victim selection strategies (Priority, Cost, Time, Resource-based)
- ✅ **Multiple Detection Strategies**: Immediate, Periodic, and CPU-triggered detection
- ✅ **Performance Metrics**: Comprehensive tracking of detection latency, recovery time, and system overhead

### User Interfaces
- 🖥️ **CLI**: Interactive command-line interface
- 📄 **Config Files**: JSON/YAML scenario definitions
- 🌐 **Web GUI**: Modern web interface with real-time visualization

### Analysis Tools
- 📊 **Real-time Monitoring**: Live system state visualization
- 📈 **Performance Analytics**: Detection and recovery metrics
- 🔍 **FSA State History**: Complete transition history tracking

---

## 🏗️ System Architecture
```
┌─────────────────────────────────────────────────────────┐
│                  USER INTERFACES                         │
│          CLI  │  Config Files  │  Web GUI                │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼────────────────────────────────┐
│              SIMULATION CONTROLLER                     │
│         (Orchestrates entire simulation)               │
└───────┬──────────────────────────────────┬────────────┘
        │                                   │
┌───────▼────────┐                  ┌──────▼──────────┐
│  Process       │                  │  Resource       │
│  Manager       │◄────────────────►│  Manager        │
│  (FSA)         │                  │  (FSA)          │
└───────┬────────┘                  └──────┬──────────┘
        │                                   │
        └───────────────┬───────────────────┘
                        │
            ┌───────────▼───────────┐
            │   Deadlock Detector   │
            │   (WFG + DFS)         │
            └───────────┬───────────┘
                        │
            ┌───────────▼───────────┐
            │   Recovery Module     │
            │  (Victim Selection)   │
            └───────────────────────┘