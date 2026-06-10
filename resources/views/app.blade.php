<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="csrf-token" content="{{ csrf_token() }}" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Manufacturing Execution System for PT Megacon Bangun Perkasa" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@600&display=swap" rel="stylesheet" />
        <title>Manufacturing Execution System</title>
        @vite('resources/js/index.jsx')
    </head>
    <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root"></div>
    </body>
</html>
