Set WshShell = CreateObject("WScript.Shell")

' Start backend
WshShell.Run "C:\Program Files\Python314\python.exe -m uvicorn app.main:app --port 8000", 7, False

WScript.Sleep 5000

' Start frontend
WshShell.Run "cmd /c npm run dev", 7, False

WScript.Sleep 10000

' Open browser
WshShell.Run "http://localhost:3000", 1, False
