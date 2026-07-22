#!/usr/bin/env python3
# (c) Dr. Ralf Korell
# Statischer HTTP-Server fuer Globe.
# Registriert den MIME-Typ fuer .mjs explizit als text/javascript,
# damit native ES-Module in allen Browsern laden (harte Anforderung).
# Modified: [2026-07-22 21:52] - Erstellt (AP-01)

import http.server
import mimetypes
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

mimetypes.add_type("text/javascript", ".mjs")
mimetypes.add_type("text/javascript", ".js")

os.chdir(os.path.dirname(os.path.abspath(__file__)))

handler = http.server.SimpleHTTPRequestHandler
handler.extensions_map[".mjs"] = "text/javascript"
handler.extensions_map[".js"] = "text/javascript"

with http.server.ThreadingHTTPServer(("", PORT), handler) as httpd:
    print(f"Globe: http://localhost:{PORT}/ (Strg+C beendet)")
    httpd.serve_forever()
