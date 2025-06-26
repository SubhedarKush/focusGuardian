#  FocusGuardian

**Take control of your digital focus. Block distractions. Build discipline.**

---

##  What is FocusGuardian?

FocusGuardian is a productivity tool for Windows that helps users stay focused by:
- Blocking distracting apps like **Chrome**, **Reddit** etc
- Preventing their access even if reopened during a focus session
- Tracking **total focus hours**
- Logging every **blocked attempt** with a timestamp

It's designed for students, developers, or anyone who wants to reclaim their time.

---

##  Tech Stack

| Layer        | Tech                         |
|--------------|------------------------------|
| **Frontend** | React.js + TailwindCSS       |
| **Backend**  | Node.js + Express + MongoDB  |
| **Agent**    | Node.js (running locally)    |

---

##  How it Works

1. **Login/Signup** via the React frontend.
2. On login, the token is securely sent to the **Agent**, which monitors running apps.
3. User selects a **timer duration** (e.g., 25 mins) and starts a **Focus Session**.
4. During the session:
   - Agent checks every few seconds for blocked apps.
   - If found, it **forcefully kills** the app and logs the attempt.
5. Stats like **total focus time** and **blocked attempts** are shown in real time.

---

##  Features

- Pomodoro-style Timer  
- App Blocking with Force Close  
- Real-Time Violation Logging  
- Total Focus Time Tracker  
- Clean & Professional UI  
- Local Agent Integration  
- Secure Token Communication

---

##  Screenshots

###  Login / Signup Page
![Screenshot 2025-06-22 224248](https://github.com/user-attachments/assets/5559825d-8de3-4f2b-ba46-01bafff151f1)


###  Dashboard with Stats and Timer
![Screenshot 2025-06-23 091654](https://github.com/user-attachments/assets/e5734ffd-1e78-452b-b6a8-c1132fc04b0c)


## Demo video- https://drive.google.com/file/d/1UgAfFyZHgwanI9AuEKWD1W-t6TYLh701/view?usp=drivesdk

---

## 🚀 How to Run Locally

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/focusguardian.git
cd focusguardian
```

### 2. Install Dependencies

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Agent
```bash
cd agent
npm install
node index.js
```

#### Frontend
```bash
cd frontend
cd frontEnd
npm install
npm start
```

> before running the agent, you need to first login using email. 
> Make sure backend runs on **port 8000** and agent also  on **port 8000** as configured.

---



##  Future Plans

- Prevent app uninstall during active sessions  
- Add support for browser-blocking extensions  
- Focus history reports and streaks  

