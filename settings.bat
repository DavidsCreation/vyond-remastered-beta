title Vyond: Remastered Settings Script
:: Interactive config.bat changer
:: Author: Davids Creation
:: License: MIT
set NODE_ENV=dev
:: DON'T EDIT THIS FILE! If you need a text version of the settings like it used to be, edit utilities\config.bat. This file is now just an interface for changing that file.

:: Initialize (stop command spam, clean screen, make variables work, set to UTF-8)
@echo off && cls
SETLOCAL ENABLEDELAYEDEXPANSION

:: Move to base folder, and make sure it worked (otherwise things would go horribly wrong)
pushd "%~dp0"
if !errorlevel! NEQ 0 goto error_location
if exist utilities\config.bat ( goto noerror_location )
:error_location
echo Doesn't seem like this script is in the Vyond: Remastered folder.
exit
:noerror_location

:: Prevents CTRL+C cancelling and keeps window open when crashing
if "!SUBSCRIPT!"=="" (
	if "%~1" equ "point_insertion" goto point_insertion
	start "" /wait /B "%~F0" point_insertion
	exit
)
:point_insertion

:: patch detection
if exist "patch.jpg" echo MESSAGE GOES HERE && exit

:: Preload variable
set CFG=utilities\config.bat
set TMPCFG=utilities\tempconfig.bat
set SHOWDEVOPTIONS=n
set BACKTODEFAULTTOGGLE=n
set BACKTOCUSTOMTOGGLE=n
set BACKTOCUSTOMTOGGLE2=n

:: Load current settings
if "%SUBSCRIPT%"=="" ( 
	set SUBSCRIPT=y
	call !cfg!
	set "SUBSCRIPT="
) else (
	call !cfg!
)

