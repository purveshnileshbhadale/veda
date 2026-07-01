"""
VEDA Desktop — single command to launch the app.
python desktop.py
"""
import subprocess, sys, os, time, urllib.request, atexit, signal

BACKEND_PORT = 8000
FRONTEND_PORT = 3000
ROOT = os.path.dirname(os.path.abspath(__file__))
procs = []

def cleanup():
    for p in procs:
        try:
            if p.poll() is None:
                if sys.platform == "win32":
                    subprocess.run(["taskkill", "/F", "/T", "/PID", str(p.pid)], capture_output=True)
                else:
                    p.terminate()
        except:
            pass

atexit.register(cleanup)

def log(msg):
    print(f"[VEDA] {msg}")

def wait_for(url, timeout=120):
    for i in range(timeout):
        try:
            r = urllib.request.urlopen(url, timeout=2)
            if r.status < 400:
                return True
        except:
            pass
        if i % 5 == 0:
            log(f"Waiting for {url}... ({i}s)")
        time.sleep(1)
    return False

def run(cmd, cwd, env_add=None):
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    if env_add:
        env.update(env_add)
    startupinfo = subprocess.STARTUPINFO()
    startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    p = subprocess.Popen(cmd, cwd=cwd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                         env=env, startupinfo=startupinfo, shell=(sys.platform == "win32"))
    procs.append(p)
    return p

def main():
    log("Starting VEDA Desktop...")

    # Check if already running
    try:
        urllib.request.urlopen(f"http://127.0.0.1:{BACKEND_PORT}/api/v1/health", timeout=2)
        log("Backend already running")
    except:
        log("Starting backend...")
        run([sys.executable, "-m", "uvicorn", "app.main:app", "--port", str(BACKEND_PORT), "--host", "127.0.0.1"],
            os.path.join(ROOT, "backend"))
        if not wait_for(f"http://127.0.0.1:{BACKEND_PORT}/api/v1/health", timeout=30):
            log("ERROR: Backend failed to start")
            cleanup()
            sys.exit(1)
        log("Backend ready")

    try:
        urllib.request.urlopen(f"http://127.0.0.1:{FRONTEND_PORT}", timeout=2)
        log("Frontend already running")
    except:
        log("Starting frontend...")
        run(["npx", "next", "dev", "--port", str(FRONTEND_PORT)],
            os.path.join(ROOT, "frontend"),
            {"NEXT_PUBLIC_API_URL": f"http://127.0.0.1:{BACKEND_PORT}/api/v1"})
        if not wait_for(f"http://127.0.0.1:{FRONTEND_PORT}", timeout=120):
            log("ERROR: Frontend failed to start")
            cleanup()
            sys.exit(1)
        log("Frontend ready")

    log("Opening desktop window...")
    import webview
    webview.create_window("VEDA - Research Paper AI",
                          url=f"http://127.0.0.1:{FRONTEND_PORT}",
                          width=1400, height=900, min_size=(1024, 700))
    webview.start(debug=True)

if __name__ == "__main__":
    main()
