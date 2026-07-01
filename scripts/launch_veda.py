"""VEDA Desktop Launcher - Starts backend, frontend, and opens browser."""
import subprocess
import sys
import time
import webbrowser
import os
import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT, "backend")
FRONTEND_DIR = os.path.join(ROOT, "frontend")

processes = []

def start_backend():
    print("[VEDA] Starting backend...")
    p = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000"],
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0,
    )
    processes.append(p)
    return p

def start_frontend():
    print("[VEDA] Starting frontend...")
    p = subprocess.Popen(
        ["cmd", "/c", "npm run dev"],
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0,
    )
    processes.append(p)
    return p

def wait_for_server(url, timeout=120):
    import urllib.request
    start = time.time()
    while time.time() - start < timeout:
        try:
            urllib.request.urlopen(url, timeout=3)
            return True
        except:
            time.sleep(2)
    return False

def cleanup():
    for p in processes:
        try:
            if sys.platform == "win32":
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(p.pid)], capture_output=True)
            else:
                p.terminate()
        except:
            pass

if __name__ == "__main__":
    try:
        backend = start_backend()
        
        print("[VEDA] Waiting for backend...")
        if wait_for_server("http://localhost:8000/api/v1/health"):
            print("[VEDA] Backend ready!")
        else:
            print("[VEDA] Backend failed to start")
            cleanup()
            sys.exit(1)
        
        frontend = start_frontend()
        print("[VEDA] Opening VEDA in your browser...")
        time.sleep(3)
        webbrowser.open("http://localhost:3000")
        
        print("\n[VEDA] VEDA is running!")
        print("  Backend: http://localhost:8000")
        print("  API Docs: http://localhost:8000/docs")
        print("  Frontend: http://localhost:3000")
        print("\nPress Ctrl+C to stop VEDA.\n")
        
        # Keep running
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n[VEDA] Shutting down...")
        finally:
            cleanup()
            print("[VEDA] Goodbye!")
    except Exception as e:
        print(f"[VEDA] Error: {e}")
        cleanup()