::::::::::
:: Menu ::
::::::::::
:: this code is a form of hell have fun going through it cause i dont :)
:optionscreen
cls
echo:
echo Enter 0 to leave settings
echo Enter the number next to the option to change it.
echo Enter a ? before the number for more info on the option.
echo Note: Some of this old legacy stuff is going to get moved to html 5 soon. 
echo so far, some settings like waveforms and discord rpc have been moved to html 5.
if %NODE_ENV%==dev ( echo Because this project is being developed, verbose mode will be turned on by default. 
echo if this project is in production, then vebose mode won't be enabled by default. 
echo if you see the word OFF near the verbose mode setting, it's most likely a glitch. just ignore these glitches.)
echo:
:: Verbose
if %VERBOSEWRAPPER%==y (
	echo ^(1^) Verbose mode is[92m ON [0m
) else ( 
	echo ^(1^) Verbose mode is[91m OFF [0m
)
:: Browser options
if !INCLUDEDCHROMIUM!==y (
	echo ^(2^) Browser set to[92m included Chromium [0m
	if !APPCHROMIUM!==y (
		echo     ^(3^) Headless mode is[92m ON [0m
	) else ( 
		echo     ^(3^) Headless mode is[91m OFF [0m
	)
	goto postbrowsershow
)
if not !CUSTOMBROWSER!==n (
	echo ^(2^) Browser set to[91m custom browser [0m
	echo     ^(3^) Browser path: !CUSTOMBROWSER!
)
if !INCLUDEDCHROMIUM!==n (
	if !CUSTOMBROWSER!==n (
		echo ^(2^) Browser set to[91m default system browser [0m
	)
)
:postbrowsershow
:: Skip checking dependenceis
if !SKIPCHECKDEPENDS!==n (
	echo ^(4^) Checking dependencies is[92m ON [0m
) else ( 
	echo ^(4^) Checking dependencies is[91m OFF [0m
)
:: Verbose
if %USEGA4SR%==y (
	echo ^(5^) Use of GA4SR by default is[92m ON [0m
) else ( 
	echo ^(5^) Use of GA4SR by default is[91m OFF [0m
)
:: Dev options
:: These are really specific options that no casual user would ever really need
if !SHOWDEVOPTIONS!==y (
	if !SKIPDEPENDINSTALL!==n (
		echo ^(D1^) Installing dependencies is[92m ON [0m
	) else ( 
		echo ^(D1^) Installing dependencies is[91m OFF [0m
	)
	if !DRYRUN!==y (
		echo ^(D2^) Dry run mode is[92m ON [0m
	) else ( 
		echo ^(D2^) Dry run mode is[91m OFF [0m
	)
	if !BROWSER_TYPE!==chrome (
		echo ^(D3^) Browser type set to[92m Chrome [0m
	)
	if !BROWSER_TYPE!==firefox (
		echo ^(D3^) Browser type set to[91m Firefox [0m
	)
	if !BROWSER_TYPE!==n (
		echo ^(D3^) Browser type[91m not set [0m
	)
)
:reaskoptionscreen
echo:
set /p CHOICE=Choice:
if "!choice!"=="0" exit
:: Verbose
if "!choice!"=="1" (
	set TOTOGGLE=VERBOSEWRAPPER
	if %VERBOSEWRAPPER%==n (
		set TOGGLETO=y
	) else (
		set TOGGLETO=n
	)
	set CFGLINE=11
	goto toggleoption
)
if "!choice!"=="?1" (
	echo When enabled, you will have two extra windows with more info about what Vyond Remastered is doing.
	echo The launcher will also say more about what it's doing and never clears itself.
	echo Mostly ment for troubleshooting and development. Default setting is off. 
      echo During development, this will be turned on by default.
	goto reaskoptionscreen
)
:: Browser settings
if "!choice!"=="2" goto browsertype
if "!choice!"=="?2" (
	echo When set to included Chromium, it opens a browser that comes with Vyond Remastered.
	echo This older browser will keep running Flash after new browsers block it completely.
	echo If you don't want to use it, you can use your default browser, or a specific executable.
	echo Default setting is included Chromium. Most should probably keep that default.
	goto reaskoptionscreen
)
if "!choice!"=="3" (
	if !INCLUDEDCHROMIUM!==y (
		set TOTOGGLE=APPCHROMIUM
		if !APPCHROMIUM!==n (
			set TOGGLETO=y
		) else (
			set TOGGLETO=n
		)
		set CFGLINE=23
		goto toggleoption
	)
	if !CUSTOMBROWSER!==y (
		goto setcustombrowser
	)
)
if "!choice!"=="?3" (
	if !INCLUDEDCHROMIUM!==y (
		echo This setting runs Chromium in headless mode, hiding everything except the title bar and webpage.
		echo This gives more room to work with, and generally just looks nicer. Default is on.
		goto reaskoptionscreen
	)
	if !CUSTOMBROWSER!==y (
		echo This setting defines which browser Vyond launches with when set to use a custom browser.
		echo This needs to be a path to a browser executable. (exe file, such as chrome.exe)
		goto reaskoptionscreen
	)
)
:: Check depends
if "!choice!"=="4" (
	set TOTOGGLE=SKIPCHECKDEPENDS
	if !SKIPCHECKDEPENDS!==n (
		set TOGGLETO=y
	) else (
		set TOGGLETO=n
	)
	set CFGLINE=14
	goto toggleoption
)
if "!choice!"=="?4" (
	echo Turning this off skips checking for Flash, Node.js, http-server, and if the HTTPS cert is installed.
	echo This is automatically disabled when Vyond Remastered launches and finds all dependencies.
	echo If you're on a new computer or having issues with security messages, you may wanna turn this back on.
	goto reaskoptionscreen
)
:: Change perms to use GA4SR by default
if "!choice!"=="5" (
	set TOTOGGLE=USEGA4SR
	if !USEGA4SR!==n (
		set TOGGLETO=y
	) else (
		set TOGGLETO=n
	)
	set CFGLINE=35
	goto toggleoption
)
if "!choice!"=="?5" (
	echo Turning this on will bring back the days of GoAnimate For Schools. 
      echo this setting is highly recomended for those who used GA4S before or if you want to try it out.
      echo The interactive tutorial pops up every time you start Vyond Remastered by default. 
      echo so don't worry about memory loss. if you aren't that person, then there will be a setting for that soon.
	goto reaskoptionscreen
)

:: Dev options
if /i "!choice!"=="masterkey" (
	set SHOWDEVOPTIONS=y
	goto optionscreen
)
if !SHOWDEVOPTIONS!==y (
	if /i "!choice!"=="D1" (
		set TOTOGGLE=SKIPDEPENDINSTALL
		if !SKIPDEPENDINSTALL!==n (
			set TOGGLETO=y
		) else (
			set TOGGLETO=n
		)
		set CFGLINE=17
		goto toggleoption
	)
	if /i "!choice!"=="?D1" (
		echo Disabling this will still check for dependencies, but won't install them.
		echo I'm not sure why I added this, but I don't have a reason to take it out.
		goto reaskoptionscreen
	)
	if /i "!choice!"=="D2" (
		set TOTOGGLE=DRYRUN
		if !DRYRUN!==n (
			set TOGGLETO=y
		) else (
			set TOGGLETO=n
		)
		set CFGLINE=32
		goto toggleoption
	)
	if /i "!choice!"=="?D2" (
		echo Turning this on will run through all of the launcher's code without affecting anything.
		echo Useful for debugging the launcher without uninstalling things and all that.
		goto reaskoptionscreen
	)
	if /i "!choice!"=="D3" goto manualbrowsertype
	if /i "!choice!"=="?D3" (
		echo Tells the launcher what kind of browser is in use. Should be autoset by CUSTOMBROWSER.
		echo Mostly used by the Flash installer to tell what version to install.
		goto reaskoptionscreen
	)
)
if "!choice!"=="clr" goto optionscreen
if "!choice!"=="cls" goto optionscreen
if "!choice!"=="clear" goto optionscreen
echo Time to choose. && goto reaskoptionscreen

:::::::::::::::::::
:: Toggle option ::
:::::::::::::::::::
:toggleoption
echo Toggling setting...
:: Find line after setting to edit
set /a AFTERLINE=!cfgline!+1
:: Loop through every line until one to edit
if exist !tmpcfg! del !tmpcfg!
set /a count=1
for /f "tokens=1,* delims=0123456789" %%a in ('find /n /v "" ^< !cfg!') do (
	set "line=%%b"
	>>!tmpcfg! echo(!line:~1!
	set /a count+=1
	if !count! GEQ !cfgline! goto linereached
)
:linereached
:: Overwrite the original setting
echo set !totoggle!=!toggleto!>> !tmpcfg!
echo:>> !tmpcfg!
:: Print the last of the config to our temp file
more +!afterline! !cfg!>> !tmpcfg!
:: Make our temp file the normal file
copy /y !tmpcfg! !cfg! >nul
del !tmpcfg!
:: Set in here for displaying
set !totoggle!=!toggleto!
if !BACKTODEFAULTTOGGLE!==y goto backtodefault
if !BACKTOCUSTOMTOGGLE!==y goto backtocustom
if !BACKTOCUSTOMTOGGLE2!==y goto backtocustom2
goto optionscreen

::::::::::::::::::
:: Browser type ::
::::::::::::::::::
:browsertype
echo:
echo:
echo Press 1 to use Vyond Remastered's included Chromium (recommended)
echo Press 2 to use your default browser set in Windows
echo Press 3 to use a specific browser of your choice
echo Press 0 to cancel changing
echo:
:browserreask
set /p BROWSERCHOICE= Response:
echo:
if /i "!browserchoice!"=="0" goto optionscreen
if /i "!browserchoice!"=="1" (
	set TOTOGGLE=INCLUDEDCHROMIUM
	set TOGGLETO=y
	set CFGLINE=20
	goto toggleoption
)
if /i "!browserchoice!"=="2" (
	set BACKTODEFAULTTOGGLE=y
	set TOTOGGLE=INCLUDEDCHROMIUM
	set TOGGLETO=n
	set CFGLINE=20
	goto toggleoption
	:backtodefault
	set BACKTODEFAULTTOGGLE=n
	set TOTOGGLE=CUSTOMBROWSER
	set TOGGLETO=n
	set CFGLINE=26
	goto toggleoption
)
if /i "!browserchoice!"=="3" goto setcustombrowser
echo You must answer what browser. && goto browserreask

:::::::::::::::::::::::::
:: Custom Browser Path ::
:::::::::::::::::::::::::
:setcustombrowser
echo:
echo Drag a browser executable (such as chrome.exe) into this window and press enter.
echo Enter 0 to cancel changing the custom browser.
:browserpathreask
echo:
set /p TOGGLETO= File:
if /i "!TOGGLETO!"=="0" goto optionscreen
if not exist "!toggleto!" echo That doesn't seem to exist. & goto browserpathreask

:: Set custom browser
set TOTOGGLE=CUSTOMBROWSER
set CFGLINE=26
set BACKTOCUSTOMTOGGLE=y
goto toggleoption

:: Attempt to set browser type
:backtocustom
set BACKTOCUSTOMTOGGLE=n
set BACKTOCUSTOMTOGGLE2=y
for %%a in (!TOGGLETO!) do (
	set CBNAME=%%~na
	set "TOGGLETO="
	:: Chrome-based
	if !cbname!==chrome set TOGGLETO=chrome
	if !cbname!==chrome64 set TOGGLETO=chrome
	if !cbname!==opera set TOGGLETO=chrome
	if !cbname!==brave set TOGGLETO=chrome
	if !cbname!==microsoftedge set TOGGLETO=chrome
	:: Firefox-based
	if !cbname!==firefox set TOGGLETO=firefox
	if !cbname!==palemoon set TOGGLETO=firefox
	:: Stupid
	if !cbname!==iexplore echo internet explorer users have no soul & set TOGGLETO=n
	:: Unknown
	if !toggleto!=="" set TOGGLETO=n
)
set TOTOGGLE=BROWSER_TYPE
set CFGLINE=29
goto toggleoption

:: Turn off included Chromium
:backtocustom2
set BACKTOCUSTOMTOGGLE2=n
set TOTOGGLE=INCLUDEDCHROMIUM
set TOGGLETO=n
set CFGLINE=20
goto toggleoption

:: Manually set browser type (dev option)
:manualbrowsertype
echo:
echo:
echo Press 1 for Chrome
echo Press 2 for Firefox
echo Press 3 for Unknown
echo Press 0 to cancel changing
echo:
:browsertypereask
set /p TYPECHOICE= Response:
echo:
if /i "!typechoice!"=="0" exit
if /i "!typechoice!"=="1" set TOGGLETO=chrome
if /i "!typechoice!"=="2" set TOGGLETO=firefox
if /i "!typechoice!"=="3" set TOGGLETO=n
echo You must answer with a browser type. && goto browsertypereask
set TOTOGGLE=BROWSER_TYPE
set CFGLINE=29
goto toggleoption