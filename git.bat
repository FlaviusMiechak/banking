@echo off
echo Checking git status...
git status

echo.
echo Staging all changes...
git add .

echo.
set /p commit_msg="Enter commit message: "

echo.
echo Committing with message: %commit_msg%
git commit -m "%commit_msg%"

echo.
echo Pushing to remote...
git push

echo.
echo Done!
pause