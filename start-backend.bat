@echo off
set TEMP=C:\Users\DELL\AppData\Local\Temp
set TMP=C:\Users\DELL\AppData\Local\Temp
cd /d C:\Users\DELL\Desktop\techhub-your-financial-hub-main\backend
"C:\tools\php83\php.exe" -S 127.0.0.1:8000 -t public public\index.php
